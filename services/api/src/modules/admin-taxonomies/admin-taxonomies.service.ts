import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
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
  ) {}

  // Categories
  async findCategories(query: any) {
    return this.repository.findCategories(query);
  }

  async findCategory(id: string) {
    const category = await this.repository.findCategory(id);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async createCategory(user: AuthenticatedUser, dto: CreateTaxonomyCategoryDto) {
    const category = await this.repository.createCategory(dto);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'create_category',
      resource: 'category',
      resourceId: category.id,
      metadata: { name: category.name, type: category.type },
    });

    return category;
  }

  async updateCategory(user: AuthenticatedUser, id: string, dto: Partial<CreateTaxonomyCategoryDto>) {
    await this.findCategory(id);
    
    const updated = await this.repository.updateCategory(id, dto);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'update_category',
      resource: 'category',
      resourceId: id,
      metadata: { changes: dto },
    });

    return updated;
  }

  async deleteCategory(user: AuthenticatedUser, id: string) {
    await this.findCategory(id);
    
    const deleted = await this.repository.deleteCategory(id);

    await this.adminLogsService.createLog({
      actorId: user.id,
      action: 'delete_category',
      resource: 'category',
      resourceId: id,
    });

    return deleted;
  }

  // Attributes
  async findAttributes(query: any) {
    return this.repository.findAttributes(query);
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

    return deleted;
  }

  // Regional Hubs
  async getRegionalHubs(query?: any) {
    return this.repository.getRegionalHubs(query);
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

    return deleted;
  }

  async getRegionalHubsByProximity(lat: number, lng: number, radiusKm?: number) {
    return this.repository.getRegionalHubsByProximity(lat, lng, radiusKm);
  }
}
