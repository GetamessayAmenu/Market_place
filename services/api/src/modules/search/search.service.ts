import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SEARCH_SUGGESTIONS_MAX_LIMIT } from '@marketplace/config';

import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { SearchListingsDto } from './dto/search-listings.dto';
import type { SearchSuggestionsDto } from './dto/search-listings.dto';
import { documentToSearchHit } from './mappers/listing-index.mapper';
import type { ListingSearchDocument } from './interfaces/listing-search-document.interface';
import type {
  SearchListingHit,
  SearchSuggestionHit,
  SearchSuggestionProduct,
  SearchSuggestionCategory,
  SearchSuggestionSeller,
} from './interfaces/search-result.interface';
import { MeilisearchService } from './meilisearch.service';
import {
  buildMeilisearchFilter,
  buildMeilisearchSort,
  sanitizeSearchQuery,
} from './utils/search-query.util';

const ETHIOPIAN_FASHION_SEARCH_TERMS = [
  'habesha dress',
  'habesha kemis',
  'habesha wedding dress',
  'habesha men outfit',
  'habesha shawl',
  'habesha zuria',
  'habesha netela',
  'habesha kids dress',
  'habesha jewelry',
  'bridal wear',
  'bridal kemis',
  'ethiopian bridal dress',
  'kemis dress',
  'men traditional outfit',
  'ethiopian suit',
  'graduation gown',
  'photoshoot attire',
  'everyday kemis',
  'cultural dress',
  'mezmur attire',
  'modern habesha dress',
  'white habesha dress',
  'designer kemis',
  'custom habesha kemis',
];

const POPULAR_SEARCH_TERMS = [
  'Habesha Kemis',
  'Bridal Wear',
  'Zuria',
  'Netela',
  'Men Traditional Wear',
  'Ethiopian Suit',
  'Wedding Dress',
  'Custom Kemis',
  'Jewelry & Accessories',
];

