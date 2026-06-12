import nodemailer from 'nodemailer';
import { PrismaClient } from "@prisma/client";
import { generateStudentEmail } from './mailFacilitators.js';

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

export const blacklistStudent = async (req, res) => {
    try {
        const { id } = req.body;
        const student = await prisma.student.findUnique({where:{id:id}})
        if(!student.blacklisted){
            const memberships = await prisma.societyMembership.findMany({
                where:{studentId: id},
                include:{
                    society: {
                        include:{
                            president: true
                        }
                    }
                }
            })
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SENDER_ADDRESS,
                    pass: process.env.EMAIL_APP_PASSWORD,
                },
            });
            let emailContent = `
            <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">${student.name} has been removed from your society</h1>
            <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
                <h3 style="font-weight: bold; text-align: center;">For your information, ${student.name} (${student.rollnumber}) has been blacklisted and thus removed from your society</h3>
                <h3 style="font-weight: bold; text-align: center;">You may not add them to your society until they are removed from the blackist</h3>
            </div>
            `
            const concernedPresidents = []
            for(const memebership of memberships){
                concernedPresidents.push(generateStudentEmail(memebership.society.president.rollnumber))
            }
            let mailOptions = {
                from: process.env.SENDER_ADDRESS,
                to: '',
                bcc: [concernedPresidents],
                subject: `Member Blacklisted`,
                html: emailContent,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.error('Error sending email:', error);
                  return res.status(500).json({ error: 'Error sending blacklist notification email to presidents' });
                }
                return res.status(200).json({ message: 'Blacklist email sent to presidents'});
            });
            await prisma.societyMembership.deleteMany({where:{studentId:id}})
            await prisma.inductionApplication.deleteMany({where:{studentId: id}})
            emailContent = `
                <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">You have been blacklisted</h1>
                <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
                    <h3>All existing society memberships and induction applications associated with you have been removed</h3>
                    <h3>While blacklisted, you may not:</h3>
                    <ul>
                        <li><h3>Be a part of any society</h3></li>
                        <li><h3>Apply for inductions in any society</h3></li>
                        <li><h3>Apply for ambassador for any inter-university event</h3></li>
                        <li><h3>Partake in any inter-university event</h3></li>
                    </ul>
                    If you think this is a mistake or you have been wrongfully blacklisted, please visit the student affairs incharge.
                </div>
            `
            mailOptions = {
                from: process.env.SENDER_ADDRESS,
                to: '',
                bcc: [generateStudentEmail(student.rollnumber)],
                subject: `Blacklist Notification`,
                html: emailContent,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                  console.error('Error sending email:', error);
                  return res.status(500).json({ error: 'Error sending blacklist notification email to target'});
                }
                return res.status(200).json({ message: 'Blacklist email sent to target'});
            });
        }
        await prisma.student.update({
            where: {
                id: id,
            },
            data:{
                blacklisted: !student.blacklisted
            }
        });
        res.status(200).json({ message: "Student deleted successfully"});
    } catch (error) {
        console.error("Error blacklisting:", error);
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