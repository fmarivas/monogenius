const {conn} = require('../../models/db')
const axios = require('axios');

require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

class plagiarism {
	static async verifyPlagiarism(textInput){
		const words = countWords(textInput);
		
		// if (words > 500) {
		  // return {
			// success: false,
			// message: 'O texto excede o limite de 500 palavras'
		  // };
		// }
		
		const options = {
			method: 'POST',
			url: 'https://plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com/plagiarism',
			headers: {
				'x-rapidapi-key': '2f9f2761c9msha9196480d6a906dp115039jsn6816fc534cc4',
				'x-rapidapi-host': 'plagiarism-checker-and-auto-citation-generator-multi-lingual.p.rapidapi.com',
				'Content-Type': 'application/json'
			},
			data: {
				text: textInput, // Envie o texto completo, não apenas o número de palavras
				language: 'auto',
				includeCitations: true,
				googleScholarSearch: true,
				scrapeSources: false
			}
		};
		try {
			const response = await axios.request(options);
			return {
				success: true,
				result: {
					percentPlagiarism: response.data.percentPlagiarism,
					sources: response.data.sources,
					citations: response.data.citations
				}
			};
		} catch (error) {
			console.error(error);
			return {
				success: false,
				message: 'Erro ao verificar plágio'
			};
		}
	}
	
	static async paraphrase(text) {
	  const message = `
		Reescreva o seguinte trecho acadêmico de forma clara e concisa, mantendo o significado original mas usando suas próprias palavras. 
		Altere a estrutura das frases e substitua termos por sinônimos apropriados quando possível. 
		O texto parafraseado deve ter aproximadamente o mesmo comprimento que o original. 
		Forneça apenas o texto parafraseado, sem comentários adicionais ou marcações:
		${text}
	  `;
	  
	  try {
		const completion = await openai.chat.completions.create({
		  model: "gpt-4o",
		  messages: [
			{ role: "system", content: "Você é um assistente especializado em parafrasear textos acadêmicos, mantendo o significado original enquanto reformula o conteúdo." },
			{ role: "user", content: message }
		  ],
		  max_tokens: 150
		});
		const response = completion.choices[0].message.content;
		
		return {
		  success: true,
		  paraphrased: response
		};
	  } catch (error) {
		console.error(error);
		return {
		  success: false,
		  message: 'Erro ao parafrasear texto!'
		};
	  }
	}
}

module.exports = plagiarism