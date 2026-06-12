-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'GENERAL_USER';

-- AlterTable
ALTER TABLE "Society" ADD COLUMN     "inductionsOpen" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "InductionApplication" (
    "id" SERIAL NOT NULL,
    "inductionId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "selected" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "InductionApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InductionSession" (
    "id" SERIAL NOT NULL,
    "start" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end" TIMESTAMP(3),
    "societyId" INTEGER NOT NULL,

    CONSTRAINT "InductionSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InductionApplication" ADD CONSTRAINT "InductionApplication_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InductionApplication" ADD CONSTRAINT "InductionApplication_inductionId_fkey" FOREIGN KEY ("inductionId") REFERENCES "InductionSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InductionSession" ADD CONSTRAINT "InductionSession_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;
