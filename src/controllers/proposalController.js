import { PrismaClient } from "@prisma/client";
import nodemailer from 'nodemailer';

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

export const getProposals = async (req, res) => {
  try {
    const { id, role, affiliation } = req.user;
    let proposals;

    const society = await prisma.society.findUnique({
      where: { id: parseInt(affiliation) },
    });
    const societyName = society ? society.name : null;

    const include = {
      submittedBy: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      },
      files: true,
    };

    switch (role) {
      case "STUDENT":
        proposals = await prisma.proposal.findMany({
          where: { submittedById: id },
          include,
        });
        break;

      case "MENTOR":
        proposals = await prisma.proposal.findMany({
          where: {
            AND: [
              { society: societyName },
              {
                OR: [
                  { status: "PENDING" },
                  { status: "REVISED" },
                  { status: "REJECTED" },
                  { status: "APPROVED" },
                  { nextReviewerRole: "MENTOR" },
                ],
              },
            ],
          },
          include,
        });
        break;

      case "STUDENT_AFFAIRS":
      case "DIRECTOR":
      case "FINANCE_MANAGER":
        proposals = await prisma.proposal.findMany({
          include,
        });
        break;

      default:
        return res.status(403).json({ message: "Role not recognized" });
    }
    res.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const createProposal = async (req, res) => {
  try {
    const { title, description, eventDate, posters, budget, venue } = req.body;

    if (!title || !description || !eventDate || !venue) {
      return res.status(400).json({ error: "All fields are required" });
    }
    let recipientEmails = [];
    let nextRole="MENTOR"
    if(req.user.role == "STUDENT_AFFAIRS"){
      nextRole = 'DIRECTOR';

      const directors = await prisma.user.findMany({
        where: { role: 'DIRECTOR' }
      });

      for (const director of directors) {
        const faculty = await prisma.faculty.findUnique({
          where: { id: director.assignedToFaculty },
        });
        if (faculty) recipientEmails.push(faculty.email);
      }
    }

    else if (req.user.role === 'STUDENT') {
      const society = await prisma.society.findUnique({
        where: { id: parseInt(req.user.affiliation) },
      });

      if (society && society.mentorID) {
        const mentor = await prisma.faculty.findUnique({
          where: { id: society.mentorID },
        });

        if (mentor) {
          recipientEmails.push(mentor.email);
        }
      }
    }

    let societyName = "Student Affairs"
    if(req.user.role == "STUDENT"){
      const society = await prisma.society.findUnique({
        where: { id: parseInt(req.user.affiliation) },
      });
      if (society) {
        societyName = society.name;
      }
    }

    let emailContent = `
      <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">New Proposal For Review</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <p style="font-weight: bold; text-align: center;">Proposal for ${title} has been submitted by ${societyName}</p>
            <p >${description}</p>
            <ul>
                <li>Date: ${eventDate}</li>
                <li>Venue: ${venue}</li>
                <li>Requested Budget: ${budget}</li>
                <h3 style="color: rgb(243, 55, 159);">Please access the proposal management system <a href="http://59.103.246.24:3000/" style="color: rgb(0, 255, 255);">here</a> and review this proposal</h3>
        </div>
    `;
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_ADDRESS,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    let mailOptions = {
      from: process.env.SENDER_ADDRESS,
      to: '',
      bcc: [...recipientEmails],
      subject: `Proposal for review`,
      html: emailContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Error sending email' });
      }
      res.status(200).json({ message: 'Emails sent successfully' });
    });

    //Submission Conformation Email
    let submittedByMail = ""
    const user = await prisma.user.findUnique({
      where:{id: req.user.id}
    });
    if(user.assignedToStudent === null && user.assignedToFaculty === null){
      submittedByMail = ""
    }
    if (req.user.role == "STUDENT" && user.assignedToStudent !== null){
      const student = await prisma.student.findUnique({
        where:{id:user.assignedToStudent}
      })
      submittedByMail = generateStudentEmail(student.rollnumber)
    }
    else if (req.user.role == "STUDENT_AFFAIRS" && user.assignedToFaculty !== null){
      const faculty = await prisma.faculty.findUnique({
        where:{id:user.assignedToFaculty}
      })
      submittedByMail = faculty.email;
    }

    emailContent = `
      <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Proposal Submitted Succesfully</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <p style="font-weight: bold; text-align: center;">Proposal for ${title} submitted succesfully submitted on behalf of ${societyName}</p>
            <p >${description}</p>
            <ul>
                <li>Date: ${eventDate}</li>
                <li>Venue: ${venue}</li>
                <li>Requested Budget: ${budget}</li>
            </ul>
        </div>
    `;
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_ADDRESS,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    mailOptions = {
      from: process.env.SENDER_ADDRESS,
      to: '',
      bcc: [submittedByMail],
      subject: `Proposal Submitted`,
      html: emailContent,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: 'Error sending email' });
      }
      res.status(200).json({ message: 'Emails sent successfully' });
    });

    const proposal = await prisma.proposal.create({
      data: {
        title,
        society: societyName,
        venue,
        description,
        eventDate: new Date(eventDate),
        budget: budget !== undefined ? budget : null,
        status: "PENDING",
        submittedById: req.user.id,
        nextReviewerRole: nextRole,
      },
      include: {
        comments: true,
      },
    });

    res.status(201).json(proposal);
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};

