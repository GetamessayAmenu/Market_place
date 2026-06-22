-- CreateEnum
CREATE TYPE "CustomOrderStatus" AS ENUM ('submitted', 'under_review', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('listing', 'seller');

-- DropIndex
DROP INDEX "listings_is_featured_status_idx";

-- AlterTable
ALTER TABLE "follows" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "listings" ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "available_for_purchase" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "available_for_rent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "custom_order_available" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rental_deposit" DECIMAL(12,2),
ADD COLUMN     "rental_price_per_day" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "custom_orders" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "buyer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "status" "CustomOrderStatus" NOT NULL DEFAULT 'submitted',
    "measurements" JSONB,
    "fabric_choice" VARCHAR(100),
    "color_choice" VARCHAR(100),
    "design_notes" TEXT,
    "reference_images" TEXT[],
    "estimated_price" DECIMAL(12,2),
    "final_price" DECIMAL(12,2),
    "estimated_days" INTEGER,
    "conversation_id" UUID,
    "cancelled_reason" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "reviewer_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "title" VARCHAR(200),
    "body" TEXT,
    "images" TEXT[],
    "verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "helpful_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_orders_buyer_id_status_idx" ON "custom_orders"("buyer_id", "status");

-- CreateIndex
CREATE INDEX "custom_orders_seller_id_status_idx" ON "custom_orders"("seller_id", "status");

-- CreateIndex
CREATE INDEX "custom_orders_listing_id_idx" ON "custom_orders"("listing_id");

-- CreateIndex
CREATE INDEX "custom_orders_status_created_at_idx" ON "custom_orders"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_listing_id_created_at_idx" ON "reviews"("listing_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_seller_id_created_at_idx" ON "reviews"("seller_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "reviews_deleted_at_idx" ON "reviews"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_reviewer_id_listing_id_key" ON "reviews"("reviewer_id", "listing_id");

-- CreateIndex
CREATE INDEX "listings_available_for_purchase_status_idx" ON "listings"("available_for_purchase", "status");

-- CreateIndex
CREATE INDEX "listings_available_for_rent_status_idx" ON "listings"("available_for_rent", "status");

-- CreateIndex
CREATE INDEX "listings_custom_order_available_status_idx" ON "listings"("custom_order_available", "status");

-- AddForeignKey
ALTER TABLE "custom_orders" ADD CONSTRAINT "custom_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_orders" ADD CONSTRAINT "custom_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_orders" ADD CONSTRAINT "custom_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_orders" ADD CONSTRAINT "custom_orders_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
