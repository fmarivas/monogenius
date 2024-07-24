const {conn} = require('../../models/db')
const util = require('util');

// Promisify the query method
const query = util.promisify(conn.query).bind(conn);

class referenceHandler {
	static async addFavoriteReferences(userId, researchTopic, references) {
		try {
			const sql = `
				INSERT INTO favorite_references (user_id, research_topic, reference_set)
				VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE
				reference_set = VALUES(reference_set),
				created_at = CURRENT_TIMESTAMP
			`;
			const referenceSet = JSON.stringify(references);
			const result = await query(sql, [userId, researchTopic, referenceSet]);
			return result.affectedRows > 0;
		} catch (err) {
			console.error('Error adding favorite references:', err);
			throw new Error('Failed to add favorite references');
		}
	}

	static async removeFavoriteReferences(userId, researchTopic) {
		try {
			const sql = 'DELETE FROM favorite_references WHERE user_id = ? AND research_topic = ?';
			const result = await query(sql, [userId, researchTopic]);
			return result.affectedRows > 0;
		} catch (err) {
			console.error('Error removing favorite references:', err);
			throw new Error('Failed to remove favorite references');
		}
	}

	static async selectReferences(userId, researchTopic) {
		try {
			// Verificar se as referências existem nos favoritos do usuário
			const checkFavoriteSql = 'SELECT * FROM favorite_references WHERE user_id = ? AND research_topic = ?';
			const favoriteResult = await query(checkFavoriteSql, [userId, researchTopic]);
			if (favoriteResult.length === 0) {
				throw new Error('References not found in favorites');
			}

			// Inserir as referências selecionadas na tabela selected_references
			const insertSelectedSql = `
				INSERT INTO selected_references (user_id, research_topic, reference_set)
				VALUES (?, ?, ?)
				ON DUPLICATE KEY UPDATE
				reference_set = VALUES(reference_set),
				created_at = CURRENT_TIMESTAMP
			`;
			await query(insertSelectedSql, [userId, researchTopic, favoriteResult[0].reference_set]);

			// Retornar as referências selecionadas
			return JSON.parse(favoriteResult[0].reference_set);
		} catch (err) {
			console.error('Error selecting references:', err);
			throw new Error('Failed to select references');
		}
	}

	static async checkFavoriteReferences(userId, researchTopic) {
		try {
			const sql = 'SELECT * FROM favorite_references WHERE user_id = ? AND research_topic = ?';
			const result = await query(sql, [userId, researchTopic]);
			return result.length > 0;
		} catch (err) {
			console.error('Error checking favorite references:', err);
			throw new Error('Failed to check favorite references');
		}
	}
}

module.exports = referenceHandler