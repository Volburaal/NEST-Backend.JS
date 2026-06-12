import express from "express";
import {
  register,
  login,
  getAllUsers,
  modifyUser,
  deleteUser,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register); // Register user
router.post("/login", login); // Login user
router.get("/users", getAllUsers); // Get all users
router.put("/modify/:id", modifyUser); // Modify a user by ID
router.delete("/delete/:id", deleteUser); // Delete a user by ID

export default router;
