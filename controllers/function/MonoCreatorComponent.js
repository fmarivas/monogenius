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
			let aiModel = tier === "free" ? 'gpt-4o-mini' : 'gpt-4o';

console.log(ideiaInicial)
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
				  name: "generate_introduction_template",
				  description: "Gera um template detalhado para a introdução de uma monografia acadêmica",
				  parameters: {
					type: "object",
					properties: {
					  introducao: {
						type: "object",
						properties: {
						  contextualizacao: { type: "string", description: "Template para a contextualização do tema" },
						  problematizacao: { type: "string", description: "Template para a problematização do tema" },
						  justificativa: { type: "string", description: "Template para a justificativa do trabalho" },
						  objetivo_geral: { type: "string", description: "Template para o objetivo geral" },
						  objetivos_especificos: { 
							type: "array", 
							items: { type: "string" }, 
							description: "Lista de templates para objetivos específicos" 
						  },
						  delimitacao_pesquisa: { type: "string", description: "Template para a delimitação da pesquisa" },
						  estrutura_trabalho: { type: "string", description: "Template para a estrutura do trabalho" },
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
		  Gere um template detalhado para a introdução de uma monografia acadêmica sobre o tema "${tema}" com a ideia inicial "${ideiaInicial}".
		  O template deve seguir as normas APA e incluir espaços para preenchimento marcados com colchetes [].

		  Estrutura do template:

		  1. Introdução

		  1.1 Contextualização (mínimo 2000 palavras)
		  [Insira aqui uma contextualização detalhada do tema. Aborde os seguintes pontos:
		  - Definição e explicação do tema central: [Defina e explique o conceito principal do seu tema]
		  - Contexto histórico: [Discuta brevemente a evolução histórica do tema]
		  - Relevância atual: [Explique por que o tema é importante no contexto atual]
		  - Tendências e debates atuais: [Mencione as principais tendências e debates relacionados ao tema]
		  - Impacto social/econômico/tecnológico: [Descreva o impacto do tema na sociedade, economia ou tecnologia]
		  Lembre-se de utilizar pelo menos 3 citações de autores relevantes para apoiar suas afirmações. Exemplos de citações que poderiam ser usadas:
		  - "A evolução das tecnologias de processamento de dados tem revolucionado a forma como gerenciamos informações em diversos setores" (Johnson, 2022, p. 45).
		  - "A segurança da informação tornou-se uma preocupação primordial na era digital, especialmente no que tange ao manuseio de documentos sensíveis" (Garcia, 2023, p. 112).
		  - "O uso de bibliotecas especializadas para análise de documentos não apenas melhora a eficiência, mas também reduz significativamente a margem de erro no processamento de dados" (Smith, 2021, p. 78).]

		  1.2 Problematização (mínimo 2000 palavras)
		  [Descreva o problema de pesquisa de forma clara e específica. Inclua os seguintes elementos:
		  - Identificação do problema: [Apresente claramente o problema que será abordado na pesquisa]
		  - Contextualização do problema: [Explique em que contexto o problema ocorre e por que é relevante]
		  - Lacunas no conhecimento: [Identifique quais aspectos do problema ainda não foram completamente estudados ou compreendidos]
		  - Consequências do problema: [Discuta as implicações do problema se não for abordado]
		  - Justificativa da pesquisa: [Explique por que este problema merece ser estudado]
		  Inclua pelo menos 2 citações que corroborem a existência e importância deste problema. Exemplos:
		  - "A falta de padronização no processamento de diferentes formatos de arquivo continua sendo um desafio significativo para muitas organizações" (Brown, 2020, p. 67).
		  - "Apesar dos avanços tecnológicos, a extração precisa de informações de documentos complexos ainda apresenta obstáculos consideráveis" (Lee & Kim, 2022, p. 23).]

		  Pergunta de Partida: ${ideiaInicial}
		  [Reformule a pergunta de partida, se necessário, para sintetizar o que o estudo busca responder. A pergunta deve ser clara, concisa e diretamente relacionada ao problema de pesquisa apresentado.]

		  1.3 Justificativa (mínimo 2000 palavras)
		  [Apresente argumentos que justifiquem a importância deste estudo. Aborde os seguintes aspectos:
		  - Relevância acadêmica: [Explique como o estudo contribuirá para o conhecimento na área]
		  - Relevância social: [Discuta os potenciais benefícios sociais da pesquisa]
		  - Relevância econômica ou prática: [Se aplicável, explique as implicações econômicas ou práticas do estudo]
		  - Originalidade: [Destaque os aspectos originais ou inovadores da sua pesquisa]
		  - Viabilidade: [Justifique brevemente por que o estudo é viável]
		  Utilize pelo menos 3 citações para apoiar seus argumentos. Exemplos:
		  - "A otimização do processamento de documentos pode resultar em economias significativas de tempo e recursos para organizações de todos os tamanhos" (Wilson et al., 2021, p. 89).
		  - "Estudos sobre tecnologias de extração de dados de documentos têm implicações diretas para a melhoria da tomada de decisões baseadas em evidências" (Chen, 2023, p. 134).
		  - "A integração de técnicas avançadas de processamento de linguagem natural na análise de documentos representa uma fronteira promissora na gestão da informação" (Patel, 2022, p. 56).]

		  1.4 Objetivos
		  1.4.1 Objetivo Geral
		  [Insira aqui o objetivo geral da pesquisa em uma frase clara e concisa. O objetivo deve estar diretamente relacionado à pergunta de partida e ao problema de pesquisa.]

		  1.4.2 Objetivos Específicos
		  [Liste de 3 a 5 objetivos específicos que, quando alcançados, levarão ao cumprimento do objetivo geral. Cada objetivo deve ser claro, mensurável e iniciado com um verbo no infinitivo. Por exemplo:]
		  - [Analisar...]
		  - [Identificar...]
		  - [Comparar...]
		  - [Avaliar...]
		  - [Propor...]

		  1.5 Delimitação da Pesquisa (mínimo 2000 palavras)
		  [Defina os limites da sua pesquisa. Aborde os seguintes pontos:
		  - Escopo temático: [Especifique exatamente quais aspectos do tema serão abordados e quais não serão]
		  - Delimitação temporal: [Defina o período de tempo que será considerado na pesquisa]
		  - Delimitação espacial: [Especifique a área geográfica ou contexto organizacional da pesquisa, se aplicável]
		  - Delimitação populacional: [Descreva a população ou amostra que será estudada, se aplicável]
		  - Limitações metodológicas: [Mencione quaisquer limitações metodológicas previstas]
		  Inclua pelo menos 2 citações que apoiem suas escolhas de delimitação. Exemplos:
		  - "A delimitação precisa do escopo de pesquisa em estudos sobre tecnologias de processamento de documentos é crucial para garantir resultados significativos e aplicáveis" (Thompson & Roberts, 2022, p. 45).
		  - "Ao estudar sistemas de gerenciamento de documentos, é importante considerar as rápidas mudanças tecnológicas e limitar o período de análise para garantir a relevância dos resultados" (Yamamoto & Singh, 2023, p. 78).]

		  1.6 Estrutura do Trabalho
		  [Descreva brevemente como o restante do trabalho será organizado. Por exemplo:]
		  [Este trabalho está estruturado em X capítulos:
		  - Capítulo 1 (Introdução): Apresenta o tema, problema, justificativa, objetivos e delimitação da pesquisa.
		  - Capítulo 2 (Revisão da Literatura): Aborda... [complete com o conteúdo previsto]
		  - Capítulo 3 (Metodologia): Descreve... [complete com o conteúdo previsto]
		  - Capítulo 4 (Resultados e Discussão): Apresenta... [complete com o conteúdo previsto]
		  - Capítulo 5 (Conclusão): Sintetiza os principais achados e contribuições da pesquisa.]

		  Instruções adicionais:
		  - Utilize o estilo de citação APA: ${citationInstructions}
		  - Integre as citações de forma fluida no texto, evitando agrupá-las em um único parágrafo.
		  - Considere as seguintes referências ao preencher o template:
		  ${referencias.join('\n')}
		  
		  ${manuais ? `Considere os seguintes manuais ou diretrizes ao preencher o template: ${manuais}.` : ''}

		  Use a função fornecida para gerar o template da introdução da monografia. Lembre-se de incluir os espaços para preenchimento marcados com colchetes [] em cada seção, mantendo as instruções detalhadas dentro dos colchetes para orientar o usuário no preenchimento.
		`;

			try {
			  const completion = await openai.chat.completions.create({
				model: aiModel,
				messages: [
				  { role: "system", content: "Você é um assistente especializado em redação acadêmica, capaz de criar templates de introduções de monografias bem estruturadas." },
				  { role: "user", content: message }
				],
				tools: tools,
				tool_choice: "auto"
			  });
			  
			  const responseMessage = completion.choices[0].message;
			  
			  if (responseMessage.tool_calls) {
				const functionCall = responseMessage.tool_calls[0];
				const functionArguments = JSON.parse(functionCall.function.arguments);
				
				if (this.isValidIntroductionStructure(functionArguments.introducao)) {
				  return functionArguments.introducao;
				} else {
				  throw new Error('A estrutura do template da introdução retornada é inválida');
				}     
			  } else {
				throw new Error('Falha ao gerar o template da introdução');
			  }
			} catch (error) {
			  console.error('Erro:', error);
			  throw new Error('Falha ao gerar o template da introdução da monografia');
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