const { conn } = require('./db');
const { v4: uuidv4 } = require('uuid');

class Data {
  static async transactionProcessing(data) {
    return new Promise((resolve, reject) => {
      conn.beginTransaction((err) => {
        if (err) {
          reject({ success: false, message: 'Transaction begin failed', error: err });
          return;
        }

        const transactionQuery = `
          INSERT INTO transactions 
          (user_id, tier, amount, transaction_date, token_amount, payment_method, status, transaction_id, conversation_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        conn.query(transactionQuery, [
          data.user_id,
		  data.type,
          data.amount,
          data.transaction_date,
          data.token_amount,
          data.payment_method,
          data.status,
          data.transaction_id,
          data.conversation_id
        ], (err, result) => {
          if (err) {
            return conn.rollback(() => {
              reject({ success: false, message: 'Transaction insert failed', error: err });
            });
          }

          if (result.affectedRows === 0) {
            return conn.rollback(() => {
              resolve({ success: false, message: 'Payment failed - No rows affected' });
            });
          }

          const updateUserQuery = `
            UPDATE users 
            SET tier = ? 
            WHERE id = ?
          `;

          conn.query(updateUserQuery, [data.type, data.user_id], (err, result) => {
            if (err) {
              return conn.rollback(() => {
                reject({ success: false, message: 'User update failed', error: err });
              });
            }

            conn.commit((err) => {
              if (err) {
                return conn.rollback(() => {
                  reject({ success: false, message: 'Transaction commit failed', error: err });
                });
              }
              resolve({ success: true, message: 'Payment processed successfully' });
            });
          });
        });
      });
    });
  }
}

module.exports = Data;