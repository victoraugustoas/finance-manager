-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL,
    "effectivatedDate" TIMESTAMP(3),
    "effectivated" BOOLEAN NOT NULL,
    "accountIdOrigin" TEXT NOT NULL,
    "accountIdDestination" TEXT NOT NULL,

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transfer_accountIdOrigin_idx" ON "Transfer"("accountIdOrigin");

-- CreateIndex
CREATE INDEX "Transfer_accountIdDestination_idx" ON "Transfer"("accountIdDestination");

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_accountIdOrigin_fkey" FOREIGN KEY ("accountIdOrigin") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_accountIdDestination_fkey" FOREIGN KEY ("accountIdDestination") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
