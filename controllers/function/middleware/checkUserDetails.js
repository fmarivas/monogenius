const { conn } = require('../../../models/db');

async function checkUserHasDetails(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    try {
        const query = 'SELECT * FROM user_details WHERE user_id = ?';
        
        conn.query(query, [req.session.user.id], (err, results) => {
            if (err) {
                console.error('Erro ao verificar detalhes do usuário:', err);
                return res.status(500).send('Erro interno do servidor');
            }
            
            if (results.length > 0) {
                res.redirect('/survey/user-source');
            } else {
                next();
            }
        });
    } catch (error) {
        console.error('Erro inesperado:', error);
        res.status(500).send('Erro interno do servidor');
    }
}

module.exports = checkUserHasDetails;