require('dotenv').config();
const MonoCreator = require('./MonoCreatorComponent')
const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

class additionalFeatures {
    static async hypothesisCreator(researchTopic, generalObjective, specificObjectives, researchProblem, methodology, tier) {
        try {
            const referencias = await MonoCreator.generateReferences(researchTopic, generalObjective, tier);
			
            const tools = [
                {
                    type: "function",
                    function: {
                        name: "generate_hypothesis",
                        description: "Gera um conjunto de hipóteses para um projeto de pesquisa, com base nos parâmetros fornecidos",
                        parameters: {
                            type: "object",
                            properties: {
                                hipoteses: {
                                    type: "object",
                                    properties: {
                                        principais: {
                                            type: "array",
                                            items: { 
                                                type: "object",
                                                properties: {
                                                    hipotese: { type: "string" },
                                                    justificativa: { type: "string" },
                                                    relacao_objetivos: { type: "string" },
                                                    implicacoes_metodologia: { type: "string" }
                                                }
                                            },
                                            minItems: 2,
                                            maxItems: 2,
                                            description: "Duas hipóteses principais que abordem diretamente o problema de pesquisa"
                                        },
                                        alternativas: {
                                            type: "array",
                                            items: { 
                                                type: "object",
                                                properties: {
                                                    hipotese: { type: "string" },
                                                    justificativa: { type: "string" },
                                                    relacao_objetivos: { type: "string" },
                                                    implicacoes_metodologia: { type: "string" }
                                                }
                                            },
                                            minItems: 2,
                                            maxItems: 2,
                                            description: "Duas hipóteses alternativas ou nulas que contradigam as hipóteses principais"
                                        },
                                        exploratoria: {
                                            type: "object",
                                            properties: {
                                                hipotese: { type: "string" },
                                                justificativa: { type: "string" },
                                                relacao_objetivos: { type: "string" },
                                                implicacoes_metodologia: { type: "string" }
                                            },
                                            description: "Uma hipótese exploratória baseada em uma lacuna identificada na literatura"
                                        }
                                    },
                                    required: ["principais", "alternativas", "exploratoria"]
                                },
                                variaveis_importantes: {
                                    type: "array",
                                    items: { type: "string" },
                                    description: "Possíveis variáveis ou fatores importantes a considerar ao testar as hipóteses"
                                }
                            },
                            required: ["hipoteses", "variaveis_importantes"]
                        }
                    }
                }
            ];

            const message = `Com base nas informações fornecidas, gere um conjunto de hipóteses para o seguinte projeto de pesquisa:
            Tema: ${researchTopic}
            Objetivo geral: ${generalObjective}
            Objetivos específicos: ${specificObjectives}
            Problema de pesquisa: ${researchProblem}
            Metodologia: ${methodology}
            Referências bibliográficas principais: ${referencias.join('\n')}
            Por favor, gere:
            Duas hipóteses principais que abordem diretamente o problema de pesquisa.
            Duas hipóteses alternativas ou nulas que contradigam as hipóteses principais.
            Uma hipótese exploratória baseada em uma lacuna identificada na literatura fornecida.
            Para cada hipótese, forneça:
            A hipótese em si
            Uma breve justificativa baseada na literatura fornecida
            Como ela se relaciona com os objetivos da pesquisa
            Possíveis implicações para a metodologia
            Além disso, sugira possíveis variáveis ou fatores que possam ser importantes considerar ao testar essas hipóteses.`;

			const completion = await openai.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{ role: "system", content: "Você é um assistente especializado em pesquisa acadêmica e bibliografia, com profundo conhecimento das normas APA." },
					{ role: "user", content: message }
				],
				tools: tools,
				tool_choice: "auto"
			});

			const response = completion.choices[0].message;

			if (response.tool_calls && response.tool_calls.length > 0) {
				const functionCall = response.tool_calls[0];
				if (functionCall.function.name === "generate_hypothesis") {
					const functionArguments = JSON.parse(functionCall.function.arguments);
					return functionArguments;
				} else {
					throw new Error(`Função inesperada chamada: ${functionCall.function.name}`);
				}
			} else {
				throw new Error('Falha ao gerar hipóteses');
			}
        } catch (err) {
            console.error("Erro ao criar hipóteses:", err);
            throw err;
        }
    }
	
	static async themesCreator(studyArea, specificInterest, academicLevel, themeCount, tier, keywords) {
		const tools = [
			{
				type: "function",
				function: {
					name: "generate_themes",
					description: "Gera temas para trabalhos acadêmicos baseado nos parâmetros fornecidos",
					parameters: {
						type: "object",
						properties: {
							themes: {
								type: "array",
								items: { type: "string" },
								description: "Lista de temas para trabalhos acadêmicos"
							}
						},
						required: ["themes"]
					}
				}
			}
		];

		let keywordsPrompt = "";
		if (keywords && keywords.length > 0) {
			keywordsPrompt = `Considere as seguintes palavras-chave em sua criação de temas: ${keywords}.`;
		}

		const message = `
			Crie ${themeCount} temas para trabalhos acadêmicos na área de ${studyArea}, com foco em ${specificInterest}, adequados para o nível de ${academicLevel}. ${keywordsPrompt}
			Os temas devem ser:
			1. Relevantes, contribuindo significativamente para o campo de estudo e abordando questões contemporâneas importantes.
			2. Originais, oferecendo novas perspectivas ou explorando áreas ainda não investigadas extensivamente.
			3. Viáveis, com disponibilidade de fontes e recursos necessários para a pesquisa, e exequíveis dentro do prazo e recursos disponíveis.
			4. Claros e delimitados, com escopo bem definido para permitir uma investigação aprofundada e específica.
			5. De interesse pessoal, potencialmente motivando o estudante a se dedicar ao tema.
			6. Com contribuição prática, sempre que possível, oferecendo soluções ou insights aplicáveis na prática.
			Apresente cada tema em uma linha separada.
		`;
		
		try{
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{ role: "system", content: "Você é um assistente especializado em pesquisa acadêmica e bibliografia, com profundo conhecimento das normas APA." },
					{ role: "user", content: message }
				],
				tools: tools,
				tool_choice: "auto"
			});

			const response = completion.choices[0].message;

			if (response.tool_calls && response.tool_calls.length > 0) {
				const functionCall = response.tool_calls[0];
				if (functionCall.function.name === "generate_themes") {
					const functionArguments = JSON.parse(functionCall.function.arguments);
					return functionArguments;
				} else {
					throw new Error(`Função inesperada chamada: ${functionCall.function.name}`);
				}
			} else {
				throw new Error('Falha ao gerar temas');
			}
		}catch(err){
			console.error(err)
			throw err;
		}
		
	}
	
	static async referencesCreator(tema, ideiaInicial, tier, language){
		try{
			const referencias = await MonoCreator.generateReferences(tema, ideiaInicial, tier, language);
			return referencias
		}catch(err){
			console.error(err)
		}
	}
	
	static async keywordGenerator(data) {
		const tools = [
			{
				type: "function",
				function: {
					name: "generate_keywords",
					description: "Gera palavras-chave relevantes baseadas nos dados fornecidos",
					parameters: {
						type: "object",
						properties: {
							keywords: {
								type: "array",
								items: { type: "string" },
								description: "Lista de palavras-chave relevantes"
							}
						},
						required: ["keywords"]
					}
				}
			}
		];

		const allText = Array.isArray(data) ? data.join(' ') : data.toString();

		const message = `
			Analise o seguinte texto e extraia de 3 a 5 palavras-chave relevantes.
			Estas palavras-chave devem representar os conceitos mais importantes e específicos do texto.
			Apresente apenas as palavras-chave, sem numeração ou explicações adicionais.

			Texto: ${allText}
		`;

		try {
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{ role: "system", content: "Você é um assistente especializado em análise de texto e extração de palavras-chave." },
					{ role: "user", content: message }
				],
				tools: tools,
				tool_choice: "auto"
			});

			const response = completion.choices[0].message;
			if (response.tool_calls && response.tool_calls.length > 0) {
				const functionCall = response.tool_calls[0];
				if (functionCall.function.name === "generate_keywords") {
					const functionArguments = JSON.parse(functionCall.function.arguments);
					return functionArguments.keywords.slice(0, 5);  // Garantir que não haja mais de 5 palavras-chave
				} else {
					throw new Error(`Função inesperada chamada: ${functionCall.function.name}`);
				}
			} else {
				throw new Error('Falha ao gerar palavras-chave');
			}
		} catch (err) {
			console.error("Erro ao gerar palavras-chave:", err);
			return [];
		}
	}
}

module.exports = additionalFeatures;