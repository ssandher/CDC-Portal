import db from "../databaseConnect.js";
import bcrypt from "bcryptjs";

const Admin = {
    getAdmin: async (email) => {
        const result = await db.query("select * from admin where email=?", email);
        const admin = result[0];
        if (admin.length != 0) return admin[0];
        else return null;
    },
    getAdminByAdminId: async (id) => {
        const result = await db.query("select * from admin where admin_id=?", id);
        const admin = result[0];
        if (admin.length != 0) return admin[0];
        else return null;
    },
    insert: async (data) => {
        const { admin_name, email, password, is_authorized } = data; // Include is_authorized
        const hash = await bcrypt.hash(password, 10);

        const result = await db.query(
            "INSERT INTO admin(admin_name, email, password, is_authorized) VALUES (?, ?, ?, ?)", // Include is_authorized
            [admin_name, email, hash, is_authorized]
        );

        return result;
    },
    storeOTP: async (email, otp) => {
        await db.query("UPDATE admin SET otp = ? WHERE email = ?", [otp, email]);
    },
    getStoredOTP: async (email) => {
        const result = await db.query("SELECT otp FROM admin WHERE email = ?", [email]);
        if (result[0].length > 0) {
            return { otp: result[0][0].otp };
        }
        return null;
    },
    clearOTP: async (email) => {
        await db.query("UPDATE admin SET otp = NULL WHERE email = ?", [email]);
    },
    updatePassword: async (email, hashedPassword) => {
        await db.query("UPDATE admin SET password = ? WHERE email = ?", [hashedPassword, email]);
    },

    // New functions
    getUnauthorizedAdmins: async () => {
        const result = await db.query("SELECT admin_id, admin_name, email FROM admin WHERE is_authorized = false");
        return result[0];
    },
    authorizeAdmin: async (admin_id) => {
        await db.query("UPDATE admin SET is_authorized = true WHERE admin_id = ?", [admin_id]);
    },
    getAllAdmins: async () => {
        const result = await db.query("SELECT admin_id, admin_name, email, is_authorized FROM admin");
        return result[0];
    },
    updateAdminAuthorization: async (admin_id, is_authorized) => {
        await db.query("UPDATE admin SET is_authorized = ? WHERE admin_id = ?", [is_authorized, admin_id]);
    }
};

export default Admin;