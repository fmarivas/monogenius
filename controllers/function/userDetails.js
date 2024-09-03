const { conn } = require('../../models/db');
const Authorization  = require('./authorization')
const { generateTimeline, calculateProgress } = require('./timelineGenerator');

class UserDetails {
  static async onboarding(userId, data) {
    return new Promise((resolve, reject) => {
      const { academicPhase, mainChallenges, expectedGraduation, researchArea, toolsUsed } = data;
      
      const query = `
        INSERT INTO user_details 
        (user_id, academic_phase, main_challenges, expected_graduation, research_area, tools_used) 
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        academic_phase = VALUES(academic_phase), 
        main_challenges = VALUES(main_challenges), 
        expected_graduation = VALUES(expected_graduation), 
        research_area = VALUES(research_area), 
        tools_used = VALUES(tools_used)
      `;

      const values = [
        userId,
        academicPhase,
        JSON.stringify(mainChallenges), // Assumindo que mainChallenges é um array
        expectedGraduation,
        researchArea,
        toolsUsed
      ];

      conn.query(query, values, (err, result) => {
        if (err) {
          console.error('Erro ao salvar detalhes do usuário:', err);
          reject({ success: false, error: err });
        } else {
          resolve({ success: true, result: result });
        }
      });
    });
  }

	static async userSource(userId, data) {
		return new Promise((resolve, reject) => {
			const { sourceOfKnowledge, otherSource, whatsappNumber } = data;
			
			const query = `
				INSERT INTO user_source 
				(user_id, source_of_knowledge, other_source, whatsapp_number) 
				VALUES (?, ?, ?, ?)
				ON DUPLICATE KEY UPDATE 
				source_of_knowledge = VALUES(source_of_knowledge), 
				other_source = VALUES(other_source), 
				whatsapp_number = VALUES(whatsapp_number)
			`;
			
			const values = [userId, sourceOfKnowledge, otherSource, whatsappNumber];
			
			conn.query(query, values, async (err, result) => {
				if (err) {
					console.error('Erro ao salvar fonte do usuário:', err);
					reject({ success: false, error: err });
				} else {
					try {
						const userDetails = await Authorization.checkUserDetails(userId);
						let redirectUrl = '/c/dashboard'; // URL padrão
						if (userDetails.exists) {
							switch (userDetails.academicPhase) {
								case 'Escolha do Tema':
									redirectUrl = '/c/themes';
									break;
								case 'Projeto':
								case 'Coleta de Dados':
								case 'Escrita':
									redirectUrl = '/c/create';
									break;
								case 'Revisão':
									redirectUrl = '/c/plagiarism';
									break;
							}
						}
						resolve({ success: true, result: result, redirectUrl: redirectUrl });
					} catch (checkError) {
						console.error('Erro ao verificar detalhes do usuário:', checkError);
						reject({ success: false, error: checkError });
					}
				}
			});
		});
	}
	
	static async updateDetails(userId, data) {
	  return new Promise((resolve, reject) => {
		const { expectedGraduation, academicPhase } = data;
		
		const query = `
		  UPDATE user_details 
		  SET expected_graduation = ?, academic_phase = ?, last_confirmation_date = NOW()
		  WHERE user_id = ?
		`;

		const values = [expectedGraduation, academicPhase, userId];

		conn.query(query, values, (err, result) => {
		  if (err) {
			console.error('Erro ao atualizar detalhes do usuário:', err);
			reject({ success: false, error: err });
		  } else {
			resolve({ success: true, result: result });
		  }
		});
	  });
	}
	
	static async checkUserDetailsConfirmation(userId) {
	  return new Promise((resolve, reject) => {
		const query = `
		  SELECT last_confirmation_date 
		  FROM user_details 
		  WHERE user_id = ?
		`;
		
		conn.query(query, [userId], (err, results) => {
		  if (err) {
			console.error('Erro ao verificar confirmação do usuário:', err);
			reject({ success: false, error: 'Erro interno do servidor' });
		  } else if (results.length === 0 || !results[0].last_confirmation_date) {
			resolve({ success: true, needsConfirmation: true });
		  } else {
			const lastConfirmation = new Date(results[0].last_confirmation_date);
			const oneMonthAgo = new Date();
			oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
			
			resolve({ success: true, needsConfirmation: lastConfirmation < oneMonthAgo });
		  }
		});
	  });
	}
	
	static async getUserDetails(userId) {
	  return new Promise((resolve, reject) => {
		const query = `
		  SELECT ud.*, us.source_of_knowledge, us.other_source, us.whatsapp_number
		  FROM user_details ud
		  LEFT JOIN user_source us ON ud.user_id = us.user_id
		  WHERE ud.user_id = ?
		`;

		conn.query(query, [userId], (err, results) => {
		  if (err) {
			console.error('Erro ao obter detalhes do usuário:', err);
			reject({ success: false, error: 'Erro interno do servidor' });
		  } else if (results.length === 0) {
			resolve({ success: false, error: 'Usuário não encontrado' });
		  } else {
			const userDetails = results[0];
			// Parse main_challenges de volta para um array, se necessário
			if (userDetails.main_challenges) {
			  userDetails.main_challenges = JSON.parse(userDetails.main_challenges);
			}
			resolve({ success: true, userDetails: userDetails });
		  }
		});
	  });
	}
	
