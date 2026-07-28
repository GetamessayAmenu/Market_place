-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected', 'under_review', 'deleted', 'restored');

-- CreateEnum
CREATE TYPE "ModerationItemType" AS ENUM ('review', 'product_image', 'store_logo', 'store_banner', 'store_gallery', 'custom_service_description', 'custom_service_reference');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ReportStatus" ADD VALUE 'investigating';
ALTER TYPE "ReportStatus" ADD VALUE 'closed';

-- AlterTable
ALTER TABLE "reports" ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "evidence" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "resolution_note" TEXT;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "is_spam" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderated_at" TIMESTAMP(3),
ADD COLUMN     "moderated_by_id" UUID,
ADD COLUMN     "moderation_reason" TEXT,
ADD COLUMN     "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "restored_at" TIMESTAMP(3),
ADD COLUMN     "spam_score" INTEGER;

-- CreateTable
CREATE TABLE "moderation_items" (
    "id" UUID NOT NULL,
    "item_type" "ModerationItemType" NOT NULL,
    "item_id" UUID NOT NULL,
    "review_id" UUID,
    "content" TEXT,
    "image_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT,
    "moderated_by_id" UUID,
    "moderated_at" TIMESTAMP(3),
    "is_spam" BOOLEAN NOT NULL DEFAULT false,
    "spam_score" INTEGER,
    "report_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "restored_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_reports" (
    "id" UUID NOT NULL,
    "moderation_item_id" UUID NOT NULL,
    "reporter_id" UUID NOT NULL,
    "reason" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "resolution_note" TEXT,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "moderation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "moderation_items_item_type_status_created_at_idx" ON "moderation_items"("item_type", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moderation_items_item_id_idx" ON "moderation_items"("item_id");

-- CreateIndex
CREATE INDEX "moderation_items_review_id_idx" ON "moderation_items"("review_id");

-- CreateIndex
CREATE INDEX "moderation_items_is_spam_idx" ON "moderation_items"("is_spam");

-- CreateIndex
CREATE INDEX "moderation_items_deleted_at_idx" ON "moderation_items"("deleted_at");

-- CreateIndex
CREATE INDEX "moderation_reports_moderation_item_id_status_idx" ON "moderation_reports"("moderation_item_id", "status");

-- CreateIndex
CREATE INDEX "moderation_reports_reporter_id_idx" ON "moderation_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "moderation_reports_status_created_at_idx" ON "moderation_reports"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_moderation_status_created_at_idx" ON "reviews"("moderation_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_is_spam_idx" ON "reviews"("is_spam");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_items" ADD CONSTRAINT "moderation_items_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_items" ADD CONSTRAINT "moderation_items_moderated_by_id_fkey" FOREIGN KEY ("moderated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_moderation_item_id_fkey" FOREIGN KEY ("moderation_item_id") REFERENCES "moderation_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_reports" ADD CONSTRAINT "moderation_reports_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
