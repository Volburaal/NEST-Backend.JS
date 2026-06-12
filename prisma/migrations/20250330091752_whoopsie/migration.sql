/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Society` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fullName` to the `Society` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Society" ADD COLUMN     "fullName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Society_name_key" ON "Society"("name");
