require('dotenv').config()
const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs');

const multer = require('multer');
const upload = multer();
const rateLimit = require('express-rate-limit');

const platformData = require('../models/platformMetrics')
const User = require('../models/user')
const Transaction = require('../models/transaction')
const feedbackController = require('../models/feedbackFunction')

const notificationController = require('../controllers/function/notificationController');

const MonoCreator = require('../controllers/function/MonoCreatorComponent')
const Plagiarism = require('../controllers/function/Plagiarism')
const additionalFeatures = require('../controllers/function/additionalFeatures')
const UserDetails = require('../controllers/function/userDetails')
const FavoritesHandler = require('../controllers/function/userFavorites')

const themeHandler = require('../controllers/function/themeHandler')
const referenceHandler = require('../controllers/function/referenceHandler')

const Support = require('../controllers/function/supportHandler')

const fileReader = require('../controllers/function/fileFunction')
const userRequest = require('../controllers/function/canMakeRequest')
const aiProcessor = require('../controllers/function/aiProcessor')


const isAuth = require('../controllers/function/middleware/auth')
const checkFeatureAccess = require('../controllers/function/middleware/checkSubscription')
const checkUserHasDetails = require('../controllers/function/middleware/checkUserDetails')
const checkUserSource = require('../controllers/function/middleware/checkUserSource')
const checkRequestAvailability = require('../controllers/function/middleware/checkRequestAvailability')

const pageResources = require('../controllers/config/pageResources')
const preTextualElements = require('../controllers/config/preTextualElements')

const {
		getPricingPlansWithDiscount, 
		tokenConsumption, 
		checkAndConsumeTokens, 
		updateUserTokens,
		getUserTokens,
	} = require('../controllers/config/pricingConfig')
	
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

