const featureAccess = {
  'themes': ['free', 'basic', 'premium', 'supreme'],
  'template': ['free', 'basic', 'premium', 'supreme'],
  'prepareDefense': ['free', 'basic', 'premium', 'supreme'],
  'submitAudioResponse': ['free', 'basic', 'premium', 'supreme'],
  'plagiarism': ['basic', 'premium', 'supreme'],
  'references': ['basic', 'premium', 'supreme'],
  'hypothesis': ['basic', 'premium', 'supreme'],
  'create': ['premium', 'supreme'],
  'resume': ['premium', 'supreme'],
};

const {
		getPricingPlansWithDiscount, 
		tokenConsumption, 
		checkAndConsumeTokens, 
		updateUserTokens,
		getUserTokens,
	} = require('../../config/pricingConfig')
	
const checkFeatureAccess = (feature) => {
  return async (req, res, next) => {
    const userTier = req.session.user.tier.toLowerCase();
    const userId = req.session.user.id;
    
    if (featureAccess[feature].includes(userTier)) {
      const hasEnoughTokens = await checkAndConsumeTokens(userId, feature);
      if (hasEnoughTokens) {
        next();
      } else {
        res.json({ 
          error: 'Tokens insuficientes', 
          message: 'Você não tem tokens suficientes para usar esta funcionalidade',
          redirect: '/c/pricing' 
        });
      }
    } else {
      res.json({ 
        error: 'Acesso negado', 
        message: 'Seu plano atual não permite acesso a esta funcionalidade',
        redirect: '/c/pricing' 
      });
    }
  };
};

module.exports = checkFeatureAccess;