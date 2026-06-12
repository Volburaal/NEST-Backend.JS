/*
  Warnings:

  - You are about to drop the column `blaclisted` on the `Student` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Student" DROP COLUMN "blaclisted",
ADD COLUMN     "blacklisted" BOOLEAN NOT NULL DEFAULT false;
