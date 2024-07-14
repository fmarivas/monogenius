const GoogleStrategy = require('passport-google-oauth20').Strategy
const express =require('express')
const router = express.Router()
const path = require('path')
const passport = require('passport')
const Authorization = require('../controllers/function/authorization')

require('dotenv').config()
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
  passport.authenticate('google', { failureRedirect: '/error' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/auth/success');
  });

router.get("/success", async (req, res, next) => {
    try {
		const user = await Authorization.handUserGoogleLogin(req.user);
		
		if(user){
			req.session.user = user
			
			res.redirect('/c/create')
		}else{
			res.redirect('/error')
		}
    } catch (err) {
        console.error(err);
		let error = new Error("Erro interno do servidor");
		error.status = 500;
		next(error);
    }
});

router.get('/error', (req, res) =>{
	res.sendFile(path.join(__dirname, 'public', 'error', 'googleError.html'));
})



module.exports = router