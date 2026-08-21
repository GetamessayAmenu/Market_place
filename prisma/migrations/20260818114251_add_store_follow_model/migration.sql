-- CreateTable
CREATE TABLE "store_follows" (
    "id" UUID NOT NULL,
    "follower_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_follows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_follows_store_id_idx" ON "store_follows"("store_id");

-- CreateIndex
CREATE INDEX "store_follows_follower_id_idx" ON "store_follows"("follower_id");

-- CreateIndex
CREATE UNIQUE INDEX "store_follows_follower_id_store_id_key" ON "store_follows"("follower_id", "store_id");

-- AddForeignKey
ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_follows" ADD CONSTRAINT "store_follows_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
