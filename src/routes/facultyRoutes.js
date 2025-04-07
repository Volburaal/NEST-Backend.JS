import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createFaculty,
    updateFaculty,
    deleteFaculty,
    getFaculty,
} from "../controllers/facultyController.js";

const router = express.Router();

router.post("/create", authenticate(["STUDENT_AFFAIRS"]), createFaculty);
router.put("/update", authenticate(["STUDENT_AFFAIRS"]), updateFaculty);
router.delete("/delete", authenticate(["STUDENT_AFFAIRS"]),deleteFaculty);
router.get("/", authenticate(["STUDENT_AFFAIRS"]),getFaculty);
export default router;