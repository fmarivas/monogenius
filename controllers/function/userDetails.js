const { conn } = require('../../models/db');
const Authorization  = require('./authorization')

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
}

module.exports = UserDetails;