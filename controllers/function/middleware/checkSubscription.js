const checkSubscription = (req, res, next) => {
  const currentDate = new Date();
  const august1st2024 = new Date('2024-08-01');
  
  let allowedTiers;
  
  if (currentDate >= august1st2024) {
    allowedTiers = ['basic', 'premium'];
  } else {
    allowedTiers = ['free', 'basic', 'premium'];
  }

  if (!req.session.user.tier || !allowedTiers.includes(req.session.user.tier.toLowerCase())) {
    return res.json({ redirect: '/c/pricing' });
  }

  next();
};

module.exports = checkSubscription;