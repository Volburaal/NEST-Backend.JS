/*
  Warnings:

  - Added the required column `cnic` to the `Student` table without a default value. This is not possible if the table is not empty.
  - Added the required column `degree` to the `Student` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Residency" AS ENUM ('DAYSCHOLAR', 'HOSTELLITE');

-- DropIndex
DROP INDEX "Student_phone_key";

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "cnic" TEXT NOT NULL,
ADD COLUMN     "degree" TEXT NOT NULL,
ADD COLUMN     "residency" "Residency" NOT NULL DEFAULT 'DAYSCHOLAR',
ADD COLUMN     "whatsapp" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;
