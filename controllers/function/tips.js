const { conn } = require('../../models/db');
const util = require('util');
const query = util.promisify(conn.query).bind(conn);

class DailyTips {
    static async checkUserDailyTip(userId) {
        const today = new Date().toISOString().split('T')[0];
        const checkResults = await query(
            'SELECT tip_id FROM viewed_tips WHERE user_id = ? AND DATE(viewed_at) = ?',
            [userId, today]
        );
        return checkResults.length > 0 ? checkResults[0].tip_id : null;
    }

    static async getExistingTip(tipId, language) {
        const existingTip = await query(
            'SELECT id, tip_content FROM daily_tips WHERE id = ? AND language = ?',
            [tipId, language]
        );
        return existingTip[0] || null;
    }

    static async getNewDailyTip(userId, language) {
        const dailyTips = await query(
            `SELECT dt.id, dt.tip_content 
             FROM daily_tips dt
             JOIN user_details ud ON ud.academic_phase = dt.category
             WHERE ud.user_id = ? AND dt.language = ?
             ORDER BY RAND()
             LIMIT 1`,
            [userId, language]
        );

        return dailyTips[0] || null;
    }

    static async recordViewedTip(userId, tipId) {
        await query(
            'INSERT INTO viewed_tips (user_id, tip_id, viewed_at) VALUES (?, ?, ?)',
            [userId, tipId, new Date()]
        );
    }

    static async getUserDailyTip(user, language = 'pt') {
        const userId = user.id;

        return new Promise((resolve, reject) => {
            conn.beginTransaction(async (err) => {
                if (err) {
                    console.error('Erro ao iniciar transação:', err);
                    return reject('Erro ao iniciar transação');
                }

                try {
                    const existingTipId = await this.checkUserDailyTip(userId);
                    let tip;

                    if (existingTipId) {
                        tip = await this.getExistingTip(existingTipId, language);
                    } else {
                        tip = await this.getNewDailyTip(userId, language);
                        if (tip) {
                            await this.recordViewedTip(userId, tip.id);
                        }
                    }

                    conn.commit();

                    if (tip) {
                        resolve({ id: tip.id, content: tip.tip_content });
                    } else {
                        resolve({ content: "Bem-vindo ao Monogenius!" });
                    }
                } catch (error) {
                    conn.rollback();
                    console.error('Erro ao processar dica diária:', error);
                    reject('Erro ao processar a solicitação de dica');
                }
            });
        });
    }
}

module.exports = DailyTips;