const {conn} = require('../../models/db')
const util = require('util');

// Promisify the query method
const query = util.promisify(conn.query).bind(conn);

class themeHandler {
    static async addFavoriteTheme(userId, theme) {
        try {
            const sql = 'INSERT INTO favorite_themes (user_id, theme) VALUES (?, ?) ON DUPLICATE KEY UPDATE created_at = CURRENT_TIMESTAMP';
            const result = await query(sql, [userId, theme]);
            return result.affectedRows > 0;
        } catch (err) {
            console.error('Error adding favorite theme:', err);
            throw new Error('Failed to add favorite theme');
        }
    }

    static async removeFavoriteTheme(userId, theme) {
        try {
            const sql = 'DELETE FROM favorite_themes WHERE user_id = ? AND theme = ?';
            const result = await query(sql, [userId, theme]);
            return result.affectedRows > 0;
        } catch (err) {
            console.error('Error removing favorite theme:', err);
            throw new Error('Failed to remove favorite theme');
        }
    }
	
    static async selectTheme(userId, theme) {
        try {
            // Verificar se o tema existe nos favoritos do usuário
            const checkFavoriteSql = 'SELECT * FROM favorite_themes WHERE user_id = ? AND theme = ?';
            const favoriteResult = await query(checkFavoriteSql, [userId, theme]);

            if (favoriteResult.length === 0) {
                throw new Error('Theme not found in favorites');
            }

            // Inserir o tema selecionado na tabela selected_themes
            const insertSelectedSql = 'INSERT INTO selected_themes (user_id, theme) VALUES (?, ?)';
            await query(insertSelectedSql, [userId, theme]);

            // Retornar o tema selecionado
            return theme;
        } catch (err) {
            console.error('Error selecting theme:', err);
            throw new Error('Failed to select theme');
        }
	}
}

module.exports = themeHandler;