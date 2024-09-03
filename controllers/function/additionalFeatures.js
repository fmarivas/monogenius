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
	
	static async themesCreator(studyArea, specificInterest, academicLevel, themeCount, tier, keywords, areaFocal='Chimoio') {
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

		// Lista de exemplos reais de temas acadêmicos
		const realExamples = [
			"Avaliação da Cinética de Desidratação da Manga (Mangifera indica L.) no Secador Convectivo",
			"Análise microbiológica de bolos de rua comercializados e consumidos ao redor da cidade de Chimoio",
			"Elaboração e caracterização da composição centesimal e análise sensorial de farinha de milho enriquecida com farinha de soja para papa",
			"Evaluation of Physicochemical, nutritional profile and sensory acceptability of bio-fortified Rice (Oryza sativa) protein of chicken meat flour in Mozambique",
			"Caracterização físico-química, nutricional e aceitabilidade sensorial de flocos maduros descontínuos de mandioca e rodelas de frutas de banana e maçã desidratada",
			"Análise e incorporação de popop para a redução parcial da areia no fabrico de blocos vazados de cimento e areia",
			"Avaliação da viabilidade técnica e económica Ambiental da implementação de secagem fotovoltaica em áreas rurais remotas",
			"Análise de perspectiva da demanda de energia na Cidade de Tete no período de 2024-2026",
			"Estufa agrícola inteligente alimentada por sistema Fotovoltaico, para melhorar as condições agro-climáticas de cultivo de hortícolas",
			"Uso de condutores no roubo de energia",
			"Automação do sistema de fornecimento de energia eléctrica para eficiência energética na empresa Abilio Antunes",
			"Análise dos Desafios e barreiras à adopção de tecnologias e práticas sustentáveis na produção agrícola no distrito de Vanduzi",
			"Análise da viabilidade do uso de sistemas agro-florestais como forma de reduzir os impactos climáticos na província de Manica",
			"Avaliação da cobertura de vacinação do controle contra Newcastle nos subúrbios da cidade de Chimoio",
			"Insegurança Alimentar e Nutricional no povoado de Belas- Distrito de Vanduzi Avaliação das fontes catalisadores nos agricultores de subsistência",
			"Análise da viabilidade da propagação vegetativa por meio da estaquía na cultura de tomate (Solanum lycopersicum)",
			"A avaliação e efeito de diferentes formas de adubação orgânica na produção de alface a variedade Great Lakes nas condições do túnel, Faculdade de Engenharia",
			"Mapeamento e análise do regime de queimadas nas florestas de miombo no norte de Moçambique: caso de estudo província de Niassa",
			"Estudo da poluição Marinha Provocada pela Empresa kenmare na Costa Marítima do Distrito de Moma, Província de Nampula",
			"Propagação de Estrutura das Correntes ao Norte do Canal de Moçambique, Cabo - Delgado",
			"Georeferenciamento Remoto e geoprocessing aplicados no monitoramento do deslocamento no norte de Moçambique por meio de dados satélites no período cronológico de 2012 a 2017 na Província da Nassa",
			"Análise de aspectos socioeconómicos da aquacultura de pequena escala na família no distrito de Gorongosa, Província de Sofala",
			"Utilização de casuarinos cálcicos para reposição de ar e controle de temperatura na empresa Euro-posto Luís Beira",
			"Importância da eficiência energética e mitigação das mudanças climáticas em Moçambique",
			"Assistente Virtual de Atendimento para Estudantes da UNENG",
			"A importância da Inteligência artificial e o desenvolvimento do pensamento crítico na comunidade académica",
			"A aplicação da tecnologia BIM na apresentação de projectos arquitectónicos e estruturais utilizando realidade aumentada",
			"Monogenius: Plataforma Inteligente para Criação e Verificação de Monografias Académicas",
			"Álcool na adolescência. Factores que influenciam o consumo e a percepção dos estudantes das escolas secundárias sobre as suas consequências",
			"Avaliação do Grau de Satisfação dos Utentes do HPC",
			"Perfil socioeconómico e grau de satisfação dos estudantes da FENG",
			"Impacto da exploração infantil na cidade de Chimoio",
			"Impacto do uso de seguros na província da Manica (estudo comparado da EMOSE e Indico Seguros)",
			"Factores psicológicos que influenciam a reincidência criminal dos prisioneiros no estabelecimento penitenciário regional centro de Manica (2023 - 2024)",
			"Impacto da formarção de preços de transporte publicos na arrecadação de receitas fiscais no município de Chimoio, no período de 2004 a 2022",
			"Gestão do Recurso Humano: Numa óptica de Marketing interno uma abordagem prática em busca de boas práticas na Gestão de Recursos Humanos",
			"O Empreendedorismo Universitário e a Quarta Revolução Industrial",
			"Análise da eficácia do ensino bilingue no desenvolvimento de competências de leitura e escrita caso da Escola Primaria e 1° Congresso, Cidade de Chimoio",
			"Política da gratuidade do ensino básico, acessibilidade e impacto na Escola Primária Quatro das Laranjeitas - Vanduzi",
			"Educação Inclusiva Solidária e as Práticas de Vida Humana: O lugar do(a) Educador(a) na Vida",
			"Avaliação da Produtividade de Variedades Peixinzinho da Cultura de Alface (Lactuca sativa L.) no Sistema Hidropónico face às mudanças climáticas na Cidade de Tete, Bairro Matundo-Vhanla",
			"Influência dos Modelos Climáticos Tropicais e Subtropicais na Precipitação Total da Estação Seca na Província de Manica",
			"Sustentabilidade da Agricultura Africana: Desafios e Oportunidades",
			"O papel das correntes oceânicas derivadas por satélite na variabilidade climática no Canal de Moçambique",
			"A mudança para práticas e tecnologias de agricultura de conservação na baixa do vale do Zambeze, Faculdade de Engenharia da UCM",
			"Análise das causas de avarias nos contadores de energia eléctrica da Electricidade de Moçambique, ASC - TETE, 2023 - 2024"
		];

		const message = `
			Crie ${themeCount} temas para trabalhos acadêmicos na área de ${studyArea}, com foco em ${specificInterest}, adequados para o nível de ${academicLevel}${areaFocal ? ` em ${areaFocal}` : ''}. ${keywordsPrompt}

			IMPORTANTE: Os temas gerados DEVEM seguir ESTRITAMENTE a estrutura e o estilo dos exemplos fornecidos abaixo. Utilize a mesma abordagem de nomenclatura, especificidade e formato. Adapte o conteúdo para ${studyArea} e ${specificInterest}, mas mantenha a estrutura similar.

			Exemplos de referência:
			${realExamples.join('\n')}

			Lembre-se:
			1. Use termos técnicos específicos da área, como nos exemplos.
			2. Inclua detalhes metodológicos ou de aplicação, quando relevante.
			3. Especifique o contexto ou população de estudo, se aplicável.
			4. Mantenha um nível de especificidade similar aos exemplos.
			5. Adapte a estrutura para ${studyArea} e ${specificInterest}, mas mantenha o estilo geral.

			Os temas devem ser relevantes${areaFocal ? ` para o contexto de ${areaFocal}` : ''}, originais, viáveis, claros, de interesse social, e alinhados com os Objetivos de Desenvolvimento Sustentável da ONU, quando aplicável.

			Apresente cada tema em uma linha separada, garantindo que sejam específicos, relevantes${areaFocal ? ` e adaptados ao contexto de ${areaFocal}` : ''}.
		`;
		
		try {
			const completion = await openai.chat.completions.create({
				model: 'gpt-4o',
				messages: [
					{ role: "system", content: "Você é um assistente especializado em pesquisa acadêmica, com profundo conhecimento em geração de temas de pesquisa. Sua tarefa é criar temas que sigam estritamente o estilo e a estrutura dos exemplos fornecidos." },
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
		} catch(err) {
			console.error(err)
			throw err;
		}
	}
	
	static async generateEnhancedThemeDetails(theme) {
		const tools = [
			{
				type: "function",
				function: {
					name: "generate_enhanced_theme_details",
					description: "Gera detalhes estruturados e aprimorados para um tema acadêmico",
					parameters: {
						type: "object",
						properties: {
							description: {
								type: "string",
								description: "Breve descrição do tema"
							},
							questions: {
								type: "array",
								items: { type: "string" },
								description: "Lista de perguntas de partida",
								minItems: 3,
								maxItems: 3
							},
							approaches: {
								type: "array",
								items: { type: "string" },
								description: "Lista de abordagens possíveis",
								minItems: 2,
								maxItems: 2
							},
							subproblems: {
								type: "array",
								items: { type: "string" },
								description: "Lista de subproblemas relacionados",
								minItems: 3,
								maxItems: 3
							},
							delimitation: {
								type: "object",
								properties: {
									suggestion: { type: "string" },
									rationale: { type: "string" }
								},
								description: "Sugestão de como delimitar o tema e justificativa"
							},
							sample: {
								type: "object",
								properties: {
									suggestion: { type: "string" },
									rationale: { type: "string" }
								},
								description: "Sugestão de definição de amostra e justificativa"
							}
						},
						required: ["description", "questions", "approaches", "subproblems", "delimitation", "sample"]
					}
				}
			}
		];

		const message = `
		Com base no tema '${theme}', forneça os seguintes detalhes aprimorados:
		Descrição: [Breve descrição do tema]
		Perguntas de Partida:
		1. [Pergunta 1]
		2. [Pergunta 2]
		3. [Pergunta 3]
		Abordagens Possíveis:
		1. [Abordagem 1]
		2. [Abordagem 2]
		Subproblemas Relacionados:
		1. [Subproblema 1]
		2. [Subproblema 2]
		3. [Subproblema 3]
		Delimitação do Tema:
		- Sugestão: [Como delimitar o tema]
		- Justificativa: [Por que esta delimitação é apropriada]
		Definição da Amostra:
		- Sugestão: [Como definir a amostra]
		- Justificativa: [Por que esta amostra é adequada]
		Assegure-se de que as informações fornecidas sejam relevantes, originais e tenham potencial para contribuição significativa ao campo de estudo.`;

		try {
			const completion = await openai.chat.completions.create({
				model: "gpt-4o",
				messages: [
					{ role: "system", content: "Você é um assistente especializado em pesquisa acadêmica, capaz de gerar temas detalhados e estruturados para estudos, incluindo orientações sobre delimitação do tema e definição de amostra." },
					{ role: "user", content: message }
				],
				tools: tools,
				tool_choice: "auto"
			});

			const response = completion.choices[0].message;

			if (response.tool_calls && response.tool_calls.length > 0) {
				const functionCall = response.tool_calls[0];
				if (functionCall.function.name === "generate_enhanced_theme_details") {
					const themeDetails = JSON.parse(functionCall.function.arguments);
					return {
						success: true,
						details: {
							title: theme,
							...themeDetails
						}
					};
				} else {
					throw new Error(`Função inesperada chamada: ${functionCall.function.name}`);
				}
			} else {
				throw new Error('Falha ao gerar detalhes aprimorados do tema');
			}
		} catch (err) {
			console.error("Erro ao gerar temas detalhados aprimorados:", err);
			return {
				success: false,
				message: "Ocorreu um erro ao gerar os temas detalhados aprimorados. Por favor, tente novamente."
			};
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