document.addEventListener('DOMContentLoaded', () => {
    function sendGAEvent(category, action, label = null, value = null) {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value
        });
    }

	
    const themeGeneratorForm = document.getElementById('themeGeneratorForm');
    const studyArea = document.getElementById('studyArea');
    const specificInterest = document.getElementById('specificInterest');
    const academicLevel = document.getElementById('academicLevel');
    const themeCount = document.getElementById('themeCount');

    const resultsContainer = document.getElementById('results');
    const themeOutput = document.getElementById('themeOutput');
    const overlay = document.getElementById('overlay');    

    // Modal Success and Fail
    function showModal(success, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalIcon = document.getElementById('modal-icon');

        if (success) {
            modalTitle.textContent = 'Sucesso';
            modalIcon.classList.remove('text-red-500');
            modalIcon.classList.add('text-green-500');
        } else {
            modalTitle.textContent = 'Erro';
            modalIcon.classList.remove('text-green-500');
            modalIcon.classList.add('text-red-500');
        }

        modalMessage.textContent = message;
        modal.classList.remove('invisible');
    }

    function hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('invisible');
    }

    let timerInterval;
    let startTime;

    function startTimer() {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
    }

    function updateTimer() {
        const elapsedTime = Date.now() - startTime;
        const seconds = Math.floor(elapsedTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
        document.getElementById('timer').textContent = formattedTime;

        // Aviso após 2 minutos (120 segundos)
        if (seconds >= 120 && seconds % 30 === 0) { // Avisa a cada 30 segundos após 2 minutos
            showModal(false, "A resposta está demorando mais que o esperado. Por favor, aguarde.");
        }
    }

	// Feedback Functions
	function showFeedbackModal(type) {
		document.getElementById('feedback-modal-themes').classList.remove('hidden');
		document.getElementById('feedback-type-themes').textContent = type;
	}

	async function submitFeedback() {
		const feedbackType = document.getElementById('feedback-type-themes').textContent;
		const reason = document.getElementById('feedback-reason-themes').value;
		const otherReason = document.getElementById('feedback-other-themes').value;
		const functionality = document.getElementById('functionality-themes').value;
		
		const formData = new FormData();
		formData.append('functionality', functionality);
		formData.append('feedback_type', feedbackType);
		formData.append('reason', reason);
		formData.append('description', otherReason);
		
        overlay.classList.remove('hidden');
        startTimer();
		
		try {
			const response = await axios.post('/api/feedback', formData);
			
			if(response.data.success){
				showModal(response.data.success, response.data.message);
				document.getElementById('feedback-modal-themes').classList.add('hidden');
				sendGAEvent('Theme Generator', 'Feedback Submitted', feedbackType);
			} else {
				showModal(response.data.success, response.data.message);
				sendGAEvent('Theme Generator', 'Feedback Failed', feedbackType);
			}
			
		} catch(err) {
			console.error(err);
			showModal(false, "Erro ao enviar feedback");
		} finally {
			stopTimer();
			overlay.classList.add('hidden');
			setTimeout(hideModal, 3000);
		}
	}

	// Event Listeners
	document.getElementById('like-btn-themes').addEventListener('click', () => showFeedbackModal('gostou'));
	document.getElementById('dislike-btn-themes').addEventListener('click', () => showFeedbackModal('não gostou'));
	document.getElementById('submit-feedback-themes').addEventListener('click', submitFeedback);
	document.getElementById('closeFeedback-modal-themes').addEventListener('click', () => {
		document.getElementById('feedback-modal-themes').classList.add('hidden');
	});
	document.getElementById('feedback-reason-themes').addEventListener('change', function() {
		const otherReason = document.getElementById('feedback-other-themes');
		otherReason.classList.remove('hidden');
	});
    async function selectTheme(index, theme) {
        sendGAEvent('Theme Generator', 'Theme Selected', theme);

    }

    async function favoriteTheme(index, theme) {
        sendGAEvent('Theme Generator', 'Theme Favorited', theme);
		
        overlay.classList.remove('hidden');
        startTimer();
		
        try {
            const response = await axios.post('/api/themes/favoriteTheme', { theme });
			
            if (response.data.success) {
                console.log('Tema adicionado aos favoritos com sucesso');
                showModal(true, response.data.message);

                updateFavoriteButton(index, true);
            } else {
                console.error('Falha ao favoritar tema');
                showModal(false, response.data.message);
            }
        } catch (error) {
            console.error('Erro ao favoritar tema:', error);
            showModal(false, 'Erro ao favoritar tema. Por favor, tente novamente.');
        } finally {
			overlay.classList.add('hidden');
			stopTimer();
        }
    }

    function updateFavoriteButton(index, isFavorited) {
        const button = document.querySelectorAll('.favorite-button')[index];
        if (isFavorited) {
            button.textContent = 'Desfavoritar';
            button.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            button.classList.add('bg-gray-500', 'hover:bg-gray-600');
        } else {
            button.textContent = 'Favoritar';
            button.classList.remove('bg-gray-500', 'hover:bg-gray-600');
            button.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        }
    }

    document.getElementById('close-modal').addEventListener('click', hideModal);

    themeGeneratorForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const data = {
            studyArea: studyArea.value,
            specificInterest: specificInterest.value,
            academicLevel: academicLevel.value,
            themeCount: themeCount.value,
            typeOfFeature: 'themeCreator',
        };
        
        sendGAEvent('Theme Generator', 'Form Submitted', studyArea.value, parseInt(themeCount.value));
        
        overlay.classList.remove('hidden');
        startTimer();
        resultsContainer.classList.add('hidden');
        
        try {
            const response = await axios.post('/additionalFeatures', data);
            
            if (response.data.success) {
                showModal(true, response.data.message);

                sendGAEvent('Theme Generator', 'Themes Generated', studyArea.value, response.data.result.themes.length);
                
                themeOutput.innerHTML = '';
                response.data.result.themes.forEach((theme, index) => {
                    const themeContainer = document.createElement('div');
                    themeContainer.className = 'p-3 bg-white rounded shadow mb-4 flex justify-between items-center';
                    
                    const themeText = document.createElement('p');
                    themeText.textContent = theme;
                    themeText.className = 'flex-grow';
                    
                    const buttonContainer = document.createElement('div');
                    buttonContainer.className = 'flex space-x-2';
                    
                    const selectButton = document.createElement('button');
                    selectButton.textContent = 'Selecionar';
                    selectButton.className = 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors';
                    selectButton.onclick = () => selectTheme(index, theme);
                    
                    const favoriteButton = document.createElement('button');
                    favoriteButton.textContent = 'Favoritar';
                    favoriteButton.className = 'favorite-button px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors';
                    favoriteButton.onclick = () => favoriteTheme(index, theme);
                    
                    // buttonContainer.appendChild(selectButton);
                    buttonContainer.appendChild(favoriteButton);
                    
                    themeContainer.appendChild(themeText);
                    themeContainer.appendChild(buttonContainer);
                    
                    themeOutput.appendChild(themeContainer);
                });
                
                resultsContainer.classList.remove('hidden');
            } else {
                showModal(false, response.data.message);

                sendGAEvent('Theme Generator', 'Generation Failed', studyArea.value);
            }
        } catch (err) {
            console.error(err);
            showModal(false, err.response?.data?.message || 'Erro de servidor. Tente mais tarde!');

            
            sendGAEvent('Theme Generator', 'Error', 'Server Error');
        }finally{
			overlay.classList.add('hidden');
			stopTimer();
            setTimeout(hideModal, 3000);
		}
    });


	const showAdvancedOptionsBtn = document.getElementById('showAdvancedOptions');
	const advancedOptionsSection = document.getElementById('advancedOptions');
	const suggestKeywordsBtn = document.getElementById('suggestKeywords');
	const keywordsInput = document.getElementById('keywords');
	const studyAreaInput = document.getElementById('studyArea');
	const specificInterestInput = document.getElementById('specificInterest');

    showAdvancedOptionsBtn.addEventListener('click', function() {
        advancedOptionsSection.classList.toggle('hidden');
        showAdvancedOptionsBtn.textContent = advancedOptionsSection.classList.contains('hidden') 
            ? 'Mostrar opções avançadas' 
            : 'Ocultar opções avançadas';
    });

   suggestKeywordsBtn.addEventListener('click', async function() {
		const studyArea = studyAreaInput.value;
		const specificInterest = specificInterestInput.value;
		
		if (!studyArea) {
			showModal(true,'Por favor, preencha pelo menos a área de estudo antes de gerar palavras-chave.');
			return;
		}
		
		overlay.classList.remove('hidden')
		startTimer()
		
		try {
			const response = await axios.post('/api/keywordsGen', {
				studyArea: studyArea,
				specificInterest: specificInterest
			});

			if (response.data && Array.isArray(response.data)) {
				keywordsInput.value = response.data.join(', ');
			} else {
				showModal(false, 'Resposta inválida do servidor');
			}
		} catch (error) {
			console.error('Erro ao gerar palavras-chave:', error);
			showModal(false,'Ocorreu um erro ao gerar palavras-chave. Por favor, tente novamente.');
		}finally{
			overlay.classList.add('hidden')
			stopTimer()
		}
	});

});