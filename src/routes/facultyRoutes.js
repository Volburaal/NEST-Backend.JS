import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createFaculty,
    updateFaculty,
    deleteFaculty,
    getFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

router.post("/create", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), createFaculty);
router.put("/delete", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), updateFaculty);
router.delete("/update", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]),deleteFaculty);
router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]),getFaculty);
export default router;