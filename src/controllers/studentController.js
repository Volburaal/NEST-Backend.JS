import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createStudent = async (req, res) => {
    try {
        const { name, rollnumber, phone } = req.body;

        if (!rollnumber || !phone) {
            return res.status(400).json({ message: 'Missing rollnumber or phone' });
        }

        const existingUser = await prisma.student.findUnique({
            where: { rollnumber: rollnumber },
        });

        if (existingUser) {
            return res.status(400).json({ message: "Student already exists" });
        }

        const student = await prisma.student.create({
            data: {
                name: name,
                rollnumber: rollnumber,
                phone: phone,
            },
        });

        res.status(201).json(student);
    } catch (error) {
        console.error("Error creating student:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};
export const updateStudent = async (req, res) => {
    try {
        const { id, name, rollnumber, phone } = req.body;

        const updatedStudent = await prisma.student.update({
            where: {
                id: id, 
            },
            data: {
                name: name,
                rollnumber: rollnumber,
                phone: phone,
            },
        });

        res.status(200).json({ message: "Student updated successfully", student: updatedStudent });
    } catch (error) {
        console.error("Error updating student:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.body;
        const deletedStudent = await prisma.student.delete({
            where: {
                id: id,
            },
        });
        res.status(200).json({ message: "Student deleted successfully", student: deletedStudent });
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).json({ error: "Server error" });
    } finally {
        await prisma.$disconnect();
    }
};

export const getStudents = async (req, res) => {
    try{
        let studentList = await prisma.student.findMany({});
        res.json(studentList)
    }
    catch (error) {
        console.error("Error fetching students:", error);
        res.status(500).json({ error: "Server error" });
    }
    finally {
        await prisma.$disconnect();
    }
}