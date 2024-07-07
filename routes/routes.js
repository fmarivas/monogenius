require('dotenv').config()
const express = require('express')
const router = express.Router()
const path = require('path')

const multer = require('multer');
const upload = multer();
const rateLimit = require('express-rate-limit');

const platformData = require('../models/platformMetrics')
const Transaction = require('../models/transaction')
const feedbackController = require('../models/feedbackFunction')

const notificationController = require('../controllers/function/notificationController');
const MonoCreator = require('../controllers/function/MonoCreatorComponent')
const Plagiarism = require('../controllers/function/Plagiarism')
const fileReader = require('../controllers/function/fileFunction')
const userRequest = require('../controllers/function/canMakeRequest')
const isAuth = require('../controllers/function/middleware/auth')

const paymentMpesa = require('../controllers/payment/MpesaFunction')

const cloudinary = require('../controllers/cloudinaryClient')
const Files = require('../controllers/function/uploadFILES');


const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // Limite cada IP a 5 feedbacks por hora
  message: 'Limite de feedbacks excedido, por favor tente novamente após uma hora'
});

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
  'pricing': 'pricing',
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
  'updates': async (req,res)=>{
    try {
        const updatesData = await notificationController.getLatestUpdates();
        
        if (updatesData.success && updatesData.updates.length > 0) {
            const updates = updatesData.updates.map(update => {
                const updateText = update.update_text;
                const [title, ...sections] = updateText.split('\n\n');
                
                return {
                    title: title,
                    sections: sections.map(section => {
                        const [subTitle, ...description] = section.split('\n');
                        return {
                            subTitle: subTitle.replace(':', ''),
                            description: description.join('\n')
                        };
                    }),
                    date: update.update_date
                };
            });

            res.render('updates', { updates: updates });
        } else {
            res.render('updates', { updates: [] });
        }
    } catch (error) {
        console.error('Erro ao obter atualizações:', error);
        res.status(500).render('error', { message: 'Erro ao carregar atualizações' });
    }
  },
  'pricing': 'pages/payment/pricing',
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


router.post('/api/create', isAuth, upload.single('manuais'), async (req, res) => {
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
		
		const tier = await userRequest.tierDisplay(req.session.user)
		
	  const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'createMono');
	  
	  if(canMakeRequest.success){
		  const mono = await MonoCreator.createMono(tema, ideiaInicial, manuais, tier)
		  
		  if(mono.success){
			  console.log('success')
			  res.json({
				  success: true, 
				  mono: mono.monografia, 
				  refer: mono.refer, 
				  message: 'Monografia criada com sucesso!',
			});
		  }else{
			  console.log('false')
			  res.json({ success: false, message: 'Falha ao criar Monografia. Tente mais tarde!' });
		  }
	  }else{
		  res.json({success: false, message: canMakeRequest.message})	
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
			res.json({success: false, message: canMakeRequest.message})	
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



//notificacoes
//verificacao de atualizacoes
router.get('/api/verify-updates', isAuth, async (req, res) => {
    try {
        const updates = await notificationController.getLatestUpdates();
		
		if(updates.success){
			res.json({success:true});			
		}else{
			res.json({success:false});			
		}
    } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// marcar a notificação como vista
router.post('/api/mark-notification-seen',isAuth, async (req,res)=>{
	try {
		const userNotificationMarker = await notificationController.markNotificationSeen(req.session.user)
		
		if(userNotificationMarker){
			res.json({success: true, url: '/c/updates'});			
		}else{
			res.json({success:false})
		}
	} catch (error) {
		console.error('Erro ao marcar notificação como vista:', error);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}	
});
//verificar o status da notificação
router.get('/api/check-notification-status', isAuth, async (req,res)=>{
	try {
		
		const userUpdate = await notificationController.checkNotificationStatus(req.session.user)
		
		if(userUpdate){
			res.json({ seen: true });			
		}else{
			res.json({ seen: false});			
		}
	} catch (error) {
		console.error('Erro ao verificar status da notificação:', error);
		res.status(500).json({ error: 'Erro interno do servidor' });
	}	
});

router.post('/api/feedback', isAuth,feedbackLimiter, upload.none(), async (req,res)=>{
	const {functionality, feedback_type, reason, description} = req.body
	
	if(!functionality || !reason){
		return res.json({success: false, message: 'Preencha os campos e tente novamente!'})
	}
	
	if(!description){
		return res.json({success: false, message: 'Preencha o motivo da sua opinião!'})
	}
	
	try{
		const userFeedback = await feedbackController.feedback(req.session.user, functionality, feedback_type, reason, description)
		
		if(userFeedback.success){
			res.json({success: true, message:'Seu feedback foi enviado com sucesso!'})
		}else{
			res.json({success: false, message:'Falha ao enviar o seu feedback. Tente novamente!'})
		}
	}catch(err){
		console.error(err)
		res.json({success: false, message: 'Error de servidor. Tente novamente mais tarde!'})
	}
})



router.post('/process-payment', isAuth, async (req,res)=>{
	let { payType, phoneNumber } = req.body;

	if (!payType) {
		return res.json({ success: false, message: "Payment Type of argument required" });
	}

	// Corrigindo a lógica da condição
	if ((payType.toLowerCase() === 'mpesa' || payType.toLowerCase() === 'emola') && (!phoneNumber || phoneNumber.trim() === '')){
		return res.json({ success: false, message: "Phone Number required" });
	}

	const tier = req.session.tier
	const amount = req.session.amount
	const tokenAmount = req.session.tokenAmount || null
	
    
	try{	
		const result = await paymentMpesa(phoneNumber, amount)
		
		if(result.success){
			const transactionData = {
                user_id: req.session.user.id, // Assumindo que você tem o ID do usuário disponível através do middleware isAuth
                type: tier,
				amount: amount,
                transaction_date: new Date(),
                token_amount: tokenAmount,
                payment_method: payType,
                status: 'Completed',
                transaction_id: result.data.output_TransactionID,
                conversation_id: result.data.output_ConversationID
			}
			
			const transaction = await Transaction.transactionProcessing(transactionData)
			
			res.json({
				success: true, 
				message: 'Pagamento efetuado com sucesso', 
				redirectUrl: '/c/dashboard',
			})
		}else{
			res.json({success: false, message: result.error.output_ResponseDesc})
		}
	}catch(e){
		console.error(e)
		res.json({success: false, message: 'Erro de servidor. Tente mais tarde!'})
	}
})

router.post('/checkout', isAuth, (req, res) => {
    let { type } = req.body;
    let amount;

    // Correção na lógica de validação
    if (type !== 'basic' && type !== 'premium' || !type) {
        return res.status(400).json({ error: "Invalid type" });
    }

    if (type === 'basic') {
        amount = 3200;
    } else if (type === 'premium') {
        amount = 10000;
    }

    // Armazenar informações na sessão
    req.session.tier = type;
    req.session.amount = amount;

    // Renderizar a página de checkout
    res.render('pages/payment/checkout', {
        tier: type,
        amount: amount,
    });
});

module.exports = router