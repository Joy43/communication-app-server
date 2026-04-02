-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'postCreated';

-- AlterTable
ALTER TABLE "notification-toggle" ADD COLUMN     "postCreated" BOOLEAN NOT NULL DEFAULT true;
