import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    createSession,
    reviewSession,
    closeSession,
    updateSelection,
    getSessions
} from '../controllers/inductionController.js'

const router = express.Router();
router.post("/create", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), createSession);
router.post("/close", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), closeSession);
router.post("/selection", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), updateSelection);
router.post("/review", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), reviewSession);
router.get("/get", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getSessions);


export default router;