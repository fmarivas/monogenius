document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/user-progress')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            updateOverallProgress(data.progress);
            updateTimeline(data.timeline);
            updateNextSteps(data.timeline);
            updateStats(data);
			updateSuggestedFeatures(data.suggestedFeatures);
        })
        .catch(error => console.error('Erro ao carregar o progresso:', error));

function updateOverallProgress(progress) {
    const progressBar = document.getElementById('overall-progress-bar');
    const progressText = document.getElementById('overall-progress-text');
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${progress}% concluído`;
}

function updateSuggestedFeatures(suggestedFeatures) {
  const suggestedFeaturesContainer = document.getElementById('suggested-features');
  if (!suggestedFeaturesContainer) return;

  suggestedFeaturesContainer.innerHTML = '<h2 class="text-2xl font-semibold mb-4">Funcionalidades Sugeridas</h2>';

  suggestedFeatures.forEach(feature => {
    const featureElement = document.createElement('div');
    featureElement.className = 'mb-4 p-4 bg-white rounded-lg shadow';
    featureElement.innerHTML = `
      <h3 class="text-lg font-semibold mb-2">${feature.name}</h3>
      <p class="text-gray-600 mb-2">${feature.description}</p>
      <a href="${feature.link}" class="text-blue-600 hover:text-blue-800">Acessar ferramenta →</a>
    `;
    suggestedFeaturesContainer.appendChild(featureElement);
  });
}

function updateTimeline(timeline) {
    const timelineContainer = document.getElementById('timeline-container');
    timelineContainer.innerHTML = '';

    const currentDate = new Date();

    timeline.forEach((stage, index) => {
        const stageElement = document.createElement('div');
        stageElement.className = 'flex flex-col items-center';

        const stageDate = new Date(stage.startDate);
        const isCurrentOrPast = stageDate <= currentDate;

        stageElement.innerHTML = `
            <div class="w-4 h-4 rounded-full ${isCurrentOrPast ? 'bg-blue-600' : 'bg-gray-300'} mb-2"></div>
            <div class="text-xs font-semibold text-center">${stage.name}</div>
            <div class="text-xs text-gray-500">${formatDate(stage.startDate)} - ${formatDate(stage.endDate)}</div>
        `;
        timelineContainer.appendChild(stageElement);

        if (index < timeline.length - 1) {
            const lineElement = document.createElement('div');
            lineElement.className = `flex-grow h-0.5 ${isCurrentOrPast ? 'bg-blue-600' : 'bg-gray-300'} mt-2`;
            timelineContainer.appendChild(lineElement);
        }
    });
}

function updateNextSteps(timeline) {
    const nextStepsContainer = document.getElementById('next-steps');
    const currentStage = timeline.find(stage => new Date(stage.startDate) <= new Date() && new Date() <= new Date(stage.endDate));
    const nextStages = timeline.slice(timeline.indexOf(currentStage) + 1);

    nextStepsContainer.innerHTML = nextStages.map(stage => `
        <li class="mb-2">${stage.name} (${formatDate(stage.startDate)} - ${formatDate(stage.endDate)})</li>
    `).join('');
}

function updateStats(data) {
    const statsContainer = document.getElementById('stats-container');
    statsContainer.innerHTML = `
        <p class="mb-2"><strong>Fase Atual:</strong> ${data.currentPhase || 'Não definida'}</p>
        <p class="mb-2"><strong>Progresso:</strong> ${data.progress}%</p>
        <p class="mb-2"><strong>Data Prevista de Conclusão:</strong> ${data.expectedCompletionDate ? formatDate(data.expectedCompletionDate) : 'Não definida'}</p>
    `;
}

function formatDate(dateString) {
    if (!dateString) return 'Data não definida';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}


//Lembretes
function fetchAndDisplayReminders() {
  fetch('/api/reminders')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.reminders.length > 0) {
        const remindersList = document.getElementById('reminders-list');
        remindersList.innerHTML = '';
        data.reminders.forEach(reminder => {
          const li = document.createElement('li');
          li.className = 'px-4 py-4 sm:px-6';
          li.innerHTML = `
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-indigo-600 truncate">${reminder.message}</p>
              <div class="ml-2 flex-shrink-0 flex">
                <p class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  ${new Date(reminder.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          `;
          remindersList.appendChild(li);
        });
      } else {
        document.getElementById('reminders-container').style.display = 'none';
      }
    })
    .catch(error => console.error('Erro ao buscar lembretes:', error));
}

// Chame esta função quando a página carregar
fetchAndDisplayReminders();

})