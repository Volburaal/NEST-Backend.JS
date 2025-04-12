import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    getSociety,
    createSociety,
    updateSociety,
    deleteSociety,
} from "../controllers/societyController.js";
import { scheduleMeeting } from "../controllers/meetingController.js";

const router = express.Router();

router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getSociety);

router.post("/create", authenticate(["STUDENT_AFFAIRS"]), createSociety);
router.put("/update", authenticate(["STUDENT_AFFAIRS"]), updateSociety);
router.delete("/delete", authenticate(["STUDENT_AFFAIRS"]), deleteSociety);
export default router;