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
	
	referenceForm.addEventListener('submit', async function(e){
		e.preventDefault()
		
		const data = {
			researchTopic: researchTopic.value,
			initialIdea: initialIdea.value,
			typeOfFeature: 'referencesCreator',
		}
		
		sendGAEvent('References Generator', 'Form Submitted', researchTopic.value);
		
		overlay.classList.remove('hidden')
		startTimer()
		resultsContainer.classList.add('hidden');
		
		try{
			const response = await axios.post('/additionalFeatures', data)
			
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
	
	
	
	
	
	
	
	
})