import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createStudent,
    updateStudent,
    deleteStudent,
    getStudents,
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/create", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), createStudent);
router.put("/delete", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), updateStudent);
router.delete("/update", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]),deleteStudent);
router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]),getStudents);
export default router;