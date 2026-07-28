-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('REQUESTED', 'APPROVED', 'HANDOVER_PENDING', 'ACTIVE', 'RETURN_INITIATED', 'RETURNED_INSPECTED', 'COMPLETED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "HolidayTheme" AS ENUM ('MESKEL', 'TIMKET', 'ENKUTATASH', 'TLEK_SERG', 'FASIKA');

-- CreateTable
CREATE TABLE "vendor_kyc_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "business_name" VARCHAR(200) NOT NULL,
    "business_name_am" VARCHAR(200),
    "tin_number" VARCHAR(15) NOT NULL,
    "license_url" VARCHAR(500) NOT NULL,
    "license_cloudinary_id" VARCHAR(255),
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_kyc_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_orders" (
    "id" UUID NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "listing_id" UUID NOT NULL,
    "renter_id" UUID NOT NULL,
    "seller_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "actual_return_date" TIMESTAMP(3),
    "daily_rate" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "security_deposit" DOUBLE PRECISION NOT NULL,
    "deposit_refunded" BOOLEAN NOT NULL DEFAULT false,
    "deposit_refund_amount" DOUBLE PRECISION,
    "deposit_refund_reason" TEXT,
    "status" "RentalStatus" NOT NULL DEFAULT 'REQUESTED',
    "pre_handover_condition" TEXT,
    "pre_handover_photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "post_return_condition" TEXT,
    "post_return_photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "damage_notes" TEXT,
    "damage_cost" DOUBLE PRECISION,
    "handover_location" VARCHAR(200),
    "handover_at" TIMESTAMP(3),
    "returned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_extensions" (
    "id" UUID NOT NULL,
    "rental_order_id" UUID NOT NULL,
    "requested_by" UUID NOT NULL,
    "additional_days" INTEGER NOT NULL,
    "new_end_date" TIMESTAMP(3) NOT NULL,
    "additional_cost" DOUBLE PRECISION NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'REQUESTED',
    "approved_by_id" UUID,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "region_hubs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_am" VARCHAR(100),
    "description" TEXT,
    "description_am" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "city_am" VARCHAR(100),
    "coordinates" VARCHAR(100),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_banners" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "title_am" VARCHAR(200),
    "subtitle" VARCHAR(300),
    "subtitle_am" VARCHAR(300),
    "image_url" VARCHAR(500) NOT NULL,
    "cloudinary_public_id" VARCHAR(255),
    "link_url" VARCHAR(500),
    "holiday_theme" "HolidayTheme",
    "theme_start_date" TIMESTAMP(3),
    "theme_end_date" TIMESTAMP(3),
    "search_weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "publish_at" TIMESTAMP(3),
    "unpublish_at" TIMESTAMP(3),
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_kyc_profiles_user_id_key" ON "vendor_kyc_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_kyc_profiles_tin_number_key" ON "vendor_kyc_profiles"("tin_number");

-- CreateIndex
CREATE INDEX "vendor_kyc_profiles_status_idx" ON "vendor_kyc_profiles"("status");

-- CreateIndex
CREATE INDEX "vendor_kyc_profiles_tin_number_idx" ON "vendor_kyc_profiles"("tin_number");

-- CreateIndex
CREATE UNIQUE INDEX "rental_orders_order_number_key" ON "rental_orders"("order_number");

-- CreateIndex
CREATE INDEX "rental_orders_status_start_date_idx" ON "rental_orders"("status", "start_date");

-- CreateIndex
CREATE INDEX "rental_orders_renter_id_idx" ON "rental_orders"("renter_id");

-- CreateIndex
CREATE INDEX "rental_orders_seller_id_idx" ON "rental_orders"("seller_id");

-- CreateIndex
CREATE INDEX "rental_orders_listing_id_idx" ON "rental_orders"("listing_id");

-- CreateIndex
CREATE INDEX "rental_orders_order_number_idx" ON "rental_orders"("order_number");

-- CreateIndex
CREATE INDEX "rental_extensions_rental_order_id_status_idx" ON "rental_extensions"("rental_order_id", "status");

-- CreateIndex
CREATE INDEX "region_hubs_type_is_active_idx" ON "region_hubs"("type", "is_active");

-- CreateIndex
CREATE INDEX "region_hubs_city_idx" ON "region_hubs"("city");

-- CreateIndex
CREATE INDEX "hero_banners_holiday_theme_status_idx" ON "hero_banners"("holiday_theme", "status");

-- CreateIndex
CREATE INDEX "hero_banners_status_publish_at_idx" ON "hero_banners"("status", "publish_at");

-- CreateIndex
CREATE INDEX "hero_banners_deleted_at_idx" ON "hero_banners"("deleted_at");

-- AddForeignKey
ALTER TABLE "vendor_kyc_profiles" ADD CONSTRAINT "vendor_kyc_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_kyc_profiles" ADD CONSTRAINT "vendor_kyc_profiles_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_renter_id_fkey" FOREIGN KEY ("renter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_orders" ADD CONSTRAINT "rental_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_banners" ADD CONSTRAINT "hero_banners_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hero_banners" ADD CONSTRAINT "hero_banners_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
