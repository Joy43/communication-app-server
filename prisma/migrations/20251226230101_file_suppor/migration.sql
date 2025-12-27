/*
  Warnings:

  - You are about to drop the column `profilePictureId` on the `users` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_profilePictureId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "profilePictureId",
ADD COLUMN     "profilePicture" TEXT;
