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
    try {
        console.log("Adding Society");
        console.log(req.body);

        const { name, fullName, mentorID, coMentorID, token } = req.body;

        if (!name || !fullName || !mentorID) {
            return res.status(400).json({ error: "Name, full name, and mentor ID are required" });
        }

        const newSociety = await prisma.society.create({
            data: {
                name,
                fullName,
                mentorID,
                coMentorID,
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

        const { id, name, fullName, mentorID, coMentorID, token } = req.body;

        // Validate the presence of required fields
        if (!id) {
            return res.status(400).json({ error: "Society ID is required" });
        }

        // Fetch the existing society to ensure it exists before updating
        const existingSociety = await prisma.society.findUnique({
            where: { id },
        });

        if (!existingSociety) {
            return res.status(404).json({ error: "Society not found" });
        }

        // Update the society with the new data
        const updatedSociety = await prisma.society.update({
            where: { id },
            data: {
                name: name || existingSociety.name,
                fullName: fullName || existingSociety.fullName,
                mentorID: mentorID || existingSociety.mentorID,
                coMentorID: coMentorID || existingSociety.coMentorID,
                // Optional: You can add additional fields like presidentId, vicePresidentId, etc., here if needed.
            },
        });

        // Return the updated society
        return res.status(200).json({ message: "Society updated successfully", society: updatedSociety });
    } catch (error) {
        console.error("Error updating society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

// Delete Society
export const deleteSociety = async (req, res) => {
    try {

        const { id, token } = req.body;

        // Validate the presence of society ID
        if (!id) {
            return res.status(400).json({ error: "Society ID is required" });
        }

        // Check if the society exists before deleting
        const existingSociety = await prisma.society.findUnique({
            where: { id },
        });

        if (!existingSociety) {
            return res.status(404).json({ error: "Society not found" });
        }

        // Delete the society
        await prisma.society.delete({
            where: { id },
        });

        // Return a success message
        return res.status(200).json({ message: "Society deleted successfully" });
    } catch (error) {
        console.error("Error deleting society:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};