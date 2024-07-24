require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

class Monography {
		static getApaInstructions() {
			return `
				Ao gerar as referências, siga estritamente o estilo APA (American Psychological Association):
				1. Livro (1 autor): Apelido, N. (Ano). Título. (Edição). Local: Editor.
				2. Livro (2-7 autores): Apelido, N., & Apelido, N. (Ano). Título. (Edição). Local: Editor.
				3. Livro (mais de 7 autores): Apelido, N., Apelido, N., Apelido, N., Apelido, N., Apelido, N., Apelido, N., ... Apelido, N. (Ano). Título. (Edição). Local: Editor.
				4. Artigo: Apelido, N. (Ano). Título do artigo. Título da Publicação, Volume(número), páginas.
				5. Tese publicada: Apelido, N. (Ano). Título da Tese. Tese de ..., Editor, Local, País.
				6. Tese não publicada: Apelido, N. (Ano). Título da Tese. (Tese de ... não publicada). Instituição, Local, País.
				7. Conferência: Apelido, N. (Ano). Título da comunicação. In Título da Conferência, Local, Data. Local: Editor.
				8. Artigo eletrônico: Apelido, N. (Ano). Título do artigo. Título da Publicação, Volume(número). URL
				9. E-book: Apelido, N. (Ano). Título [E-book]. Editor. URL
				Certifique-se de que cada referência siga exatamente este formato, adequando-se ao tipo de fonte.
			`;
		}

		static getLanguageInstruction(language) {
			if (!language) return "";

			const instructions = {
			  mixed: "Forneça as referências em uma mistura de português e inglês, priorizando as fontes mais relevantes em ambos os idiomas.",
			  pt: "Forneça as referências preferencialmente em português, mas inclua fontes importantes em inglês se necessário.",
			  en: "Provide the references preferably in English, but include important sources in Portuguese if necessary."
			};

			if (Array.isArray(language) && language.includes('pt') && language.includes('en')) {
			  return instructions.mixed;
			} else if (language === 'pt' || language === 'en') {
			  return instructions[language];
			}

			return "";
			}

