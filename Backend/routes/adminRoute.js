import { Router } from "express";
import AdminController from "../controller/adminController.js";

const adminRoute = Router();

adminRoute.get("/users", AdminController.getUnauthorizedUsers); 
adminRoute.put("/authorize/:id", AdminController.authorizeUser);
adminRoute.get("/all-users", AdminController.getAllUsers);
adminRoute.post("/super-admin-login", AdminController.superAdminLogin);
adminRoute.put("/update-authorization/:id", AdminController.updateAuthorization);

export default adminRoute;