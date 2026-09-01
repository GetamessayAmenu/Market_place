import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import type { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';
import type { CreateFeaturedListingDto } from './dto/create-featured-listing.dto';
import type { CreateFeaturedSellerDto } from './dto/create-featured-seller.dto';
import type { UpdateHomepageSeoDto } from './dto/update-homepage-seo.dto';
import type { ReorderCmsItemsDto } from './dto/reorder-cms-items.dto';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';

const DEFAULT_SECTIONS = [
  { sectionKey: 'categories', title: 'Browse Categories', subtitle: 'Explore collections by style and occasion', sortOrder: 1, itemCount: 8, contentSource: 'automatic' },
  { sectionKey: 'featured_listings', title: 'Featured Collections', subtitle: 'Handpicked items from top Ethiopian designers', sortOrder: 2, itemCount: 8, contentSource: 'automatic' },
  { sectionKey: 'new_arrivals', title: 'New Arrivals', subtitle: 'Latest additions to our marketplace', sortOrder: 3, itemCount: 10, contentSource: 'automatic' },
  { sectionKey: 'trending', title: 'Trending Designers', subtitle: 'Discover popular creators and boutiques', sortOrder: 4, itemCount: 6, contentSource: 'automatic' },
  { sectionKey: 'rental_highlights', title: 'Rental Highlights', subtitle: 'Rent traditional & modern wear for special events', sortOrder: 5, itemCount: 6, contentSource: 'automatic' },
  { sectionKey: 'custom_design', title: 'Custom Tailoring & Design', subtitle: 'Order bespoke outfits made to your exact measurements', sortOrder: 6, itemCount: 4, contentSource: 'automatic' },
  { sectionKey: 'featured_sellers', title: 'Featured Sellers & Designers', subtitle: 'Meet our top verified fashion creators', sortOrder: 7, itemCount: 6, contentSource: 'automatic' },
  { sectionKey: 'how_it_works', title: 'How It Works', subtitle: 'Simple steps to buy, rent, or order custom fashion', sortOrder: 8, itemCount: 3, contentSource: 'automatic' },
  { sectionKey: 'testimonials', title: 'What Our Customers Say', subtitle: 'Real stories from fashion lovers and designers', sortOrder: 9, itemCount: 3, contentSource: 'automatic' },
  { sectionKey: 'newsletter', title: 'Stay in Style', subtitle: 'Get the latest fashion drops and exclusive deals', sortOrder: 10, itemCount: 1, contentSource: 'automatic' },
];

const DEFAULT_SEO = {
  title: 'Ethiopian Fashion Marketplace — Buy, Rent & Custom Order',
  description: 'Discover Ethiopian fashion. Buy ready-to-wear, rent for special occasions, or order custom-made outfits from talented designers.',
  ogImageUrl: null,
  ogImageCloudinaryId: null,
};

@Injectable()
export class HomepageCmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminLogsService: AdminLogsService,
  ) {}

  // ─── Homepage Sections ─────────────────────────────────────────────────────

  async getSections() {
    let sections = await this.prisma.homepageSection.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    if (sections.length === 0) {
      // Seed default sections
      await this.prisma.homepageSection.createMany({
        data: DEFAULT_SECTIONS,
        skipDuplicates: true,
      });
      sections = await this.prisma.homepageSection.findMany({
        orderBy: { sortOrder: 'asc' },
      });
    }

    return { success: true, data: sections };
  }

  async updateSection(id: string, dto: UpdateHomepageSectionDto, admin?: AuthenticatedUser) {
    const existing = await this.prisma.homepageSection.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Homepage section not found');
    }

    const updated = await this.prisma.homepageSection.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.subtitle !== undefined ? { subtitle: dto.subtitle } : {}),
        ...(dto.isEnabled !== undefined ? { isEnabled: dto.isEnabled } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.itemCount !== undefined ? { itemCount: dto.itemCount } : {}),
        ...(dto.contentSource !== undefined ? { contentSource: dto.contentSource } : {}),
        ...(dto.manualItemIds !== undefined ? { manualItemIds: dto.manualItemIds } : {}),
      },
    });

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'UPDATE_HOMEPAGE_SECTION',
        resource: 'HomepageSection',
        resourceId: id,
        metadata: { sectionKey: updated.sectionKey, changes: dto },
      });
    }

    return { success: true, data: updated };
  }

  async reorderSections(dto: ReorderCmsItemsDto, admin?: AuthenticatedUser) {
    const updates = dto.itemIds.map((id, index) =>
      this.prisma.homepageSection.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'REORDER_HOMEPAGE_SECTIONS',
        resource: 'HomepageSection',
        resourceId: null,
        metadata: { count: dto.itemIds.length },
      });
    }

    return { success: true, message: 'Sections reordered successfully' };
  }

  // ─── Featured Listings ─────────────────────────────────────────────────────

  async getFeaturedListings() {
    const items = await this.prisma.homepageFeaturedListing.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        listing: {
          include: {
            images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
            seller: { select: { id: true, displayName: true, avatarUrl: true, email: true } },
            category: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    return { success: true, data: items };
  }

  async addFeaturedListing(dto: CreateFeaturedListingDto, admin?: AuthenticatedUser) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
    });

    if (!listing || listing.deletedAt || listing.status !== 'active') {
      throw new BadRequestException('Listing is not eligible to be featured (must be active and public)');
    }

    const existing = await this.prisma.homepageFeaturedListing.findFirst({
      where: { listingId: dto.listingId },
    });

    if (existing) {
      const updated = await this.prisma.homepageFeaturedListing.update({
        where: { id: existing.id },
        data: { isActive: true, sortOrder: dto.sortOrder ?? existing.sortOrder },
        include: { listing: true },
      });
      return { success: true, data: updated };
    }

    const created = await this.prisma.homepageFeaturedListing.create({
      data: {
        listingId: dto.listingId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
      include: { listing: true },
    });

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'ADD_FEATURED_LISTING',
        resource: 'HomepageFeaturedListing',
        resourceId: created.id,
        metadata: { listingId: dto.listingId },
      });
    }

    return { success: true, data: created };
  }

  async removeFeaturedListing(id: string, admin?: AuthenticatedUser) {
    await this.prisma.homepageFeaturedListing.delete({ where: { id } });

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'REMOVE_FEATURED_LISTING',
        resource: 'HomepageFeaturedListing',
        resourceId: id,
      });
    }

    return { success: true, message: 'Featured listing removed' };
  }

  async reorderFeaturedListings(dto: ReorderCmsItemsDto, admin?: AuthenticatedUser) {
    const updates = dto.itemIds.map((id, index) =>
      this.prisma.homepageFeaturedListing.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'REORDER_FEATURED_LISTINGS',
        resource: 'HomepageFeaturedListing',
        resourceId: null,
        metadata: { count: dto.itemIds.length },
      });
    }

    return { success: true, message: 'Featured listings reordered' };
  }

  // ─── Featured Sellers ──────────────────────────────────────────────────────

  async getFeaturedSellers() {
    const items = await this.prisma.homepageFeaturedSeller.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        seller: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
            location: true,
            sellerType: true,
            emailVerifiedAt: true,
            phoneVerifiedAt: true,
            createdAt: true,
          },
        },
      },
    });

    return { success: true, data: items };
  }

  async addFeaturedSeller(dto: CreateFeaturedSellerDto, admin?: AuthenticatedUser) {
    const seller = await this.prisma.user.findUnique({
      where: { id: dto.sellerId },
    });

    if (!seller || seller.deletedAt || seller.status !== 'active') {
      throw new BadRequestException('Seller is not eligible to be featured (must be active)');
    }

    const existing = await this.prisma.homepageFeaturedSeller.findFirst({
      where: { sellerId: dto.sellerId },
    });

    if (existing) {
      const updated = await this.prisma.homepageFeaturedSeller.update({
        where: { id: existing.id },
        data: { isActive: true, sortOrder: dto.sortOrder ?? existing.sortOrder },
        include: { seller: true },
      });
      return { success: true, data: updated };
    }

    const created = await this.prisma.homepageFeaturedSeller.create({
      data: {
        sellerId: dto.sellerId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
      },
      include: { seller: true },
    });

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'ADD_FEATURED_SELLER',
        resource: 'HomepageFeaturedSeller',
        resourceId: created.id,
        metadata: { sellerId: dto.sellerId },
      });
    }

    return { success: true, data: created };
  }

  async removeFeaturedSeller(id: string, admin?: AuthenticatedUser) {
    await this.prisma.homepageFeaturedSeller.delete({ where: { id } });

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'REMOVE_FEATURED_SELLER',
        resource: 'HomepageFeaturedSeller',
        resourceId: id,
      });
    }

    return { success: true, message: 'Featured seller removed' };
  }

  async reorderFeaturedSellers(dto: ReorderCmsItemsDto, admin?: AuthenticatedUser) {
    const updates = dto.itemIds.map((id, index) =>
      this.prisma.homepageFeaturedSeller.update({
        where: { id },
        data: { sortOrder: index + 1 },
      }),
    );

    await this.prisma.$transaction(updates);

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'REORDER_FEATURED_SELLERS',
        resource: 'HomepageFeaturedSeller',
        resourceId: null,
        metadata: { count: dto.itemIds.length },
      });
    }

    return { success: true, message: 'Featured sellers reordered' };
  }

  // ─── Homepage SEO ──────────────────────────────────────────────────────────

  async getSeo() {
    let seo = await this.prisma.homepageSeo.findFirst();
    if (!seo) {
      seo = await this.prisma.homepageSeo.create({
        data: DEFAULT_SEO,
      });
    }
    return { success: true, data: seo };
  }

  async updateSeo(dto: UpdateHomepageSeoDto, admin?: AuthenticatedUser) {
    let seo = await this.prisma.homepageSeo.findFirst();

    if (!seo) {
      seo = await this.prisma.homepageSeo.create({
        data: {
          title: dto.title,
          description: dto.description,
          ...(dto.ogImageUrl !== undefined ? { ogImageUrl: dto.ogImageUrl } : {}),
          ...(dto.ogImageCloudinaryId !== undefined ? { ogImageCloudinaryId: dto.ogImageCloudinaryId } : {}),
        },
      });
    } else {
      seo = await this.prisma.homepageSeo.update({
        where: { id: seo.id },
        data: {
          title: dto.title,
          description: dto.description,
          ...(dto.ogImageUrl !== undefined ? { ogImageUrl: dto.ogImageUrl } : {}),
          ...(dto.ogImageCloudinaryId !== undefined ? { ogImageCloudinaryId: dto.ogImageCloudinaryId } : {}),
        },
      });
    }

    if (admin) {
      await this.adminLogsService.createLog({
        actorId: admin.id,
        action: 'UPDATE_HOMEPAGE_SEO',
        resource: 'HomepageSeo',
        resourceId: seo.id,
        metadata: { title: dto.title },
      });
    }

    return { success: true, data: seo };
  }

  // ─── Public Layout Aggregator ───────────────────────────────────────────────

  async getPublicLayout() {
    // 1. Fetch Active Hero Banners (all published & non-deleted)
    const heroBanners = await this.prisma.heroBanner.findMany({
      where: {
        status: 'published',
        deletedAt: null,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // 2. Fetch Ordered Active Sections
    let rawSections = await this.prisma.homepageSection.findMany({
      where: { isEnabled: true },
      orderBy: { sortOrder: 'asc' },
    });

    if (rawSections.length === 0) {
      await this.prisma.homepageSection.createMany({
        data: DEFAULT_SECTIONS,
        skipDuplicates: true,
      });
      rawSections = await this.prisma.homepageSection.findMany({
        where: { isEnabled: true },
        orderBy: { sortOrder: 'asc' },
      });
    }

    // 3. Resolve Content for Each Section
    const resolvedSections = await Promise.all(
      rawSections.map(async (sec) => {
        let items: any[] = [];

        if (sec.contentSource === 'manual' && sec.manualItemIds.length > 0) {
          if (['featured_listings', 'new_arrivals', 'rental_highlights', 'custom_design'].includes(sec.sectionKey)) {
            items = await this.prisma.listing.findMany({
              where: {
                id: { in: sec.manualItemIds },
                status: 'active',
                deletedAt: null,
              },
              take: sec.itemCount,
              include: {
                images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                category: { select: { id: true, name: true, slug: true } },
                seller: { select: { id: true, displayName: true, avatarUrl: true } },
              },
            });
          } else if (['trending', 'featured_sellers'].includes(sec.sectionKey)) {
            items = await this.prisma.user.findMany({
              where: {
                id: { in: sec.manualItemIds },
                status: 'active',
                deletedAt: null,
              },
              take: sec.itemCount,
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                location: true,
                emailVerifiedAt: true,
                phoneVerifiedAt: true,
              },
            });
          }
        } else {
          // Automatic query based on section key
          switch (sec.sectionKey) {
            case 'categories':
              items = await this.prisma.category.findMany({
                where: { parentId: null, isActive: true, deletedAt: null },
                take: sec.itemCount,
                orderBy: { sortOrder: 'asc' },
                include: { _count: { select: { listings: true } } },
              });
              break;

            case 'featured_listings': {
              const explicitFeatured = await this.prisma.homepageFeaturedListing.findMany({
                where: { isActive: true, listing: { status: 'active', deletedAt: null } },
                take: sec.itemCount,
                orderBy: { sortOrder: 'asc' },
                include: {
                  listing: {
                    include: {
                      images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                      category: { select: { id: true, name: true, slug: true } },
                      seller: { select: { id: true, displayName: true, avatarUrl: true } },
                    },
                  },
                },
              });

              if (explicitFeatured.length > 0) {
                items = explicitFeatured.map((ef) => ef.listing).filter(Boolean);
              } else {
                items = await this.prisma.listing.findMany({
                  where: { status: 'active', deletedAt: null },
                  take: sec.itemCount,
                  orderBy: { isFeatured: 'desc' },
                  include: {
                    images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                    category: { select: { id: true, name: true, slug: true } },
                    seller: { select: { id: true, displayName: true, avatarUrl: true } },
                  },
                });
              }
              break;
            }

            case 'new_arrivals':
              items = await this.prisma.listing.findMany({
                where: { status: 'active', deletedAt: null },
                take: sec.itemCount,
                orderBy: { createdAt: 'desc' },
                include: {
                  images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                  category: { select: { id: true, name: true, slug: true } },
                  seller: { select: { id: true, displayName: true, avatarUrl: true } },
                },
              });
              break;

            case 'trending':
            case 'featured_sellers': {
              const explicitSellers = await this.prisma.homepageFeaturedSeller.findMany({
                where: { isActive: true, seller: { status: 'active', deletedAt: null } },
                take: sec.itemCount,
                orderBy: { sortOrder: 'asc' },
                include: {
                  seller: {
                    select: {
                      id: true,
                      displayName: true,
                      avatarUrl: true,
                      location: true,
                      emailVerifiedAt: true,
                      phoneVerifiedAt: true,
                    },
                  },
                },
              });

              if (explicitSellers.length > 0) {
                items = explicitSellers.map((es) => es.seller).filter(Boolean);
              } else {
                items = await this.prisma.user.findMany({
                  where: { status: 'active', deletedAt: null },
                  take: sec.itemCount,
                  orderBy: { createdAt: 'desc' },
                  select: {
                    id: true,
                    displayName: true,
                    avatarUrl: true,
                    location: true,
                    emailVerifiedAt: true,
                    phoneVerifiedAt: true,
                  },
                });
              }
              break;
            }

            case 'rental_highlights':
              items = await this.prisma.listing.findMany({
                where: { availableForRent: true, status: 'active', deletedAt: null },
                take: sec.itemCount,
                orderBy: { createdAt: 'desc' },
                include: {
                  images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                  category: { select: { id: true, name: true, slug: true } },
                  seller: { select: { id: true, displayName: true, avatarUrl: true } },
                },
              });
              break;

            case 'custom_design':
              items = await this.prisma.listing.findMany({
                where: {
                  OR: [{ customOrderAvailable: true }, { supportsCustomDesign: true }],
                  status: 'active',
                  deletedAt: null,
                },
                take: sec.itemCount,
                orderBy: { createdAt: 'desc' },
                include: {
                  images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
                  category: { select: { id: true, name: true, slug: true } },
                  seller: { select: { id: true, displayName: true, avatarUrl: true } },
                },
              });
              break;

            default:
              items = [];
              break;
          }
        }

        return {
          id: sec.id,
          key: sec.sectionKey,
          title: sec.title,
          subtitle: sec.subtitle,
          sortOrder: sec.sortOrder,
          itemCount: sec.itemCount,
          contentSource: sec.contentSource,
          items,
        };
      }),
    );

    // 4. Fetch SEO
    const seoRes = await this.getSeo();

    return {
      success: true,
      data: {
        heroBanners,
        sections: resolvedSections,
        seo: seoRes.data,
      },
    };
  }
}
