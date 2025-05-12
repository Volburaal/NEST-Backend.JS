import nodemailer from 'nodemailer';
import { PrismaClient } from "@prisma/client";
import { generateStudentEmail } from "./mailFacilitators.js"

const prisma = new PrismaClient();
  
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
  

export const scheduleMeeting = async (req, res) => {
  try {
    const { title, date, time, venue, agenda } = req.body;
    const societyName = req.user.affiliation;

    const society = await prisma.society.findUnique({
      where: { id: parseInt(societyName) },
    });

    if (!society) return res.status(404).json({ error: 'Society not found' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const societyId = society.id;

    const members = await prisma.societyMembership.findMany({
      where: { societyId },
      include: { student: true },
    });

    // Create meeting record
    const meeting = await prisma.meeting.create({
      data: {
        title,
        date: new Date(date),
        time,
        venue,
        agenda,
        societyId,
        attendance: {
          create: members.map((membership) => ({
            student: { connect: { id: membership.student.id } },
            isPresent: false, // default to false, can be updated later
          })),
        },
      },
    });

    // Determine sender name
    let name = user.email;
    if (user.assignedToStudent && req.user.role === 'STUDENT') {
      const student = await prisma.student.findUnique({
        where: { id: user.assignedToStudent },
      });
      name = student?.name ?? user.email;
    } else if (user.assignedToFaculty) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: user.assignedToFaculty },
      });
      name = faculty?.name ?? user.email;
    }

    const studentEmails = members.map((m) =>
      generateStudentEmail(m.student.rollnumber)
    );

    const { mentorEmail, coMentorEmail } = await getMentorAndCoMentorEmails(societyId);

    const emailContent = `
      <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Meeting Notification</h1>
      <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
          <h3 style="text-align: center;"><b>A meeting has been scheduled by ${name} (${society.name})</b><br></h3>
          <h2><b>Agenda</b><br></h2>
          <p style="text-align: justify; word-wrap: break-word; white-space: normal;">${agenda}</p>
          <br>
          <p >Date: <b>${date}</b></p>
          <p>Time: <b>${time}</b></p>
          <p>Venue: <b>${venue}</b></p>
          <h5>On behalf of ${society.name}, this mail was sent to the corresponding mentor, co-mentor and all society members automatically.<br>If you are not affiliated to the society or think this mail was sent to you by mistake please report to the student affairs</h6>
        </div>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_ADDRESS,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.SENDER_ADDRESS,
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
      return res.status(200).json({ message: 'Meeting scheduled and emails sent', meetingId: meeting.id });
    });
  } catch (error) {
    console.error("Error scheduling meeting:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const getMeetings = async (req, res) => {
  try {
    const userRole = req.user.role;
    let meetings;

    if (userRole === 'STUDENT' || userRole === 'MENTOR') {
      const societyId = req.user.affiliation;
      meetings = await prisma.meeting.findMany({
        where: {
          societyId: parseInt(societyId),
        },
        include: {
          attendance: {
            include: {
              student: true,
            },
          },
          minutes: true,
        },
      });

    } else if (userRole === 'STUDENT_AFFAIRS') {
      meetings = await prisma.meeting.findMany({
        include: {
          society: true,
          attendance: {
            include: {
              student: true,
            },
          },
          minutes: true,
        },
      });
    } else {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    return res.status(200).json(meetings);

  } catch (error) {
    console.error('Error fetching meetings:', error);
    return res.status(500).json({ error: 'Server error while fetching meetings' });
  }
};


export const setMinutes = async (req, res) => {
  try {
    const {content} = req.body;
    const meetingId = parseInt(req.params.id);
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });
    if (meeting){
      const minutes = await prisma.minutes.create({
        data: {
          content,
          meetingId: meetingId,
        },
      });
    return res.status(200).json(minutes);
  }
  else{
    res.status(404).json({ error: 'Meeting not found' });
  }
    

  } catch (error) {
    console.error('Error adding minute:', error);
    return res.status(500).json({ error: 'Server error while adding minutes' });
  }
};

export const updateAttendance = async (req, res) => {
  try {
    const meetingId = req.params.id;
    const {attendance} = req.body;
    for (const attend of attendance){
      const {studentId} = attend;
      const presence = attend.presence ?? false;
      const attendanceRecord = await prisma.attendance.update({
        where: {
          meetingId_studentId: {
            meetingId: parseInt(meetingId),
            studentId: parseInt(studentId),
          },
        },
        data: {
          isPresent: presence,
        },
      })
    }
    return res.status(200).json({message: "Attendance updated successfully"});

  } catch (error) {
    console.error('Error updating attendance:', error);
    return res.status(500).json({ error: 'Server error while updating attendance' });
  }
};


export const deleteMinute = async (req, res) => {
  try {
    const {minuteId} = req.body;
    const response = await prisma.minutes.delete({
      where: { id: parseInt(minuteId) },
    });
    return res.status(200).json({message: "Minute deleted successfully"});
  } catch (error) {
    console.error('Error deleting minute:', error);
    return res.status(500).json({ error: 'Server error while deleting minute' });
  }
};