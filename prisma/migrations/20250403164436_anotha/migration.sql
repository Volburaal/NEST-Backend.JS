/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "assignedTo",
ADD COLUMN     "assignedToFaculty" INTEGER,
ADD COLUMN     "assignedToStudent" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedToStudent_fkey" FOREIGN KEY ("assignedToStudent") REFERENCES "Student"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_assignedToFaculty_fkey" FOREIGN KEY ("assignedToFaculty") REFERENCES "Faculty"("id") ON DELETE SET DEFAULT ON UPDATE CASCADE;
