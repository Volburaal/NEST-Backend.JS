import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createProposal,
  getProposals,
  reviewProposal,
} from "../controllers/proposalController.js";

const router = express.Router();

// Fetch proposals based on role and current state
router.get(
  "/",
  authenticate(["STUDENT", "MENTOR", "STUDENT_AFFAIRS", "DIRECTOR", "FINANCE_MANAGER"]),
  getProposals
);

// Create a new proposal (only for STUDENT role)
router.post("/", authenticate(["STUDENT"]), createProposal);

// Review a proposal
router.put(
  "/:id/review",
  authenticate(["MENTOR", "STUDENT_AFFAIRS", "DIRECTOR", "FINANCE_MANAGER"]),
  reviewProposal
);

export default router;

