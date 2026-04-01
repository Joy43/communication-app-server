/*
  Warnings:

  - You are about to drop the column `profilePicture` on the `users` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'follow';
ALTER TYPE "NotificationType" ADD VALUE 'orderUpdate';
ALTER TYPE "NotificationType" ADD VALUE 'uploadProof';
ALTER TYPE "NotificationType" ADD VALUE 'paymentReminder';
ALTER TYPE "NotificationType" ADD VALUE 'newOrder';
ALTER TYPE "NotificationType" ADD VALUE 'serviceRequestAccepted';
ALTER TYPE "NotificationType" ADD VALUE 'serviceRequestRejected';
ALTER TYPE "NotificationType" ADD VALUE 'serviceRequestCancelled';
ALTER TYPE "NotificationType" ADD VALUE 'paymentSuccessful';
ALTER TYPE "NotificationType" ADD VALUE 'paymentFailed';
ALTER TYPE "NotificationType" ADD VALUE 'inquiryResponse';
ALTER TYPE "NotificationType" ADD VALUE 'reviewReceived';
ALTER TYPE "NotificationType" ADD VALUE 'postLiked';
ALTER TYPE "NotificationType" ADD VALUE 'postCommented';
ALTER TYPE "NotificationType" ADD VALUE 'postShared';
ALTER TYPE "NotificationType" ADD VALUE 'postReplied';
ALTER TYPE "NotificationType" ADD VALUE 'donationReceived';
ALTER TYPE "NotificationType" ADD VALUE 'communityCreated';
ALTER TYPE "NotificationType" ADD VALUE 'communityJoined';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "profilePicture",
ADD COLUMN     "fcmToken" TEXT DEFAULT '';

-- CreateTable
CREATE TABLE "notification-toggle" (
    "id" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "userUpdates" BOOLEAN NOT NULL DEFAULT true,
    "serviceCreate" BOOLEAN NOT NULL DEFAULT true,
    "review" BOOLEAN NOT NULL DEFAULT true,
    "post" BOOLEAN NOT NULL DEFAULT true,
    "message" BOOLEAN NOT NULL DEFAULT true,
    "inquiry" BOOLEAN NOT NULL DEFAULT true,
    "userRegistration" BOOLEAN NOT NULL DEFAULT true,
    "service" BOOLEAN NOT NULL DEFAULT true,
    "follow" BOOLEAN NOT NULL DEFAULT true,
    "orderUpdate" BOOLEAN NOT NULL DEFAULT true,
    "uploadProof" BOOLEAN NOT NULL DEFAULT true,
    "paymentReminder" BOOLEAN NOT NULL DEFAULT true,
    "newOrder" BOOLEAN NOT NULL DEFAULT true,
    "serviceRequestAccepted" BOOLEAN NOT NULL DEFAULT true,
    "serviceRequestRejected" BOOLEAN NOT NULL DEFAULT true,
    "serviceRequestCancelled" BOOLEAN NOT NULL DEFAULT true,
    "paymentSuccessful" BOOLEAN NOT NULL DEFAULT true,
    "paymentFailed" BOOLEAN NOT NULL DEFAULT true,
    "inquiryResponse" BOOLEAN NOT NULL DEFAULT true,
    "reviewReceived" BOOLEAN NOT NULL DEFAULT true,
    "postLiked" BOOLEAN NOT NULL DEFAULT true,
    "postCommented" BOOLEAN NOT NULL DEFAULT true,
    "postShared" BOOLEAN NOT NULL DEFAULT true,
    "postReplied" BOOLEAN NOT NULL DEFAULT true,
    "donationReceived" BOOLEAN NOT NULL DEFAULT true,
    "communityCreated" BOOLEAN NOT NULL DEFAULT true,
    "communityJoined" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notification-toggle_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notification-toggle" ADD CONSTRAINT "notification-toggle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
