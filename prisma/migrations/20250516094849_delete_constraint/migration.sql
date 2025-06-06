-- DropForeignKey
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_proposalId_fkey";

-- DropForeignKey
ALTER TABLE "ZeroRequirement" DROP CONSTRAINT "ZeroRequirement_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "ZeroRequirement" DROP CONSTRAINT "ZeroRequirement_proposalId_fkey";

-- AddForeignKey
ALTER TABLE "ZeroRequirement" ADD CONSTRAINT "ZeroRequirement_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "ZeroDepartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZeroRequirement" ADD CONSTRAINT "ZeroRequirement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
