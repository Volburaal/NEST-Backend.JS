import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    getSociety,
    addStudent,
    createSociety,
    updateSociety,
    deleteSociety,
    getMembers,
} from "../controllers/societyController.js";

const router = express.Router();

router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getSociety);
router.post("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), addStudent);
router.post("/create", authenticate(["STUDENT_AFFAIRS"]), createSociety);
router.put("/update", authenticate(["STUDENT_AFFAIRS"]), updateSociety);
router.delete("/delete", authenticate(["STUDENT_AFFAIRS"]), deleteSociety);
export default router;