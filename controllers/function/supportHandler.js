const {conn} = require('../../models/db');
const util = require('util');
// Promisify the query method
const query = util.promisify(conn.query).bind(conn);

class Support {
    static async addTicket(userId, subject, description) {
        const sql = `
            INSERT INTO support_tickets (user_id, subject, description, created_at)
            VALUES (?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE 
            subject = VALUES(subject),
            description = VALUES(description),
            updated_at = NOW()
        `;

        try {
            const result = await query(sql, [userId, subject, description]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error adding ticket:', error);
            throw error;
        }
    }

    // Outros métodos relacionados ao suporte podem ser adicionados aqui
}

module.exports = Support;