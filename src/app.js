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
import meetingRoutes from './routes/meetingRoutes.js'
import inductionRoutes from './routes/inductionRoutes.js'
import settingRoutes from './routes/settingRoutes.js'
import { PrismaClient } from "@prisma/client";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  methods: "GET,POST,PUT,DELETE",
}));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/meeting", meetingRoutes)
app.use("/api/society", societyRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/proposals", proposalRoutes);
app.use("/api/society/induction", inductionRoutes);
app.use("/api/settings", settingRoutes);

const settings = await prisma.settings.findFirst()
if(!settings){
  console.log("No settings found, initializing defaults")
  await prisma.settings.create()
}

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
