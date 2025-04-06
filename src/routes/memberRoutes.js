import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    addStudent,
    getMembers,
    deleteMember,
    capture
} from "../controllers/societyController.js";

const router = express.Router();

router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getMembers);
router.post("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), addStudent);
router.delete("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), deleteMember);
export default router;