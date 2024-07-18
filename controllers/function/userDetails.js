const { conn } = require('../../models/db');

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

  // Outros métodos podem ser adicionados aqui conforme necessário
}

module.exports = UserDetails;