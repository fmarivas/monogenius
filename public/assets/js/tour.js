document.addEventListener('DOMContentLoaded', function() {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      cancelIcon: {
        enabled: true
      },
      classes: 'shadow-md bg-indigo-600',
      scrollTo: { behavior: 'smooth', block: 'center' }
    }
  });

  tour.addStep({
    id: 'welcome',
    text: 'Bem-vindo ao Gerador de Temas de Pesquisa! Vamos te guiar através dos principais elementos desta página.',
    attachTo: {
      element: 'h1',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Próximo',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'study-area',
    text: 'Aqui você deve inserir sua área de estudo principal, como por exemplo "Psicologia".',
    attachTo: {
      element: '#studyArea',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: tour.back
      },
      {
        text: 'Próximo',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'specific-interest',
    text: 'Neste campo, você pode especificar um interesse mais focado dentro da sua área de estudo, como "Psicologia Cognitiva". Isto ajudará a gerar temas mais relevantes.',
    attachTo: {
      element: '#specificInterest',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: tour.back
      },
      {
        text: 'Próximo',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'academic-level',
    text: 'Selecione seu nível acadêmico aqui. Isso ajudará a ajustar a complexidade dos temas sugeridos.',
    attachTo: {
      element: '#academicLevel',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: tour.back
      },
      {
        text: 'Próximo',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'theme-count',
    text: 'Defina quantos temas você gostaria que fossem gerados.',
    attachTo: {
      element: '#themeCount',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: tour.back
      },
      {
        text: 'Próximo',
        action: tour.next
      }
    ]
  });

  tour.addStep({
    id: 'generate-button',
    text: 'Quando estiver pronto, clique aqui para gerar seus temas de pesquisa!',
    attachTo: {
      element: 'button[type="submit"]',
      on: 'bottom'
    },
    buttons: [
      {
        text: 'Voltar',
        action: tour.back
      },
      {
        text: 'Concluir',
        action: tour.complete
      }
    ]
  });

  tour.start();
});