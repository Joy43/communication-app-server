/*
  Warnings:

  - You are about to drop the column `coverPhoto` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'TRANSGENDER', 'NON_BINARY', 'GENDERQUEER', 'GENDERFLUID', 'AGENDER', 'BIGENDER', 'TWO_SPIRIT', 'INTERSEX', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "coverPhoto",
DROP COLUMN "dateOfBirth";

-- CreateTable
CREATE TABLE "follows" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "username" TEXT NOT NULL,
    "title" TEXT DEFAULT '',
    "bio" TEXT,
    "avatarUrl" TEXT DEFAULT 'https://example.com/default-avatar.png',
    "coverUrl" TEXT DEFAULT 'https://example.com/default-cover.png',
    "location" TEXT,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "isToggleNotification" BOOLEAN NOT NULL DEFAULT true,
    "dateOfBirth" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "gender" "Gender" NOT NULL DEFAULT 'MALE',
    "experience" TEXT,
    "followersCount" INTEGER NOT NULL DEFAULT 0,
    "followingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "follows_followerId_idx" ON "follows"("followerId");

-- CreateIndex
CREATE INDEX "follows_followingId_idx" ON "follows"("followingId");

-- CreateIndex
CREATE INDEX "follows_createdAt_idx" ON "follows"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "follows_followerId_followingId_key" ON "follows"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_userId_key" ON "profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "profiles_username_idx" ON "profiles"("username");

-- CreateIndex
CREATE INDEX "profiles_name_idx" ON "profiles"("name");

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follows" ADD CONSTRAINT "follows_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