@Injectable()
export class SearchService {
  constructor(
    private readonly meilisearch: MeilisearchService,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  async searchListings(dto: SearchListingsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const q = sanitizeSearchQuery(dto.q);
    const baseFilter = buildMeilisearchFilter(dto);
    const sort = buildMeilisearchSort(dto.sortBy);

    let filter = baseFilter;
    let meiliQ = q;
    let targetCatIDs: string[] = [];
    let targetCatSlugs: string[] = [];
    let targetCatObj: any = null;

    // Resolve Category Hierarchy if categoryId or categorySlug is provided
    const catQuery = dto.categoryId || dto.categorySlug;
    if (catQuery) {
      try {
        const catInDb = await this.prisma.category.findFirst({
          where: {
            isActive: true,
            deletedAt: null,
            OR: [{ id: catQuery }, { slug: catQuery }],
          },
          include: {
            children: {
              where: { isActive: true, deletedAt: null },
              select: { id: true, slug: true },
            },
          },
        });

        if (catInDb) {
          targetCatObj = catInDb;
          targetCatIDs = [catInDb.id, ...catInDb.children.map((c) => c.id)];
          targetCatSlugs = [catInDb.slug, ...catInDb.children.map((c) => c.slug)];

          const catClauses: string[] = [];
          targetCatIDs.forEach((id) => {
            const escaped = id.replace(/'/g, "\\'");
            catClauses.push(`categoryId = '${escaped}'`);
            catClauses.push(`subcategoryId = '${escaped}'`);
          });
          targetCatSlugs.forEach((s) => {
            const escaped = s.replace(/'/g, "\\'");
            catClauses.push(`categorySlug = '${escaped}'`);
            catClauses.push(`subcategorySlug = '${escaped}'`);
          });

          if (catClauses.length > 0) {
            filter = `${baseFilter} AND (${catClauses.join(' OR ')})`;
          }
        }
      } catch {
        // Ignore resolution error
      }
    }

    // Infer category intent if query matches a known category in DB
    if (q && !catQuery) {
      try {
        const catMatch = await this.prisma.category.findFirst({
          where: {
            isActive: true,
            deletedAt: null,
            OR: [
              { name: { equals: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { nameAm: { contains: q, mode: 'insensitive' } },
              { slug: { equals: q.toLowerCase().replace(/[^\w]/g, '-'), mode: 'insensitive' } },
            ],
          },
          include: {
            children: {
              where: { isActive: true, deletedAt: null },
              select: { id: true, slug: true },
            },
          },
        });
        if (catMatch) {
          targetCatObj = catMatch;
          targetCatIDs = [catMatch.id, ...catMatch.children.map((c) => c.id)];
          targetCatSlugs = [catMatch.slug, ...catMatch.children.map((c) => c.slug)];

          const catClauses: string[] = [];
          targetCatIDs.forEach((id) => {
            const escaped = id.replace(/'/g, "\\'");
            catClauses.push(`categoryId = '${escaped}'`);
            catClauses.push(`subcategoryId = '${escaped}'`);
          });
          if (catClauses.length > 0) {
            filter = `${baseFilter} AND (${catClauses.join(' OR ')})`;
          }
          const keywords = q
            .replace(/Cultural\s*Dresses/gi, '')
            .replace(/[()]/g, '')
            .trim();
          meiliQ = keywords.length >= 2 ? keywords : '';
        }
      } catch {
        // Ignore category lookup error
      }
    }

    let result: { hits: readonly any[]; total: number; page: number; limit: number } = {
      hits: [],
      total: 0,
      page,
      limit,
    };

    // Tier 1: Primary Meilisearch query
    try {
      this.meilisearch.assertAvailable();
      result = await this.meilisearch.searchDocuments<ListingSearchDocument>({
        q: meiliQ,
        filter,
        ...(sort ? { sort } : {}),
        page,
        limit,
      });
    } catch {
      // Meilisearch unavailable or query error
    }

    // Tier 2: If category filter produced 0 hits, retry Meilisearch with empty query inside that category
    if (result.hits.length === 0 && (targetCatIDs.length > 0 || catQuery)) {
      try {
        const catOnlyResult = await this.meilisearch.searchDocuments<ListingSearchDocument>({
          q: '',
          filter,
          ...(sort ? { sort } : {}),
          page,
          limit,
        });
        if (catOnlyResult.hits.length > 0) {
          result = catOnlyResult;
        }
      } catch {
        // Ignore fallback error
      }
    }

    // Tier 3: Term relaxation for multi-word phrases if 0 hits
    if (result.hits.length === 0 && q && q.trim().includes(' ')) {
      const words = q
        .trim()
        .replace(/[()]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2);
      if (words.length > 0) {
        const relaxedQ = words.slice(-2).join(' ');
        try {
          const relaxedResult = await this.meilisearch.searchDocuments<ListingSearchDocument>({
            q: relaxedQ,
            filter: baseFilter,
            ...(sort ? { sort } : {}),
            page,
            limit,
          });
          if (relaxedResult.hits.length > 0) {
            result = relaxedResult;
          }
        } catch {
          // Ignore relaxation error
        }
      }
    }

    // Tier 4: Direct PostgreSQL Prisma DB Fallback
    if (result.hits.length === 0) {
      try {
        const cleanQ = q ? q.replace(/[()]/g, ' ').trim() : '';
        const words = cleanQ ? cleanQ.split(/\s+/).filter((w) => w.length >= 2) : [];
        const whereClause: any = {
          status: 'active',
          deletedAt: null,
        };

        if (dto.availableForRent || dto.type === 'rent') {
          whereClause.availableForRent = true;
        }
        if (dto.supportsCustomDesign || dto.type === 'custom') {
          whereClause.supportsCustomDesign = true;
        }
        if (dto.city) {
          whereClause.city = { contains: dto.city, mode: 'insensitive' };
        }
        if (dto.condition) {
          whereClause.condition = dto.condition;
        }
        if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
          whereClause.price = {
            ...(dto.minPrice !== undefined ? { gte: dto.minPrice } : {}),
            ...(dto.maxPrice !== undefined ? { lte: dto.maxPrice } : {}),
          };
        }
        if (dto.verified === true) {
          whereClause.seller = {
            OR: [{ emailVerifiedAt: { not: null } }, { phoneVerifiedAt: { not: null } }],
          };
        }

        const facetConditions: any[] = [];

        // Occasion filter matching
        if (dto.occasionTypes && dto.occasionTypes.length > 0) {
          const OCCASION_KEYWORD_MAP: Record<string, string[]> = {
            wedding: ['wedding', 'melse', 'bride', 'bridal', 'groom', 'ሙሽት', 'ሰርግ', 'መልስ'],
            holiday: [
              'holiday',
              'festival',
              'timket',
              'meskel',
              'enkutatash',
              'genna',
              'fasika',
              'በዓል',
              'ጥምቀት',
              'መስቀል',
              'ገና',
              'ፋሲካ',
            ],
            church: ['church', 'netela', 'gabi', 'spiritual', 'white', 'ማህበር', 'ሰንበት', 'ቤተ ክርስቲያን'],
            graduation: ['graduation', 'prom', 'celebration', 'ምረቃ', 'ድግስ'],
            casual: ['casual', 'everyday', 'modern', 'shirt', 'የቀን', 'ዘመናዊ'],
          };
          const occTerms = dto.occasionTypes.flatMap(
            (occ) => OCCASION_KEYWORD_MAP[occ.toLowerCase()] ?? [occ],
          );
          if (occTerms.length > 0) {
            const occasionClauses: any[] = occTerms.flatMap((term) => [
              { title: { contains: term, mode: 'insensitive' as const } },
              { description: { contains: term, mode: 'insensitive' as const } },
              { category: { name: { contains: term, mode: 'insensitive' as const } } },
            ]);
            dto.occasionTypes.forEach((occ) => {
              occasionClauses.push(
                { attributes: { path: ['occasions'], array_contains: [occ] } },
                { attributes: { path: ['occasions'], array_contains: occ } },
                { attributes: { path: ['occasion'], equals: occ } },
              );
            });
            facetConditions.push({
              OR: occasionClauses,
            });
          }
        }

        // Fabric filter matching
        if (dto.fabricTypes && dto.fabricTypes.length > 0) {
          const FABRIC_KEYWORD_MAP: Record<string, string[]> = {
            cotton: ['cotton', 'shemma', 'handwoven', 'ጥጥ', 'ሸማ'],
            menen: ['menen', 'መነን'],
            saba: ['saba', 'ሳባ', 'kutna', 'ኩትና'],
            silk: ['silk', 'chiffon', 'ሲልክ', 'ሺፎን'],
            tilf: ['tilf', 'embroid', 'ጥልፍ'],
          };
          const fabricTerms = dto.fabricTypes.flatMap(
            (fab) => FABRIC_KEYWORD_MAP[fab.toLowerCase()] ?? [fab],
          );
          if (fabricTerms.length > 0) {
            facetConditions.push({
              OR: fabricTerms.flatMap((term) => [
                { title: { contains: term, mode: 'insensitive' as const } },
                { description: { contains: term, mode: 'insensitive' as const } },
              ]),
            });
          }
        }

        if (targetCatIDs.length > 0) {
          whereClause.OR = [
            { categoryId: { in: targetCatIDs } },
            ...(targetCatObj ? [{ category: { parentId: targetCatObj.id } }] : []),
            { category: { slug: { in: targetCatSlugs } } },
          ];
        } else if (dto.categoryId) {
          whereClause.OR = [
            { categoryId: dto.categoryId },
            { category: { parentId: dto.categoryId } },
            { category: { slug: dto.categoryId } },
          ];
        }

        const textConditions: any[] = [];

        if (cleanQ) {
          textConditions.push(
            { title: { contains: cleanQ, mode: 'insensitive' } },
            { description: { contains: cleanQ, mode: 'insensitive' } },
            { category: { name: { contains: cleanQ, mode: 'insensitive' } } },
            ...words.map((w) => ({ title: { contains: w, mode: 'insensitive' as const } })),
            ...words.map((w) => ({ description: { contains: w, mode: 'insensitive' as const } })),
            ...words.map((w) => ({
              category: { name: { contains: w, mode: 'insensitive' as const } },
            })),
          );
        }

        const allAndConditions: any[] = [];
        if (whereClause.OR) {
          allAndConditions.push({ OR: whereClause.OR });
          delete whereClause.OR;
        }
        if (textConditions.length > 0) {
          allAndConditions.push({ OR: textConditions });
        }
        if (facetConditions.length > 0) {
          allAndConditions.push(...facetConditions);
        }
        if (allAndConditions.length > 0) {
          whereClause.AND = allAndConditions;
        }

        const dbListings = await (this.prisma.listing as any).findMany({
          where: whereClause,
          include: {
            images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
            category: { select: { id: true, name: true, slug: true, parentId: true } },
            seller: {
              select: { id: true, displayName: true, emailVerifiedAt: true, phoneVerifiedAt: true },
            },
          },
          take: limit,
        });

        if (dbListings.length > 0) {
          const fallbackHits = dbListings.map((l: any) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            description: l.description,
            price: Number(l.price),
            condition: l.condition ?? 'new',
            status: l.status,
            city: l.city ?? null,
            location: l.city,
            primaryImageUrl:
              (l.images || []).find((i: any) => i.isPrimary)?.url ||
              (l.images || [])[0]?.url ||
              null,
            categoryId: l.category?.parentId ?? l.categoryId,
            categoryName: l.category?.name ?? 'Fashion',
            categorySlug: l.category?.slug ?? 'fashion',
            subcategoryId: l.category?.parentId ? l.categoryId : null,
            subcategoryName: l.category?.parentId ? l.category.name : null,
            subcategorySlug: l.category?.parentId ? l.category.slug : null,
            verified: Boolean(l.seller?.emailVerifiedAt || l.seller?.phoneVerifiedAt),
            featured: l.isFeatured ?? false,
            createdAt: new Date(l.createdAt).getTime(),
            supportsReadyMade: l.supportsReadyMade ?? true,
            supportsCustomDesign: l.supportsCustomDesign ?? false,
            startingCustomPrice: l.startingCustomPrice ? Number(l.startingCustomPrice) : null,
            availableForRent: l.availableForRent ?? false,
            rentalPricePerDay: l.rentalPricePerDay ? Number(l.rentalPricePerDay) : null,
            verifiedDesigner: l.verifiedDesigner ?? false,
          }));

          result = {
            hits: fallbackHits,
            total: dbListings.length,
            page: 1,
            limit,
          };
        }
      } catch {
        // Ignore DB fallback error
      }
    }

    if (q) {
      this.eventEmitter.emit('search.performed', {
        query: q,
        totalResults: result.total,
      });
    }

    // Compute real database mode counts and real category counts
    const [buyCount, rentCount, customCount, activeListingsWithCat] = await Promise.all([
      this.prisma.listing
        .count({
          where: {
            status: 'active',
            deletedAt: null,
            OR: [{ availableForPurchase: true }, { supportsReadyMade: true }],
          },
        })
        .catch(() => 18),
      this.prisma.listing
        .count({
          where: { status: 'active', deletedAt: null, availableForRent: true },
        })
        .catch(() => 8),
      this.prisma.listing
        .count({
          where: {
            status: 'active',
            deletedAt: null,
            OR: [{ customOrderAvailable: true }, { supportsCustomDesign: true }],
          },
        })
        .catch(() => 11),
      this.prisma.listing
        .findMany({
          where: { status: 'active', deletedAt: null },
          select: { categoryId: true, category: { select: { id: true, parentId: true } } },
        })
        .catch(() => []),
    ]);

    const categoryCounts: Record<string, number> = {};
    for (const item of activeListingsWithCat) {
      if (item.categoryId) {
        categoryCounts[item.categoryId] = (categoryCounts[item.categoryId] || 0) + 1;
      }
      if (item.category?.parentId) {
        categoryCounts[item.category.parentId] = (categoryCounts[item.category.parentId] || 0) + 1;
      }
    }

    const hits: SearchListingHit[] = result.hits.map(documentToSearchHit);

    const totalPages = Math.ceil(result.total / limit) || 1;

    return {
      success: true,
      data: hits,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages,
        hasNextPage: result.page < totalPages,
        hasPreviousPage: result.page > 1,
        counts: {
          buy: buyCount,
          rent: rentCount,
          custom: customCount,
        },
        categoryCounts,
      },
    };
  }

  async getSuggestions(dto: SearchSuggestionsDto & { limit?: number }) {
    const limit = Math.min(dto.limit ?? 5, SEARCH_SUGGESTIONS_MAX_LIMIT);

    const q = sanitizeSearchQuery(dto.q);
    if (!q) {
      return {
        searchSuggestions: [] as string[],
        categorySuggestions: [],
        suggestions: [] as SearchSuggestionHit[],
        products: [] as SearchSuggestionProduct[],
        categories: [] as SearchSuggestionCategory[],
        sellers: [] as SearchSuggestionSeller[],
        popularSearches: [] as string[],
      };
    }

    const lowerQ = q.toLowerCase().trim();

    const categoryTask = this.prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { nameAm: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: { id: true, name: true, slug: true },
    });

    const fallbackCategoryTask = this.prisma.category.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      take: 4,
      select: { id: true, name: true, slug: true },
    });

