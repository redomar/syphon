-- CreateEnum
CREATE TYPE "public"."AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CREDIT_CARD', 'DEBIT_CARD', 'INVESTMENT', 'CASH', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "accountId" TEXT;

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."AccountType" NOT NULL,
    "provider" TEXT,
    "lastFourDigits" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "public"."Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_name_key" ON "public"."Account"("userId", "name");

-- CreateIndex
CREATE INDEX "Transaction_userId_accountId_idx" ON "public"."Transaction"("userId", "accountId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
