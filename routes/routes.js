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
const additionalFeatures = require('../controllers/function/additionalFeatures')

const fileReader = require('../controllers/function/fileFunction')
const userRequest = require('../controllers/function/canMakeRequest')
const {getPricingPlansWithDiscount} = require('../controllers/function/pricingConfig')

const featuresConfig = require('../controllers/function/featuresConfig')
const preTextualElements = require('../controllers/function/preTextualElements')

const isAuth = require('../controllers/function/middleware/auth')
const checkSubscription = require('../controllers/function/middleware/checkSubscription')

const pageResources = require('../controllers/config/pageResources')

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
}

// const routes = {
  // 'create': async (req, res)=>{
	// try{
		// const insertId = await platformData.addPageVisit(req);
		// res.render('pages/create')
	// }catch(err){
		// console.error(err)
	// }		  
  // },
  // 'template': async (req,res)=>{
	// try{
		// const insertId = await platformData.addPageVisit(req);
		// res.render('pages/template')
	// }catch(err){
		// console.error(err)
	// }	  
  // },
  // 'plagiarism': async (req,res)=>{
	// try{
		// const insertId = await platformData.addPageVisit(req);
		// res.render('pages/plagiarism')
	// }catch(err){
		// console.error(err)
	// }
  // },
  // 'profile': async (req,res)=>{
	  // try{
		// const insertId = await platformData.addPageVisit(req);
		// res.render('pages/profile',  {user: req.session.user})
	  // }catch(err){
		  // console.error(err)
	  // }
  // },
  // 'dashboard': (req,res)=>{
	  // res.render('dashboard', {user: req.user})
  // },

  // 'pricing': 'pages/payment/pricing',
// };



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

router.get('/c/:id', isAuth, async (req, res, next) => {
    const id = req.params.id;
    
	const pageDetails = {
		main: {
			dashboard: { name: 'Dashboard', icon: 'fas fa-tachometer-alt' },
		},
		features: {
			create: { name: 'Criar Monografia', icon: 'fas fa-pen-fancy' },
			plagiarism: { name: 'Verificador de Plágio', icon: 'fas fa-search' },
			template: { name: 'Templates', icon: 'fas fa-file-alt' },
		},
		cta: {
			pricing: { name: 'Planos e Preços', icon: 'fas fa-fire' },
		},
		bottom: {
			support: { name: 'Suporte', icon: 'fas fa-headset' },
			settings: { name: 'Configurações', icon: 'fas fa-cog' }
		},
		additionalFeatures: {
			references: { name: 'Gerador de Referências', icon: 'fas fa-book', description: 'Crie referências bibliográficas automaticamente.' },
			themes: { name: 'Gerador de Temas', icon: 'fas fa-lightbulb', description: 'Obtenha sugestões de temas inovadores para sua pesquisa.' },
			hypothesis: { name: 'Gerador de Hipóteses', icon: 'fas fa-flask', description: 'Formule hipóteses para sua pesquisa de forma assistida.' }
		}		
	};


    let imgData;
	let pricingPlans;
	
    try {
		pricingPlans = await getPricingPlansWithDiscount(req.session.user.id)
        
    } catch(err) {
        console.error(err);
        let error = new Error("Erro de processamento. Tente mais tarde");
        error.status = 500;
        return next(error);
    }

    // Função para encontrar a página nos detalhes
    const findPage = (details, targetId) => {
        for (let category in details) {
            if (details[category][targetId]) {
                return details[category][targetId];
            }
        }
        return null;
    };

    const pageDetail = findPage(pageDetails, id);

    if (pageDetail) {
        res.render('layout', {
            title: pageDetail.name,
            body: id,
            pageDetails: pageDetails,
            page: id,
            user: req.session.user,
            imgData: imgData,
			pageResources: pageResources[id] || {},
			preTextualElements: preTextualElements,
			plans: pricingPlans,
			dashboardFeatures: featuresConfig,
        });
    } else {
        let error = new Error("Page not found");
        error.status = 404;
        next(error);
    }
});


