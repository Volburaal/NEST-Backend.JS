import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createFeedback = async (req, res) => {
    try{
        const {title, content} = req.body;
        const id = req.user.id
        const user  = await prisma.user.findUnique({
            where: { id }
        });
        const submittedBy = user.name
        const feedback = await prisma.feedback.create({
            data: {
                title,
                content,
                submittedBy, 
            },
        });

        res.status(201).json(feedback);
    }
    catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
}
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