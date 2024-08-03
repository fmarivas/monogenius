document.addEventListener('DOMContentLoaded', ()=>{

    function sendGAEvent(category, action, label = null, value = null) {
        if (typeof gtag === 'function') {
            gtag('event', action, {
                'event_category': category,
                'event_label': label,
                'value': value
            });
        } else {
            console.warn('Google Analytics não está disponível');
        }
    }
	
	sendGAEvent('References Generator', 'Page View');
	
	const referenceForm = document.getElementById('referenceForm')
	const researchTopic = document.getElementById('researchTopic')
	const initialIdea = document.getElementById('initialIdea')
	
	const resultsContainer = document.getElementById('results')
	const referenceOutput = document.getElementById('referenceOutput')
	const overlay = document.getElementById('overlay')	
	
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
			sendGAEvent('References Generator', 'Long Response Time', `${minutes}:${seconds % 60}`);
		}
	}

	document.getElementById('close-modal').addEventListener('click', hideModal);
	
	researchTopic.addEventListener('focus', () => {
		sendGAEvent('References Generator', 'Input Focus', 'Research Topic');
	});

	initialIdea.addEventListener('focus', () => {
		sendGAEvent('References Generator', 'Input Focus', 'Initial Idea');
	});	
	
	const favoriteReferencesBtn = document.getElementById('favoriteReferences');

	function updateFavoriteButton(isFavorited) {
		if (isFavorited) {
			favoriteReferencesBtn.textContent = 'Desfavoritar Referências';
			favoriteReferencesBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
			favoriteReferencesBtn.classList.add('bg-gray-500', 'hover:bg-gray-600');
		} else {
			favoriteReferencesBtn.textContent = 'Favoritar Referências';
			favoriteReferencesBtn.classList.remove('bg-gray-500', 'hover:bg-gray-600');
			favoriteReferencesBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
		}
	}

	let isFavorited = false; // Variável global para rastrear o estado

	async function toggleFavoriteReferences() {
		const references = Array.from(document.querySelectorAll('#referenceOutput li')).map(li => li.textContent);
		const researchTopic = document.getElementById('researchTopic').value;
		
		if (references.length === 0 || !researchTopic) {
			showModal(false, "É necessário ter um tema de pesquisa e referências para favoritar/desfavoritar.");
			return;
		}
		
		overlay.classList.remove('hidden');
		startTimer();
		
		try {
			const action = isFavorited ? 'unfavorite' : 'favorite';
			const response = await axios.post(`/api/references/${action}`, { researchTopic, references });
			
			if (response.data.success) {
				isFavorited = !isFavorited; // Toggle o estado
				updateFavoriteButton(isFavorited);
				showModal(true, response.data.message);
				sendGAEvent('References Generator', `References ${action}d`, researchTopic, references.length);
			} else {
				showModal(false, response.data.message);
				sendGAEvent('References Generator', `References ${action} Failed`, researchTopic);
			}
		} catch (err) {
			console.error(err);
			showModal(false, `Erro ao ${isFavorited ? 'desfavoritar' : 'favoritar'} referências. Por favor, tente novamente.`);
			sendGAEvent('References Generator', `References ${isFavorited ? 'Unfavorite' : 'Favorite'} Error`, researchTopic);
		} finally {
			overlay.classList.add('hidden');
			stopTimer();
			setTimeout(hideModal, 3000);
		}
	}

	favoriteReferencesBtn.addEventListener('click', toggleFavoriteReferences);
	
	async function checkInitialFavoriteState() {
		const researchTopic = document.getElementById('researchTopic').value;
		if (!researchTopic) return;

		try {
			const response = await axios.get(`/api/references/checkFavorite?researchTopic=${encodeURIComponent(researchTopic)}`);
			isFavorited = response.data.isFavorited;
			updateFavoriteButton(isFavorited);
		} catch (err) {
			console.error('Erro ao verificar o estado inicial de favorito:', err);
		}
	}
	checkInitialFavoriteState();
	
	
	
	referenceForm.addEventListener('submit', async function(e){
		e.preventDefault()
		
		const languageSelect = document.getElementById('language');
		let language = languageSelect.value;
		
		// Interpretação da opção "ambos"
		if (language === 'both') {
			language = ['pt', 'en'];
		}
		
		const data = {
			researchTopic: researchTopic.value,
			initialIdea: initialIdea.value,
			language: language,
			typeOfFeature: 'referencesCreator',
		}
		
		sendGAEvent('References Generator', 'Form Submitted', researchTopic.value);
		
		overlay.classList.remove('hidden')
		startTimer()
		resultsContainer.classList.add('hidden');
		
		try{
			const response = await axios.post('/api/references', data)

			if (response.data && response.data.redirect) {
				setTimeout(()=>{
					window.location.href = response.data.redirect
				}, 1000)
				return;
			}
			
			if(response.data.success){
				showModal(true, response.data.message);
				overlay.classList.add('hidden');
				stopTimer()
				setTimeout(hideModal, 3000);
				
				referenceOutput.innerHTML = '';
				
				const ul = document.createElement('ul');
				ul.className = 'list-disc pl-5 space-y-2';				
				
				// Adicionar cada referência como um item da lista
				response.data.result.forEach(reference => {
					const li = document.createElement('li');
					li.textContent = reference;
					li.className = 'p-2 bg-white rounded shadow';
					ul.appendChild(li);
				});

				// Adicionar a lista completa ao referenceOutput
				referenceOutput.appendChild(ul);	
				
			 // Mostrar o container de resultados
				resultsContainer.classList.remove('hidden');	
				
				sendGAEvent('References Generator', 'References Generated', researchTopic.value, response.data.result.length);
			}else{
				showModal(false, response.data.message);
				overlay.classList.add('hidden');
				stopTimer()
				setTimeout(hideModal, 3000);
				
				sendGAEvent('References Generator', 'Generation Failed', researchTopic.value);
			}
		}catch(err){
			console.error(err)
			showModal(false, response.data.message);
			overlay.classList.add('hidden');
			stopTimer()
			setTimeout(hideModal, 3000);
			
			sendGAEvent('References Generator', 'Error', 'Server Error');
		}
	})
	
	
	// Feedback Functions
	function showFeedbackModal(type) {
		document.getElementById('feedback-modal-references').classList.remove('hidden');
		document.getElementById('feedback-type-references').textContent = type;
	}

	async function submitFeedback() {
		const feedbackType = document.getElementById('feedback-type-references').textContent;
		const reason = document.getElementById('feedback-reason-references').value;
		const otherReason = document.getElementById('feedback-other-references').value;
		const functionality = document.getElementById('functionality-references').value;
		
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
				document.getElementById('feedback-modal-references').classList.add('hidden');
				sendGAEvent('Reference Generator', 'Feedback Submitted', feedbackType);
			} else {
				showModal(response.data.success, response.data.message);
				sendGAEvent('Reference Generator', 'Feedback Failed', feedbackType);
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
	document.getElementById('like-btn-references').addEventListener('click', () => showFeedbackModal('gostou'));
	document.getElementById('dislike-btn-references').addEventListener('click', () => showFeedbackModal('não gostou'));

	document.getElementById('submit-feedback-references').addEventListener('click', submitFeedback);

	document.getElementById('closeFeedback-modal-references').addEventListener('click', () => {
		document.getElementById('feedback-modal-references').classList.add('hidden');
	});

	document.getElementById('feedback-reason-references').addEventListener('change', function() {
		const otherTextarea = document.getElementById('feedback-other-references');
		otherTextarea.classList.remove('hidden');
	})
	
	
	
	
	
})