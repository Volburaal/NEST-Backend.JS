/*
  Warnings:

  - Changed the type of `dept` on the `Faculty` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Department" AS ENUM ('CS', 'SE', 'AI', 'EE', 'SnH', 'FSM');

-- AlterTable
ALTER TABLE "Faculty" DROP COLUMN "dept",
ADD COLUMN     "dept" "Department" NOT NULL;
