import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    getSociety,
    createSociety,
    updateSociety,
    deleteSociety,
    getEbHistory
} from "../controllers/societyController.js";

const router = express.Router();

router.get("/", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getSociety);
router.post("/create", authenticate(["STUDENT_AFFAIRS"]), createSociety);
router.put("/update", authenticate(["MENTOR","STUDENT_AFFAIRS"]), updateSociety);
router.delete("/delete", authenticate(["STUDENT_AFFAIRS"]), deleteSociety);
router.get("/:id/history", authenticate(["STUDENT","MENTOR","STUDENT_AFFAIRS"]), getEbHistory)
export default router;