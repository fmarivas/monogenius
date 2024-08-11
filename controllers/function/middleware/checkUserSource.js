const { conn } = require('../../../models/db');
const Authorization  = require('../authorization')

async function checkUserSource(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    try {
        // Primeiro, verifique a tabela user_source
        const sourceQuery = 'SELECT * FROM user_source WHERE user_id = ?';
        
        conn.query(sourceQuery, [req.session.user.id], async (err, sourceResults) => {
            if (err) {
                console.error('Erro ao verificar fonte do usuário:', err);
                return res.status(500).send('Erro interno do servidor');
            }
            
            if (sourceResults.length === 0) {
                // Se não houver dados em user_source, mantenha o usuário na página atual
                return next();
            }
            
            // Se houver dados em user_source, verifique os detalhes do usuário
            const userDetails = await Authorization.checkUserDetails(req.session.user.id);
            
            if (userDetails.exists) {
                // Redirecionar com base na fase acadêmica
                switch (userDetails.academicPhase) {
                    case 'Escolha do Tema':
                        return res.redirect('/c/themes');
                    case 'Projeto':
                        return res.redirect('/c/create');
                    case 'Coleta de Dados':
                        return res.redirect('/c/create');
                    case 'Escrita':
                        return res.redirect('/c/create');
                    case 'Revisão':
                        return res.redirect('/c/plagiarism');
                    default:
                        return res.redirect('/c/dashboard');
                }
            } else {
                // Se os detalhes do usuário não existirem, redirecione para o dashboard
                return res.redirect('/c/dashboard');
            }
        });
    } catch (error) {
        console.error('Erro inesperado:', error);
        res.status(500).send('Erro interno do servidor');
    }
}

module.exports = checkUserSource;