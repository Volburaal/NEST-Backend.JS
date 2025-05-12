import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createStudent,
    updateStudent,
    deleteStudent,
    getStudents,
    blacklistStudent,
} from "../controllers/studentController.js";

const router = express.Router();

router.post("/create", authenticate(["STUDENT_AFFAIRS"]), createStudent);
router.delete("/delete", authenticate(["STUDENT_AFFAIRS"]), deleteStudent);
router.put("/blacklist", authenticate(["STUDENT_AFFAIRS"]), blacklistStudent);
router.put("/update", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]),updateStudent);
router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]),getStudents);
export default router;