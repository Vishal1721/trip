import express from "express";
import UserController from "../Controller/UserController.js"
import User from "../models/User.js";
const router=express.Router();


router.post("/login",UserController.login);

export default router;