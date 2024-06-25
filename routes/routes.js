require('dotenv').config()
const express = require('express')
const router = express.Router()
const path = require('path')

const multer = require('multer');
const upload = multer();

const platformData = require('../models/platformMetrics')

const MonoCreator = require('../controllers/function/MonoCreatorComponent')
const Plagiarism = require('../controllers/function/Plagiarism')
const fileReader = require('../controllers/function/fileFunction')
const userRequest = require('../controllers/function/canMakeRequest')
const isAuth = require('../controllers/function/middleware/auth')

const cloudinary = require('../controllers/cloudinaryClient')
const Files = require('../controllers/function/uploadFILES');

router.get('/', async (req,res) =>{
	try{
		res.render('landingpage')		
	}catch(err){
		console.error(err)
	}
})

const generalRoutes = {
	'upload-files': async (req,res)=>{
		try {
			const baseImagePath = path.join(__dirname, '..', 'public', 'assets', 'img');
			
			const uploadSuccess = await Files.uploadAllImages(baseImagePath);
			if (uploadSuccess) {
				res.send('Upload de imagens concluído com sucesso');
			} else {
				res.status(500).send('Erro ao fazer upload das imagens');
			}
		} catch (err) {
			console.error('Erro ao processar upload de imagens:', err);
			res.status(500).send('Erro interno do servidor');
		}
	},
  'about': 'about',
  'terms': 'terms',
  'privacy': 'privacy',
  'get-public-token': (req, res) => {
    const requestOrigin = req.headers.origin || `${req.protocol}://${req.headers.host}`;
    const allowedHosts = process.env.ALLOWED_HOSTS.split(',');
    if (allowedHosts.some(host => {
      try {
        const url = new URL(requestOrigin);
        return url.host === host;
      } catch (err) {
        return false;
      }
    })) {
      res.json({ token: process.env.PUBLIC_ROUTE_TOKEN });
    } else {
      res.status(403).json({ error: 'Origem não permitida' });
    }
  },
  'logout': (req,res,next) => {
    req.session.destroy((err) => {
        if (err) {
            // Trata o erro se houver falha ao destruir a sessão
            console.error("Erro ao destruir a sessão:", err);
			let error = new Error("Erro ao realizar o logout");
			error.status = 500;
			next(error);			
        } else {
            // Redireciona para a página de login ou para a página inicial após o logout
            res.redirect('/auth/login');
        }
    });
  }  
}

const routes = {
  'create': async (req, res)=>{
	try{
		const insertId = await platformData.addPageVisit(req);
		res.render('pages/create')
	}catch(err){
		console.error(err)
	}		  
  },
  'template': async (req,res)=>{
	try{
		const insertId = await platformData.addPageVisit(req);
		res.render('pages/template')
	}catch(err){
		console.error(err)
	}	  
  },
  'plagiarism': async (req,res)=>{
	try{
		const insertId = await platformData.addPageVisit(req);
		res.render('pages/plagiarism')
	}catch(err){
		console.error(err)
	}
  },
  'profile': async (req,res)=>{
	  try{
		const insertId = await platformData.addPageVisit(req);
		res.render('pages/profile',  {user: req.session.user})
	  }catch(err){
		  console.error(err)
	  }
  },
  'dashboard': (req,res)=>{
	  res.render('dashboard', {user: req.user})
  },
};



router.get('/:id', (req, res, next) => {
  const id = req.params.id;
  const route = generalRoutes[id];

  if (typeof route === 'function') {
    route(req, res);
  } else if (route) {
    res.render(route);
  } else {
    let error = new Error("Page not found");
    error.status = 404;
    next(error);
  }
});

router.get('/c/:id', isAuth, (req, res, next) => {
  const id = req.params.id;
  const route = routes[id];

  if (typeof route === 'function') {
    route(req, res);
  } else if (route) {
    res.render(route);
  } else {
    let error = new Error("Page not found");
    error.status = 404;
    next(error);
  }
});


router.post('/api/create', upload.single('manuais'), async (req, res) => {
  const token = req.headers.authorization;

  if (token !== process.env.PUBLIC_ROUTE_TOKEN) {
    return res.status(403).json({ error: 'Token inválido' });
  }

  const { tema, ideiaInicial } = req.body;
  const files = req.file;
  let manuais
  
  try{
		
		if(files){
			const readFile = await fileReader.readFile(files)
			manuais = readFile.success ? readFile.content : []
		}else{
			manuais = []
		}
		
	  const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'createMono');
	  
	  if(canMakeRequest.success){
		  const mono = await MonoCreator.createMono(tema, ideiaInicial, manuais)
		  if(mono){
			  res.json({success: true, mono: mono, message: 'Monografia criada com sucesso!'});		  
		  }else{
			  res.json({ success: false, message: 'Falha ao criar Monografia. Tente mais tarde!' });
		  }
	  }else{
		  res.json({success: false, message: 'Excedeu o limite diario!'})	
	  }
  }catch(err){
	  console.error(err)
	  res.json({success: false, message: 'Erro interno do servidor.Tente novamente mais tarde!'});
  }
});

router.post('/api/read-file', upload.single('file'), async (req,res) =>{
	const token = req.headers.authorization;
	
	if (token !== process.env.PUBLIC_ROUTE_TOKEN) {
		return res.status(403).json({ error: 'Token inválido' });
	}
	
	const file = req.file;
	
	if(!file){
		return res.json({success:false, message: 'Ocorreu um erro ao ler o arquivo.'})
	}
	
	try{
		const readFile = await fileReader.readFile(file)
		
		if (readFile.success) {
		  return res.json({ success: true, content: readFile.content });
		} else {
		  return res.json({ success: false, message: readFile.message });
		}
	}catch(err){
		console.error(err)
		return res.json({success:false})
	}
})


router.post('/api/plagiarism', async (req,res)=> {
	const token = req.headers.authorization;
	const textField = req.body.textInput
	
	if (token !== process.env.PUBLIC_ROUTE_TOKEN) {
		return res.json({ success: false, error: 'Token inválido' });
	}
	
	if(!textField){
		return res.status(401).json({success: false, message: 'Preencha o campo do texto!'})
	}
	
	try{
		const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'plagiarism');
		
		if(canMakeRequest.success){
			const plagiarismChecker = await Plagiarism.verifyPlagiarism(textField);
			if(plagiarismChecker.success){
				res.json({success: true, result: plagiarismChecker.result});
			} else {
				res.json({success: false, message: plagiarismChecker.message});
			}
		}else{
			res.json({success: false, message: 'Excedeu o limite diario!'})	
		}
		
	}catch(err){
		console.error(err)
		res.json({success: false, message: 'Erro interno do servidor'});
	}
})

router.post('/template/download', upload.single('logo'), (req, res) => {
    const { instituicao, tema, autor, supervisor, local, mes, ano } = req.body;
    const logoBuffer = req.file ? req.file.buffer : null;

    res.render('template/templateCapa-1', {
        logo: logoBuffer,
        instituicao,
        tema,
        autor,
        supervisor,
        dateLocal: `${local}, ${mes} de ${ano}`,
    });
});
module.exports = router