router.post('/api/create', isAuth, checkSubscription, upload.array('manuais'), async (req, res) => {
	const token = req.headers.authorization;

	if (token !== process.env.PUBLIC_ROUTE_TOKEN) {
		return res.status(403).json({ error: 'Token inválido' });
	}

	const { tema, ideiaInicial } = req.body;
	const files = req.files;
	let manuais = []
  
	try{
		
		if (files && files.length > 0) {
		  for (const file of files) {
			const readFile = await fileReader.readFile(file);
			if (readFile.success) {
			  manuais.push(readFile.content);
			}
		  }
		}
		
		
		const tier = await userRequest.tierDisplay(req.session.user)
		
		const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'createMono');
		  
			if(canMakeRequest.success){
			  const mono = await MonoCreator.createMono(tema, ideiaInicial, manuais, tier)
			  
			  if(mono.success){
				  res.json({
					  success: true, 
					  mono: mono.monografia, 
					  refer: mono.refer, 
					  message: 'Monografia criada com sucesso!',
				});
			  }else{
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

router.post('/api/read-file', isAuth, upload.single('file'), async (req,res) =>{
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


router.post('/api/plagiarism', isAuth, checkSubscription, async (req,res)=> {
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

router.post('/template/download', isAuth, checkSubscription, upload.single('logo'), (req, res) => {
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
			res.json({success: true, url: '/updates'});			
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

router.post('/checkout', isAuth, async (req, res) => {
    let { type } = req.body;
    let amount;
    let pricingPlans;

    // Correção na lógica de validação
    if (!type || (type !== 'basic' && type !== 'premium')) {
        return res.status(400).json({ error: "Invalid type" });
    }

    try {
        pricingPlans = await getPricingPlansWithDiscount(req.session.user.id);
        
        // Encontrar o plano correspondente
        const selectedPlan = Object.values(pricingPlans).find(plan => plan.name.toLowerCase() === type.toLowerCase());
        
        if (selectedPlan) {
            amount = selectedPlan.price; // Use 'price' instead of 'basePrice' as it's already discounted if applicable
        } else {
            throw new Error("Plan not found");
        }

        // Armazenar informações na sessão
        req.session.tier = type;
        req.session.amount = amount;

        // Renderizar a página de checkout
        res.render('pages/payment/checkout', {
            tier: type,
            amount: amount,
        });
    } catch (err) {
        console.error("Error in checkout route:", err);
        res.status(500).json({ error: "An error occurred during checkout" });
    }
});

router.post('/additionalFeatures', isAuth, checkSubscription, upload.none(), async (req,res)=>{
	const {typeOfFeature} = req.body
	
	try{
		if(typeOfFeature === 'hypothesis'){
			const {
					researchTopic, 
					generalObjective, 
					specificObjectives, 
					researchProblem, 
					methodology
				}= req.body
						
			if(!researchTopic || !generalObjective || !specificObjectives || !researchProblem){
				return res.json({success: false, message: 'Preencha os campos obrigatorios'})
			}
			
			const result = await additionalFeatures.hypothesisCreator(
				researchTopic, 
				generalObjective, 
				specificObjectives, 
				researchProblem, 
				methodology, 
				req.session.user.tier
			)
			
			if(result){
				res.json({
						success: true, 
						message: 'Hipoteses criadas com sucesso',
						result: result
					})
			}else{
				res.json({success: false, message: 'Erro de criacao. Tente novamente!'})
			}
		}else if(typeOfFeature === 'themeCreator'){
			const {
				studyArea,
				specificInterest,
				academicLevel,
				themeCount,
			} = req.body
			
			
			if(!studyArea || !academicLevel || !themeCount){
				return res.json({success: false, message: 'Preencha os campos obrigatorios'})
			}
			
			const result = await additionalFeatures.themesCreator(
				studyArea,
				specificInterest,
				academicLevel,
				themeCount,
				req.session.user.tier,
			)
			
			if(result){
				res.json({
						success: true, 
						message: 'Temas gerados com sucesso',
						result: result
					})
			}else{
				res.json({success: false, message: 'Erro de criacao. Tente novamente!'})
			}
		}else if(typeOfFeature === 'referencesCreator'){
			const {
				researchTopic,
				initialIdea,
			} = req.body
			
			
			if(!researchTopic || !initialIdea){
				return res.json({success: false, message: 'Preencha os campos obrigatorios'})
			}
			
			const result = await additionalFeatures.referencesCreator(
				researchTopic,
				initialIdea,
				req.session.user.tier,
			)
			
			if(result){
				res.json({
						success: true, 
						message: 'Referencias geradas com sucesso',
						result: result
					})
			}else{
				res.json({success: false, message: 'Erro de criacao. Tente novamente!'})
			}
		}else{
			res.json({success: false, message: 'Infelizmente esse recurso esta indisponivel por agora!'})
		}
	}catch(err){
		console.error(err)
		return res.json({success: false, message: 'Error de servidor. Tente mais tarde!'})
	}
})

// router.post('/additionalFeatures', isAuth, async (req,res)=>{
	
// })

module.exports = router