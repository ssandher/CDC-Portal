import express from "express";
import db from "./databaseConnect.js";
import routes from "./routes/index.js";
import authmiddleware from "./middleware/auth.js";
import AdminController from "./controller/adminController.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js"; // Import Admin model

const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/signup", AdminController.signup);  // signup
app.post("/login", AdminController.login);    // login

// // **SUPERUSER CREATION (RUN ONCE, THEN REMOVE)**
// async function createSuperUser() {
//     const email = "cdcadmin@gmail.com";
//     const password = "cdcadmin@70"; // Change this!
//     const admin_name = "CDC Admin";

//     // Check if the superuser already exists
//     const existingAdmin = await Admin.getAdmin(email); // Use Admin model directly
//     if (!existingAdmin) {
//         const hashedPassword = await bcrypt.hash(password, 10);
//         await db.query(
//             "INSERT INTO admin(admin_name, email, password, is_authorized) VALUES (?, ?, ?, ?)",
//             [admin_name, email, hashedPassword, true] // is_authorized = true
//         );
//         console.log("Superuser created!");
//     } else {
//         console.log("Superuser already exists.");
//     }
// }

// createSuperUser(); // Call the function

app.use("/api", authmiddleware, routes);
app.post("/verify-token", AdminController.verifyToken) //verify token function
app.use("/", routes);

app.listen(port, () =>  {
    console.log("Server listening on port " + port);
});