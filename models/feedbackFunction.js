const { conn } = require('./db');

class FeedbackController {
  static feedback(user, functionality, feedback_type, reason, description) {
    const userId = user.id;

    return new Promise((resolve, reject) => {
      const query = "INSERT INTO user_feedback(user_id, functionality, feedback_type, reason, description) VALUES(?, ?, ?, ?, ?)";

      conn.query(query, [userId, functionality, feedback_type, reason, description], (err, results) => {
        if (err) {
          console.error('Erro ao inserir feedback:', err);
          reject({ success: false, error: err.message });
          return;
        }

        if (results.affectedRows > 0) {
          resolve({ success: true });
        } else {
          console.warn('Nenhuma linha afetada ao inserir feedback');
          resolve({ success: false, message: 'Nenhum dado foi inserido' });
        }
      });
    });
  }
}

module.exports = FeedbackController;