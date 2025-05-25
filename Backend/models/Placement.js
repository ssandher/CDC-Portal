// models/placement.js

import db from "../databaseConnect.js";
const isValidDateString = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return false;
    return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

const Placement = {
    getAll: async () => {
        try {
            const query = `
        SELECT
          placement_id, student_id, company_id, position, location, salary,
          DATE_FORMAT(placement_date, '%Y-%m-%d') AS placement_date,
          offer_type, offer_letter, core_non_core
        FROM placement`;
            const [placements] = await db.query(query);
            return placements || [];
        } catch (error) {
            console.error("Error fetching all placements:", error);
            throw new Error(`Error fetching placements: ${error.message}`);
        }
    },

    getById: async (id) => {
        try {
            const query = `
        SELECT
          placement_id, student_id, company_id, position, location, salary,
          DATE_FORMAT(placement_date, '%Y-%m-%d') AS placement_date,
          offer_type, offer_letter, core_non_core
        FROM placement
        WHERE placement_id = ?`;
            const [placement] = await db.query(query, [id]);
            return placement.length ? placement[0] : null;
        } catch (error) {
            console.error("Error fetching placement by ID:", error);
            throw new Error(`Error fetching placement by ID ${id}: ${error.message}`);
        }
    },

    getAllDetails: async () => {
        const query = `
      SELECT
        p.placement_id,
        s.rollNumber AS student_rollNumber, -- Include rollNumber
        s.name AS student_name,
        c.company_name,
        p.position,
        p.salary,
        DATE_FORMAT(p.placement_date, '%Y-%m-%d') AS placement_date, -- Format here
        p.location,
        p.offer_type,
        p.offer_letter,
        p.core_non_core
      FROM placement p
      JOIN student s ON p.student_id = s.student_id
      JOIN company c ON p.company_id = c.company_id
      ORDER BY c.company_name, s.name -- Optional: Add ordering
    `;
        try {
            const [result] = await db.query(query);
            return result || []; 
        } catch (error) {
            console.error("Error fetching all placement details:", error);
            throw new Error(`Error fetching all placement details: ${error.message}`);
        }
    },
    getAllPlacementsWithStudentIds: async () => {
        try {
            const query = `
                SELECT student_id
                FROM placement
            `;
            const [placements] = await db.query(query);
            return placements || [];
        } catch (error) {
            console.error("Error fetching placements with student IDs:", error);
            throw new Error(`Error fetching placements with student IDs: ${error.message}`);
        }
    },

    getCoreNonCoreCount: async () => {
        const query = `
      SELECT
        core_non_core,
        COUNT(*) AS count
      FROM placement
      WHERE core_non_core IS NOT NULL AND core_non_core != '' -- Exclude empty/null if desired
      GROUP BY core_non_core
    `;
        try {
            const [result] = await db.query(query);
            return result || []; 
        } catch (error) {
            console.error("Error fetching core/non-core placements:", error);
            throw new Error(`Error fetching core/non-core counts: ${error.message}`);
        }
    },

    getPlacedYearOfStudyWise: async () => {
        const query = `
      SELECT
        s.year_of_study AS year,
        COUNT(p.student_id) AS placed_students
      FROM placement p
      JOIN student s ON p.student_id = s.student_id
      GROUP BY s.year_of_study
      ORDER BY s.year_of_study
    `;
        try {
            const [result] = await db.query(query);
            return result || []; 
        } catch (error) {
            console.error("Error fetching placed students year-of-study wise:", error);
            throw new Error(`Error fetching year-wise placements: ${error.message}`);
        }
    },

    getPlacedDepartmentWise: async () => {
        const query = `
      SELECT
        d.dep_name AS department,
        COUNT(p.student_id) AS placed_students
      FROM placement p
      JOIN student s ON p.student_id = s.student_id
      JOIN department d ON s.dep_id = d.dep_id
      GROUP BY d.dep_id, d.dep_name -- Group by name as well
      ORDER BY d.dep_name
    `;
        try {
            const [result] = await db.query(query);
            return result || []; 
        } catch (error) {
            console.error("Error fetching placed students department-wise:", error);
            throw new Error(`Error fetching department-wise placements: ${error.message}`);
        }
    },

    getByCompanyId: async (companyId) => {
        try {
            const query = `
        SELECT
          p.placement_id, p.student_id, p.company_id, p.position, p.location, p.salary,
          DATE_FORMAT(p.placement_date, '%Y-%m-%d') AS placement_date,
          p.offer_type, p.offer_letter, p.core_non_core,
          s.rollNumber, -- Include student details directly if needed often
          s.name as student_name
        FROM placement p
        JOIN student s ON p.student_id = s.student_id
        WHERE p.company_id = ?
        ORDER BY s.rollNumber
      `;
            const [placements] = await db.query(query, [companyId]);
            return placements || []; 
        } catch (error) {
            console.error("Error fetching placements by Company ID:", error);
            throw new Error(`Error fetching placements for company ID ${companyId}: ${error.message}`);
        }
    },

    checkIfStudentPlacedInCompany: async (student_id, company_id) => {
        try {
            const query = `
                SELECT COUNT(*) AS count
                FROM placement
                WHERE student_id = ? AND company_id = ?
            `;
            const [result] = await db.query(query, [student_id, company_id]);
            return result[0].count > 0;
        } catch (error) {
            console.error("Error checking if student placed in company:", error);
            throw new Error(`Error checking placement: ${error.message}`);
        }
    },

    checkIfStudentAlreadyPlaced: async (student_id) => {
        try {
            const query = `
                SELECT COUNT(*) AS count
                FROM placement
                WHERE student_id = ?
            `;
            const [result] = await db.query(query, [student_id]);
            return result[0].count > 0;
        } catch (error) {
            console.error("Error checking if student already placed:", error);
            throw new Error(`Error checking placement: ${error.message}`);
        }
    },

    insert: async (data) => {
        if (!data.company_id || !data.student_id || !data.position || !data.placement_date || data.salary === undefined || data.salary === null) {
            throw new Error("Missing required fields: company_id, student_id, position, placement_date, salary.");
        }
        if (!isValidDateString(data.placement_date)) {
            throw new Error(`Invalid placement_date format: Expected YYYY-MM-DD, got ${data.placement_date}`);
        }
        const placedInCompany = await Placement.checkIfStudentPlacedInCompany(data.student_id, data.company_id);
        if (placedInCompany) {
            throw new Error("Student already placed in this company.");
        }

        const alreadyPlaced = await Placement.checkIfStudentAlreadyPlaced(data.student_id);
        if (alreadyPlaced) {
            throw new Error("Student already placed in another company and cannot be placed again.");
        }

        const query = `
      INSERT INTO placement (
        company_id, student_id, position, placement_date, location, salary, offer_type, offer_letter, core_non_core
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

        const values = [
            data.company_id,
            data.student_id,
            data.position,
            data.placement_date, 
            data.location || null, 
            data.salary,
            data.offer_type || null, 
            data.offer_letter == true || data.offer_letter === 'true' || data.offer_letter === 1 ? 1 : 0,
            data.core_non_core || null, 
        ];

        try {
            const [result] = await db.query(query, values);
            return { insertId: result.insertId, affectedRows: result.affectedRows };
        } catch (error) {
            console.error("Error inserting new placement:", error);
            throw new Error(`Database error inserting placement: ${error.message}`);
        }
    },

    deleteById: async (id) => {
        try {
            const [result] = await db.query("DELETE FROM placement WHERE placement_id = ?", [id]);
            if (result.affectedRows === 0) {

                return { success: false, message: "Placement not found or already deleted." };
            }
            return { success: true, affectedRows: result.affectedRows };
        } catch (error) {
            console.error("Error deleting placement by ID:", error);
            throw new Error(`Database error deleting placement ID ${id}: ${error.message}`);
        }
    },

    updateById: async (id, data) => {
        if (!data.company_id || !data.student_id || !data.position || !data.placement_date || data.salary === undefined || data.salary === null) {
            throw new Error("Missing required fields for update: company_id, student_id, position, placement_date, salary.");
        }
        if (!isValidDateString(data.placement_date)) {
            throw new Error(`Invalid placement_date format for update: Expected YYYY-MM-DD, got ${data.placement_date}`);
        }

        try {
            const query = `
        UPDATE placement
        SET company_id = ?, student_id = ?, position = ?, placement_date = ?, location = ?, salary = ?, offer_type = ?, offer_letter = ?, core_non_core = ?
        WHERE placement_id = ?
    `;

            const values = [
                data.company_id,
                data.student_id,
                data.position,
                data.placement_date, // <-- Pass the string directly
                data.location || null,
                data.salary,
                data.offer_type || null,
                data.offer_letter == true || data.offer_letter === 'true' || data.offer_letter === 1 ? 1 : 0,
                data.core_non_core || null,
                id,
            ];

            const [result] = await db.query(query, values);
            if (result.affectedRows === 0) {
                return { success: false, message: `Placement with ID ${id} not found.` };
            }d
            return { success: true, changedRows: result.changedRows, affectedRows: result.affectedRows };
        } catch (error) {
            console.error("Error updating placement by ID:", error);
            throw new Error(`Database error updating placement ID ${id}: ${error.message}`);
        }
    },
};

export default Placement;