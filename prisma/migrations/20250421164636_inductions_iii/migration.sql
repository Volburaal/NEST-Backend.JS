/*
  Warnings:

  - Added the required column `body` to the `InductionSession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `InductionSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InductionSession" ADD COLUMN     "body" TEXT NOT NULL,
ADD COLUMN     "subject" TEXT NOT NULL;
