import nodemailer from 'nodemailer';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const generateStudentEmail = (rollnumber) => {
    // const campusCodes = {
    //   F: 'cfd',
    //   I: 'isb',
    //   L: 'lhr',
    //   P: 'pwr',
    //   K: 'khi',
    // };
  
    const batch = rollnumber.substring(0, 2);
    const campus = rollnumber[2].toLowerCase();
    const studentNumber = rollnumber.substring(4);
    
    return `${campus}${batch}${studentNumber}@cfd.nu.edu.pk`;
    //return `${campus}${batch}${studentNumber}@${campusCodes[campus]}.nu.edu.pk`;
  };
  
  const getMentorAndCoMentorEmails = async (societyId) => {
    const society = await prisma.society.findUnique({
      where: { id: societyId },
      select: {
        mentorID: true,
        coMentorID: true,
      },
    });
  
    if (!society) {
      throw new Error('Society not found');
    }
  
    const { mentorID, coMentorID } = society;
  
    const mentor = await prisma.faculty.findUnique({
      where: { id: mentorID },
      select: {
        email: true,
      },
    });
  
    let coMentorEmail = '';
    if (coMentorID) {
      const coMentor = await prisma.faculty.findUnique({
        where: { id: coMentorID },
        select: {
          email: true,
        },
      });
      coMentorEmail = coMentor?.email || '';
    }
  
    const mentorEmail = mentor?.email || '';
  
    return { mentorEmail, coMentorEmail };
  };
  
  
  export const  scheduleMeeting = async (req, res) => {
    try {
        console.log(req.body)
        const { title, date, time, venue, agenda, token } = req.body;
        
        const societyName = req.user.affiliation;

        const society = await prisma.society.findUnique({
            where: {
            name: societyName,
            },
        });

        if (!society) {
            return res.status(404).json({ error: 'Society not found' });
        }
        const user = await prisma.user.findUnique({
            where:{
                id: req.user.id
            }
        })

        const societyId = society.id;

        const members = await prisma.societyMembership.findMany({
            where: { societyId },
            include: {
            student: true,
            },
        });
        let name = user.email;

        if (user.assignedToStudent === null && user.assignedToFaculty === null) {
            name = user.email;
        } else if (req.user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { id: user.assignedToStudent },
            });
            name = student ? student.name : user.email;
        } else {
            const faculty = await prisma.faculty.findUnique({
                where: { id: user.assignedToFaculty },
            });
            name = faculty ? faculty.name : user.email;
        }

        const studentEmails = members.map((membership) => generateStudentEmail(membership.student.rollnumber));

        const { mentorEmail, coMentorEmail } = await getMentorAndCoMentorEmails(societyId);
        const emailContent = `
            <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Meeting Notification</h1>
            <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
                <h3 style="text-align: center;"><b>A meeting has been scheduled by ${name} (${req.user.affiliation})</b><br></h3>
                <h2><b>Agenda</b><br></h2>
                <p style="text-align: justify; word-wrap: break-word; white-space: normal;">${agenda}</p>
                <br>
                <p >Date: <b>${date}</b></p>
                <p>Time: <b>${time}</b></p>
                <p>Venue: <b>${venue}</b></p>
                <h5>On behalf of ${societyName}, this mail was sent to the corresponding mentor, co-mentor and all society members automatically.<br>If you are not affiliated to the society or think this mail was sent to you by mistake please report to the student affairs</h6>
             </div>
        `;
  
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: '',
          pass: '',
        },
      });
  
      const mailOptions = {
        from: 'muzammilnoor897@gmail.com',
        to: '',
        bcc: [...studentEmails, mentorEmail, coMentorEmail],
        subject: `Meeting Scheduled: ${title}`,
        html: emailContent,
      };
  
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email' });
        }
        res.status(200).json({ message: 'Emails sent successfully' });
      });
    } catch (error) {
      console.error("Error scheduling meeting:", error);
      res.status(500).json({ error: "Server error" });
    } finally {
      await prisma.$disconnect();
    }
  };