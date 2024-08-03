const preTextualElements = [
  {
	name: 'Capa',
	template: 'capa',
	content: {
	  logo: true,
	  instituicao: 'Nome da Instituição',
	  tema: 'Tema do Trabalho',
	  autor: 'Nome do Autor',
	  supervisor: 'Nome do Supervisor',
	  local: 'Local, Mês Ano'
	}
  },
  {
	name: 'Contra-capa',
	template: 'contra-capa',
	content: {
	  autor: 'Nome do Autor',
	  titulo: 'Título do Trabalho',
	  subtitulo: 'Subtítulo (se houver)',
	  descricao: 'Trabalho de Conclusão de Curso apresentado como requisito parcial para obtenção do grau de Bacharel em [Curso]',
	  orientador: 'Prof. Dr. Nome do Orientador',
	  local: 'Local',
	  ano: 'Ano'
	}
  },
  {
    name: 'Declaracao',
    template: 'declaracao',
    content: {
      titulo: 'DECLARAÇÃO',
      nomeCompleto: '[Nome Completo]',
      textoDeclaracao: 'Eu, [Nome Completo], declaro por minha honra que este trabalho é da minha autoria e nunca foi apresentado em nenhuma outra instituição para obter qualquer grau acadêmico. As obras usadas neste trabalho foram devidamente citadas e listadas na lista de referências bibliográficas.',
      local: '[LOCAL]',
      data: '_____ de ______________ de [ANO]',
      assinatura: '(NOME COMPLETO)'
    },
  },
  {
    name: 'Agradecimentos',
    template: 'agradecimentos',
    content: {
      titulo: 'AGRADECIMENTOS',
      texto: 'Gostaria de expressar minha sincera gratidão a todos que contribuíram para a realização deste trabalho:\n\nAos meus pais, pelo apoio incondicional...\n\nAo meu orientador, Prof. Dr. [Nome], pela orientação...\n\nAos meus colegas e amigos, pelo companheirismo...\n\nÀ [Instituição], por proporcionar...',
    }
  }
];

module.exports = preTextualElements