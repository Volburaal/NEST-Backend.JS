/*
  Warnings:

  - You are about to drop the `RoleHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "MembershipRole" ADD VALUE 'MEDIA_HEAD';

-- DropForeignKey
ALTER TABLE "RoleHistory" DROP CONSTRAINT "RoleHistory_userId_fkey";

-- AlterTable
ALTER TABLE "Society" ADD COLUMN     "mediaHeadId" INTEGER,
ADD COLUMN     "treasurerId" INTEGER;

-- DropTable
DROP TABLE "RoleHistory";

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_coMentorID_fkey" FOREIGN KEY ("coMentorID") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_presidentId_fkey" FOREIGN KEY ("presidentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_vicePresidentId_fkey" FOREIGN KEY ("vicePresidentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_treasurerId_fkey" FOREIGN KEY ("treasurerId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_mediaHeadId_fkey" FOREIGN KEY ("mediaHeadId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
