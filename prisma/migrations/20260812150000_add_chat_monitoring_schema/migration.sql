-- Add ChatFlagReason and ChatFlagStatus enums
CREATE TYPE "ChatFlagReason" AS ENUM ('SUSPICIOUS_EXTERNAL_PAYMENT', 'ABUSIVE_LANGUAGE', 'OFF_PLATFORM_SCAM', 'PHISHING_ATTEMPT', 'HARASSMENT', 'SPAM', 'OTHER');

CREATE TYPE "ChatFlagStatus" AS ENUM ('PENDING_REVIEW', 'RESOLVED', 'DISMISSED', 'USER_BANNED', 'USER_WARNED');

-- Add HubType enum
CREATE TYPE "HubType" AS ENUM ('sub_city', 'district', 'neighborhood', 'market_area');

-- Add chat_flag_logs table
CREATE TABLE "chat_flag_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "flagged_by_user_id" UUID,
    "reason" "ChatFlagReason" NOT NULL,
    "keyword_triggered" TEXT,
    "status" "ChatFlagStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "action" TEXT,
    "action_reason" TEXT,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_flag_logs_pkey" PRIMARY KEY ("id")
);

-- Add verification_history table
CREATE TABLE "verification_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "verification_request_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_history_pkey" PRIMARY KEY ("id")
);

-- Add columns to attributes table
ALTER TABLE "attributes" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "attributes" ADD COLUMN IF NOT EXISTS "description_am" TEXT;
ALTER TABLE "attributes" ADD COLUMN IF NOT EXISTS "name_am" VARCHAR(100);

-- Add columns to conversations table
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "is_flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "conversations" ADD COLUMN IF NOT EXISTS "risk_score" INTEGER NOT NULL DEFAULT 0;

-- Add columns to messages table
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "is_flagged" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Add columns to verification_requests table
ALTER TABLE "verification_requests" ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE "verification_requests" ADD COLUMN IF NOT EXISTS "reviewer_notes" TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS "chat_flag_logs_conversation_id_created_at_idx" ON "chat_flag_logs"("conversation_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "chat_flag_logs_status_created_at_idx" ON "chat_flag_logs"("status", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "chat_flag_logs_flagged_by_user_id_idx" ON "chat_flag_logs"("flagged_by_user_id");
CREATE INDEX IF NOT EXISTS "chat_flag_logs_resolved_by_id_idx" ON "chat_flag_logs"("resolved_by_id");
CREATE INDEX IF NOT EXISTS "conversations_is_flagged_risk_score_idx" ON "conversations"("is_flagged", "risk_score" DESC);
CREATE INDEX IF NOT EXISTS "messages_is_flagged_idx" ON "messages"("is_flagged");
CREATE INDEX IF NOT EXISTS "verification_history_verification_request_id_created_at_idx" ON "verification_history"("verification_request_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "verification_history_actor_id_idx" ON "verification_history"("actor_id");

-- Add foreign keys
ALTER TABLE "chat_flag_logs" ADD CONSTRAINT "chat_flag_logs_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chat_flag_logs" ADD CONSTRAINT "chat_flag_logs_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "verification_history" ADD CONSTRAINT "verification_history_verification_request_id_fkey" FOREIGN KEY ("verification_request_id") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "verification_history" ADD CONSTRAINT "verification_history_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
