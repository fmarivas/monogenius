require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI(process.env.OPENAI_API_KEY);

class Monography {
	  static async createMono(tema, ideiaInicial, manuais) {
		const tools = [
		  {
			type: "function",
			function: {
			  name: "generate_monography_structure",
			  description: "Gera a estrutura de uma monografia com base nos parâmetros fornecidos",
			  parameters: {
				type: "object",
				properties: {
				  contextualizacao: {
					type: "string",
					description: "Contextualização do tema (minimo 5000 carateres)"
				  },
				  problematizacao: {
					type: "string",
					description: "Problematização do tema (minimo 5000 carateres)"
				  },
				  justificativa: {
					type: "string",
					description: "Justificativa do trabalho (minimo 5000 carateres)"
				  },
				  objetivo_geral: {
					type: "string",
					description: "Objetivo geral do trabalho (breve e direto)"
				  },
				  objetivos_especificos: {
					type: "array",
					items: { type: "string" },
					description: "Lista de objetivos específicos (máximo de 4, breves e diretos)"
				  },
				  delimitacao_pesquisa: {
					type: "string",
					description: "Delimitação da pesquisa (minimo 5000 carateres)"
				  },
				  estrutura_trabalho: {
					type: "string",
					description: "Breve descrição da estrutura do trabalho"
				  },
				  referencias_bibliograficas: {
					type: "array",
					items: { type: "string" },
					description: "Lista de 10 referências bibliográficas que sustentariam o tema"
				  }
				},
				required: ["contextualizacao", "problematizacao", "justificativa", "objetivo_geral", "objetivos_especificos", "delimitacao_pesquisa", "estrutura_trabalho", "referencias_bibliograficas"]
			  }
			}
		  }
		];

		const message = `
		  Escreva a primeira parte de um trabalho de conclusão de curso, inclua ${manuais} enquanto escreves para dar sustento ao texto. O tema do trabalho é "${tema}" e a ideia inicial é "${ideiaInicial}". Use a função fornecida para gerar a estrutura da monografia.
		`;

		try {
		  const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [
			  { role: "system", content: "Você é um assistente virtual especializado em orientar estudantes e pesquisadores na estruturação e redação de trabalhos acadêmicos. Ajude a organizar e desenvolver cada seção de forma clara e objetiva, seguindo a norma APA e diretrizes específicas." },
			  { role: "user", content: message }
			],
			tools: tools,
			tool_choice: "auto"
		  });

		  const responseMessage = completion.choices[0].message;

		  if (responseMessage.tool_calls) {
			const functionCall = responseMessage.tool_calls[0];
			const functionArguments = JSON.parse(functionCall.function.arguments);
			
			const formattedResponse = this.formatMonography(functionArguments);
			return functionArguments;
		  } else {
			return responseMessage.content;
		  }
		} catch (error) {
		  console.error('Error:', error);
		  throw new Error('Failed to generate monography structure');
		}
	  }
  
	 static formatMonography(monography) {
		let formatted = `Tema: ${monography.tema}\n\n`;
		formatted += `Contextualização:\n${monography.contextualizacao}\n\n`;
		formatted += `Problematização:\n${monography.problematizacao}\n\n`;
		formatted += `Justificativa:\n${monography.justificativa}\n\n`;
		formatted += `Objetivo Geral:\n${monography.objetivo_geral}\n\n`;
		formatted += `Objetivos Específicos:\n${monography.objetivos_especificos.map(obj => `- ${obj}`).join('\n')}\n\n`;
		formatted += `Delimitação da Pesquisa:\n${monography.delimitacao_pesquisa}\n\n`;
		formatted += `Estrutura do Trabalho:\n${monography.estrutura_trabalho}\n\n`;
		formatted += `Referências Bibliográficas:\n${monography.referencias_bibliograficas.map(ref => `- ${ref}`).join('\n')}`;

		return formatted;
	  }  
}

module.exports = Monography;