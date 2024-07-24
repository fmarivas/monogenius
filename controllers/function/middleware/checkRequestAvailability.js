// Middleware de pré-verificação
const userRequest = require('../canMakeRequest')

const checkRequestAvailability = async (req, res, next) => {
  try {
    const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'plagiarism', null, true);
    if (canMakeRequest.success) {
      req.canMakeRequest = true;
      next();
    } else {
      res.status(403).json({ success: false, message: canMakeRequest.message });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao verificar disponibilidade da solicitação' });
  }
};

module.exports = checkRequestAvailability