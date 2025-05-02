/*
  Warnings:

  - A unique constraint covering the columns `[inductionId,studentId]` on the table `InductionApplication` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "InductionApplication_inductionId_studentId_key" ON "InductionApplication"("inductionId", "studentId");
