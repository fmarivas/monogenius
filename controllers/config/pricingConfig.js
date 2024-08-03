const { conn } = require('../../models/db');

const pricingPlans = {
  basic: {
    name: "Basic",
    basePrice: 3500,
	tokensPerMonth: 1000,
    features: [
		"Gerador de Temas Inovadores",
		"Verificação de plágio",
		"Gerador de Referências Bibliográficas",
		"Gerador de Templates",
		"Suporte prioritário por e-mail"
    ]
  },
  premium: {
    name: "Premium",
    basePrice: 10000,
	tokensPerMonth: 3000,
    features: [
      "Tudo do pacote Basic",
      "Criador de Monografia",
      "Gerador de Hipóteses",
      "Suporte por chat"
    ]
  },
  supreme: {
    name: "Supreme",
    basePrice: null, // Preço customizado
	tokensPerMonth: 10000,
    features: [
      "Tudo do pacote Premium",
      "Avaliador de Temas (brevemente)",
	  "Preparador de defesas (brevemente)",
      "Consultoria Acadêmica Personalizada",
      "Suporte prioritário 24/7",
      "Acesso antecipado a novas funcionalidades"
    ]
  }
};

const tokenConsumption = {
  themes: {
    name: 'Gerador de Temas',
    tokensPerUse: 10
  },
  create: {
    name: 'Criar Monografia',
    tokensPerUse: 50
  },
  plagiarism: {
    name: 'Verificador de Plágio',
    tokensPerWord: 0.1
  },
  references: {
    name: 'Gerador de Referências',
    tokensPerUse: 2
  },
  template: {
    name: 'Templates',
    tokensPerUse: 5
  },
  hypothesis: {
    name: 'Gerador de Hipóteses',
    tokensPerUse: 10
  },
  resume: {
    name: 'Gerador de Resumo',
    tokensPerUse: 15
  },
  prepareDefense: {
    name: 'Preparar Defesa (Gerar Perguntas)',
    tokensPerUse: 25
  },
  submitAudioResponse: {
    name: 'Analisar Resposta de Áudio',
    tokensPerUse: 20
  }
};

async function getUserTransactions(userId) {
  return new Promise((resolve, reject) => {
    conn.query('SELECT * FROM transactions WHERE user_id = ?', [userId], (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

function calculateDiscount(transactions) {
  const newUserDiscountPercentage = 50; // 15% de desconto para novos usuários

  if (transactions.length === 0) {
    return newUserDiscountPercentage / 100;
  } else {
	return 0
  }
}

async function getPricingPlansWithDiscount(userId) {
  try {
    const transactions = await getUserTransactions(userId);
    const discount = calculateDiscount(transactions);

    const plansWithDiscount = Object.entries(pricingPlans).reduce((acc, [key, plan]) => {
      if (plan.basePrice !== null) {
        const discountedPrice = Math.round(plan.basePrice * (1 - discount));
        acc[key] = {
          ...plan,
          price: discountedPrice,
          originalPrice: plan.basePrice,
          discount: discount * 100
        };
      } else {
        acc[key] = { ...plan };
      }
      return acc;
    }, {});

    return plansWithDiscount;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return pricingPlans; // Retorna os preços originais em caso de erro
  }
}

function calculatePlagiarismTokens(wordCount) {
  return Math.ceil(wordCount * tokenConsumption.plagiarism.tokensPerWord);
}

async function getUserTokens(userId) {
  return new Promise((resolve, reject) => {
    conn.query('SELECT tokens FROM users WHERE id = ?', [userId], (error, results) => {
      if (error) {
        reject(error);
      } else if (results.length === 0) {
        resolve(0); // Usuário não encontrado
      } else {
        resolve(results[0].tokens);
      }
    });
  });
}

async function updateUserTokens(userId, newTokenAmount) {
  return new Promise((resolve, reject) => {
    conn.query('UPDATE users SET tokens = ? WHERE id = ?', [newTokenAmount, userId], (error, result) => {
      if (error) {
        reject(error);
      } else if (result.affectedRows === 0) {
        reject(new Error('Usuário não encontrado'));
      } else {
        resolve();
      }
    });
  });
}
async function checkAndConsumeTokens(userId, feature, amount = 1) {
  const userTokens = await getUserTokens(userId);
  
  let tokensToConsume;
  
  if (feature === 'plagiarism') {
    tokensToConsume = calculatePlagiarismTokens(amount);
  } else if (tokenConsumption[feature] && tokenConsumption[feature].tokensPerUse) {
    tokensToConsume = tokenConsumption[feature].tokensPerUse * amount;
  } else {
    console.error(`Feature "${feature}" not found in tokenConsumption`);
    return false; // ou lançar um erro, dependendo de como você quer lidar com features inválidas
  }
  
  if (userTokens >= tokensToConsume) {
    await updateUserTokens(userId, userTokens - tokensToConsume);
    return true;
  } else {
    return false;
  }
}

module.exports = { 
  getPricingPlansWithDiscount, 
  pricingPlans, 
  tokenConsumption, 
  checkAndConsumeTokens,
  updateUserTokens,
  getUserTokens,
};