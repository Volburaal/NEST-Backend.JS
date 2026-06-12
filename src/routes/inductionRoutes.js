import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createSession,
    reviewSession,
    closeSession,
    updateSelection,
    getSessions,
    sessionApplication,
    generateOtp,
    verifyOtp,
} from '../controllers/inductionController.js'

const router = express.Router();
router.post("/create", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), createSession);
router.post("/apply", authenticate(["GENERAL_USER"]), sessionApplication);
router.post("/generate", authenticate(["GENERAL_USER"]), generateOtp);
router.post("/verify", authenticate(["GENERAL_USER"]), verifyOtp);
router.put("/close", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), closeSession);
router.put("/selection", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), updateSelection);
router.put("/review", authenticate(["MENTOR","STUDENT_AFFAIRS"]), reviewSession);
router.get("/get", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS","GENERAL_USER"]), getSessions);


export default router; 