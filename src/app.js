import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/authRoutes.js";
import proposalRoutes from "./routes/proposalRoutes.js";

const app = express();
const prisma = new PrismaClient();

app.use(
  cors({
    origin: "http://59.103.246.24:3000", // Allow frontend domain
    credentials: true, // Allow cookies if needed
    methods: "GET,POST,PUT,DELETE", // Allowed methods
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
