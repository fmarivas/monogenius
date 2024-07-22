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
const UserDetails = require('../controllers/function/userDetails')
const themeHandler = require('../controllers/function/themeHandler')
const FavoritesHandler = require('../controllers/function/userFavorites')

const fileReader = require('../controllers/function/fileFunction')
const userRequest = require('../controllers/function/canMakeRequest')


const isAuth = require('../controllers/function/middleware/auth')
const checkSubscription = require('../controllers/function/middleware/checkSubscription')
const checkUserHasDetails = require('../controllers/function/middleware/checkUserDetails')

const pageResources = require('../controllers/config/pageResources')
const preTextualElements = require('../controllers/config/preTextualElements')
const {getPricingPlansWithDiscount} = require('../controllers/config/pricingConfig')
const featuresConfig = require('../controllers/config/featuresConfig')
const pageDetails = require('../controllers/config/sidebarConfig')

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

	const currentDate = new Date();
	const isAugustFirst = currentDate.getMonth() === 7 && currentDate.getDate() === 1; // Agosto é mês 7 em JavaScript (0-indexed)

	const tierThemeLimits = {
		free: isAugustFirst ? 3 : 15,
		basic: isAugustFirst ? 5 : 15,
		premium: isAugustFirst ? 10 : 15,
		supreme: 15
	};

    const userTier = (req.session.user.tier).toLowerCase() || 'free';
    const maxThemes = tierThemeLimits[userTier];
	
	
    let imgData;
	let pricingPlans;
	let userFavorites
	let userSelectedMonoTheme = req.session.selectedTheme || ''
	
    try {
		pricingPlans = await getPricingPlansWithDiscount(req.session.user.id)
		
		userFavorites = await FavoritesHandler.getUserFavorites(req.session.user.id)
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
			maxThemes: maxThemes,
			userFavorites: userFavorites,
			userSelectedMonoTheme: userSelectedMonoTheme,
        });
    } else {
        let error = new Error("Page not found");
        error.status = 404;
        next(error);
    }
});


//Rota de inicio de pesquisa
router.get('/survey/onboarding', isAuth, checkUserHasDetails, (req,res)=>{
	res.render('onboarding',{user: req.session.user})
})


router.post('/onboarding', isAuth, async (req, res) => {
  const { academicPhase, mainChallenges, expectedGraduation, researchArea, toolsUsed } = req.body;

  if (!academicPhase || !mainChallenges || !expectedGraduation || !researchArea) {
    return res.render('survey/onboarding', { 
      errorMessage: 'Por favor, preencha todos os campos obrigatórios!',
      user: req.session.user
    });
  }

  try {
    const result = await UserDetails.onboarding(req.session.user.id, req.body);

    if (result.success) {
      req.session.user.hasCompletedOnboarding = true; // Opcional: marcar que o usuário completou o onboarding
      return res.redirect('/c/create');
    } else {
      return res.render('survey/onboarding', { 
        errorMessage: 'Erro ao configurar sua conta. Por favor, tente novamente.',
        user: req.session.user
      });
    }
  } catch (err) {
    console.error('Erro no servidor durante o onboarding:', err);
    return res.render('survey/onboarding', { 
      errorMessage: 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.',
      user: req.session.user
    });
  }
});





router.post('/api/create', isAuth, checkSubscription, upload.array('manuais'), async (req, res) => {
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
	const textField = req.body.textInput
	
	
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
				keywords
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
				keywords
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
				language
			} = req.body
			
			if(!researchTopic || !initialIdea){
				return res.json({success: false, message: 'Preencha os campos obrigatorios'})
			}
			
			const result = await additionalFeatures.referencesCreator(
				researchTopic,
				initialIdea,
				req.session.user.tier,
				language,
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


// Rota para adicionar, deletar e tudo relacionar a um tema aos favoritos
router.post('/api/keywordsGen', async (req, res) => {
    try {
        const { studyArea, specificInterest } = req.body;
        const data = `${studyArea} ${specificInterest}`.trim();
        const keywords = await additionalFeatures.keywordGenerator(data);
        
		res.json(keywords);
    } catch (error) {
        console.error('Erro ao gerar palavras-chave:', error);
        res.status(500).json({ error: 'Erro ao gerar palavras-chave' });
    }
});

router.post('/api/themes/:id', isAuth, async (req, res) => {
	const id = req.params.id
	const userId = req.session.user.id;
	
    try {
		if(id === 'favoriteTheme'){
			const { theme } = req.body;
			
			if (!theme) {
				return res.status(400).json({ success: false, message: 'Theme is required' });
			}
			const result = await themeHandler.addFavoriteTheme(userId, theme);
			res.json({ 
				success: result, 
				message: result ? 'Theme favorited successfully' : 'Failed to favorite theme',
				redirectUrl: result ? '/c/favorites' : null // Exemplo de URL de redirecionamento
			});
		} else {
			let error = new Error("Page not found");
			error.status = 404;
			next(error);
		}
    } catch (error) {
        console.error('Error in favoriteTheme route:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para remover um tema dos favoritos
router.delete('/api/favorites/theme/:theme', isAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { theme } = req.params;
        
        if (!theme) {
            return res.status(400).json({ success: false, message: 'Theme is required' });
        }
        const result = await themeHandler.removeFavoriteTheme(userId, theme);
        res.json({ success: result, message: result ? 'Theme unfavorited successfully' : 'Theme was not in favorites' });
    } catch (error) {
        console.error('Error in unfavoriteTheme route:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para selecionar um tema
router.post('/api/favorites/theme/select', isAuth, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { theme } = req.body;
        
        if (!theme) {
            return res.status(400).json({ success: false, message: 'Theme is required' });
        }

        const selectedTheme = await themeHandler.selectTheme(userId, theme);
        
        // Armazenar o tema selecionado na sessão
        req.session.selectedTheme = selectedTheme;

        res.json({ 
            success: true, 
            message: 'Theme selected successfully', 
            redirectUrl: '/c/create'
        });
    } catch (error) {
        console.error('Error in selectTheme route:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rota para obter os temas favoritos do usuário
// router.get('/favoriteThemes', isAuth, async (req, res) => {
    // try {
        // const userId = req.session.user.id;
        // const favorites = await themeHandler.getFavoriteThemes(userId);
        // res.json({ success: true, favorites });
    // } catch (error) {
        // console.error('Error in getFavoriteThemes route:', error);
        // res.status(500).json({ success: false, message: error.message });
    // }
// });

// Rota para obter o tema selecionado do usuário
// router.get('/selectedTheme', isAuth, async (req, res) => {
    // try {
        // const userId = req.session.user.id;
        // const selectedTheme = await themeHandler.getSelectedTheme(userId);
        // res.json({ success: true, selectedTheme });
    // } catch (error) {
        // console.error('Error in getSelectedTheme route:', error);
        // res.status(500).json({ success: false, message: error.message });
    // }
// });
module.exports = router