import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createFaculty = async (req, res) => {
    try{
        const { name, email, extension, dept, token } = req.body;
        if (!name || !email || !extension || !dept) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const existingFaculty = await prisma.faculty.findFirst({
            where: {
                OR: [
                    { email: email }
                ]
            }
        });
        if (existingFaculty) {
            return res.status(400).json({ error: 'Faculty with the same email or extension already exists' });
        }
        const newFaculty = await prisma.faculty.create({
            data: {
                name: name,
                email: email,
                extension: extension,
                dept: dept
            }
        });
        res.status(201).json(newFaculty);
    }
    catch (error) {
        console.error("Error creating faculty:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
}
export const updateFaculty = async (req, res) => {
    try {
        const { id, name, email, extension, dept, token } = req.body;

        if (!id || !name || !email || !extension || !dept) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingFaculty = await prisma.faculty.findUnique({
            where: { id: id }
        });

        if (!existingFaculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        if ((email !== existingFaculty.email || extension !== existingFaculty.extension) && id !== existingFaculty.id) {
            const existingEmailOrExtension = await prisma.faculty.findFirst({
                where: {
                    OR: [
                        { email: email },
                        { extension: extension }
                    ]
                }
            });

            if (existingEmailOrExtension) {
                return res.status(400).json({ error: 'Faculty with the same email or extension already exists' });
            }
        }

        const updatedFaculty = await prisma.faculty.update({
            where: { id: id },
            data: {
                name: name,
                email: email,
                extension: extension,
                dept: dept
            }
        });

        res.status(200).json(updatedFaculty);
    } catch (error) {
        console.error("Error updating faculty:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};


export const deleteFaculty = async (req, res) => {
    try {
        const { id, token } = req.body;

        if (!id || !token) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const existingFaculty = await prisma.faculty.findUnique({
            where: { id: id }
        });

        if (!existingFaculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }
        const deletedFaculty = await prisma.faculty.delete({
            where: { id: id }
        });
        res.status(200).json({ message: 'Faculty deleted successfully', deletedFaculty });
    } catch (error) {
        console.error("Error deleting faculty:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};



export const getFaculty = async (req, res) => {
    try{
        let facultyList = await prisma.faculty.findMany({});
        res.json(facultyList)
    }
    catch (error) {
        console.error("Error fetching feedback:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
    
}
