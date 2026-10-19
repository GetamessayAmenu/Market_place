-- AlterEnum
ALTER TYPE "RentalStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "RentalStatus" ADD VALUE IF NOT EXISTS 'ACCEPTED';
ALTER TYPE "RentalStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';
ALTER TYPE "RentalStatus" ADD VALUE IF NOT EXISTS 'RETURN_PENDING';

-- AlterTable
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "rental_pickup_location" VARCHAR(200);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "rental_notes" TEXT;

-- AlterTable
ALTER TABLE "rental_orders" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "pickup_location" VARCHAR(200);
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "rental_notes" TEXT;
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "renter_notes" TEXT;
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "suggested_start_date" TIMESTAMP(3);
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "suggested_end_date" TIMESTAMP(3);
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "suggested_by" UUID;
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "cancelled_by" UUID;
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "cancelled_at" TIMESTAMP(3);
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "decline_reason" TEXT;
ALTER TABLE "rental_orders" ADD COLUMN IF NOT EXISTS "rental_duration_days" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rental_orders_start_date_end_date_idx" ON "rental_orders"("start_date", "end_date");

-- CreateTable
CREATE TABLE IF NOT EXISTS "rental_histories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rental_order_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "from_status" VARCHAR(50),
    "to_status" VARCHAR(50),
    "notes" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rental_histories_rental_order_id_created_at_idx" ON "rental_histories"("rental_order_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rental_histories_actor_id_idx" ON "rental_histories"("actor_id");

-- AddForeignKey
ALTER TABLE "rental_histories" ADD CONSTRAINT "rental_histories_rental_order_id_fkey" FOREIGN KEY ("rental_order_id") REFERENCES "rental_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_histories" ADD CONSTRAINT "rental_histories_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
