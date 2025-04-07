/*
  Warnings:

  - Added the required column `dept` to the `Faculty` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Faculty" ADD COLUMN     "dept" TEXT NOT NULL;