export const reviewProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const { role, id: userId } = req.user;

    const formattedStatus = status.toLowerCase();

    const proposal = await prisma.proposal.findUnique({
      where: { id: parseInt(id) },
      include: {
        comments: true,
        submittedBy: true,
        reviewedBy: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true,
        assignedToStudent: true,
        assignedToFaculty: true,
        email: true,
      },
    });

    let commentedByName = "";
    if (user.assignedToStudent === null && user.assignedToFaculty === null) {
      commentedByName = user.email;
    } else if (user.role === "STUDENT") {
      commentedByName = user.name;
    } else {
      const faculty = await prisma.faculty.findUnique({
        where:{id: user.assignedToFaculty}
      });
      commentedByName = faculty.name;
    }

    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }

    if (proposal.nextReviewerRole !== role) {
      return res.status(403).json({ message: "Not authorized to review this proposal" });
    }

    let nextReviewerRole = null;
    let emailContent = '';
    let recipientEmails = [];

    if (status.toUpperCase() === "APPROVED") {
      switch (role) {
        case "MENTOR":
          nextReviewerRole = "STUDENT_AFFAIRS";
          break;
        case "STUDENT_AFFAIRS":
          nextReviewerRole = "DIRECTOR";
          break;
        case "DIRECTOR":
          nextReviewerRole = "FINANCE_MANAGER";
          break;
        case "FINANCE_MANAGER":
          nextReviewerRole = null;
          break;
      }

      // Send email to the submitter for an approved proposal
      emailContent = `
       <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Status Update</h1>
          <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
              <p style="font-weight: bold; text-align: center;">Proposal for ${proposal.title} has been ${formattedStatus} by ${commentedByName}</p>
              <p >Comments: ${comments}</p>
          </div>
      `;

      const submittedBy = proposal.submittedBy;
      let submitterEmail = "";
      if (submittedBy.role === "STUDENT"){
        const student = await prisma.student.findUnique({
          where: { id: submittedBy.assignedToStudent },
        });
        submitterEmail = generateStudentEmail(student.rollnumber);
      }
      else if (submittedBy.role === "STUDENT_AFFAIRS"){
        const faculty = await prisma.faculty.findUnique({
          where: { id: submittedBy.assignedToFaculty },
        });
        submitterEmail = faculty.email;
      }

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_ADDRESS,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      let mailOptions = {
        from: process.env.SENDER_ADDRESS,
        to: submitterEmail,
        subject: `Proposal Approved: ${proposal.title}`,
        html: emailContent,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email to submitter' });
        }
      });

      const nextReviewers = await prisma.user.findMany({
        where: { role: nextReviewerRole },
      });

      for (const reviewer of nextReviewers) {
        const faculty = await prisma.faculty.findUnique({
          where: { id: reviewer.assignedToFaculty },
        });
        if (faculty) {
          recipientEmails.push(faculty.email);
        }
      }

      emailContent = `
        <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">New Proposal for Review</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <p style="font-weight: bold; text-align: center;">Proposal for ${proposal.title} is awaiting your review.</p>
            <p>${proposal.description}</p>
            <ul>
                <li>Date: ${proposal.eventDate}</li>
                <li>Venue: ${proposal.venue}</li>
                <li>Requested Budget: ${proposal.budget}</li>
            </ul>
            <h3 style="color: rgb(243, 55, 159);">Please access the proposal management system <a href="http://59.103.246.24:3000/" style="color: rgb(0, 255, 255);">here</a> and review this proposal.</h3>
        </div>
      `;

      for (const recipient of recipientEmails) {
        mailOptions = {
          from: process.env.SENDER_ADDRESS,
          to: recipient,
          subject: `New Proposal for Review: ${proposal.title}`,
          html: emailContent,
        };

        // Send email to the next reviewer
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email to next reviewer:', error);
          }
        });
      }
    } else if (status.toUpperCase() === "REJECTED") {

      emailContent = `
       <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Status Update</h1>
          <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
              <p style="font-weight: bold; text-align: center;">Proposal for ${proposal.title} has been ${formattedStatus} by ${commentedByName}</p>
              <p >Comments: ${comments}</p>
          </div>
      `;

      const submittedBy = proposal.submittedBy;
      let submitterEmail = "";
      if (submittedBy.role === "STUDENT"){
        const student = await prisma.student.findUnique({
          where: { id: submittedBy.assignedToStudent },
        });
        submitterEmail = generateStudentEmail(student.rollnumber);
      }
      else if (submittedBy.role === "STUDENT_AFFAIRS"){
        const faculty = await prisma.faculty.findUnique({
          where: { id: submittedBy.assignedToFaculty },
        });
        submitterEmail = faculty.email;
      }

      let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SENDER_ADDRESS,
          pass: process.env.EMAIL_APP_PASSWORD,
        },
      });

      let mailOptions = {
        from: process.env.SENDER_ADDRESS,
        to: submitterEmail,
        subject: `Proposal Rejected: ${proposal.title}`,
        html: emailContent,
      };

      // Send emails
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email to submitter:', error);
          return res.status(500).json({ error: 'Error sending email to submitter' });
        }
      });
    }


    const updatedProposal = await prisma.$transaction(async (prisma) => {
      const updated = await prisma.proposal.update({
        where: { id: parseInt(id) },
        data: {
          status: status.toUpperCase(),
          reviewedById: userId,
          nextReviewerRole,
        },
        include: {
          comments: {
            include: {
              user: {
                select: {
                  name: true,
                  role: true,
                },
              },
            },
          },
        },
      });

      if (comments) {
        await prisma.comment.create({
          data: {
            content: comments,
            userId: userId,
            proposalId: parseInt(id),
            commentedByName: commentedByName,
          },
        });
      }

      return updated;
    });

    res.json(updatedProposal);
  } catch (error) {
    console.error("Error reviewing proposal:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};