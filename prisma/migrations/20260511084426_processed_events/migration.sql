/*
  Warnings:

  - You are about to drop the column `aggregateId` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the column `aggregateType` on the `OutboxEvent` table. All the data in the column will be lost.
  - You are about to drop the `processed_events` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "OutboxEvent" DROP COLUMN "aggregateId",
DROP COLUMN "aggregateType";

-- DropTable
DROP TABLE "processed_events";

-- CreateTable
CREATE TABLE "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "handler" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedEvent_eventId_handler_key" ON "ProcessedEvent"("eventId", "handler");
