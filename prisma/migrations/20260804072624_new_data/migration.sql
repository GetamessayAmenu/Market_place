/*
  Warnings:

  - You are about to drop the column `color_choice` on the `custom_orders` table. All the data in the column will be lost.
  - You are about to drop the column `design_notes` on the `custom_orders` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_days` on the `custom_orders` table. All the data in the column will be lost.
  - You are about to drop the column `estimated_price` on the `custom_orders` table. All the data in the column will be lost.
  - You are about to drop the column `fabric_choice` on the `custom_orders` table. All the data in the column will be lost.
  - You are about to drop the column `final_price` on the `custom_orders` table. All the data in the column will be lost.
  - You are about to drop the column `reference_images` on the `custom_orders` table. All the data in the column will be lost.
  - Made the column `min_rental_duration_days` on table `listings` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "custom_orders" DROP COLUMN "color_choice",
DROP COLUMN "design_notes",
DROP COLUMN "estimated_days",
DROP COLUMN "estimated_price",
DROP COLUMN "fabric_choice",
DROP COLUMN "final_price",
DROP COLUMN "reference_images",
ADD COLUMN     "agreed_price" DECIMAL(12,2),
ADD COLUMN     "buyer_notes" TEXT,
ADD COLUMN     "embroidery_notes" TEXT,
ADD COLUMN     "inspiration_images" TEXT[],
ADD COLUMN     "selected_color" VARCHAR(100),
ADD COLUMN     "selected_fabric" VARCHAR(100),
ADD COLUMN     "selected_size" VARCHAR(50);

-- AlterTable
ALTER TABLE "listings" ALTER COLUMN "min_rental_duration_days" SET NOT NULL;
