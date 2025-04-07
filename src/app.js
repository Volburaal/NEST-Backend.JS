import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import authRoutes from './routes/authRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import societyRoutes from './routes/societyRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import facultyRoutes from './routes/facultyRoutes.js'
import memberRoutes from './routes/memberRoutes.js'
import { PrismaClient } from "@prisma/client";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const prisma = new PrismaClient();


// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
}));

// Create uploads directory
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Body parsing middleware
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/society", societyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/members",memberRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

(async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
})();

export default app;
