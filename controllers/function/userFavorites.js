const {conn} = require('../../models/db')
const util = require('util');

// Promisify the query method
const query = util.promisify(conn.query).bind(conn);

class favorites{
	static async getUserFavorites(userId) {
		try {
			const favoriteThemes = await this.getFavoriteThemes(userId);
			const favoriteReferences = await this.getFavoriteReferences(userId);
			
			// const favoriteMonographs = await this.getFavoriteMonographs(userId);

			return {
				favorites: favoriteThemes,
				mono: [],
				refer: favoriteReferences,
			};
		} catch (err) {
			console.error('Error getting user favorites:', err);
			throw new Error('Failed to get user favorites');
		}	
	}
	
    static async getFavoriteThemes(userId) {
        try {
            const sql = 'SELECT theme FROM favorite_themes WHERE user_id = ? ORDER BY created_at DESC';
            const results = await query(sql, [userId]);
            return results.map(row => row.theme);
        } catch (err) {
            console.error('Error getting favorite themes:', err);
            throw new Error('Failed to get favorite themes');
        }
    }
	
	static async getFavoriteReferences(userId) {
		try {
			const sql = 'SELECT research_topic, reference_set FROM favorite_references WHERE user_id = ? ORDER BY created_at DESC';
			const results = await query(sql, [userId]);
			return results.map(row => ({
				research_topic: row.research_topic,
				reference_set: JSON.parse(row.reference_set)
			}));
		} catch (err) {
			console.error('Error getting favorite references:', err);
			throw new Error('Failed to get favorite references');
		}
	}
	
    static async getAllFavoriteThemes() {
        try {
            const sql = 'SELECT theme, COUNT(*) as count FROM favorite_themes GROUP BY theme ORDER BY count DESC';
            const results = await query(sql);
            return results;
        } catch (err) {
            console.error('Error getting all favorite themes:', err);
            throw new Error('Failed to get all favorite themes');
        }
    }
}


module.exports = favorites