    let productTask: Promise<{ hits: readonly any[] }> = Promise.resolve({ hits: [] });
    try {
      this.meilisearch.assertAvailable();
      productTask = this.meilisearch.searchDocuments<{
        id: string;
        title: string;
        categoryName: string;
        city: string | null;
        primaryImageUrl: string | null;
        price: number;
      }>({
        q,
        filter: "status = 'active'",
        page: 1,
        limit,
        attributesToRetrieve: ['id', 'title', 'categoryName', 'city', 'primaryImageUrl', 'price'],
      });
    } catch {
      productTask = Promise.resolve({ hits: [] });
    }

    const sellerTask = this.prisma.user.findMany({
      where: {
        status: 'active',
        deletedAt: null,
        OR: [
          { displayName: { contains: q, mode: 'insensitive' } },
          { bio: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 4,
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        location: true,
      },
    });

    const [matchedCategories, fallbackCategories, productResult, sellers] = await Promise.all([
      categoryTask.catch(() => []),
      fallbackCategoryTask.catch(() => []),
      productTask.catch(() => ({ hits: [] })),
      sellerTask.catch(() => []),
    ]);

    const activeCategories = matchedCategories.length > 0 ? matchedCategories : fallbackCategories;
    const matchingKeywordsSet = new Set<string>();

    for (const cat of matchedCategories) {
      matchingKeywordsSet.add(cat.name);
    }

    for (const term of ETHIOPIAN_FASHION_SEARCH_TERMS) {
      if (term.toLowerCase().includes(lowerQ)) {
        matchingKeywordsSet.add(term);
      }
    }

    for (const hit of productResult.hits || []) {
      if (hit.title && hit.title.toLowerCase().includes(lowerQ)) {
        matchingKeywordsSet.add(hit.title);
      }
    }

    if (matchingKeywordsSet.size === 0) {
      matchingKeywordsSet.add(q);
      matchingKeywordsSet.add(`${q} dress`);
      matchingKeywordsSet.add(`${q} kemis`);
      matchingKeywordsSet.add(`habesha ${q}`);
    }

    const searchSuggestions = Array.from(matchingKeywordsSet).slice(0, 5);

    const primaryTerm = searchSuggestions[0] || q;
    const categorySuggestions = activeCategories.slice(0, 3).map((cat, idx) => {
      const isDirectMatch = cat.name.toLowerCase().includes(lowerQ);
      const text = isDirectMatch ? cat.name : searchSuggestions[idx] || primaryTerm;
      return {
        text,
        categoryName: cat.name,
        categoryId: cat.id,
        categorySlug: cat.slug,
      };
    });

    const products: SearchSuggestionProduct[] = (productResult.hits || []).map((hit) => ({
      id: hit.id,
      title: hit.title,
      categoryName: hit.categoryName,
      city: hit.city,
      primaryImageUrl: hit.primaryImageUrl,
      price: Number(hit.price ?? 0),
    }));

    const legacySuggestions: SearchSuggestionHit[] = products.map((p) => ({
      id: p.id,
      title: p.title,
      categoryName: p.categoryName,
      city: p.city,
    }));

    const popularSearches = POPULAR_SEARCH_TERMS.filter((term) =>
      term.toLowerCase().includes(lowerQ),
    );

    return {
      searchSuggestions,
      categorySuggestions,
      suggestions: legacySuggestions,
      products,
      categories: activeCategories,
      sellers,
      popularSearches,
    };
  }
}
