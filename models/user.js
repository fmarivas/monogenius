const { conn } = require('./db');
const util = require('util');
const query = util.promisify(conn.query).bind(conn);

class User {
    static async usersTokens(id) {
        try {
            const result = await query('SELECT tokens FROM users WHERE id = ?', [id]);
            if (result.length > 0) {
                return result[0].tokens;
            } else {
                return 0; // Retorna 0 se o usuário não for encontrado
            }
        } catch (err) {
            console.error('Database error:', err);
            throw err;
        }
    }
}

module.exports = User;