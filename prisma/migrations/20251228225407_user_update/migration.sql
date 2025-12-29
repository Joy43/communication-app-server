/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "about" TEXT DEFAULT 'User about information',
ADD COLUMN     "address" TEXT,
ADD COLUMN     "coverPhoto" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "username" TEXT,
ALTER COLUMN "locationLon" SET DEFAULT '-71.0589',
ALTER COLUMN "locationLat" SET DEFAULT '42.3601';

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
