import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSociety = async (req, res) => {
    try{
        console.log("Fetching Society")
        console.log(req.body)
    }
    catch (error) {
        console.error("Error creating feedback:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
}
export const addStudent = async (req, res) => {
    try{
        const {selectedStudent, role} = req.body
        const society = req.user.affiliation
        const societyID = await prisma.society.findMany({
        });
        console.log(selectedStudent,societyID,role)
    }
    catch (error) {
        console.error("Error adding student to society:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
    
}
export const createSociety = async (req, res) => {
    try{
        console.log("Adding Society")
        console.log(req.body)
    }
    catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
    
}