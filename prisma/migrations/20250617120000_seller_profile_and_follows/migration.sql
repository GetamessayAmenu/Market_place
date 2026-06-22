-- Seller Profile Enhancement: Add seller-specific fields + Follow model

CREATE TYPE "SellerType" AS ENUM ('designer', 'tailor', 'boutique', 'rental_shop');

ALTER TABLE "users"
  ADD COLUMN "bio" TEXT,
  ADD COLUMN "location" VARCHAR(200),
  ADD COLUMN "seller_type" "SellerType",
  ADD COLUMN "cover_image_url" VARCHAR(500),
  ADD COLUMN "specialties" TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN "social_links" JSONB,
  ADD COLUMN "response_rate" INTEGER,
  ADD COLUMN "response_time_hours" INTEGER,
  ADD COLUMN "total_sales" INTEGER;

CREATE INDEX "users_seller_type_idx" ON "users"("seller_type");

CREATE TABLE "follows" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "follower_id" UUID NOT NULL,
  "following_id" UUID NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "follows_follower_id_following_id_key" ON "follows"("follower_id", "following_id");
CREATE INDEX "follows_follower_id_idx" ON "follows"("follower_id");
CREATE INDEX "follows_following_id_idx" ON "follows"("following_id");

ALTER TABLE "follows"
  ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
