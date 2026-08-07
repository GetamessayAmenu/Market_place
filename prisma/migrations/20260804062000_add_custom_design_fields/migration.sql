-- Add custom design fields to listings
ALTER TABLE "listings" ADD COLUMN "supports_ready_made" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "listings" ADD COLUMN "supports_custom_design" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "starting_custom_price" DECIMAL(12,2);
ALTER TABLE "listings" ADD COLUMN "estimated_production_days" INTEGER;
ALTER TABLE "listings" ADD COLUMN "customization_options" JSONB;
