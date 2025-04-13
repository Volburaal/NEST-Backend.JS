-- CreateEnum
CREATE TYPE "ExecutiveRole" AS ENUM ('MENTOR', 'COMENTOR', 'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'MEDIA_HEAD');

-- CreateTable
CREATE TABLE "SocietyExecutiveHistory" (
    "id" SERIAL NOT NULL,
    "societyId" INTEGER NOT NULL,
    "role" "ExecutiveRole" NOT NULL,
    "personId" INTEGER NOT NULL,
    "personName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "SocietyExecutiveHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocietyExecutiveHistory_societyId_role_personId_key" ON "SocietyExecutiveHistory"("societyId", "role", "personId");

-- AddForeignKey
ALTER TABLE "SocietyExecutiveHistory" ADD CONSTRAINT "SocietyExecutiveHistory_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;
