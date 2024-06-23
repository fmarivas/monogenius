const {conn} = require('../../models/db')
const axios = require('axios');

class plagiarism {
	static async verifyPlagiarism(textInput){
		const words = textInput.trim().split(/\s+/).filter(Boolean).length;
		
		if(words > 500){
			return {
				success: false,
				message: 'O texto excede o limite de 500 palavras'
			};
		}
		
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
}

module.exports = plagiarism