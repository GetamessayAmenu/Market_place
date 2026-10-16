import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { HomepageCmsService } from './homepage-cms.service';
import { UpdateHomepageSectionDto } from './dto/update-homepage-section.dto';
import { CreateFeaturedListingDto } from './dto/create-featured-listing.dto';
import { CreateFeaturedSellerDto } from './dto/create-featured-seller.dto';
import { UpdateHomepageSeoDto } from './dto/update-homepage-seo.dto';
import { ReorderCmsItemsDto } from './dto/reorder-cms-items.dto';

const CMS_ADMIN_ROLES = ['admin', 'super_admin', 'platform_admin', 'content_manager', 'moderator'] as const;

@Controller()
export class HomepageCmsController {
  constructor(private readonly cmsService: HomepageCmsService) {}

  // ─── Public Endpoints ───────────────────────────────────────────────────────

  @Get('homepage/layout')
  @Public()
  async getPublicLayout() {
    return this.cmsService.getPublicLayout();
  }

  @Get('homepage/seo')
  @Public()
  async getPublicSeo() {
    return this.cmsService.getSeo();
  }

  // ─── Admin Sections Endpoints ───────────────────────────────────────────────

  @Get('admin/homepage/sections')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.homepage.view')
  async getSections() {
    return this.cmsService.getSections();
  }

  @Patch('admin/homepage/sections/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.homepage.manage')
  async updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateHomepageSectionDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.updateSection(id, dto, admin);
  }

  @Post('admin/homepage/sections/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.homepage.manage')
  async reorderSections(
    @Body() dto: ReorderCmsItemsDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.reorderSections(dto, admin);
  }

  // ─── Admin Featured Listings Endpoints ─────────────────────────────────────

  @Get('admin/homepage/featured-listings')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_listings.view')
  async getFeaturedListings() {
    return this.cmsService.getFeaturedListings();
  }

  @Post('admin/homepage/featured-listings')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_listings.manage')
  async addFeaturedListing(
    @Body() dto: CreateFeaturedListingDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.addFeaturedListing(dto, admin);
  }

  @Delete('admin/homepage/featured-listings/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_listings.manage')
  async removeFeaturedListing(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.removeFeaturedListing(id, admin);
  }

  @Post('admin/homepage/featured-listings/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_listings.manage')
  async reorderFeaturedListings(
    @Body() dto: ReorderCmsItemsDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.reorderFeaturedListings(dto, admin);
  }

  // ─── Admin Featured Sellers Endpoints ──────────────────────────────────────

  @Get('admin/homepage/featured-sellers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_sellers.view')
  async getFeaturedSellers() {
    return this.cmsService.getFeaturedSellers();
  }

  @Post('admin/homepage/featured-sellers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_sellers.manage')
  async addFeaturedSeller(
    @Body() dto: CreateFeaturedSellerDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.addFeaturedSeller(dto, admin);
  }

  @Delete('admin/homepage/featured-sellers/:id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_sellers.manage')
  async removeFeaturedSeller(
    @Param('id') id: string,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.removeFeaturedSeller(id, admin);
  }

  @Post('admin/homepage/featured-sellers/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.featured_sellers.manage')
  async reorderFeaturedSellers(
    @Body() dto: ReorderCmsItemsDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.reorderFeaturedSellers(dto, admin);
  }

  // ─── Admin Homepage SEO Endpoints ───────────────────────────────────────────

  @Get('admin/homepage/seo')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.seo.view')
  async getAdminSeo() {
    return this.cmsService.getSeo();
  }

  @Put('admin/homepage/seo')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(...CMS_ADMIN_ROLES)
  @RequirePermission('cms.seo.manage')
  async updateSeo(
    @Body() dto: UpdateHomepageSeoDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cmsService.updateSeo(dto, admin);
  }
}