//Contador de palavras
function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

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
	let updateUserTokens
	
    try {
		pricingPlans = await getPricingPlansWithDiscount(req.session.user.id)
		
		updateUserTokens = await User.usersTokens(req.session.user.id)
		
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
			tokens: updateUserTokens,
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

router.get('/survey/user-source', isAuth, checkUserSource, (req,res)=>{
	res.render('user_source',{user: req.session.user})
})


router.post('/onboarding', isAuth, async (req, res) => {
  const { academicPhase, mainChallenges, expectedGraduation, researchArea, toolsUsed } = req.body;

  if (!academicPhase || !mainChallenges || !expectedGraduation || !researchArea) {
    return res.render('onboarding', { 
      errorMessage: 'Por favor, preencha todos os campos obrigatórios!',
      user: req.session.user
    });
  }

  try {
    const result = await UserDetails.onboarding(req.session.user.id, req.body);

    if (result.success) {
      req.session.user.hasCompletedOnboarding = true; // Opcional: marcar que o usuário completou o onboarding
      return res.redirect('/survey/user-source');
    } else {
      return res.render('onboarding', { 
        errorMessage: 'Erro ao configurar sua conta. Por favor, tente novamente.',
        user: req.session.user
      });
    }
  } catch (err) {
    console.error('Erro no servidor durante o onboarding:', err);
    return res.render('onboarding', { 
      errorMessage: 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.',
      user: req.session.user
    });
  }
});


router.post('/survey/user-source', isAuth, async (req, res) => {
	const { sourceOfKnowledge, otherSource, whatsappNumber } = req.body;

	if (!sourceOfKnowledge) {
		return res.render('user_source', { 
		  errorMessage: 'Por favor, selecione como você conheceu o Monogenius.',
		  user: req.session.user
		});
	}

	try {
		const result = await UserDetails.userSource(req.session.user.id, req.body);
		if (result.success) {
		  req.session.user.hasCompletedSourceSurvey = true; // Opcional: marcar que o usuário completou a pesquisa
		  return res.redirect('/c/create');
		} else {
		  return res.render('user_source', { 
			errorMessage: 'Erro ao salvar suas informações. Por favor, tente novamente.',
			user: req.session.user
		  });
		}
	} catch (err) {
		console.error('Erro no servidor ao salvar fonte do usuário:', err);
		return res.render('user_source', { 
		  errorMessage: 'Ocorreu um erro no servidor. Por favor, tente novamente mais tarde.',
		  user: req.session.user
		})
	}		
});


router.post('/api/create', isAuth, checkFeatureAccess('create'), upload.array('manuais'), async (req, res) => {
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
		
		// const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'createMono');
		  
			// if(canMakeRequest.success){
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
			// }else{
				// res.json({success: false, message: canMakeRequest.message})	
			// }
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


router.post('/api/plagiarism', isAuth, checkFeatureAccess('plagiarism'), async (req, res) => {
  const textField = req.body.textInput;
  
  if (!textField) {
    return res.status(401).json({success: false, message: 'Preencha o campo do texto!'});
  }
  
  try {
    const wordCount = countWords(textField);
    
    if (wordCount > 500) {
      return res.json({success: false, message: 'O texto excede o limite de 500 palavras'});
    }
    
    const hasEnoughTokens = await checkAndConsumeTokens(req.session.user.id, 'plagiarism', wordCount);
    
    if (!hasEnoughTokens) {
      return res.json({success: false, message: 'Tokens insuficientes para realizar a verificação de plágio'});
    }
    
    const canMakeRequest = await userRequest.canMakeRequest(req.session.user, 'plagiarism');
    
    if (canMakeRequest.success) {
      const plagiarismChecker = await Plagiarism.verifyPlagiarism(textField);
      if (plagiarismChecker.success) {
        res.json({success: true, result: plagiarismChecker.result});
      } else {
        res.json({success: false, message: plagiarismChecker.message});
      }
    } else {
      res.json({success: false, message: canMakeRequest.message});
    }
    
  } catch (err) {
    console.error(err);
    res.json({success: false, message: 'Erro interno do servidor'});
  }
});

router.post('/template/download', isAuth, checkFeatureAccess('template'), upload.single('logo'), (req, res) => {
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


//Preprdor de defesas
router.post('/api/prepare-defense', checkFeatureAccess('prepareDefense'), isAuth, upload.single('file'), async (req, res) => {
  const file = req.file;
  
  if (!file) {
    return res.json({ success: false, message: 'Ocorreu um erro ao ler o arquivo.' });
  }
  
  try {
    // Lê o arquivo
    const readResult = await fileReader.readFile(file);
    
    if (!readResult.success) {
      return res.json({ success: false, message: readResult.message });
    }
    
    // Processa o conteúdo com IA e gera perguntas
    const aiResult = await aiProcessor.generateQuestions(readResult.content);
    
    if (aiResult.success) {
		// Armazena os resultados na sessão
        if (!req.session.aiResult) {
            req.session.aiResult = {};
        }
        
		// Armazena as perguntas e o conteúdo da tese na sessão
		req.session.aiResult.question = aiResult.questions
		req.session.thesisContent = readResult.content

      return res.json({ 
        success: true, 
        questions: aiResult.questions,
      });
    } else {
      return res.json({ success: false, message: aiResult.message });
    }
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: 'Erro interno do servidor.' });
  }
});

//Resposta em audio 
router.post('/api/submit-audio-response', checkFeatureAccess('submitAudioResponse'), isAuth, upload.single('audio'), async (req, res) => {
    if (!req.file) {
        return res.json({ success: false, message: 'Nenhum arquivo de áudio recebido.' });
    }

    const audioBuffer = req.file.buffer;

    try {
        // Transcreve o áudio
        const transcriptionResult = await aiProcessor.transcribeAudio(audioBuffer, req.file.mimetype);
        
        if (!transcriptionResult.success) {
            return res.json({ success: false, message: transcriptionResult.message });
        }

        // Recupera as perguntas da sessão
        const questions = req.session.aiResult.questions || [];

        // Analisa a resposta
        const analysisResult = await aiProcessor.analyzeResponse(questions, transcriptionResult.transcription, req.session.thesisContent);
        
		if (!analysisResult.success) {
            return res.json({ success: false, message: analysisResult.message });
        }

        
        req.session.aiResult.audioResponse = {
            size: audioBuffer.length,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
            timestamp: new Date().toISOString(),
            transcription: transcriptionResult.transcription,
            feedback: analysisResult.feedback,
			audioFeedbackPath: analysisResult.audioFeedbackPath
        };
		
		 // Ler o arquivo de áudio
		 const audioFeedback = await fs.promises.readFile(analysisResult.audioFeedbackPath);

		res.json({ 
			success: true, 
			message: 'Áudio recebido, transcrito e analisado com sucesso.',
			transcription: transcriptionResult.transcription,
			feedback: analysisResult.feedback,
			audioFeedback: audioFeedback.toString('base64') // Convertemos para base64 para enviar via JSON
		});
		
		// Remover o arquivo temporário após enviar a resposta
		fs.unlink(analysisResult.audioFeedbackPath, (err) => {
			if (err) console.error('Erro ao remover arquivo temporário:', err);
		});
		
    } catch (error) {
        console.error('Erro ao processar áudio:', error);
        res.json({ success: false, message: 'Erro ao processar o áudio.' });
    }
});

//resumo academico
router.post('/api/generate-resume', isAuth, checkFeatureAccess('resume'), async (req, res) => {
  try {
    const { texto } = req.body;

    if (!texto || texto.trim() === '') {
      return res.status(400).json({ error: true, message: 'O texto não pode estar vazio.' });
    }

    const result = await additionalFeatures.resumo(texto);

    if (result.success) {
      res.json({
        resumo: result.resumoPortugues,
        abstract: result.abstractEnglish,
        palavrasChave: result.palavrasChave.split(',').map(word => word.trim()),
        keywords: result.keywords.split(',').map(word => word.trim())
      });
    } else {
      res.status(500).json({ error: true, message: result.message });
    }
  } catch (error) {
    console.error('Erro ao gerar resumo:', error);
    res.status(500).json({ error: true, message: 'Erro interno do servidor ao gerar o resumo.' });
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
            
			const currentTokens = await getUserTokens(req.session.user.id);
            await updateUserTokens(req.session.user.id, currentTokens + tokenAmount);
            
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
			tokenAmount = selectedPlan.tokensPerMonth
        } else {
            throw new Error("Plan not found");
        }

        // Armazenar informações na sessão
        req.session.tier = type;
        req.session.amount = amount;
		req.session.tokenAmount = tokenAmount
		
        // Renderizar a página de checkout
        res.render('pages/payment/checkout', {
            tier: type,
            amount: amount,
			tokenAmount: tokenAmount,
        });
    } catch (err) {
        console.error("Error in checkout route:", err);
        res.status(500).json({ error: "An error occurred during checkout" });
    }
});

// Para a recarga de tokens separada (sem mudar de plano)
router.post('/recharge-tokens', isAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { amount, tokenAmount } = req.body;
    
    if (!amount || !tokenAmount) {
        return res.status(400).json({ error: "Amount and token amount are required" });
    }
    
    try {
        // Processo de pagamento (você pode reutilizar a lógica do paymentMpesa)
        const paymentResult = await paymentMpesa(req.body.phoneNumber, amount);
        
        if (paymentResult.success) {
            const currentTokens = await getUserTokens(userId);
            await updateUserTokens(userId, currentTokens + parseInt(tokenAmount));
            
            // Registrar a transação
            await Transaction.transactionProcessing({
                user_id: userId,
                type: 'token_recharge',
                amount: amount,
                transaction_date: new Date(),
                token_amount: tokenAmount,
                payment_method: req.body.payType,
                status: 'Completed',
                transaction_id: paymentResult.data.output_TransactionID,
                conversation_id: paymentResult.data.output_ConversationID
            });
            
            res.json({ success: true, message: 'Tokens recarregados com sucesso' });
        } else {
            res.json({ success: false, message: paymentResult.error.output_ResponseDesc });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao recarregar tokens' });
    }
});

// Rota para o gerador de hipóteses
router.post('/api/hypothesis', isAuth, checkFeatureAccess('hypothesis'), upload.none(), async (req, res) => {
    const { researchTopic, generalObjective, specificObjectives, researchProblem, methodology } = req.body;
    
    if (!researchTopic || !generalObjective || !specificObjectives || !researchProblem) {
        return res.json({ success: false, message: 'Preencha os campos obrigatórios' });
    }
    
    try {
        const result = await additionalFeatures.hypothesisCreator(
            researchTopic, 
            generalObjective, 
            specificObjectives, 
            researchProblem, 
            methodology, 
            req.session.user.tier
        );
        
        if (result) {
            res.json({
                success: true, 
                message: 'Hipóteses criadas com sucesso',
                result: result
            });
        } else {
            res.json({ success: false, message: 'Erro de criação. Tente novamente!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erro de servidor. Tente mais tarde!' });
    }
});

// Rota para o gerador de temas
router.post('/api/themes', isAuth, checkFeatureAccess('themes'), upload.none(), async (req, res) => {
    const { studyArea, specificInterest, academicLevel, themeCount, keywords, areaFocal } = req.body;
    
    if (!studyArea || !academicLevel || !themeCount) {
        return res.json({ success: false, message: 'Preencha os campos obrigatórios' });
    }
    
    try {
        const result = await additionalFeatures.themesCreator(
            studyArea,
            specificInterest,
            academicLevel,
            themeCount,
            req.session.user.tier,
            keywords,
            areaFocal
        );
        
        if (result) {
            res.json({
                success: true, 
                message: 'Temas gerados com sucesso',
                result: result
            });
        } else {
            res.json({ success: false, message: 'Erro de criação. Tente novamente!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erro de servidor. Tente mais tarde!' });
    }
});

// Rota para o gerador de referências
router.post('/api/references', isAuth, checkFeatureAccess('references'), upload.none(), async (req, res) => {
    const { researchTopic, initialIdea, language } = req.body;
    
    if (!researchTopic || !initialIdea) {
        return res.json({ success: false, message: 'Preencha os campos obrigatórios' });
    }
    
    try {
        const result = await additionalFeatures.referencesCreator(
            researchTopic,
            initialIdea,
            req.session.user.tier,
            language
        );
        
        if (result) {
            res.json({
                success: true, 
                message: 'Referências geradas com sucesso',
                result: result
            });
        } else {
            res.json({ success: false, message: 'Erro de criação. Tente novamente!' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Erro de servidor. Tente mais tarde!' });
    }
});

// Rota para adicionar, deletar e tudo relacionar a um tema aos favoritos
router.post('/api/keywordsGen', isAuth, checkFeatureAccess('themes'), async (req, res) => {
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

//Rota para adicionar temas aos favoritos
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

//Rota para adicionar referencias bibliograficas aos favoritos
router.post('/api/references/favorite', isAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { researchTopic, references } = req.body;
    try {
        if (!researchTopic || !references || !Array.isArray(references) || references.length === 0) {
            return res.status(400).json({ success: false, message: 'Research topic and references are required' });
        }
        const result = await referenceHandler.addFavoriteReferences(userId, researchTopic, references);
        res.json({ 
            success: result, 
            message: result ? 'References favorited successfully' : 'Failed to favorite references'
        });
    } catch (error) {
        console.error('Error in favoriteReferences route:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

//Rota para remover uma referencia dos favoritos
router.post('/api/references/unfavorite', isAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { researchTopic } = req.body;
    try {
        if (!researchTopic) {
            return res.status(400).json({ success: false, message: 'Research topic is required' });
        }
        const result = await referenceHandler.removeFavoriteReferences(userId, researchTopic);
        res.json({ 
            success: result, 
            message: result ? 'References unfavorited successfully' : 'Failed to unfavorite references'
        });
    } catch (error) {
        console.error('Error in unfavoriteReferences route:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

//Rota para verificar o estado dos favoritos das referenncias
router.get('/api/references/checkFavorite', isAuth, async (req, res) => {
    const userId = req.session.user.id;
    const { researchTopic } = req.query;
    try {
        const isFavorited = await referenceHandler.checkFavoriteReferences(userId, researchTopic);
        res.json({ isFavorited });
    } catch (error) {
        console.error('Error in checkFavorite route:', error);
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


router.post('/support/:id', async (req, res) => {
    const { id } = req.params;
    const userId = req.session.user.id; // Assumindo que você tem middleware de autenticação



    try {
		if (id === 'tickets') {
			const { subject, description } = req.body;

			if (!subject || !description) {
				return res.json({ success: false, message: 'Subject and description are required.' });
			}
			
			const success = await Support.addTicket(userId, subject, description);
			if (success) {
				res.json({ success: true, message: 'Ticket created successfully.' });
			} else {
				res.json({ success: false, message: 'Failed to create ticket.' });
			}
		}
    } catch (error) {
        console.error('Error in support route:', error);
        res.json({ success: false, message: 'An error occurred while processing your request.' });
    }
});

module.exports = router