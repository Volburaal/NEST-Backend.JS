import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createFeedback = async (req, res) => {
    try {
        const { title, content } = req.body;
        const id = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                assignedStudent: true,
                assignedFaculty: true,
            },
        });

        let submittedBy = `${user.email} (unassigned)`;

        if (user.role === "STUDENT") {
            if (user.assignedToStudent) {
                const student = await prisma.student.findUnique({
                    where: { id: user.assignedToStudent },
                });
                submittedBy = `${student.name} (${student.rollnumber})`;
            } else {
                submittedBy = `${user.email} (unassigned)`;
            }
        } else if (user.role === "MENTOR" || user.role === "FACULTY") {
            if (user.assignedToFaculty) {
                const faculty = await prisma.faculty.findUnique({
                    where: { id: user.assignedToFaculty },
                });
                submittedBy = `${faculty.name} (${faculty.dept})`;
            } else {
                submittedBy = `${user.email} (unassigned)`;
            }
        }

        const feedback = await prisma.feedback.create({
            data: {
                title,
                content,
                submittedBy,
            },
        });

        res.status(201).json(feedback);
    } catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};


export const getFeedback = async (req, res) => {
    try{
        const { id, role, affiliation } = req.user;
        let feedbackList = await prisma.feedback.findMany({});
        res.json(feedbackList)
    }
    catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
    
}