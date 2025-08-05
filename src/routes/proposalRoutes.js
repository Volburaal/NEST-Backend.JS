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
  authenticate(["GENERAL_USER", "STUDENT", "MENTOR", "STUDENT_AFFAIRS", "DIRECTOR", "FINANCE_MANAGER"]),
  getProposals
);

router.post("/", authenticate(["STUDENT", "STUDENT_AFFAIRS"]), createProposal);

// Review a proposal
router.put(
  "/:id/review",
  authenticate(["MENTOR", "STUDENT_AFFAIRS", "DIRECTOR", "FINANCE_MANAGER"]),
  reviewProposal
);

export default router;

