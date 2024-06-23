const { conn } = require('../../models/db');
const path = require('path')

class Authorization {
    static async handUserGoogleLogin(user) {
        return new Promise((resolve, reject) => {
            let { id, name, emails, photos, provider } = user;
            let user_code = id;
            let fname = name.givenName;
            let lname = name.familyName;
            let email = emails[0].value;
            let pic = photos[0].value;
            let date = new Date().toISOString().slice(0, 10);
            let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            // Verifique se o usuário já existe na base de dados
            const selectQuery = 'SELECT * FROM users WHERE user_code = ?';
            conn.query(selectQuery, [user_code], (err, result) => {
                if (err) {
                    console.error('Erro ao executar a consulta:', err);
                    reject(err);
                    return;
                }

                if (result.length > 0) {
                    resolve(result[0]); // Usuário já existe
                } else {
                    // Insere novo usuário
                    const insertQuery = `INSERT INTO users (user_code, fname, lname, email, date_registered, profile_pic, timezone,source)
                                         VALUES (?, ?, ?, ?, ?, ?, ?, 'google')`;
                    conn.query(insertQuery, [user_code, fname, lname, email, date, pic, timezone], (err, result) => {
                        if (err) {
                            console.error('Erro ao registrar o usuário:', err);
                            reject(err);
                            return;
                        }
                        // Retorna o novo usuário inserido
                        const queryNewInsert = "SELECT * FROM users WHERE user_code = ?";
                        conn.query(queryNewInsert, [user_code], (err, response) => {
                            if (err) {
                                console.error(err);
                                reject(err);
                                return;
                            }
                            resolve(response[0]);
                        });
                    });
                }
            });
        });
    }

    static async checkUserDetails(user_id_info) {
        const selectQuery = 'SELECT * FROM user_details WHERE user_id_info = ?';
        return new Promise((resolve, reject) => {
            conn.query(selectQuery, [user_id_info], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result.length > 0);
                }
            });
        });
    }
	
	static async checkHowKnew(userId){
		const query = "SELECT * FROM onboarding_data WHERE user_id=?"
		return new Promise((resolve,reject) =>{
			conn.query(query,[userId], (err, result)=>{
				if(err){
					console.error(err)
					reject(err)
				}else{
					resolve(result.length > 0)
				}
			})
		})
	}
}

module.exports = Authorization;
