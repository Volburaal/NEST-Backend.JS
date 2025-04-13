import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSociety = async (req, res) => {
    try{
        let societyList = await prisma.society.findMany({});
        res.json(societyList)
    }
    catch (error) {
        console.error("Error fetching societies:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
}

export const addStudent = async (req, res) => {
    try {
        const { selectedStudent, role } = req.body;
        const newRole = role.toUpperCase().replace(/ /g, '_');
        

        const societyID = parseInt(req.user.affiliation);
        const existingMembership = await prisma.societyMembership.findUnique({
            where: {
                studentId_societyId: {
                    studentId: selectedStudent,
                    societyId: societyID,
                },
            },
        });

        if (existingMembership) {
            return res.status(400).json({ error: "Student is already a member of this society." });
        }
        await prisma.societyMembership.create({
            data: {
                studentId: selectedStudent,
                societyId: societyID,
                role: newRole || 'MEMBER',
            },
        });

        return res.status(200).json({ message: "Student added successfully to the society." });
    } catch (error) {
        console.error("Error adding student to society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const removeStudent = async (req, res) => {
    try {
        const { selectedStudent } = req.body;          const societyName = req.user.affiliation;          
                const Tsociety = await prisma.society.findUnique({
            where: {
                name: societyName,
            },
            include: {
                memberships: true,
            },
        });

        if (!Tsociety) {
            return res.status(404).json({ error: "Society not found." });
        }

        const societyID = Tsociety.id;

                const existingMembership = await prisma.societyMembership.findUnique({
            where: {
                studentId_societyId: {
                    studentId: selectedStudent,
                    societyId: societyID,
                },
            },
        });

        if (!existingMembership) {
            return res.status(400).json({ error: "Student is not a member of this society." });
        }

                await prisma.societyMembership.delete({
            where: {
                id: existingMembership.id,              },
        });

        return res.status(200).json({ message: "Student removed successfully from the society." });
    } catch (error) {
        console.error("Error removing student from society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const createSociety = async (req, res) => {
    try {
        const { name, fullName, mentorID, coMentorID, presidentId, vicePresidentId, secretaryId, treasurerId, mediaHeadId, token } = req.body;

        if (!name || !fullName || !mentorID) {
            return res.status(400).json({ error: "Name, full name, and mentor ID are required" });
        }

        const newSociety = await prisma.society.create({
            data: {
                name,
                fullName,
                mentorID,
                coMentorID,
                presidentId,
                vicePresidentId,
                secretaryId,
                treasurerId,
                mediaHeadId
            },
        });
        return res.status(201).json({ message: "Society created successfully", society: newSociety });
    } catch (error) {
        console.error("Error creating society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const updateSociety = async (req, res) => {
    try {
        const {id,  name, fullName, mentorID, coMentorID, presidentId, vicePresidentId, secretaryId, treasurerId, mediaHeadId, token } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Society ID is required" });
        }
        const existingSociety = await prisma.society.findUnique({
            where: { id },
        });

        if (!existingSociety) {
            return res.status(404).json({ error: "Society not found" });
        }

        const updatedSociety = await prisma.society.update({
            where: { id },
            data: {
                name: name || existingSociety.name,
                fullName: fullName || existingSociety.fullName,
                mentorID,
                coMentorID,
                presidentId,
                vicePresidentId,
                secretaryId,
                treasurerId,
                mediaHeadId
            },
        });

        return res.status(200).json({ message: "Society updated successfully", society: updatedSociety });
    } catch (error) {
        console.error("Error updating society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteSociety = async (req, res) => {
    try {

        const { id, token } = req.body;

                if (!id) {
            return res.status(400).json({ error: "Society ID is required" });
        }

                const existingSociety = await prisma.society.findUnique({
            where: { id },
        });

        if (!existingSociety) {
            return res.status(404).json({ error: "Society not found" });
        }

                await prisma.society.delete({
            where: { id },
        });

                return res.status(200).json({ message: "Society deleted successfully" });
    } catch (error) {
        console.error("Error deleting society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const getMembers = async (req, res) => {
    try {
        const society = await prisma.society.findUnique({
            where: {
                id: parseInt(req.user.affiliation),
            },
            select: {
                id: true,
                mentorID: true,
                coMentorID: true,
                memberships: {
                    select: {
                        studentId: true,
                        role: true,
                        student: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        if (!society) {
            return res.status(404).json({ error: "Society not found" });
        }

        const mentor = society.mentorID
            ? await prisma.faculty.findUnique({
                  where: { id: society.mentorID },
                  select: { id: true, name: true },
              })
            : null;

        const coMentor = society.coMentorID
            ? await prisma.faculty.findUnique({
                  where: { id: society.coMentorID },
                  select: { id: true, name: true },
              })
            : null;

        const membersData = society.memberships.map((membership) => ({
            studentId: membership.studentId,
            studentName: membership.student.name,
            role: membership.role,
        }));

        return res.status(200).json({
            societyId: society.id,
            mentor: mentor ? mentor : null,
            coMentor: coMentor ? coMentor : null,
            members: membersData,
        });

    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteMember = async (req, res) => {
    try {
        const { id } = req.body;

        const society = await prisma.society.findUnique({
            where: {
                id: parseInt(req.user.affiliation),
            },
            select: {
                id: true,
            },
        });

        if (!society) {
            return res.status(404).json({ error: "Society not found" });
        }

        const societyID = society.id;

        if (!id) {
            return res.status(400).json({ error: "Missing id" });
        }

        const deletedMembership = await prisma.societyMembership.delete({
            where: {
                studentId_societyId: {
                    studentId: id,
                    societyId: societyID,
                },
            },
        });

        if (!deletedMembership) {
            return res.status(404).json({ error: "Membership not found" });
        }

        return res.status(200).json({ message: "Membership deleted successfully" });

    } catch (error) {
        console.error("Error deleting society membership:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};


export const capture = async (req, res) => {
    try {
        console.log(req.body)

        return res.status(200).json({ message: "Captured"});
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};