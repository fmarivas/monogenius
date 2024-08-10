require('dotenv').config();
const OpenAI = require('openai');
const os = require('os');
const fs = require('fs');
const path = require('path');
const openai = new OpenAI(process.env.OPENAI_API_KEY);


class AIProcessor {
  static async generateQuestions(content) {
	const message = `
	  Você é um examinador experiente de teses acadêmicas. Sua tarefa é analisar o conteúdo da tese fornecida e gerar 5 perguntas desafiadoras. Diretrizes:

	  1. Foque em pontos específicos que necessitam de elaboração.
	  2. Identifique possíveis inconsistências na argumentação.
	  3. Desafie o autor a defender suas afirmações ou metodologia.
	  4. Incentive reflexão sobre aspectos cruciais do trabalho.
	  5. Aborde áreas onde as conclusões podem não estar bem fundamentadas.

	  Ao formular as perguntas:
	  - Seja conciso, direto e específico.
	  - Referencie partes exatas do conteúdo.
	  - Limite cada pergunta a no máximo 25 palavras.
	  - Use linguagem clara e acadêmica.
	  - Evite comentários ou avaliações adicionais.

	  Modelo de pergunta:
	  "No capítulo X, você afirma Y. Como isso se relaciona com Z? Pode elaborar essa conexão?"

	  Baseado no conteúdo fornecido, gere 5 perguntas desafiadoras seguindo estas diretrizes.

	  ${content}
	`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Você é um examinador experiente de teses acadêmicas" },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const generatedQuestions = response.choices[0].message.content.split('\n').filter(q => q.trim() !== '');
      return {
        success: true,
        questions: generatedQuestions
      };
    } catch (error) {
      console.error('Erro ao gerar perguntas:', error);
      return {
        success: false,
        message: 'Falha ao gerar perguntas. Por favor, tente novamente.'
      };
    }
  }
  
  static async transcribeAudio(audioBuffer, mimetype) {
    try {
      // Cria um arquivo temporário para o áudio
		const tempDir = os.tmpdir();
		const tempFilePath = path.join(tempDir, `temp_audio_${Date.now()}.${mimetype.split('/')[1]}`);

		// Escreve o buffer para um arquivo temporário
		fs.writeFileSync(tempFilePath, audioBuffer);

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: "whisper-1",
      });

      // Remove o arquivo temporário
      fs.unlinkSync(tempFilePath);
	  
      return {
        success: true,
        transcription: transcription.text
      };
    } catch (error) {
      console.error('Erro ao transcrever áudio:', error);
      return {
        success: false,
        message: 'Falha ao transcrever o áudio. Por favor, tente novamente.'
      };
    }
  }

	static async generateFeedback(questions, transcription, thesisContent) {
	  const message = `
		Você é um examinador experiente de teses acadêmicas. Sua tarefa é analisar a resposta do candidato às perguntas previamente geradas, considerando o contexto completo da tese.

		Contexto da tese:
		${thesisContent}

		Perguntas geradas baseadas na tese:
		${questions.join('\n')}

		Transcrição da resposta do candidato:
		${transcription}

		Por favor, analise a resposta do candidato considerando o contexto completo da tese e forneça feedback sobre os seguintes pontos:

		1. Relevância e adequação da resposta às perguntas feitas, considerando o conteúdo da tese.
		2. Clareza e coerência na argumentação, em relação aos pontos abordados na tese.
		3. Demonstração de conhecimento aprofundado sobre o tema e sua relação com o trabalho apresentado.
		4. Pontos fortes da resposta, destacando insights originais ou conexões relevantes com a tese.
		5. Áreas que poderiam ser melhoradas ou expandidas, indicando seções específicas da tese que poderiam ser mais bem exploradas.
		6. Consistência entre a resposta do candidato e as afirmações feitas na tese.

		Ao fornecer o feedback:
		- Seja específico, citando partes relevantes da tese e da resposta do candidato.
		- Mantenha um tom construtivo, profissional e acadêmico.
		- Forneça exemplos concretos de como o candidato poderia melhorar ou expandir suas respostas.
		- Avalie a capacidade do candidato de defender e elaborar os pontos principais da tese.
		- Considere a profundidade da análise do candidato em relação à complexidade do tema abordado na tese.

		Estruture seu feedback em parágrafos claros, abordando cada ponto de análise separadamente.
	  `;

	  try {
		const response = await openai.chat.completions.create({
		  model: "gpt-4o-mini",
		  messages: [
			{ role: "system", content: "Você é um examinador experiente de teses acadêmicas" },
			{ role: "user", content: message }
		  ],
		  temperature: 0.7,
		  max_tokens: 1000
		});

		return {
		  success: true,
		  feedback: response.choices[0].message.content
		};
	  } catch (error) {
		console.error('Erro ao gerar feedback:', error);
		return {
		  success: false,
		  message: 'Falha ao gerar o feedback. Por favor, tente novamente.'
		};
	  }
	}

	static async generateAudioFeedback(feedbackText) {
	  try {
		const mp3 = await openai.audio.speech.create({
		  model: "tts-1",
		  voice: "echo",
		  input: feedbackText,
		});

		const audioBuffer = Buffer.from(await mp3.arrayBuffer());
		const tempDir = os.tmpdir();
		const tempFilePath = path.join(tempDir, `feedback_audio_${Date.now()}.mp3`);

		await fs.promises.writeFile(tempFilePath, audioBuffer);

		return {
		  success: true,
		  audioFeedbackPath: tempFilePath
		};
	  } catch (error) {
		console.error('Erro ao gerar áudio do feedback:', error);
		return {
		  success: false,
		  message: 'Falha ao gerar o áudio do feedback. Por favor, tente novamente.'
		};
	  }
	}
	
	static async analyzeResponse(questions, transcription, thesisContent) {
	  const feedbackResult = await this.generateFeedback(questions, transcription, thesisContent);
	  
	  if (!feedbackResult.success) {
		return feedbackResult;
	  }

	  const audioResult = await this.generateAudioFeedback(feedbackResult.feedback);

	  if (!audioResult.success) {
		return audioResult;
	  }

	  return {
		success: true,
		feedback: feedbackResult.feedback,
		audioFeedbackPath: audioResult.audioFeedbackPath
	  };
	}

  
  
  
  
}

module.exports = AIProcessor;