/*
  Warnings:

  - Added the required column `for` to the `ZeroRequirement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ZeroRequirement" ADD COLUMN     "for" TEXT NOT NULL;
