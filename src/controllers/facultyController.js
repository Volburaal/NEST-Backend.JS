import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createFaculty = async (req, res) => {
    try{
        console.log("Create Faculty")
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
export const updateFaculty = async (req, res) => {
    try{
        console.log("Update Faculty")
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
export const deleteFaculty = async (req, res) => {
    try{
        console.log("Delete Faculty")
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

export const getFaculty = async (req, res) => {
    try{
        console.log("Get Faculty")
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