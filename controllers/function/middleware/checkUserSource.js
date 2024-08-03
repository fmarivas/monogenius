const { conn } = require('../../../models/db');

async function checkUserSource(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    try {
        const query = 'SELECT * FROM user_source WHERE user_id = ?';
        
        conn.query(query, [req.session.user.id], (err, results) => {
            if (err) {
                console.error('Erro ao verificar fonte do usuário:', err);
                return res.status(500).send('Erro interno do servidor');
            }
            
            if (results.length > 0) {
                res.redirect('/c/create');
            } else {
                next();
            }
        });
    } catch (error) {
        console.error('Erro inesperado:', error);
        res.status(500).send('Erro interno do servidor');
    }
}

module.exports = checkUserSource;