		static async generateReferences(tema, ideiaInicial, language) {
			const apaInstructions = this.getApaInstructions();
			const systemPrompt = `Você é um assistente especializado em pesquisa acadêmica e bibliografia, com profundo conhecimento das normas APA. ${apaInstructions}`;

			let languageInstruction = this.getLanguageInstruction(language);

			  const userPrompt = `
				Gere uma lista de 10 referências bibliográficas relevantes e atuais para um trabalho acadêmico 
				com o tema "${tema}" e a ideia inicial "${ideiaInicial}". As referências devem ser variadas, 
				incluindo livros, artigos científicos e outras fontes acadêmicas confiáveis. 
				
				${languageInstruction}
				Garanta que as referências sejam diversificadas em termos de tipo de fonte e data de publicação, 
				priorizando fontes dos últimos 5-10 anos quando possível.

				Importante:
				- Forneça exatamente 10 referências.
				- Não inclua numeração ou marcadores antes das referências.
				- Não inclua nenhum texto introdutório ou explicativo.
				- Cada referência deve estar em uma nova linha.
				- Retorne apenas as referências, nada mais.
			  `;

			try {
			  const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Timeout após 25 segundos')), 25000)
			  );

			  const completionPromise = openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
				  { role: "system", content: systemPrompt },
				  { role: "user", content: userPrompt }
				],
				max_tokens: 2000,
				temperature: 0.7
			  });

			  const completion = await Promise.race([completionPromise, timeoutPromise]);
			  
			  const references = completion.choices[0].message.content.split('\n').filter(ref => ref.trim() !== '');
			  return references.slice(0, 10); // Garante que retornamos exatamente 10 referências
			} catch (error) {
			  console.error('Erro ao gerar referências:', error);
			  throw new Error('Falha ao gerar referências bibliográficas');
			}
		}
		
		static async generateIntroduction(tema, ideiaInicial, manuais, referencias, tier) {
		  let aiModel = tier === "free" ? 'gpt-3.5-turbo' : 'gpt-4o-mini';

		  const citationInstructions = `
			Ao citar as referências no texto, use o estilo APA:
			- Para citações diretas: (Sobrenome, Ano, p. X)
			- Para citações indiretas: (Sobrenome, Ano)
			- Para múltiplos autores, use '&' para dois autores e 'et al.' para três ou mais
			Integre as citações de forma fluida no texto, evitando concentrá-las em um único parágrafo.
		  `;
		  
		  const tools = [
			{
			  type: "function",
			  function: {
				name: "generate_introduction",
				description: "Gera a estrutura da introdução de uma monografia com base nos parâmetros fornecidos",
				parameters: {
				  type: "object",
				  properties: {
					introducao: {
					  type: "object",
					  properties: {
						contextualizacao: { type: "string", description: "Contextualização do tema (texto extenso de no mínimo 1000 palavras)" },
						problematizacao: { type: "string", description: "Problematização do tema (texto extenso de no mínimo 1000 palavras)" },
						justificativa: { type: "string", description: "Justificativa do trabalho (texto extenso de no mínimo 1000 palavras)" },
						objetivo_geral: { type: "string", description: "Objetivo geral do trabalho (breve e direto)" },
						objetivos_especificos: { 
						  type: "array", 
						  items: { type: "string" }, 
						  description: "Lista de objetivos específicos (máximo de 4, breves e diretos)" 
						},
						delimitacao_pesquisa: { type: "string", description: "Delimitação da pesquisa (texto extenso de no mínimo 1000 palavras)" },
						estrutura_trabalho: { type: "string", description: "Breve descrição da estrutura do trabalho" },
					  },
					  required: ["contextualizacao", "problematizacao", "justificativa", "objetivo_geral", "objetivos_especificos", "delimitacao_pesquisa", "estrutura_trabalho"]
					}
				  },
				  required: ["introducao"]
				}
			  }
			}
		  ];

		 const message = `
			  Escreva a introdução detalhada de uma monografia acadêmica sobre o tema "${tema}" com a ideia inicial "${ideiaInicial}". 
			  É crucial que cada seção seja desenvolvida com profundidade, fornecendo explicações detalhadas e análises abrangentes.

			  Requisitos específicos de extensão:
			  - Contextualização, Problematização, Justificativa e Delimitação da Pesquisa: mínimo de 2000 palavras cada.

			  Incorpore as seguintes referências bibliográficas em seu texto, usando citações apropriadas:
			  ${referencias.join('\n')}
			  ${citationInstructions}

			  ${manuais ? `Considere os seguintes manuais ou diretrizes ao escrever: ${manuais}.` : ''}

			  Use a função fornecida para gerar a estrutura da introdução da monografia. Lembre-se de respeitar os requisitos mínimos de extensão para cada seção e incorporar as citações de forma adequada.
		  `;

		  try {
			  const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Timeout após 25 segundos')), 27000)
			  );
			  
			const completionPromise = await openai.chat.completions.create({
			  model: aiModel,
			  messages: [
				{ role: "system", content: "Você é um assistente especializado em redação acadêmica, capaz de criar introduções de monografias bem estruturadas e fundamentadas." },
				{ role: "user", content: message }
			  ],
			  tools: tools,
			  tool_choice: "auto"
			});
			
			const completion = await Promise.race([completionPromise, timeoutPromise]);
			
			const responseMessage = completion.choices[0].message;
			
			if (responseMessage.tool_calls) {
			  const functionCall = responseMessage.tool_calls[0];
			  const functionArguments = JSON.parse(functionCall.function.arguments);
			  
			  if (this.isValidIntroductionStructure(functionArguments.introducao)) {
				return functionArguments.introducao;
			  } else {
				throw new Error('A estrutura da introdução retornada é inválida');
			  }     
			} else {
			  throw new Error('Falha ao gerar a estrutura da introdução');
			}
		  } catch (error) {
			console.error('Erro:', error);
			throw new Error('Falha ao gerar a introdução da monografia');
		  }
		}

		static isValidIntroductionStructure(introducao) {
		  return introducao &&
				 introducao.contextualizacao &&
				 introducao.problematizacao &&
				 introducao.justificativa &&
				 introducao.objetivo_geral &&
				 Array.isArray(introducao.objetivos_especificos) &&
				 introducao.delimitacao_pesquisa &&
				 introducao.estrutura_trabalho;
		}

		static formatIntroduction(introducao) {
		  let formatted = `1. Introdução\n`;
		  formatted += `1.1 Contextualização\n${introducao.contextualizacao}\n\n`;
		  formatted += `1.2 Problematização\n${introducao.problematizacao}\n\n`;
		  formatted += `1.3 Justificativa\n${introducao.justificativa}\n\n`;
		  formatted += `1.4 Objetivos\n`;
		  formatted += `1.4.1 Objetivo Geral\n${introducao.objetivo_geral}\n\n`;
		  formatted += `1.4.2 Objetivos Específicos\n${introducao.objetivos_especificos.map(obj => `- ${obj}`).join('\n')}\n\n`;
		  formatted += `1.5 Delimitação da Pesquisa\n${introducao.delimitacao_pesquisa}\n\n`;
		  formatted += `1.6 Estrutura do Trabalho\n${introducao.estrutura_trabalho}\n\n`;
		  
		  return formatted;
		}

			
		static async createMono(tema, ideiaInicial, manuais, tier) {
			try {
				const referencias = await this.generateReferences(tema, ideiaInicial, tier);
				
				const monografia = await this.generateIntroduction(tema, ideiaInicial, manuais, referencias, tier);
				
				return (monografia ? {success: true, monografia: monografia, refer: referencias}: {success: false})
				
			} catch (error) {
				console.error('Erro ao criar monografia:', error);
				throw error;
			}
		}
}

module.exports = Monography;