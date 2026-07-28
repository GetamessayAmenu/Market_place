-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_verified_designer" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified_designer_at" TIMESTAMP(3),
ADD COLUMN     "verified_designer_by_id" UUID;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_verified_designer_by_id_fkey" FOREIGN KEY ("verified_designer_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
