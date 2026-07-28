-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'published', 'scheduled', 'archived');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('hero_banner', 'featured_product', 'featured_rental', 'featured_custom_service', 'promotional_section', 'homepage_category');

-- CreateTable
CREATE TABLE "homepage_content" (
    "id" UUID NOT NULL,
    "type" "ContentType" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "subtitle" VARCHAR(300),
    "description" TEXT,
    "image_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "link_url" VARCHAR(500),
    "link_label" VARCHAR(100),
    "button_text" VARCHAR(100),
    "background_color" VARCHAR(7),
    "text_color" VARCHAR(7),
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "publish_at" TIMESTAMP(3),
    "unpublish_at" TIMESTAMP(3),
    "featured_listing_id" UUID,
    "featured_category_id" UUID,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "homepage_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homepage_content_type_status_sort_order_idx" ON "homepage_content"("type", "status", "sort_order");

-- CreateIndex
CREATE INDEX "homepage_content_status_publish_at_idx" ON "homepage_content"("status", "publish_at");

-- CreateIndex
CREATE INDEX "homepage_content_deleted_at_idx" ON "homepage_content"("deleted_at");

-- AddForeignKey
ALTER TABLE "homepage_content" ADD CONSTRAINT "homepage_content_featured_listing_id_fkey" FOREIGN KEY ("featured_listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_content" ADD CONSTRAINT "homepage_content_featured_category_id_fkey" FOREIGN KEY ("featured_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_content" ADD CONSTRAINT "homepage_content_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "homepage_content" ADD CONSTRAINT "homepage_content_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
