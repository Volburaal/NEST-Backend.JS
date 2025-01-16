import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createProposal,
  getProposals,
  reviewProposal,
} from "../controllers/proposalController.js";

const router = express.Router();

// Fetch all proposals or filter by status
router.get(
  "/",
  authenticate(["STUDENT", "MENTOR", "STUDENT_AFFAIRS", "DIRECTOR"]),
  getProposals
);

// Create a new proposal (only for STUDENT role)
router.post("/", authenticate(["STUDENT"]), createProposal);

// Review a proposal (MENTOR, STUDENT_AFFAIRS, DIRECTOR can review)
router.put(
  "/:id/review",
  authenticate(["MENTOR", "STUDENT_AFFAIRS", "DIRECTOR"]),
  reviewProposal
);

export default router;
