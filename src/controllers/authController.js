import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Register a new user
export const register = async (req, res) => {
  try {
    const { name, email, role, affiliation, password } = req.body;

    const validRoles = [
      "STUDENT",
      "MENTOR",
      "STUDENT_AFFAIRS",
      "DIRECTOR",
      "FINANCE_MANAGER",
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Invalid role. Valid roles are: STUDENT, MENTOR, STUDENT_AFFAIRS, DIRECTOR, FINANCE_MANAGER",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        affiliation,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Login user
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
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Modify a user
export const modifyUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, affiliation, password } = req.body;

    const validRoles = [
      "STUDENT",
      "MENTOR",
      "STUDENT_AFFAIRS",
      "DIRECTOR",
      "FINANCE_MANAGER",
    ];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        message:
          "Invalid role. Valid roles are: STUDENT, MENTOR, STUDENT_AFFAIRS, DIRECTOR, FINANCE_MANAGER",
      });
    }

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        name,
        email,
        role,
        affiliation,
        ...(hashedPassword && { password: hashedPassword }),
      },
    });

    res.status(200).json({
      message: "User updated successfully",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        affiliation: updatedUser.affiliation,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a user
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
