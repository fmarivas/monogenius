const { conn } = require('../../models/db');

const requestLimits = {
  plagiarism: 5,
  createMono: 3,
  // Adicione outros tipos e seus limites aqui
};

class UserRequest {
  static async canMakeRequest(user, type) {
    const userId = user.id;
    const today = new Date().toISOString().split('T')[0];
    
	// Verificar se o tipo é válido
    if (!requestLimits.hasOwnProperty(type)) {
      return Promise.reject({ success: false, message: 'Tipo de solicitação inválido' });
    }
	
	const limit = requestLimits[type];
	
    return new Promise((resolve, reject) => {
      const querySelect = 'SELECT * FROM user_requests WHERE user_id = ? AND request_date = ? AND request_type = ?';

      conn.query(querySelect, [userId, today, type], (err, existingRequest) => {
        if (err) {
          console.error(err);
          reject({ success: false });
          return;
        }

        if (existingRequest.length > 0) {
          const { request_count } = existingRequest[0];
		  
          if (request_count >= limit) {
            resolve({ success: false });
          } else {
            const queryUpdate = 'UPDATE user_requests SET request_count = request_count + 1 WHERE user_id = ? AND request_date = ? AND request_type = ?';
            conn.query(queryUpdate, [userId, today, type], (err, resultUpdate) => {
              if (err) {
                console.error(err);
                reject({ success: false });
                return;
              }

              resolve({ success: true });
            });
          }
        } else {
          conn.query('INSERT INTO user_requests (user_id, request_date, request_count, request_type) VALUES (?, ?, 1, ?)', [userId, today, type], (err, resultInsert) => {
            if (err) {
              console.error(err);
              reject({ success: false });
              return;
            }
            if (resultInsert.affectedRows > 0) {
              resolve({ success: true });
            } else {
              resolve({ success: false });
            }
          });
        }
      });
    });
  }
}

module.exports = UserRequest;