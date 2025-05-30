import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { generateOTP } from '../utils/otpGenerator.js';

const AdminController = {
    signup: async (req, res) => {
        try {
            const { admin_name, email, password } = req.body; 

            const existingEmail = await Admin.getAdmin(email);
            if (existingEmail) {
                return res.status(400).json({
                    message: "Email is already in use. Please use a different email.",
                });
            }

            await Admin.insert({
                admin_name: admin_name,  
                email: email,
                password: password,
                is_authorized: false 
            });
            res.status(201).json({
                message: "User registered successfully",
                user: {
                    email: email,
                    admin_name: admin_name
                },
            });
        } catch (error) {
            res
                .status(500)
                .json({ message: "Internal server error", error: error.message });
        }
    },
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await Admin.getAdmin(email);

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            // **Authorization Check:**
            if (!user.is_authorized) {
                return res.status(403).json({ message: "User not authorized. Please contact the administrator." });
            }

            const token = jwt.sign({ id: user.admin_id }, process.env.secret_key, { // changed to admin_id
                expiresIn: "1h",
            });
            // Send the username back in the response
            res.status(200).json({ message: "Login successful", token: token, userName: user.admin_name, role: 'user' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            const user = await Admin.getAdmin(email);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Generate OTP
            const otp = generateOTP();
            await Admin.storeOTP(email, otp);
            const mailOptions = {
                email: [email], // Wrap email in an array
                subject: 'Password Reset OTP',
                data: `<p>Your OTP for password reset is: <b>${otp}</b></p>`, // Use HTML for formatted email
            };

            // Use the existing email sending mechanism
            try {
                const sendMailResponse = await fetch('http://localhost:3000/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(mailOptions),
                });

                if (sendMailResponse.ok) {
                    console.log('Email sent successfully');
                } else {
                    console.error('Error sending email:', sendMailResponse.statusText);
                }
            } catch (error) {
                console.error('Error sending email:', error);
            }
            res.status(200).json({ message: "OTP sent to your email." });


        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    },
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;

            const storedOTP = await Admin.getStoredOTP(email);

            if (!storedOTP) {
                return res.status(400).json({ message: "OTP not found or expired." });
            }

            if (otp !== storedOTP.otp) {
                return res.status(400).json({ message: "Invalid OTP." });
            }

            // Clear OTP after successful verification
            await Admin.clearOTP(email);

            res.status(200).json({ message: "OTP verified successfully." });

        } catch (error) {
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    },
    resetPassword: async (req, res) => {
        try {
            const { email, password } = req.body;

            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Update the password in the database
            await Admin.updatePassword(email, hashedPassword);

            res.status(200).json({ message: "Password reset successfully." });

        } catch (error) {
            res.status(500).json({ message: "Internal server error", error: error.message });
        }
    },
    verifyToken: async (req, res) => {
        try {
            const token = req.headers.authorization?.split(' ')[1]; // Get token from header

            if (!token) {
                return res.status(401).json({ isValid: false, message: 'No token provided' });
            }

            jwt.verify(token, process.env.secret_key, async (err, decoded) => {
                if (err) {
                    return res.status(401).json({ isValid: false, message: 'Invalid token' });
                }

                // Token is valid, now fetch the admin to get the name
                const admin = await Admin.getAdminByAdminId(decoded.id); // Assuming you have a getAdminByAdminId function

                if (!admin) {
                    return res.status(404).json({ isValid: false, message: 'Admin not found' });
                }

                // Send back the admin name and isValid = true
                return res.status(200).json({ isValid: true, userName: admin.admin_name });
            });
        } catch (error) {
            console.error("Error verifying token:", error);
            return res.status(500).json({ isValid: false, message: 'Internal server error' });
        }
    },

    //New functions
    getUnauthorizedUsers: async (req, res) => {
        try {
            const users = await Admin.getUnauthorizedAdmins();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Error fetching users", error: error.message });
        }
    },
    authorizeUser: async (req, res) => {
        try {
            const { id } = req.params;
            await Admin.authorizeAdmin(id);
            res.status(200).json({ message: "User authorized successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error authorizing user", error: error.message });
        }
    },
    // Add this to adminController.js
    getAllUsers: async (req, res) => {
        try {
            const users = await Admin.getAllAdmins();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Error fetching users", error: error.message });
        }
    },
    superAdminLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await Admin.getAdmin(email);

            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(400).json({ message: "Invalid email or password" });
            }

            if (email !== "cdcadmin@gmail.com") {
                return res.status(403).json({ message: "Unauthorized access" });
            }

            const token = jwt.sign({ id: user.admin_id }, process.env.secret_key, { expiresIn: "1h" });
            res.status(200).json({ message: "Login successful", token: token, role: 'admin' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    updateAuthorization: async (req, res) => {
        try {
            const { id } = req.params;
            const { is_authorized } = req.body;
            await Admin.updateAdminAuthorization(id, is_authorized);
            res.status(200).json({ message: "Authorization updated successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error updating authorization", error: error.message });
        }
    }

};
export default AdminController;