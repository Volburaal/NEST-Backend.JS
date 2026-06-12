-- AlterEnum
ALTER TYPE "Department" ADD VALUE 'Other';

-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE 'TREASURER';

-- DropForeignKey
ALTER TABLE "RoleHistory" DROP CONSTRAINT "RoleHistory_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assignedTo" INTEGER NOT NULL DEFAULT -1;

-- AddForeignKey
ALTER TABLE "RoleHistory" ADD CONSTRAINT "RoleHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
