import { LISTINGS_SEARCH_INDEX_UID } from '@marketplace/config';
import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Meilisearch as MeilisearchType, Index, SearchParams } from 'meilisearch';

import { ApiConfigService } from '../../infrastructure/config/api-config.service';

import type { ListingSearchDocument } from './interfaces/listing-search-document.interface';

const SEARCHABLE_ATTRIBUTES = [
  'title',
  'description',
  'city',
  'location',
  'categoryName',
  'subcategoryName',
  'categorySlug',
  'subcategorySlug',
] as const;

const FILTERABLE_ATTRIBUTES = [
  'categoryId',
  'categorySlug',
  'subcategoryId',
  'subcategorySlug',
  'city',
  'condition',
  'price',
  'verified',
  'featured',
  'status',
  'availableForRent',
  'supportsCustomDesign',
  'supportsReadyMade',
] as const;

const SORTABLE_ATTRIBUTES = ['createdAt', 'price', 'featured'] as const;

export interface MeilisearchQueryParams {
  readonly q: string;
  readonly filter?: string;
  readonly sort?: readonly string[];
  readonly page: number;
  readonly limit: number;
  readonly attributesToRetrieve?: readonly string[];
}

export interface MeilisearchSearchResult<T extends Record<string, unknown>> {
  readonly hits: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
}

@Injectable()
export class MeilisearchService implements OnModuleInit {
  private readonly logger = new Logger(MeilisearchService.name);
  private client: MeilisearchType | null = null;
  private index: Index | null = null;

  constructor(private readonly config: ApiConfigService) {}

  get isConfigured(): boolean {
    return this.config.isMeilisearchConfigured;
  }

  async onModuleInit(): Promise<void> {
    if (!this.isConfigured) {
      this.logger.warn('Meilisearch is not configured — search indexing disabled');
      return;
    }

    // Dynamic import — wrapped to prevent TS from compiling to require()
    // since `meilisearch` is an ESM-only package.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<{ Meilisearch: new (opts: { host: string; apiKey: string }) => MeilisearchType }>;
    const { Meilisearch } = await dynamicImport('meilisearch');
    this.client = new Meilisearch({
      host: this.config.meilisearchHost ?? '',
      apiKey: this.config.meilisearchApiKey ?? '',
    });

    await this.ensureIndex();
    this.logger.log(`Meilisearch index "${LISTINGS_SEARCH_INDEX_UID}" ready`);
  }

  assertAvailable(): void {
    if (!this.client || !this.index) {
      throw new ServiceUnavailableException({
        code: 'SEARCH_UNAVAILABLE',
        message: 'Search service is not configured',
      });
    }
  }

  async indexDocuments(documents: readonly ListingSearchDocument[]): Promise<void> {
    this.assertAvailable();
    if (!documents.length) {
      return;
    }

    await this.index!.addDocuments([...documents]);
  }

  async deleteDocument(id: string): Promise<void> {
    this.assertAvailable();
    await this.index!.deleteDocument(id);
  }

  async searchDocuments<T extends Record<string, unknown>>(
    params: MeilisearchQueryParams,
  ): Promise<MeilisearchSearchResult<T>> {
    this.assertAvailable();

    const searchParams: SearchParams = {
      offset: (params.page - 1) * params.limit,
      limit: params.limit,
      matchingStrategy: 'last',
    };

    if (params.filter) {
      searchParams.filter = params.filter;
    }

    if (params.sort && params.sort.length) {
      searchParams.sort = [...params.sort];
    }

    if (params.attributesToRetrieve && params.attributesToRetrieve.length) {
      searchParams.attributesToRetrieve = [...params.attributesToRetrieve];
    }

    const result = await this.index!.search<T>(params.q, searchParams);

    return {
      hits: result.hits,
      total: result.estimatedTotalHits ?? result.hits.length,
      page: params.page,
      limit: params.limit,
    };
  }

  async pingHealth(): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    try {
      const health = await this.client.health();
      return health.status === 'available';
    } catch {
      return false;
    }
  }

  private async ensureIndex(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.getIndex(LISTINGS_SEARCH_INDEX_UID);
    } catch {
      await this.client.createIndex(LISTINGS_SEARCH_INDEX_UID, { primaryKey: 'id' });
    }

    const index = this.client.index(LISTINGS_SEARCH_INDEX_UID);
    this.index = index;

    await index.updateSearchableAttributes([...SEARCHABLE_ATTRIBUTES]);
    await index.updateFilterableAttributes([...FILTERABLE_ATTRIBUTES]);
    await index.updateSortableAttributes([...SORTABLE_ATTRIBUTES]);
    await index.updateRankingRules([
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ]);
  }
}
