-- AlterTable
ALTER TABLE "User" ADD COLUMN     "designation" TEXT,
ADD COLUMN     "tenureEnd" TIMESTAMP(3),
ADD COLUMN     "tenureStart" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RoleHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "designation" TEXT,
    "affiliation" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoleHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoleHistory_userId_idx" ON "RoleHistory"("userId");

-- AddForeignKey
ALTER TABLE "RoleHistory" ADD CONSTRAINT "RoleHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
