-- DropForeignKey
ALTER TABLE "Society" DROP CONSTRAINT "Society_mentorID_fkey";

-- AlterTable
ALTER TABLE "Society" ADD COLUMN     "coMentorID" INTEGER,
ALTER COLUMN "mentorID" DROP NOT NULL,
ALTER COLUMN "presidentId" DROP NOT NULL,
ALTER COLUMN "vicePresidentId" DROP NOT NULL,
ALTER COLUMN "secretaryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_mentorID_fkey" FOREIGN KEY ("mentorID") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;
