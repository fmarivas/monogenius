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
  }
  // Adicione outros elementos pré-textuais aqui
];

module.exports = preTextualElements