-- CreateTable
CREATE TABLE "ZeroRequirement" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "proposalId" INTEGER NOT NULL,

    CONSTRAINT "ZeroRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "allowInductions" BOOLEAN NOT NULL DEFAULT true,
    "allowProposals" BOOLEAN NOT NULL DEFAULT true,
    "minNotice" INTEGER NOT NULL DEFAULT 7,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZeroDepartment" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "ZeroDepartment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZeroDepartment_email_key" ON "ZeroDepartment"("email");

-- AddForeignKey
ALTER TABLE "ZeroRequirement" ADD CONSTRAINT "ZeroRequirement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "ZeroDepartment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZeroRequirement" ADD CONSTRAINT "ZeroRequirement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
