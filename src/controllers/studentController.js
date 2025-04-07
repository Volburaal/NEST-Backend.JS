import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createStudent = async (req, res) => {
    try {
        const { name, cnic, degree, rollnumber, phone, whatsapp, residency } = req.body;

        if (!name || !cnic || !degree || !rollnumber) {
            return res.status(400).json({ message: 'Missing required fields: name, cnic, degree, or rollnumber' });
        }

        const existingStudentByRollnumber = await prisma.student.findUnique({
            where: { rollnumber: rollnumber },
        });

        if (existingStudentByRollnumber) {
            return res.status(400).json({ message: "Student with this rollnumber already exists" });
        }

        const existingStudentByCnic = await prisma.student.findUnique({
            where: { cnic: cnic },
        });

        if (existingStudentByCnic) {
            return res.status(400).json({ message: "Student with this CNIC already exists" });
        }

        const student = await prisma.student.create({
            data: {
                name: name,
                cnic: cnic,
                degree: degree,
                rollnumber: rollnumber,
                phone: phone || null,
                whatsapp: whatsapp || null,
                residency: residency || "DAYSCHOLAR",
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
        console.log(req.body)
        const { id, name, rollnumber, cnic, degree, phone, whatsapp, residency } = req.body;

        if (!id || !name || !rollnumber || !cnic || !degree) {
            return res.status(400).json({ message: 'Missing required fields: id, name, rollnumber, cnic, or degree' });
        }

        const existingStudentByRollnumber = await prisma.student.findUnique({
            where: { rollnumber: rollnumber },
        });

        if (existingStudentByRollnumber && existingStudentByRollnumber.id !== id) {
            return res.status(400).json({ message: "Student with this rollnumber already exists" });
        }

        const existingStudentByCnic = await prisma.student.findUnique({
            where: { cnic: cnic },
        });

        if (existingStudentByCnic && existingStudentByCnic.id !== id) {
            return res.status(400).json({ message: "Student with this CNIC already exists" });
        }

        const updatedStudent = await prisma.student.update({
            where: { id: id },
            data: {
                name: name,
                rollnumber: rollnumber,
                cnic: cnic,
                degree: degree,
                phone: phone || null,
                whatsapp: whatsapp || null,
                residency: residency || "DAYSCHOLAR",
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