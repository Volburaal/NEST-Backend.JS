import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
    setSettings,
    getSettings,
    addDept,
    editDept,
    getDept,
    deleteDept,
    clearBlcklist,
} from "../controllers/settingController.js";

const router = express.Router();

router.post( "/", authenticate(["STUDENT_AFFAIRS"]), setSettings);
router.get( "/", authenticate(["STUDENT_AFFAIRS"]), getSettings);

router.post( "/blacklist-clear", authenticate(["STUDENT_AFFAIRS"]), clearBlcklist);

router.post( "/dept", authenticate(["STUDENT_AFFAIRS"]), addDept);
router.put( "/dept/:id", authenticate(["STUDENT_AFFAIRS"]), editDept);
router.get( "/dept", authenticate(["STUDENT", "STUDENT_AFFAIRS"]), getDept);
router.delete( "/dept/:id", authenticate(["STUDENT_AFFAIRS"]), deleteDept);
export default router;