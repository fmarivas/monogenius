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
	
	static async themesCreator(studyArea, specificInterest, academicLevel, themeCount, tier, keywords, areaFocal) {
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
		Crie ${themeCount} temas para trabalhos acadêmicos na área de ${studyArea}, com foco em ${specificInterest}, adequados para o nível de ${academicLevel}${areaFocal ? ` em ${areaFocal}` : ''}. ${keywordsPrompt}

		Os temas devem ser:
		1. Relevantes${areaFocal ? ` para o contexto de ${areaFocal}` : ''}, abordando questões contemporâneas importantes e contribuindo significativamente para o desenvolvimento${areaFocal ? ' do país' : ''}.
		2. Originais, oferecendo novas perspectivas ou explorando áreas ainda não investigadas extensivamente${areaFocal ? ` em ${areaFocal}` : ''}.
		3. Viáveis, considerando a disponibilidade de fontes e recursos necessários para a pesquisa no contexto${areaFocal ? ' local' : ''}.
		4. Claros e delimitados, com escopo bem definido para permitir uma investigação aprofundada e específica.
		5. De interesse pessoal e social, potencialmente motivando o estudante e beneficiando a comunidade.
		6. Com contribuição prática, sempre que possível, oferecendo soluções ou insights aplicáveis${areaFocal ? ` à realidade de ${areaFocal}` : ''}.
		7. Interdisciplinares, quando apropriado, integrando conhecimentos de diferentes áreas para uma abordagem mais abrangente.
		8. Alinhados com os Objectivos de Desenvolvimento Sustentável (ODS) da ONU, quando aplicável.
		9. Considerando aspectos culturais, históricos ou socioeconómicos${areaFocal ? ` específicos de ${areaFocal}` : ''}.
		10. Potencialmente inovadores, explorando tecnologias ou metodologias emergentes no contexto${areaFocal ? ' local' : ''}.

		Baseie-se nos seguintes exemplos de temas reais de trabalhos acadêmicos${areaFocal ? ` em ${areaFocal}` : ''}, adaptando-os para a área de ${studyArea} e foco em ${specificInterest}:

		Optimização de [processo específico] em [indústria/setor]: O caso de [empresa/instituição] em [localidade${areaFocal ? ` de ${areaFocal}` : ''}]
		Proposta de implementação de [sistema/plano] para [objetivo específico] em [empresa/instituição] de [localidade${areaFocal ? ` de ${areaFocal}` : ''}]
		Análise da situação de [aspecto social/político/econômico]${areaFocal ? ` em ${areaFocal}` : ''}: O caso de [instituição/região específica]
		Impacto de [fator socioeconômico] em [área de desenvolvimento] em [região/grupo específico]: Estudo de caso em [instituição/localidade], [período]
		Projeto de [infraestrutura/sistema] para [instituição/empresa] em [localidade${areaFocal ? ` de ${areaFocal}` : ''}]: [objetivo específico]
		[Aspecto social/político] nas [tipo de evento/processo]${areaFocal ? ` em ${areaFocal}` : ''}: Um estudo de caso em [localidades específicas] em [ano]
		Fatores que influenciam [resultado específico] em [contexto educacional/social]: Caso da [instituição específica] em [localidade], [período]
		Políticas de [área de desenvolvimento]${areaFocal ? ` em ${areaFocal}` : ''}: Uma análise sobre [aspecto específico] no [nível educacional/setor] - Estudo de caso do [instituição governamental], [período]
		Avaliação do processo de [atividade industrial/agrícola] na [empresa/indústria]: Estudo de caso em [localidade]${areaFocal ? ', província de [nome da província]' : ''}
		Desempenho [tipo de desempenho] de [objeto de estudo] sob diferentes [variáveis]: Um estudo comparativo${areaFocal ? ` em [contexto de ${areaFocal}]` : ''}
		[Aspecto humano/social] em [instituições específicas]: Um estudo de caso no [nome do centro/instituição] na Cidade de [localidade]
		Proposta de [solução tecnológica] para [problema específico]${areaFocal ? ` em ${areaFocal}` : ''}
		Ocorrência de [fenômeno específico] no processo de [atividade industrial]: Estudo de caso na [empresa]${areaFocal ? ` em ${areaFocal}` : ''}
		Análise do impacto de [política econômica] em [indicador econômico]${areaFocal ? ` em ${areaFocal}` : ''}: Período [ano inicial - ano final]
		Estratégias de [área de intervenção] em [setor]: Uma análise comparativa entre [cidade${areaFocal ? ` de ${areaFocal}` : ''}] e [cidade estrangeira]
		Efeitos das [fenômeno ambiental] na [recurso natural/econômico] em [região geográfica${areaFocal ? ` de ${areaFocal}` : ''}]
		Análise da [infraestrutura/serviço público] da cidade de [localidade${areaFocal ? ` de ${areaFocal}` : ''}]
		Papel do [instituição governamental] no processo de [transformação tecnológica/social]${areaFocal ? ` em ${areaFocal}` : ''}
		[Aspecto organizacional] face a [desafio específico]: Caso da [instituição educacional] em [localidade], [período]
		Participação da [grupo social] na [processo político/econômico] no setor de [indústria específica]${areaFocal ? ` em ${areaFocal}` : ''}: [período]

		Apresente cada tema em uma linha separada, garantindo que sejam específicos, relevantes${areaFocal ? ` e adaptados ao contexto de ${areaFocal}` : ''}.
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
	

	static async resumo(data) {
	  const message = `
		Você é um assistente especializado em resumos acadêmicos. Sua tarefa é criar um resumo conciso e bem estruturado de um trabalho acadêmico, com base nos dados fornecidos. Siga estas instruções:

		1. Crie um resumo em português (200-250 palavras) com a seguinte estrutura:

		   a) Introdução: objetivo ou finalidade da investigação
		   b) Metodologia: procedimentos básicos (desenho, participantes/amostra, métodos de coleta e análise de dados)
		   c) Resultados: principais descobertas com evidências estatísticas/empíricas
		   d) Discussão/conclusões: implicações principais e conclusões

		2. Traduza o resumo para inglês (abstract).

		3. Gere 3 a 5 palavras-chave em português que traduzam adequadamente o conteúdo do trabalho.

		4. Traduza as palavras-chave para inglês.

		Formate a saída da seguinte maneira:

		Resumo:

		[Insira o resumo em português aqui]

		Abstract:

		[Insira o abstract em inglês aqui]

		Palavras-chave:

		[Liste as palavras-chave em português, separadas por vírgulas]

		Keywords:

		[Liste as keywords em inglês, separadas por vírgulas]

		Dados do trabalho acadêmico:

		${data}

		Mantenha uma linguagem clara, objetiva e acadêmica. Foque nos aspectos mais importantes do estudo.
	  `;

	  try {
		const completion = await openai.chat.completions.create({
		  model: 'gpt-4o-mini',
		  messages: [
			{ role: "system", content: "Você é um assistente especializado em análise de texto acadêmico, criação de resumos e extração de palavras-chave." },
			{ role: "user", content: message }
		  ],
		  max_tokens: 1000
		});

		const response = completion.choices[0].message.content;

		// Extrair as seções do texto usando expressões regulares
		const resumoMatch = response.match(/\*\*Resumo:\*\*([\s\S]*?)(?=\*\*Abstract:\*\*|\*\*Palavras-chave:\*\*|$)/i);
		const abstractMatch = response.match(/\*\*Abstract:\*\*([\s\S]*?)(?=\*\*Palavras-chave:\*\*|\*\*Keywords:\*\*|$)/i);
		const palavrasChaveMatch = response.match(/\*\*Palavras-chave:\*\*([\s\S]*?)(?=\*\*Keywords:\*\*|$)/i);
		const keywordsMatch = response.match(/\*\*Keywords:\*\*([\s\S]*?)$/i);

		const resumoPortugues = resumoMatch ? resumoMatch[1].trim() : '';
		const abstractEnglish = abstractMatch ? abstractMatch[1].trim() : '';
		const palavrasChave = palavrasChaveMatch ? palavrasChaveMatch[1].trim() : '';
		const keywords = keywordsMatch ? keywordsMatch[1].trim() : '';

		if (!resumoPortugues || !abstractEnglish || !palavrasChave || !keywords) {
		  throw new Error('A resposta da API não contém todas as seções esperadas');
		}


		return {
		  success: true,
		  resumoPortugues,
		  abstractEnglish,
		  palavrasChave,
		  keywords
		};
	  } catch (error) {
		console.error('Erro ao gerar resumo:', error);
		return {
		  success: false,
		  message: 'Falha ao gerar o resumo. Por favor, tente novamente.'
		};
	  }
	}

}

module.exports = additionalFeatures;