const { conn } = require('../../models/db');

class UserRequest {
		  static async canMakeRequest(user, type, wordCount = null) {
			const userId = user.id;
			const userTier = user.tier;
			const today = new Date().toISOString().split('T')[0];

			return new Promise((resolve, reject) => {
			  const queryLimit = 'SELECT daily_limit, word_limit FROM tier_limits WHERE tier = ? AND feature = ?';
			  
			  conn.query(queryLimit, [userTier, type], (err, limits) => {
				if (err) {
				  console.error(err);
				  reject({ success: false, message: 'Erro ao verificar limites' });
				  return;
				}

				if (limits.length === 0) {
				  reject({ success: false, message: 'Limites não encontrados para este tier e feature' });
				  return;
				}

				const { daily_limit, word_limit } = limits[0];

				// Verificar limite de palavras, se aplicável
				if (word_limit !== null && wordCount > word_limit) {
				  resolve({ success: false, message: `Limite de ${word_limit} palavras excedido` });
				  return;
				}

				const querySelect = 'SELECT * FROM user_requests WHERE user_id = ? AND request_date = ? AND request_type = ?';

				conn.query(querySelect, [userId, today, type], (err, existingRequest) => {
				  if (err) {
					console.error(err);
					reject({ success: false, message: 'Erro ao verificar solicitações existentes' });
					return;
				  }

				  if (existingRequest.length > 0) {
					const { request_count } = existingRequest[0];
					
					if (request_count >= daily_limit) {
					  resolve({ success: false, message: 'Limite diário atingido' });
					} else {
					  const queryUpdate = 'UPDATE user_requests SET request_count = request_count + 1 WHERE user_id = ? AND request_date = ? AND request_type = ?';
					  conn.query(queryUpdate, [userId, today, type], (err, resultUpdate) => {
						if (err) {
						  console.error(err);
						  reject({ success: false, message: 'Erro ao atualizar contagem de solicitações' });
						  return;
						}

						resolve({ success: true });
					  });
					}
				  } else {
					conn.query('INSERT INTO user_requests (user_id, request_date, request_count, request_type) VALUES (?, ?, 1, ?)', [userId, today, type], (err, resultInsert) => {
					  if (err) {
						console.error(err);
						reject({ success: false, message: 'Erro ao inserir nova solicitação' });
						return;
					  }
					  if (resultInsert.affectedRows > 0) {
						resolve({ success: true });
					  } else {
						resolve({ success: false, message: 'Falha ao inserir nova solicitação' });
					  }
					});
				  }
				});
			  });
			});
		  }
  
  
		static tierDisplay(user){
			const userId = user.user_code
			
			return new Promise((resolve, reject)=>{
				const query = 'SELECT tier FROM users WHERE user_code=?'
				
				conn.query(query, [userId], (err,results) =>{
					if(err){
						console.error(err)
						reject({success: false})
						return
					}
					
					resolve(results.length > 0? results[0].tier : null)
				})
			})
		}  
  
  
  
  
  
  
  
  
  
  
  
}

module.exports = UserRequest;