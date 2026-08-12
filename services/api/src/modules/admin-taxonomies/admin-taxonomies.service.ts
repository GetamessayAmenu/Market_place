import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { slugify } from '@marketplace/utils';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { QUEUE_NAMES } from '../../infrastructure/queue/queue.constants';
import { AdminLogsService } from '../admin-logs/admin-logs.service';
import { AdminTaxonomiesRepository } from './admin-taxonomies.repository';
import type { CreateRegionalHubDto } from './dto/create-regional-hub.dto';
import type { CreateTaxonomyAttributeDto } from './dto/create-taxonomy-attribute.dto';
import type { CreateTaxonomyCategoryDto } from './dto/create-taxonomy-category.dto';

@Injectable()
export class AdminTaxonomiesService {
  constructor(
    private readonly repository: AdminTaxonomiesRepository,
    private readonly adminLogsService: AdminLogsService,
    @InjectQueue(QUEUE_NAMES.TAXONOMY_CACHE) private readonly taxonomyCacheQueue: Queue,
    @InjectQueue(QUEUE_NAMES.AUDIT_LOG) private readonly auditLogQueue: Queue,
    @InjectQueue(QUEUE_NAMES.MEILISEARCH_SYNC) private readonly meilisearchSyncQueue: Queue,
  ) {}

  // Categories
  async findCategories(query: any) {
    const result = await this.repository.findCategories(query);
    return result.data;
  }

  async findCategory(id: string) {
    const category = await this.repository.findCategory(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(user: AuthenticatedUser, dto: CreateTaxonomyCategoryDto) {
    // Generate slug if not provided
    const createData = {
      ...dto,
      slug: dto.slug || slugify(dto.name),
    };
    const category = await this.repository.createCategory(createData);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'create_category',
        resource: 'category',
        resourceId: category.id,
        metadata: { name: category.name, type: category.type },
      });
    } catch (error) {
      console.error('Failed to create admin log:', error);
    }

    try {
      await this.taxonomyCacheQueue.add('invalidate-category-cache', {
        categoryId: category.id,
        action: 'create',
      });
    } catch (error) {
      console.error('Failed to add to taxonomy cache queue:', error);
    }

