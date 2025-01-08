import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createProposal,
  getProposals,
  reviewProposal,
} from "../controllers/proposalController.js";
const router = express.Router();

router.get(
  "/",
  authenticate(["STUDENT", "MENTOR", "STUDENT_AFFAIRS", "DIRECTOR"]),
  getProposals
);
router.post("/", authenticate(["STUDENT"]), createProposal);
router.put(
  "/:id/review",
  authenticate(["MENTOR", "STUDENT_AFFAIRS", "DIRECTOR"]),
  reviewProposal
);

export default router;
