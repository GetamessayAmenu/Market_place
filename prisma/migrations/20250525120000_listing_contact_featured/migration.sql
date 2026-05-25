-- Phase 5: featured flag + contact options for listings
ALTER TABLE "listings" ADD COLUMN "is_featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "listings" ADD COLUMN "contact_options" JSONB;

CREATE INDEX "listings_is_featured_status_idx" ON "listings"("is_featured", "status");
