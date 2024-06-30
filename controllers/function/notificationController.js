const { conn } = require('../../models/db');

class notificationController {
	static async checkNotificationStatus(user) {
		const userId = user.id;

		try {
			// Primeiro, obtemos o ID da última atualização
			const latestUpdateId = await this.getLatestUpdateId();

			// Agora, verificamos se o usuário já viu esta atualização
			const query = `
				SELECT uv.update_id
				FROM user_update_views uv
				WHERE uv.user_id = ?
				ORDER BY uv.update_id DESC
				LIMIT 1
			`;

			return new Promise((resolve, reject) => {
				conn.query(query, [userId], (err, results) => {
					if (err) {
						reject(err);
					} else {
						// Verifica se há resultados e se o último update_id visto pelo usuário
						// é igual ao último update_id disponível
						const seen = results.length > 0 && results[0].update_id === latestUpdateId;
						resolve(seen);
					}
				});
			});
		} catch (error) {
			console.error('Erro ao verificar o status da notificação:', error);
			throw error;
		}
	}

	static async markNotificationSeen(user) {
		const userId = user.id;
		
		try {
			const latestUpdateId = await this.getLatestUpdateId();
			
			const query = `
				INSERT INTO user_update_views (user_id, update_id)
				VALUES (?, ?)
				ON DUPLICATE KEY UPDATE update_id = ?
			`;
			return new Promise((resolve, reject) => {
				conn.query(query, [userId, latestUpdateId, latestUpdateId], (err, result) => {
					if (err) {
						reject(err);
					} else {
						resolve(true);
					}
				});
			});
		} catch (error) {
			console.error('Erro ao obter o último ID de atualização:', error);
			// throw error;
		}
	}

	static getLatestUpdateId() {
		return new Promise((resolve, reject) => {
			const query = `
				SELECT id
				FROM updates
				ORDER BY update_date DESC
				LIMIT 1
			`;
			conn.query(query, (err, results) => {
				if (err) {
					reject(err);
				} else {
					resolve(results.length > 0 ? results[0].id : null);
				}
			});
		});
	}

    static getLatestUpdates() {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT id, update_text, update_date
                FROM updates
                ORDER BY update_date DESC
                LIMIT 5
            `;
            conn.query(query, (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({ success: true, updates: results });
                }
            });
        });
    }
}

module.exports = notificationController;