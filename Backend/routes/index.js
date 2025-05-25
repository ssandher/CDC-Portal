import { Router } from "express";
import companyRoute from "./companyRoute.js";
import schoolRoute from "./schoolRoute.js";
import departmentRoute from "./departmentRoute.js";
import studentRoute from "./studentRoute.js";
import placementRoute from "./placementRoute.js";
import emailRoute from "./emailRoute.js";
import interviewRoundRoute from "./interviewRoundRoute.js";
import roundParticipationRoute from "./roundParticipationRoute.js";
import AdminController from '../controller/adminController.js'; 
import adminRoute from "./adminRoute.js"; 

const routes = new Router();

routes.use("/student", studentRoute);
routes.use("/school", schoolRoute);
routes.use("/department", departmentRoute);
routes.use("/company", companyRoute);
routes.use("/placement", placementRoute);
routes.use("/", emailRoute);
routes.use("/interviewRound", interviewRoundRoute);
routes.use("/roundParticipation", roundParticipationRoute);
routes.post('/forgot-password', AdminController.forgotPassword);
routes.post('/verify-otp', AdminController.verifyOTP);
routes.post('/reset-password', AdminController.resetPassword);
routes.use("/admin", adminRoute);

export default routes;