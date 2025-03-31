import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    getMembers,
    deleteMember,
} from "../controllers/societyController.js";

const router = express.Router();

router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getMembers);
router.delete("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), deleteMember);
export default router;