    try {
      await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
        resourceType: 'category',
        resourceId: category.id,
        action: 'create',
      });
    } catch (error) {
      console.error('Failed to add to meilisearch sync queue:', error);
    }

    try {
      await this.auditLogQueue.add('create-audit-log', {
        adminId: user.id,
        action: 'create_category',
        resource: 'category',
        resourceId: category.id,
        timestamp: new Date().toISOString(),
        metadata: { name: category.name, type: category.type },
      });
    } catch (error) {
      console.error('Failed to add to audit log queue:', error);
    }

    return category;
  }

  async updateCategory(user: AuthenticatedUser, id: string, dto: Partial<CreateTaxonomyCategoryDto>) {
    await this.findCategory(id);
    
    const updated = await this.repository.updateCategory(id, dto);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'update_category',
        resource: 'category',
        resourceId: id,
        metadata: { changes: dto },
      });
    } catch (error) {
      console.error('Failed to create admin log:', error);
    }

    try {
      await this.taxonomyCacheQueue.add('invalidate-category-cache', {
        categoryId: id,
        action: 'update',
      });
    } catch (error) {
      console.error('Failed to add to taxonomy cache queue:', error);
    }

    try {
      await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
        resourceType: 'category',
        resourceId: id,
        action: 'update',
      });
    } catch (error) {
      console.error('Failed to add to meilisearch sync queue:', error);
    }

    try {
      await this.auditLogQueue.add('create-audit-log', {
        adminId: user.id,
        action: 'update_category',
        resource: 'category',
        resourceId: id,
        timestamp: new Date().toISOString(),
        metadata: { changes: dto },
      });
    } catch (error) {
      console.error('Failed to add to audit log queue:', error);
    }

    return updated;
  }

  async deleteCategory(user: AuthenticatedUser, id: string) {
    await this.findCategory(id);
    
    const deleted = await this.repository.deleteCategory(id);

    try {
      await this.adminLogsService.createLog({
        actorId: user.id,
        action: 'delete_category',
        resource: 'category',
        resourceId: id,
      });
    } catch (error) {
      console.error('Failed to create admin log:', error);
    }

    try {
      await this.taxonomyCacheQueue.add('invalidate-category-cache', {
        categoryId: id,
        action: 'delete',
      });
    } catch (error) {
      console.error('Failed to add to taxonomy cache queue:', error);
    }

    try {
      await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
        resourceType: 'category',
        resourceId: id,
        action: 'delete',
      });
    } catch (error) {
      console.error('Failed to add to meilisearch sync queue:', error);
    }

    try {
      await this.auditLogQueue.add('create-audit-log', {
        adminId: user.id,
        action: 'delete_category',
        resource: 'category',
        resourceId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to add to audit log queue:', error);
    }

    return deleted;
  }

  // Attributes
  async findAttributes(query: any) {
    const result = await this.repository.findAttributes(query);
    return result.data;
  }

  async findAttribute(id: string) {
    const attribute = await this.repository.findAttribute(id);
    if (!attribute) {
      throw new NotFoundException('Attribute not found');
    }
    return attribute;
  }

  async createAttribute(user: AuthenticatedUser, dto: CreateTaxonomyAttributeDto) {
    const attribute = await this.repository.createAttribute({
      ...dto,
      values: dto.values as any,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'create_attribute',
      resource: 'attribute',
      resourceId: attribute.id,
      metadata: { name: attribute.name, type: attribute.type },
    });

    await this.taxonomyCacheQueue.add('invalidate-attribute-cache', {
      attributeId: attribute.id,
      action: 'create',
    });

    await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
      resourceType: 'attribute',
      resourceId: attribute.id,
      action: 'create',
    });

    await this.auditLogQueue.add('create-audit-log', {
      adminId: user.id,
      action: 'create_attribute',
      resource: 'attribute',
      resourceId: attribute.id,
      timestamp: new Date().toISOString(),
      metadata: { name: attribute.name, type: attribute.type },
    });

    return attribute;
  }

  async updateAttribute(user: AuthenticatedUser, id: string, dto: Partial<CreateTaxonomyAttributeDto>) {
    await this.findAttribute(id);
    
    const updated = await this.repository.updateAttribute(id, {
      ...dto,
      values: dto.values as any,
    });

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_attribute',
      resource: 'attribute',
      resourceId: id,
      metadata: { changes: dto },
    });

    await this.taxonomyCacheQueue.add('invalidate-attribute-cache', {
      attributeId: id,
      action: 'update',
    });

    await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
      resourceType: 'attribute',
      resourceId: id,
      action: 'update',
    });

    await this.auditLogQueue.add('create-audit-log', {
      adminId: user.id,
      action: 'update_attribute',
      resource: 'attribute',
      resourceId: id,
      timestamp: new Date().toISOString(),
      metadata: { changes: dto },
    });

    return updated;
  }

  async deleteAttribute(user: AuthenticatedUser, id: string) {
    await this.findAttribute(id);
    
    const deleted = await this.repository.deleteAttribute(id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'delete_attribute',
      resource: 'attribute',
      resourceId: id,
    });

    await this.taxonomyCacheQueue.add('invalidate-attribute-cache', {
      attributeId: id,
      action: 'delete',
    });

    await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
      resourceType: 'attribute',
      resourceId: id,
      action: 'delete',
    });

    await this.auditLogQueue.add('create-audit-log', {
      adminId: user.id,
      action: 'delete_attribute',
      resource: 'attribute',
      resourceId: id,
      timestamp: new Date().toISOString(),
    });

    return deleted;
  }

  // Regional Hubs
  async getRegionalHubs(query?: any) {
    const result = await this.repository.getRegionalHubs(query);
    return result.data;
  }

  async createRegionalHub(user: AuthenticatedUser, dto: CreateRegionalHubDto) {
    const hub = await this.repository.createRegionalHub(dto);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'create_regional_hub',
      resource: 'regional_hub',
      resourceId: hub.id,
      metadata: { name: hub.name, type: dto.type },
    });

    await this.taxonomyCacheQueue.add('invalidate-regional-hub-cache', {
      hubId: hub.id,
      action: 'create',
    });

    await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
      resourceType: 'regional_hub',
      resourceId: hub.id,
      action: 'create',
    });

    await this.auditLogQueue.add('create-audit-log', {
      adminId: user.id,
      action: 'create_regional_hub',
      resource: 'regional_hub',
      resourceId: hub.id,
      timestamp: new Date().toISOString(),
      metadata: { name: hub.name, type: dto.type },
    });

    return hub;
  }

  async updateRegionalHub(user: AuthenticatedUser, id: string, dto: Partial<CreateRegionalHubDto>) {
    const updated = await this.repository.updateRegionalHub(id, dto);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_regional_hub',
      resource: 'regional_hub',
      resourceId: id,
      metadata: { changes: dto },
    });

    await this.taxonomyCacheQueue.add('invalidate-regional-hub-cache', {
      hubId: id,
      action: 'update',
    });

    await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
      resourceType: 'regional_hub',
      resourceId: id,
      action: 'update',
    });

    await this.auditLogQueue.add('create-audit-log', {
      adminId: user.id,
      action: 'update_regional_hub',
      resource: 'regional_hub',
      resourceId: id,
      timestamp: new Date().toISOString(),
      metadata: { changes: dto },
    });

    return updated;
  }

  async deleteRegionalHub(user: AuthenticatedUser, id: string) {
    const deleted = await this.repository.deleteRegionalHub(id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'delete_regional_hub',
      resource: 'regional_hub',
      resourceId: id,
    });

    await this.taxonomyCacheQueue.add('invalidate-regional-hub-cache', {
      hubId: id,
      action: 'delete',
    });

    await this.meilisearchSyncQueue.add('update-meilisearch-facets', {
      resourceType: 'regional_hub',
      resourceId: id,
      action: 'delete',
    });

    await this.auditLogQueue.add('create-audit-log', {
      adminId: user.id,
      action: 'delete_regional_hub',
      resource: 'regional_hub',
      resourceId: id,
      timestamp: new Date().toISOString(),
    });

    return deleted;
  }

  async getRegionalHubsByProximity(lat: number, lng: number, radiusKm?: number) {
    return this.repository.getRegionalHubsByProximity(lat, lng, radiusKm);
  }
}
