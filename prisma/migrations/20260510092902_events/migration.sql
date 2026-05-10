-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED');

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxEvent_status_createdAt_idx" ON "OutboxEvent"("status", "createdAt");
