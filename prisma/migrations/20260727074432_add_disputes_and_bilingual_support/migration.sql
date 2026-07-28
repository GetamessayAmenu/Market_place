-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('open', 'in_progress', 'awaiting_response', 'under_review', 'resolved', 'closed', 'escalated');

-- CreateEnum
CREATE TYPE "DisputePriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "DisputeType" AS ENUM ('off_platform_transaction', 'payment_dispute', 'delivery_issue', 'quality_mismatch', 'communication_conflict', 'other');

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "description" TEXT,
ADD COLUMN     "description_am" TEXT,
ADD COLUMN     "name_am" VARCHAR(100),
ADD COLUMN     "slug_am" VARCHAR(120);

-- CreateTable
CREATE TABLE "disputes" (
    "id" UUID NOT NULL,
    "ticket_number" VARCHAR(20) NOT NULL,
    "type" "DisputeType" NOT NULL,
    "priority" "DisputePriority" NOT NULL DEFAULT 'medium',
    "status" "DisputeStatus" NOT NULL DEFAULT 'open',
    "reporter_id" UUID NOT NULL,
    "reported_user_id" UUID,
    "listing_id" UUID,
    "conversation_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "evidence_urls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "chat_evidence_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "resolution_note" TEXT,
    "resolution_action" VARCHAR(100),
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "escalated_by_id" UUID,
    "last_activity_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_comments" (
    "id" UUID NOT NULL,
    "dispute_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "disputes_ticket_number_key" ON "disputes"("ticket_number");

-- CreateIndex
CREATE INDEX "disputes_status_priority_created_at_idx" ON "disputes"("status", "priority", "created_at" DESC);

-- CreateIndex
CREATE INDEX "disputes_reporter_id_idx" ON "disputes"("reporter_id");

-- CreateIndex
CREATE INDEX "disputes_reported_user_id_idx" ON "disputes"("reported_user_id");

-- CreateIndex
CREATE INDEX "disputes_type_status_idx" ON "disputes"("type", "status");

-- CreateIndex
CREATE INDEX "disputes_ticket_number_idx" ON "disputes"("ticket_number");

-- CreateIndex
CREATE INDEX "dispute_comments_dispute_id_created_at_idx" ON "dispute_comments"("dispute_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "dispute_comments_author_id_idx" ON "dispute_comments"("author_id");

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_escalated_by_id_fkey" FOREIGN KEY ("escalated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_comments" ADD CONSTRAINT "dispute_comments_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_comments" ADD CONSTRAINT "dispute_comments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
