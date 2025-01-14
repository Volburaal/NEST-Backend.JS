import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors"; // Import the CORS package
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/authRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";

const app = express();
const prisma = new PrismaClient();

// Use CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow requests only from the frontend
  })
);

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/proposals", proposalRoutes);

(async () => {
  try {
    await prisma.$connect();
    console.log("Connected to database");
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
})();

export default app;
