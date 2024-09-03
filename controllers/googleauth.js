require('dotenv').config()
const GoogleStrategy = require('passport-google-oauth20').Strategy
const express =require('express')
const router = express.Router()
const path = require('path')
const passport = require('passport')
const Authorization = require('../controllers/function/authorization')

let userProfile

passport.use(new GoogleStrategy({
    clientID: process.env.ClientId,
    clientSecret: process.env.ClientSecret,
    callbackURL: process.env.redirect_url
  },
  function(accessToken, refreshToken, profile, done) {
	  userProfile = profile
    return done(null, profile);
  }
));

router.get('/login', (req, res) =>{
	res.render('login')
})



router.get('/google',  passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/error' }),
  async (req, res) => {
    try {
      const user = await Authorization.handUserGoogleLogin(req.user);
      
      if (user) {
        req.session.user = user;
        res.redirect('/survey/onboarding');
      } else {
        throw new Error('user_not_found');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      let errorType = 'unknown';
      if (err.message === 'user_not_found') {
        errorType = 'user_not_found';
      } else if (err.code === 'ER_BAD_NULL_ERROR') {
        errorType = 'missing_info';
      }
      res.redirect(`/auth/error?type=${errorType}`);
    }
  }
);

router.get('/error', (req, res) => {
  const errorType = req.query.type || 'unknown';
  res.render('error', { errorType });
});


module.exports = router