import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AdminTaxonomiesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Categories
  async findCategories(query: {
    skip?: number;
    take?: number;
    type?: string;
    parentId?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 20, type, parentId, search, isActive } = query;

    const where: any = {};
    if (type) where.type = type;
    if (parentId) where.parentId = parentId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAm: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          parent: {
            select: { id: true, name: true, nameAm: true },
          },
          children: {
            select: { id: true, name: true, nameAm: true },
          },
          _count: {
            select: { listings: true },
          },
        },
      }),
      this.prisma.category.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findCategory(id: string) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        categoryAttributes: {
          include: {
            attribute: true,
          },
        },
      },
    });
  }

  async createCategory(data: any) {
    return this.prisma.category.create({
      data,
      include: {
        parent: true,
      },
    });
  }

  async updateCategory(id: string, data: any) {
    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
      },
    });
  }

  async deleteCategory(id: string) {
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Attributes
  async findAttributes(query: {
    skip?: number;
    take?: number;
    type?: string;
    search?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 20, type, search, isActive } = query;

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAm: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.attribute.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.attribute.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async findAttribute(id: string) {
    return this.prisma.attribute.findUnique({
      where: { id },
      include: {
        categoryAttributes: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async createAttribute(data: any) {
    return this.prisma.attribute.create({
      data,
    });
  }

  async updateAttribute(id: string, data: any) {
    return this.prisma.attribute.update({
      where: { id },
      data,
    });
  }

  async deleteAttribute(id: string) {
    return this.prisma.attribute.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Regional Hubs
  async getRegionalHubs(query?: {
    skip?: number;
    take?: number;
    type?: string;
    city?: string;
    isActive?: boolean;
  }) {
    const { skip = 0, take = 20, type, city, isActive } = query || {};

    const where: any = {};
    if (type) where.type = type;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.regionHub.findMany({
        where,
        skip,
        take,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      this.prisma.regionHub.count({ where }),
    ]);

    return { data, total, skip, take };
  }

  async createRegionalHub(data: any) {
    return this.prisma.regionHub.create({
      data,
    });
  }

  async updateRegionalHub(id: string, data: any) {
    return this.prisma.regionHub.update({
      where: { id },
      data,
    });
  }

  async deleteRegionalHub(id: string) {
    return this.prisma.regionHub.delete({
      where: { id },
    });
  }

  // Proximity-based queries
  async getRegionalHubsByProximity(lat: number, lng: number, radiusKm: number = 10) {
    const hubs = await this.prisma.regionHub.findMany({
      where: {
        isActive: true,
        coordinates: {
          not: null,
        },
      },
    });

    // Calculate distance for each hub and filter by radius
    const hubsWithDistance = hubs
      .map((hub: any) => {
        if (!hub.coordinates) return null;
        const [hubLat, hubLng] = hub.coordinates.split(',').map(Number);
        const distance = this.calculateDistance(lat, lng, hubLat, hubLng);
        return { ...hub, distance };
      })
      .filter((hub: any) => hub !== null && hub.distance <= radiusKm)
      .sort((a: any, b: any) => a.distance - b.distance);

    return hubsWithDistance;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
