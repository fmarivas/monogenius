require('dotenv').config();
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

class Monography {
		static async generateReferences(tema, ideiaInicial, tier) {
			let aiModel
			
			if(tier === "free"){
				aiModel = 'gpt-3.5-turbo'
			}else if(tier === 'basic' || tier === 'premium'){
				aiModel = 'gpt-4o'
			}
			const tools = [
				{
					type: "function",
					function: {
						name: "generate_references",
						description: "Gera uma lista de referências bibliográficas com base no tema",
						parameters: {
							type: "object",
							properties: {
								referencias_bibliograficas: {
									type: "array",
									items: { type: "string" },
									description: "Lista de 10 referências bibliográficas que sustentariam o tema"
								}
							},
							required: ["referencias_bibliograficas"]
						}
					}
				}
			];

			const apaInstructions = `
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

			const message = `
				Gere uma lista de 10 referências bibliográficas relevantes e atuais para um trabalho acadêmico 
				com o tema "${tema}" e a ideia inicial "${ideiaInicial}". As referências devem ser variadas, 
				incluindo livros, artigos científicos e outras fontes acadêmicas confiáveis. 
				
				${apaInstructions}

				Garanta que as referências sejam diversificadas em termos de tipo de fonte e data de publicação, 
				priorizando fontes dos últimos 5-10 anos quando possível.
			`;

			try {
				const completion = await openai.chat.completions.create({
					model: `${aiModel}`,
					messages: [
						{ role: "system", content: "Você é um assistente especializado em pesquisa acadêmica e bibliografia, com profundo conhecimento das normas APA." },
						{ role: "user", content: message }
					],
					tools: tools,
					tool_choice: "auto"
				});

				const responseMessage = completion.choices[0].message;

				if (responseMessage.tool_calls) {
					const functionCall = responseMessage.tool_calls[0];
					const functionArguments = JSON.parse(functionCall.function.arguments);
					return functionArguments.referencias_bibliograficas;
				} else {
					throw new Error('Falha ao gerar referências bibliográficas');
				}
			} catch (error) {
				console.error('Erro:', error);
				throw new Error('Falha ao gerar referências bibliográficas');
			}
		}
		
		static async generateMonographyWithReferences(tema, ideiaInicial, manuais, referencias, tier) {
			let aiModel
			
			if(tier === "free"){
				aiModel = 'gpt-3.5-turbo'
			}else if(tier === 'basic' || tier === 'premium'){
				aiModel = 'gpt-4o'
			}

			const tools = [
				{
					type: "function",
					function: {
						name: "generate_monography_structure",
						description: "Gera a estrutura de uma monografia com base nos parâmetros fornecidos, incluindo citações das referências",
						parameters: {
							type: "object",
							properties: {
								introducao: {
									type: "object",
									properties: {
										contextualizacao: { type: "string", description: "Contextualização do tema (texto extenso de no minimo 1000 palavras isso e importante)" },
										problematizacao: { type: "string", description: "Problematização do tema (texto extenso de no minimo 1000 palavras isso e importante)" },
										justificativa: { type: "string", description: "Justificativa do trabalho (texto extenso de no minimo 1000 palavras isso e importante)" },
										objetivo_geral: { type: "string", description: "Objetivo geral do trabalho (breve e direto)" },
										objetivos_especificos: { 
											type: "array", 
											items: { type: "string" }, 
											description: "Lista de objetivos específicos (máximo de 4, breves e diretos)" 
										},
										delimitacao_pesquisa: { type: "string", description: "Delimitação da pesquisa (texto extenso de no minimo 1000 palavras isso e importante)" },
										estrutura_trabalho: {
											type: "string",
											description: "Breve descrição da estrutura do trabalho"
										},										
									},
									required: ["contextualizacao", "problematizacao", "justificativa", "objetivo_geral", "objetivos_especificos", "delimitacao_pesquisa", "estrutura_trabalho"]
								},
								revisao_bibliografica: {
									type: "string",
									description: "Revisão bibliográfica, incorporando citações das referências fornecidas"
								},
								
								
							},
							required: ["introducao", "revisao_bibliografica"]
						}
					}
				}
			];

			const citationInstructions = `
			Ao citar as referências no texto, use o estilo APA:
			- Para citações diretas: (Sobrenome, Ano, p. X)
			- Para citações indiretas: (Sobrenome, Ano)
			- Para múltiplos autores, use '&' para dois autores e 'et al.' para três ou mais
			Integre as citações de forma fluida no texto, evitando concentrá-las em um único parágrafo.
			`;

			const message = `
			Escreva uma monografia acadêmica detalhada e extensa sobre o tema "${tema}" com a ideia inicial "${ideiaInicial}". 
			É crucial que cada seção seja desenvolvida com profundidade, fornecendo explicações detalhadas e análises abrangentes.

			Requisitos específicos de extensão:
			- Contextualização, Problematização, Justificativa e Delimitação da Pesquisa: mínimo de 5000 caracteres cada.
			- Revisão bibliográfica: mínimo de 25000 .

			Incorpore as seguintes referências bibliográficas em seu texto, usando citações apropriadas:

			${referencias.join('\n')}

			${citationInstructions}

			Considere os seguintes manuais ou diretrizes ao escrever: ${manuais}.

			Use a função fornecida para gerar a estrutura da monografia, incluindo uma introdução detalhada 
			e uma revisão bibliográfica que incorpore as referências fornecidas. Lembre-se de respeitar os requisitos mínimos de extensão para cada seção.
			`;

			try {
				const completion = await openai.chat.completions.create({
					model: `${aiModel}`,
					messages: [
						{ role: "system", content: "Você é um assistente especializado em redação acadêmica, capaz de criar monografias bem estruturadas e fundamentadas em literatura relevante." },
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
					throw new Error('Falha ao gerar a estrutura da monografia');
				}
			} catch (error) {
				console.error('Erro:', error);
				throw new Error('Falha ao gerar a monografia');
			}
		}

		static formatMonography(monografia) {
			let formatted = `1. Introdução\n`;
			formatted += `1.1 Contextualização\n${monografia.introducao.contextualizacao}\n\n`;
			formatted += `1.2 Problematização\n${monografia.introducao.problematizacao}\n\n`;
			formatted += `1.3 Justificativa\n${monografia.introducao.justificativa}\n\n`;
			formatted += `1.4 Objetivos\n`;
			formatted += `1.4.1 Objetivo Geral\n${monografia.introducao.objetivo_geral}\n\n`;
			formatted += `1.4.2 Objetivos Específicos\n${monografia.introducao.objetivos_especificos.map(obj => `- ${obj}`).join('\n')}\n\n`;
			formatted += `1.5 Delimitação da Pesquisa\n${monografia.introducao.delimitacao_pesquisa}\n\n`;
			formatted += `1.6 Estrutura do Trabalho\n${monografia.introducao.estrutura_trabalho}\n\n`;
			
			formatted += `2. Revisão Bibliográfica\n${monografia.revisao_bibliografica}\n\n`;

			return formatted;
		}
		
		
		static async createMono(tema, ideiaInicial, manuais, tier) {
			try {
				const referencias = await this.generateReferences(tema, ideiaInicial, tier);
				
				const monografia = await this.generateMonographyWithReferences(tema, ideiaInicial, manuais, referencias, tier);
				
				return (monografia ? {success: true, monografia: monografia, refer: referencias}: {success: false})
				
			} catch (error) {
				console.error('Erro ao criar monografia:', error);
				throw error;
			}
		}
}

module.exports = Monography;