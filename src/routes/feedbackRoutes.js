import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createFeedback,
    getFeedback,
} from "../controllers/feedbackController.js";

const router = express.Router();

router.get(
  "/",
  authenticate(["STUDENT_AFFAIRS"]),
  getFeedback
);

router.post("/", authenticate(["STUDENT","MENTOR","DIRECTOR","FINANCE_MANAGER"]), createFeedback);
export default router;