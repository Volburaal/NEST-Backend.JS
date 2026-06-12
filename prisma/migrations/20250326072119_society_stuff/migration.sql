-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('MEMBER', 'PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY');

-- CreateTable
CREATE TABLE "Faculty" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "extension" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "affiliations" TEXT[],

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rollnumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "affiliations" TEXT[],

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Society" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mentorID" INTEGER NOT NULL,
    "presidentId" INTEGER NOT NULL,
    "vicePresidentId" INTEGER NOT NULL,
    "secretaryId" INTEGER NOT NULL,

    CONSTRAINT "Society_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocietyMembership" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "societyId" INTEGER NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "SocietyMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_email_key" ON "Faculty"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_extension_key" ON "Faculty"("extension");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollnumber_key" ON "Student"("rollnumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_phone_key" ON "Student"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "SocietyMembership_studentId_societyId_key" ON "SocietyMembership"("studentId", "societyId");

-- AddForeignKey
ALTER TABLE "Society" ADD CONSTRAINT "Society_mentorID_fkey" FOREIGN KEY ("mentorID") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyMembership" ADD CONSTRAINT "SocietyMembership_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocietyMembership" ADD CONSTRAINT "SocietyMembership_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society"("id") ON DELETE CASCADE ON UPDATE CASCADE;
