const pageDetails = {
    main: {
        dashboard: { name: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    },
    features: {
        themes: { name: 'Gerador de Temas', icon: 'fas fa-lightbulb', description: 'Obtenha sugestões de temas inovadores para sua pesquisa.' },
        create: { name: 'Criar Monografia', icon: 'fas fa-pen-fancy' },
        plagiarism: { name: 'Verificador de Plágio', icon: 'fas fa-search' },
        defense: { name: 'Preparar Defesa', icon: 'fas fa-shield-alt', description: 'Prepare-se para sua defesa de monografia com perguntas geradas por IA.' },
    },
    cta: {
        pricing: { name: 'Planos e Preços', icon: 'fas fa-fire' },
    },
    bottom: {
        favorites: { name: 'Favoritos', icon: 'fas fa-star' },
        support: { name: 'Suporte', icon: 'fas fa-headset' },
        settings: { name: 'Configurações', icon: 'fas fa-cog' }
    },
    additionalFeatures: {
        template: { name: 'Templates', icon: 'fas fa-file-alt' },
        references: { name: 'Gerador de Referências', icon: 'fas fa-book', description: 'Crie referências bibliográficas automaticamente.' },
        hypothesis: { name: 'Gerador de Hipóteses', icon: 'fas fa-flask', description: 'Formule hipóteses para sua pesquisa de forma assistida.' },
		resume: { name: 'Gerador de Resumo', icon: 'fas fa-file-alt', description: 'Crie resumos acadêmicos automaticamente para seu trabalho.' },
    }        
};

module.exports = pageDetails;