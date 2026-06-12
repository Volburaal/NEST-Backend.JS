import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    scheduleMeeting,
    getMeetings,
    setMinutes,
    updateAttendance,
    deleteMinute
} from "../controllers/meetingController.js";

const router = express.Router();

router.post("/create", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), scheduleMeeting);
router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getMeetings);
router.post("/:id/minutes", authenticate(["STUDENT","MENTOR"]), setMinutes);
router.delete("/:id/minutes", authenticate(["STUDENT","MENTOR"]), deleteMinute);
router.put("/:id/attendance", authenticate(["STUDENT","MENTOR"]), updateAttendance);
export default router;