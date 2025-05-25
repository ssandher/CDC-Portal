// routes/emailRoute.js
import { Router } from "express";
import EmailController from "../controller/emailController.js";

const emailRoute = new Router();

emailRoute.post("/send-email", EmailController.sendMail);

export default emailRoute;