	static async getUserProgress(userId) {
	  return new Promise((resolve, reject) => {
		const query = `
		  SELECT academic_phase, expected_graduation
		  FROM user_details
		  WHERE user_id = ?
		`;

		conn.query(query, [userId], (err, results) => {
		  if (err) {
			console.error('Erro ao obter progresso do usuário:', err);
			reject({ success: false, error: 'Erro interno do servidor' });
		  } else if (results.length === 0) {
			resolve({ success: false, error: 'Usuário não encontrado' });
		  } else {
			const userDetails = results[0];
			const timeline = generateTimeline(userDetails.expected_graduation, userDetails.academic_phase);
			const progress = calculateProgress(userDetails.academic_phase);
			
			const suggestedFeatures = this.getSuggestedFeatures(userDetails.academic_phase);
			
			resolve({
			  success: true,
			  progress: progress,
			  timeline: timeline,
			  currentPhase: userDetails.academic_phase,
			  expectedCompletionDate: userDetails.expected_graduation,
			  suggestedFeatures: suggestedFeatures
			});
		  }
		});
	  });
	}
	
	static async generateReminders(userId) {
	  return new Promise(async (resolve, reject) => {
		try {
		  const userProgress = await this.getUserProgress(userId);
		  if (!userProgress.success) {
			throw new Error(userProgress.error);
		  }

		  const { currentPhase, expectedCompletionDate } = userProgress;
		  const today = new Date();
		  const completionDate = new Date(expectedCompletionDate);
		  const daysUntilCompletion = Math.ceil((completionDate - today) / (1000 * 60 * 60 * 24));

		  let reminders = [];

		  // Gerar lembretes baseados na fase atual e na data de entrega
		  switch (currentPhase) {
			case 'Escolha do Tema':
			  if (daysUntilCompletion <= 60) {
				reminders.push({
				  message: 'Lembre-se de finalizar a escolha do tema em breve!',
				  due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 semana a partir de hoje
				});
			  }
			  break;
			case 'Projeto':
			  if (daysUntilCompletion <= 45) {
				reminders.push({
				  message: 'Você está na metade do tempo para concluir seu projeto. Revise seu cronograma!',
				  due_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 dias a partir de hoje
				});
			  }
			  break;
			case 'Coleta de Dados':
			  if (daysUntilCompletion <= 30) {
				reminders.push({
				  message: 'Certifique-se de finalizar a coleta de dados em breve para ter tempo de analisá-los.',
				  due_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000) // 5 dias a partir de hoje
				});
			  }
			  break;
			case 'Escrita':
			  if (daysUntilCompletion <= 15) {
				reminders.push({
				  message: 'Faltam apenas duas semanas para a entrega. Acelere a escrita!',
				  due_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000) // 2 dias a partir de hoje
				});
			  }
			  break;
			case 'Revisão':
			  if (daysUntilCompletion <= 7) {
				reminders.push({
				  message: 'Última semana para revisão. Não se esqueça de verificar a formatação!',
				  due_date: new Date(today.getTime() + 24 * 60 * 60 * 1000) // 1 dia a partir de hoje
				});
			  }
			  break;
		  }

		  // Inserir os lembretes no banco de dados
		  const insertQuery = `
			INSERT INTO reminders (user_id, message, due_date)
			VALUES (?, ?, ?)
		  `;

		  for (let reminder of reminders) {
			await new Promise((resolve, reject) => {
			  conn.query(insertQuery, [userId, reminder.message, reminder.due_date], (err, result) => {
				if (err) reject(err);
				else resolve(result);
			  });
			});
		  }

		  resolve({ success: true, reminders: reminders });
		} catch (error) {
		  console.error('Erro ao gerar lembretes:', error);
		  reject({ success: false, error: error.message });
		}
	  });
	}
	
	static getReminders(userId) {
	  return new Promise((resolve, reject) => {
		// Buscar os lembretes do usuário
		const query = `
		  SELECT * FROM reminders
		  WHERE user_id = ? AND is_sent = FALSE
		  ORDER BY due_date ASC
		`;
		
		conn.query(query, [userId], (err, results) => {
		  if (err) {
			console.error('Erro ao buscar lembretes:', err);
			reject({ success: false, error: 'Erro interno do servidor' });
		  } else {
			resolve({ success: true, reminders: results });
		  }
		});
	  });
	}
	
	static getSuggestedFeatures(academicPhase) {
	  const featureSuggestions = {
		'Escolha do Tema': [
		  { name: 'Gerador de Temas', link: '/c/themes', description: 'Obtenha sugestões de temas inovadores para sua pesquisa.' },
		],
		'Projeto': [
		  { name: 'Criar Projecto', link: '/c/create', description: 'Use essa funcionalidade para te ajudar no seu projeto.' },
		  { name: 'Templates', link: '/c/template', description: 'Utilize templates profissionais para seu projeto.' }
		],
		'Coleta de Dados': [
		  { name: 'Gerador de Referências', link: '/c/references', description: 'Crie referências bibliográficas automaticamente.' },
		],
		'Escrita': [
		  { name: 'Criar Monografia', link: '/c/create', description: 'Comece a estruturar a sua monografia.' },
		  { name: 'Verificador de Plágio', link: '/c/plagiarism', description: 'Verifique seu texto quanto a plágio.' },
		  { name: 'Gerador de Resumo', link: '/c/resume', description: 'Crie resumos acadêmicos automaticamente para seu trabalho.' }
		],
		'Revisão': [
		  { name: 'Preparar Defesa', link: '/c/defense', description: 'Prepare-se para sua defesa de monografia com perguntas geradas por IA.' },
		  { name: 'Verificador de Plágio', link: '/c/plagiarism', description: 'Faça uma última verificação de plágio antes da entrega.' },
		  { name: 'Parafrasear', link: '/c/paraphrase', description: 'Parafrase o seu texto de forma assistida.' }
		]
	  };

	  return featureSuggestions[academicPhase] || [];
	}
}

module.exports = UserDetails;