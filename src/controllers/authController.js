import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Register a new user
export const register = async (req, res) => {
  try {
    const { email, role, affiliation, password, assignedTo } = req.body;

    const validRoles = [
      "STUDENT",
      "MENTOR",
      "STUDENT_AFFAIRS",
      "DIRECTOR",
      "FINANCE_MANAGER",
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
          roleHistory: {
            create: {
              role,
              affiliation,
              startDate: now,
            },
          },
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
      include: {
        roleHistory: {
          orderBy: { startDate: 'desc' },
          take: 1,
        },
      },
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
    const { email, role, affiliation, password, assignedTo } = req.body;
    const now = new Date();

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

    let newAssignedToStudent = existingUser.assignedToStudent;
    let newAssignedToFaculty = existingUser.assignedToFaculty;

    if (assignedTo !== undefined) {
      if (assignedTo === -1) {
        newAssignedToStudent = null;
        newAssignedToFaculty = null;
      } else if (role === "STUDENT") {
        newAssignedToStudent = assignedTo;
        newAssignedToFaculty = null;
      } else {
        newAssignedToStudent = null;
        newAssignedToFaculty = assignedTo;
      }
    }

    const updatedUser = await prisma.$transaction(async (prisma) => {
      if (role && role !== existingUser.role) {
        await prisma.roleHistory.updateMany({
          where: { userId: parseInt(id), endDate: null },
          data: { endDate: now },
        });

        await prisma.roleHistory.create({
          data: {
            userId: parseInt(id),
            role,
            designation: designation || "",
            affiliation,
            startDate: now,
          },
        });
      }

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
