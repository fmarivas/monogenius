require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors')
const app = express();
const port = process.env.PORT || 8080;

const routes = require('./routes/routes');
const authRoutes = require('./controllers/googleauth');
const { conn } = require('./models/db');

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session); 
const passport = require('passport');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors())
// Guardar as sessões
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000,  // Limpa as sessões expiradas a cada 15 minutos
  expiration: 3600000,  // Sessões expiram após 24 horas
  createDatabaseTable: true,
  schema: {
    tableName: 'sessions',  // Nome específico para a tabela de sessões de administradores
    columnNames: {
      session_id: 'session_id',
      expires: 'expires',
      data: 'data'
    }
  }
}, conn);

app.set('trust proxy', 1); // Confia no primeiro proxy

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false, //antes true
  store: sessionStore, //Aqui
  cookie: {
    // secure: process.env.NODE_ENV === 'production',  // Uso de HTTPS
    // httpOnly: true,
    // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 1000 * 60 * 60 * 24,
  }  
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use('/', routes);
app.use('/auth', authRoutes);

passport.serializeUser(function (user, cb) {
  cb(null, user); // Armazena apenas o ID do usuário na sessão
});

passport.deserializeUser(function (obj, cb) {
  cb(null, obj);
});

//error
app.use((err, req, res, next) => {
  if (err.status === 403) {
    res.status(403).sendFile(path.join(__dirname, 'public', 'error', 'error403.html'));
  } else if (err.status === 404) {
    res.sendFile(path.join(__dirname, 'public', 'error', 'error404.html'));
  } else {
    console.error(err.stack);
    res.status(500).sendFile(path.join(__dirname, 'public', 'error', 'error500.html'));
  }
});

const server = app.listen(port, () => {
  console.log(`Server running on port http://localhost:${port}`);
});

// Aumentar o timeout do servidor para 5 minutos (300000 ms)
server.timeout = 300000;