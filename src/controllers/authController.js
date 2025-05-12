import bcrypt from "bcrypt";
import nodemailer from 'nodemailer';
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { generateStudentEmail } from "./mailFacilitators.js"

const prisma = new PrismaClient();

// Register a new user
export const register = async (req, res) => {
  try {
    const { email, role, affiliation, password, assignedTo, assignedToStudent, assignedToFaculty } = req.body;
    let reciever;
    let emailBody;
    let emailTitle = "SFC Portal Account Assignment";
    if(role === "STUDENT" && assignedToStudent !== -1){
      const student = await prisma.student.findUnique({
        where:{id: assignedToStudent}
      })
      const roll = student.rollnumber;
      reciever = generateStudentEmail(roll)
      emailBody = `
        <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Account Allocated</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <h3 style="text-align: center;"><b>The account ${email} has been allocated to you</b><br></h3>
            <h4>Your responsibilities include:</h4>
            <ul>
              <li>Creating and tracking proposals on behalf of your society</li>
              <li>Managing all society member records</li>
              <li>Scheduling meetings</li>
              <li>Updating meeting details such as minutes and attendance after meetings</li>
            </ul>
            <h4>Credentials for the NEST-SAM portal are provided below</h4>
            <br>
            <p >Username: <b>${email}</b></p>
            <p>Password: <b>${password}</b></p>
            <br>
            <p>Access the portal on the provided <a href="http://59.103.246.24:3000" style="color: deeppink;">IP</a> (59.103.246.24:3000). Please note that the portal is only accesible on university internet</p>
          </div>
      `;
    }
    if(role !== "STUDENT" && assignedToFaculty !== -1){
      const faculty = await prisma.faculty.findUnique({
        where:{id: assignedToFaculty}
      })
      reciever = faculty.email;
      let responsibilities = `
        <li>It seems that there are no responsibilities to dish out</li>
        `;
      if (role == "MENTOR") {
        responsibilities = `
          <li>Reviewing proposals made by your society</li>
          <li>Managing all society member records</li>
          <li>Scheduling meetings</li>
          <li>Updating meeting details such as minutes and attendance after meetings</li>
        `;
      }
      else if (role == "STUDENT_AFFAIRS") {
        responsibilities = `
          <li>Reviewing proposals made by societies</li>
          <li>Managing student, faculty and society records</li>
          <li>Managing society leadership such as mentor and co-mentor</li>
          <li>Creating proposals for events not affiliated to any society</li>
          <li>Managing society account assignments</li>
          <li style="color: rgb(255, 0, 191); font-weight: bold; list-style-type: none;">Proposals shall be available for reivew once reviewed by the respective society mentor</li>
        `;
      }
      else if (role == "DIRECTOR") {
        responsibilities = `
          <li>Reviewing proposals made by societies</li>
          <li style="color: rgb(255, 0, 191); font-weight: bold; list-style-type: none;">Proposals shall be available for reivew once reviewed by the student affairs incahrge</li>
        `;
      }
      else if (role == "FINANCE_MANAGER") {
        responsibilities = `
          <li>Reviewing proposals made by societies and allocating budget if required</li>
          <li style="color: rgb(255, 0, 191); font-weight: bold; list-style-type: none;">Proposals shall be available for reivew once reviewed by the director</li>
        `;
      }
      emailBody = `
        <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Account Allocated</h1>
        <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
            <h3 style="text-align: center;"><b>The account ${email} has been allocated to you</b><br></h3>
            <h4>Your responsibilities include:</h4>
            <ul>
              ${responsibilities}
            </ul>
            <h4>Credentials for the NEST-SAM portal are provided below</h4>
            <br>
            <p >Username: <b>${email}</b></p>
            <p>Password: <b>${password}</b></p>
            <br>
            <p>Access the portal on the provided <a href="http://59.103.246.24:3000" style="color: deeppink;">IP</a> (59.103.246.24:3000). Please note that the portal is only accesible on university internet</p>
          </div>
      `;
    }
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
      bcc: [reciever],
      subject: emailTitle,
      html: emailBody,
    };
    if(reciever){
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending account creation email' });
        }
        return res.status(200).json({ message: 'Creation Email Sent'});
      });
    }

    const validRoles = [
      "STUDENT",
      "MENTOR",
      "STUDENT_AFFAIRS",
      "DIRECTOR",
      "FINANCE_MANAGER",
      "GENERAL_USER"
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Valid roles are: STUDENT, MENTOR, STUDENT_AFFAIRS, DIRECTOR, FINANCE_MANAGER",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const user = await prisma.$transaction(async (prisma) => {
      return await prisma.user.create({
        data: {
          email,
          role,
          affiliation,
          password: hashedPassword,
          tenureStart: now,
          assignedToStudent: role === "STUDENT" && assignedTo !== -1 ? assignedTo : null,
          assignedToFaculty: role !== "STUDENT" && assignedTo !== -1 ? assignedTo : null,
        },
      });
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        affiliation: user.affiliation,
        tenureStart: user.tenureStart,
        assignedToStudent: user.assignedToStudent,
        assignedToFaculty: user.assignedToFaculty,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedStudent: { select: { name: true, rollnumber: true } },
        assignedFaculty: { select: { name: true, dept: true } },
      },
    });

    const formattedUsers = users.map(user => {
      let assignedToName = "None";

      if (user.role === "STUDENT" && user.assignedStudent) {
        assignedToName = `${user.assignedStudent.name} (${user.assignedStudent.rollnumber})`;
      } else if (user.role !== "STUDENT" && user.assignedFaculty) {
        assignedToName = `${user.assignedFaculty.name} (${user.assignedFaculty.dept})`;
      }

      return {
        ...user,
        assignedToName,
      };
    });
    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        affiliation: user.affiliation,
        designation: user.designation,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        affiliation: user.affiliation,
        designation: user.designation,
        tenureStart: user.tenureStart,
        tenureEnd: user.tenureEnd,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const modifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    let { email, role, affiliation, password, assignedTo } = req.body;
    const now = new Date();
    if(!assignedTo){
      assignedTo=-1
    }

    const validRoles = [
      "STUDENT",
      "MENTOR",
      "STUDENT_AFFAIRS",
      "DIRECTOR",
      "FINANCE_MANAGER",
    ];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Valid roles are: STUDENT, MENTOR, STUDENT_AFFAIRS, DIRECTOR, FINANCE_MANAGER",
      });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const oldPassword = existingUser.password;

    let newAssignedToStudent = existingUser.assignedToStudent;
    let newAssignedToFaculty = existingUser.assignedToFaculty;
    let updateEmail;
    let emailBody = ""
    let emailTitle = ""
    if (assignedTo !== undefined) {
      if (assignedTo === -1) {
        newAssignedToStudent = null;
        newAssignedToFaculty = null;
      }
      else if (role === "STUDENT") {
        const oldAssignedTo = existingUser.assignedToStudent;
        if((oldAssignedTo !== null && assignedTo !== -1) && (oldAssignedTo === assignedTo) && (hashedPassword !== oldPassword)){
          const student = await prisma.student.findUnique({
            where:{id: assignedTo}
          })
          const roll = student.rollnumber;
          updateEmail = generateStudentEmail(roll)
          emailTitle = "SFC Portal Password Update";
          emailBody = `
            <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Password Reset</h1>
            <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
              <h3 style="text-align: center;"><b>The password for ${email} has been changed</b><br></h3>
              <h4>New Credentials for the NEST-SAM portal are provided below</h4>
              <br>
              <p >Username: <b>${email}</b></p>
              <p>Password: <b>${password}</b></p>
              <br>
              <p>Access the portal on the provided <a href="http://59.103.246.24:3000" style="color: deeppink;">IP</a> (59.103.246.24:3000). Please note that the portal is only accesible on university internet</p>
            </div>
          `;
        }
        if ((oldAssignedTo === null && assignedTo !== -1)||(oldAssignedTo !== null && (oldAssignedTo !== assignedTo))) {
          if(!password){
            return res.status(400).json({message: "Password must be reset when account is re-assigned"})
          }
          const student = await prisma.student.findUnique({
            where:{id: assignedTo}
          })
          const roll = student.rollnumber;
          updateEmail = generateStudentEmail(roll)
          emailTitle = "SFC Portal Account Assignment";
          emailBody = `
            <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Account Allocated</h1>
            <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
                <h3 style="text-align: center;"><b>The account ${email} has been allocated to you</b><br></h3>
                <h4>Your responsibilities include:</h4>
                <ul>
                  <li>Creating and tracking proposals on behalf of your society</li>
                  <li>Managing all society member records</li>
                  <li>Scheduling meetings</li>
                  <li>Updating meeting details such as minutes and attendance after meetings</li>
                </ul>
                <h4>Credentials for the NEST-SAM portal are provided below</h4>
                <br>
                <p >Username: <b>${email}</b></p>
                <p>Password: <b>${password}</b></p>
                <br>
                <p>Access the portal on the provided <a href="http://59.103.246.24:3000" style="color: deeppink;">IP</a> (59.103.246.24:3000). Please note that the portal is only accesible on university internet</p>
              </div>
          `;
        }
        newAssignedToStudent = assignedTo;
        newAssignedToFaculty = null;
      }
      else {
        const oldAssignedTo = existingUser.assignedToFaculty;
        if((oldAssignedTo !== null && assignedTo !== -1) && (oldAssignedTo === assignedTo) && (hashedPassword !== oldPassword)){
          const faculty = await prisma.faculty.findUnique({
            where:{id: assignedTo}
          })
          updateEmail = faculty.email;
          emailTitle = "SFC Portal Password Update";
          emailBody = `
            <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Password Reset</h1>
            <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
              <h3 style="text-align: center;"><b>The password for ${email} has been changed</b><br></h3>
              <h4>New Credentials for the NEST-SAM portal are provided below</h4>
              <br>
              <p >Username: <b>${email}</b></p>
              <p>Password: <b>${password}</b></p>
              <br>
              <p>Access the portal on the provided <a href="http://59.103.246.24:3000" style="color: deeppink;">IP</a> (59.103.246.24:3000). Please note that the portal is only accesible on university internet</p>
            </div>
          `;
        }
        if ((oldAssignedTo === null && assignedTo !== -1)||(oldAssignedTo !== null && (oldAssignedTo !== assignedTo))) {
          if(!password){
            return res.status(400).json({message: "Password must be reset when account is re-assigned"})
          }
          const faculty = await prisma.faculty.findUnique({
            where:{id: assignedTo}
          })
          let responsibilities = `
            <li>It seems that there are no responsibilities to dish out</li>
          `;
          if (role == "MENTOR") {
            responsibilities = `
              <li>Reviewing proposals made by your society</li>
              <li>Managing all society member records</li>
              <li>Scheduling meetings</li>
              <li>Updating meeting details such as minutes and attendance after meetings</li>
            `;
          }
          else if (role == "STUDENT_AFFAIRS") {
            responsibilities = `
              <li>Reviewing proposals made by societies</li>
              <li>Managing student, faculty and society records</li>
              <li>Managing society leadership such as mentor and co-mentor</li>
              <li>Creating proposals for events not affiliated to any society</li>
              <li>Managing society account assignments</li>
              <li style="color: rgb(255, 0, 191); font-weight: bold; list-style-type: none;">Proposals shall be available for reivew once reviewed by the respective society mentor</li>
            `;
          }
          else if (role == "DIRECTOR") {
            responsibilities = `
              <li>Reviewing proposals made by societies</li>
              <li style="color: rgb(255, 0, 191); font-weight: bold; list-style-type: none;">Proposals shall be available for reivew once reviewed by the student affairs incahrge</li>
            `;
          }
          else if (role == "FINANCE_MANAGER") {
            responsibilities = `
              <li>Reviewing proposals made by societies and allocating budget if required</li>
              <li style="color: rgb(255, 0, 191); font-weight: bold; list-style-type: none;">Proposals shall be available for reivew once reviewed by the director</li>
            `;
          }
          updateEmail = faculty.email;
          emailTitle = "SFC Portal Account Assignment";
          emailBody = `
            <h1 style="color:rgb(213, 238, 255); text-align:center; background-color: rgb(67, 0, 87); padding: 2%; margin:0px; border-radius: 50px 50px 0px 0px;">Account Allocated</h1>
            <div style="color: rgb(248, 199, 255); background-color: rgb(49, 49, 49); margin: 0px; padding: 5%; border-radius: 0px 0px 50px 50px;">
                <h3 style="text-align: center;"><b>The account ${email} has been allocated to you</b><br></h3>
                <h4>Your responsibilities include:</h4>
                <ul>
                  ${responsibilities}
                </ul>
                <h4>Credentials for the NEST-SAM portal are provided below</h4>
                <br>
                <p >Username: <b>${email}</b></p>
                <p>Password: <b>${password}</b></p>
                <br>
                <p>Access the portal on the provided <a href="http://59.103.246.24:3000" style="color: deeppink;">IP</a> (59.103.246.24:3000). Please note that the portal is only accesible on university internet</p>
              </div>
          `;
        }
        newAssignedToStudent = null;
        newAssignedToFaculty = assignedTo;
      }
    }

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
      bcc: [updateEmail],
      subject: emailTitle,
      html: emailBody,
    };
    if(updateEmail){
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error('Error sending email:', error);
          return res.status(500).json({ error: 'Error sending email' });
        }
        return res.status(200).json({ message: 'Update Email Sent'});
      });
    }

    const updatedUser = await prisma.$transaction(async (prisma) => {
      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          email,
          role,
          affiliation,
          ...(role && { tenureStart: now }),
          ...(hashedPassword && { password: hashedPassword }),
          assignedToStudent: newAssignedToStudent,
          assignedToFaculty: newAssignedToFaculty,
        },
      });
    });

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        affiliation: updatedUser.affiliation,
        tenureStart: updatedUser.tenureStart,
        tenureEnd: updatedUser.tenureEnd,
        assignedToStudent: updatedUser.assignedToStudent,
        assignedToFaculty: updatedUser.assignedToFaculty,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
