import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createFeedback,
    getFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

// Fetch proposals based on role and current state
router.get(
  "/",
  authenticate(["STUDENT_AFFAIRS"]),
  getFeedback
);

// Create a new proposal (only for STUDENT role)
router.post("/", authenticate(["STUDENT","MENTOR","DIRECTOR","FINANCE_MANAGER"]), createFeedback);
export default router;