-- AlterEnum
-- Note: PostgreSQL requires adding enum values one at a time
ALTER TYPE "RentalStatus" ADD VALUE 'DECLINED';
ALTER TYPE "RentalStatus" ADD VALUE 'EXPIRED'; 
ALTER TYPE "RentalStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "RentalStatus" ADD VALUE 'RETURNED_PENDING_INSPECTION' BEFORE 'COMPLETED';

-- Note: RETURNED_INSPECTED is deprecated but kept for backwards compatibility
-- New status RETURNED_PENDING_INSPECTION should be used going forward

-- CreateEnum
CREATE TYPE "RentalPricingTier" AS ENUM ('DAILY', 'THREE_DAY_EVENT', 'WEEKLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CleaningPolicy" AS ENUM ('DRY_CLEAN_ONLY', 'HAND_WASH_COLD', 'MACHINE_WASH_GENTLE', 'PROFESSIONAL_CLEANING_REQUIRED', 'SPOT_CLEAN_ONLY');

-- CreateEnum
CREATE TYPE "ConditionLogType" AS ENUM ('PRE_HANDOVER', 'POST_RETURN');

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "rental_pricing_tier" "RentalPricingTier",
ADD COLUMN "rental_three_day_rate" DECIMAL(12,2),
ADD COLUMN "rental_weekly_rate" DECIMAL(12,2),
ADD COLUMN "cleaning_policy" "CleaningPolicy",
ADD COLUMN "fabric_care_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "min_rental_duration_days" INTEGER DEFAULT 1,
ADD COLUMN "max_rental_duration_days" INTEGER;

-- AlterTable
ALTER TABLE "rental_orders" ADD COLUMN "pickup_hub" VARCHAR(100),
ADD COLUMN "cancellation_reason" TEXT,
ADD COLUMN "offline_deposit_status" VARCHAR(50),
ADD COLUMN "pricing_tier_used" "RentalPricingTier";

-- CreateTable
CREATE TABLE "rental_condition_logs" (
    "id" UUID NOT NULL,
    "booking_id" UUID NOT NULL,
    "type" "ConditionLogType" NOT NULL,
    "photo_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "logged_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_condition_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_blackout_dates" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_blackout_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_condition_logs_booking_id_type_idx" ON "rental_condition_logs"("booking_id", "type");

-- CreateIndex
CREATE INDEX "rental_condition_logs_logged_by_user_id_idx" ON "rental_condition_logs"("logged_by_user_id");

-- CreateIndex
CREATE INDEX "rental_blackout_dates_listing_id_start_date_idx" ON "rental_blackout_dates"("listing_id", "start_date");

-- CreateIndex
CREATE INDEX "rental_blackout_dates_listing_id_end_date_idx" ON "rental_blackout_dates"("listing_id", "end_date");

-- AddForeignKey
ALTER TABLE "rental_condition_logs" ADD CONSTRAINT "rental_condition_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_condition_logs" ADD CONSTRAINT "rental_condition_logs_logged_by_user_id_fkey" FOREIGN KEY ("logged_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_blackout_dates" ADD CONSTRAINT "rental_blackout_dates_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_blackout_dates" ADD CONSTRAINT "rental_blackout_dates_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Update the relation in users table is handled automatically by Prisma based on the model definitions
