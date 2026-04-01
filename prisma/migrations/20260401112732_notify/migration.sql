-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "meta" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "profilePictureUrl" TEXT DEFAULT 'https://example.com/default-profile-pic.png';
