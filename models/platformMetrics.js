const {conn} = require('./db')
const { v4: uuidv4 } = require('uuid');

class data {
	static async addPageVisit(req) {
	  return new Promise((resolve, reject) => {
		const userId = req.session.user.id;
		const pageUrl = req.originalUrl;
		const visitTimestamp = new Date();
		const visitSessionId = uuidv4();

		const query = `
		  SELECT COUNT(*) AS count
		  FROM page_visits
		  WHERE user_id = ? AND page_url = ? AND visit_session_id = ?
		`;

		conn.query(query, [userId, pageUrl, visitSessionId], (err, result) => {
		  if (err) {
			console.error(err);
			reject(err);
			return;
		  }

		  if (result[0].count === 0) {
			const insertQuery = `
			  INSERT INTO page_visits (user_id, page_url, visit_timestamp, visit_session_id)
			  VALUES (?, ?, ?, ?)
			`;

			conn.query(insertQuery, [userId, pageUrl, visitTimestamp, visitSessionId], (err, insertResult) => {
			  if (err) {
				console.error(err);
				reject(err);
				return;
			  }

			  resolve(insertResult.insertId);
			});
		  } else {
			resolve(null); // Não insere, pois a visita já foi registrada
		  }
		});
	  });
	}
}

module.exports = data