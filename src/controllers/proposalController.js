import { PrismaClient } from "@prisma/client";
import nodemailer from 'nodemailer';
import { generateStudentEmail } from "./mailFacilitators.js"

const prisma = new PrismaClient();

export const getProposals = async (req, res) => {
  try {
    const { id, role, affiliation } = req.user;
    let proposals;

    const include = {
      submittedBy: {
        select: {
          email: true,
          role: true,
        },
      },
      comments: {
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      },
      files: true,
      requirements: true,
      zerorequirements: {
        include:{
          dept: true,
        }
      },
    };

    switch (role) {
      case "STUDENT":
      case "MENTOR":
        const society = await prisma.society.findUnique({
          where: { id: parseInt(affiliation) },
        });
        const societyName = society ? society.name : null;
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
      case "GENERAL_USER":
        proposals = await prisma.proposal.findMany({
          where:{
            status: "APPROVED",
            nextReviewerRole: null,
          }
        })
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
    const { title, description, eventDate, posters, requirements, zeroRequirements, budget, venue, tag } = req.body;
   
    if(tag === "EVENT"){
      await prisma.proposal.create({
        data:{
          title,
          society: "",
          venue,
          description,
          status: "APPROVED",
          nextReviewerRole: null,
          submittedById: req.user.id,
          eventDate: new Date(eventDate),
          budget: 0
        }
      })
      return res.status(200).json({message:"Event Added"})
    }
    else{

    }

    const settings = await prisma.settings.findUnique({where:{id:1}})
    if(!settings.allowProposals){
      return res.status(400).json({ message: "Proposal Creation has been disabled by student affairs" });
    }
    const evDate = new Date(eventDate)
    const diffInDays = Math.floor((evDate - new Date())/ (1000 * 60 * 60 * 24));
    if(diffInDays < settings.minNotice){
      return res.status(400).json({message: "A minimum notice of " + settings.minNotice + " days must be provided for any event."})
    }
    
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
    
    if (recipientEmails.length > 0){
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email' });
        }
        res.status(200).json({ message: 'Emails sent successfully' });
      });
    }

    let submittedByMail;
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

    if(submittedByMail){
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email' });
        }
        res.status(200).json({ message: 'Emails sent successfully' });
      }); 
    }

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
    for (let requirement of requirements){
      await prisma.requirement.create({
        data:{
          name: requirement.requirement,
          price: requirement.price,
          quantity: requirement.quantity,
          proposalId: proposal.id,
        }
      })
    }
    for(const requirement of zeroRequirements){
      await prisma.zeroRequirement.create({
        data:{
          name: requirement.requirement,
          for: requirement.reason,
          departmentId: requirement.departmentId,
          proposalId: proposal.id,
        }
      })
    }


    res.status(201).json(proposal);
  } catch (error) {
    console.error("Error creating proposal:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    await prisma.$disconnect();
  }
};

function normalizeRole(role) {
  if (!role) return null;
  return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
}

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
        zerorequirements: true,
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
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
          if(proposal.budget <= 0){
            nextReviewerRole = null;
          }
          break;
        case "FINANCE_MANAGER":
          nextReviewerRole = null;
          break;
      }

      // Send email to the submitter for an approved proposal
      let emailContent = `
        <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Status Update</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <p style="font-weight: bold; text-align: center;">Proposal for ${proposal.title} has been ${formattedStatus} by ${commentedByName} (${normalizeRole(role)})</p>
            <p>Comments: ${comments}</p>
            ${nextReviewerRole ? 
                `<p>The proposal will next be reviewed by ${normalizeRole(nextReviewerRole)}</p>` :
                `<p>The proposal has been fully approved.</p>`}
        </div>
      `;

      if(nextReviewerRole === null){
        const departments = await prisma.zeroDepartment.findMany();

        for(const department of departments){
          let tableRows = ""
          const zeroReqs = await prisma.zeroRequirement.findMany({
            where:{
              proposalId: parseInt(id),
              departmentId: department.id
            }
          });
          if(zeroReqs.length !== 0){
            for(const zeroReq of zeroReqs){
              tableRows += `
                <tr>
                  <td style="border: 1px solid rgb(241, 134, 255); padding: 8px;">${zeroReq.name}</td>
                  <td style="border: 1px solid rgb(241, 134, 255); padding: 8px;">${zeroReq.for}</td>
                </tr>
              `;
            }
            let societyName = ""
            switch(proposal.society){
              case "Student Affairs":
                societyName = "Student Affairs"
                break;
              default:
                const society = await prisma.society.findUnique({
                  where:{name: proposal.society}
                })
                societyName = society.fullName
                break;
            }
            emailContent = `
              <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">
                  Requirements Notification
              </h1>
              <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px; display: block; text-align: center;">
                  <h3 style="font-weight: normal; text-align: justify;">
                      The event titled <strong>${proposal.title}</strong> is scheduled to take place on <strong>${proposal.eventDate}</strong>. 
                      This event, organized by <strong>${societyName}</strong>, has received approval from both the Campus Director and the Student Affairs Incharge.
                      <br><br>
                      To ensure the smooth execution of the event, the following items/support are required from your department:
                  </h3>
                  
                  <table style="width: 80%; border-collapse: collapse; margin-top: 20px; margin-left: auto; margin-right: auto;">
                      <tr>
                          <th style="border: 1px solid rgb(241, 134, 255); padding: 8px; color: rgb(167, 220, 255); width: 30%; text-align: center;">Requirement Name</th>
                          <th style="border: 1px solid rgb(241, 134, 255); padding: 8px; color: rgb(167, 220, 255); width: 70%; text-align: center;">For</th>
                      </tr>
                      ${tableRows}
                  </table>
              </div>
            `
            let transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.SENDER_ADDRESS,
                pass: process.env.EMAIL_APP_PASSWORD,
              },
            });
            let mailOptions = {
              from: process.env.SENDER_ADDRESS,
              to: department.email,
              subject: `Requirements Notification for ${proposal.title}`,
              html: emailContent,
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ error: 'Error sending email to submitter' });
              }
            });
          }
        }
      }

      emailContent = `
        <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Status Update</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <p style="font-weight: bold; text-align: center;">Proposal for ${proposal.title} has been ${formattedStatus} by ${commentedByName} (${normalizeRole(role)})</p>
            <p>Comments: ${comments}</p>
            ${nextReviewerRole ? 
                `<p>The proposal will next be reviewed by ${normalizeRole(nextReviewerRole)}</p>` :
                `<p>The proposal has been fully approved.</p>`}
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
        if(submittedBy.assignedToFaculty){
          const faculty = await prisma.faculty.findUnique({
            where: { id: submittedBy.assignedToFaculty },
          });
        submitterEmail = faculty.email;
      }
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
      if (nextReviewerRole){
        const nextReviewers = await prisma.user.findMany({
          where: { role: nextReviewerRole },
        });

        for (const reviewer of nextReviewers) {
          if(reviewer.assignedToFaculty){
            const faculty = await prisma.faculty.findUnique({
              where: { id: reviewer.assignedToFaculty },
            });
            if (faculty) {
              recipientEmails.push(faculty.email);
            }
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
