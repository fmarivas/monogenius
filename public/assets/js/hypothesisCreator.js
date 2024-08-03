document.addEventListener('DOMContentLoaded', ()=>{
	
	function sendGAEvent(category, action, label = null, value = null) {
	  gtag('event', action, {
		'event_category': category,
		'event_label': label,
		'value': value
	  });
	}
	
	sendGAEvent('Hypothesis Generator', 'Page View');
	
	const hypothesisForm = document.getElementById('hypothesisForm')
	const researchTopic = document.getElementById('researchTopic')
	const generalObjective = document.getElementById('generalObjective')
	const specificObjectives = document.getElementById('specificObjectives')
	const researchProblem = document.getElementById('researchProblem')
	const methodology = document.getElementById('methodology')
	
	const resultsContainer = document.getElementById('results')
	const hypothesisList = document.getElementById('hypothesisList')
	const overlay = document.getElementById('overlay')

	//Modal Success and Fail
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
			sendGAEvent('Hypothesis Generator', 'Long Response Time', `${minutes}:${seconds % 60}`);
		}
	}
	document.getElementById('close-modal').addEventListener('click', hideModal);
	
	hypothesisForm.addEventListener('submit', async function(e){
		e.preventDefault()
		
		sendGAEvent('Hypothesis Generator', 'Form Submitted');
		
		const data = {
			researchTopic: researchTopic.value,
			generalObjective: generalObjective.value,
			specificObjectives: specificObjectives.value,
			researchProblem: researchProblem.value,
			methodology: methodology.value,
			typeOfFeature: 'hypothesis'
		}
		
		overlay.classList.remove('hidden')
		startTimer()
		try{
			const response = await axios.post('/api/hypothesis', data)

			if (response.data && response.data.redirect) {
				setTimeout(()=>{
					window.location.href = response.data.redirect
				}, 1000)
				return;
			}
			
			if(response.data.success){
				
				resultsContainer.classList.remove('hidden')
				hypothesisList.innerHTML = ''; //limpa o quadro de resultados
				
				
				const result = response.data.result;
				
				sendGAEvent('Hypothesis Generator', 'Hypotheses Generated', 'Success', result.hipoteses.principais.length + result.hipoteses.alternativas.length + 1);
				// Função auxiliar para criar elementos de hipótese
				function createHypothesisElement(hypothesis, type) {
					const div = document.createElement('div');
					div.className = 'p-4 bg-gray-50 rounded-md mb-4';
					div.innerHTML = `
						<h3 class="font-bold text-lg mb-2">${type}</h3>
						<p><strong>Hipótese:</strong> ${hypothesis.hipotese}</p>
						<p><strong>Justificativa:</strong> ${hypothesis.justificativa}</p>
						<p><strong>Relação com objetivos:</strong> ${hypothesis.relacao_objetivos}</p>
						<p><strong>Implicações metodológicas:</strong> ${hypothesis.implicacoes_metodologia}</p>
					`;
					return div;
				}
				
				// Hipóteses principais
				result.hipoteses.principais.forEach((hypothesis, index) => {
					hypothesisList.appendChild(createHypothesisElement(hypothesis, `Hipótese Principal ${index + 1}`));
				});
				
				// Hipóteses alternativas
				result.hipoteses.alternativas.forEach((hypothesis, index) => {
					hypothesisList.appendChild(createHypothesisElement(hypothesis, `Hipótese Alternativa ${index + 1}`));
				});
				
				// Hipótese exploratória
				hypothesisList.appendChild(createHypothesisElement(result.hipoteses.exploratoria, "Hipótese Exploratória"));
				
				// Variáveis importantes
				const variablesDiv = document.createElement('div');
				variablesDiv.className = 'p-4 bg-gray-50 rounded-md mt-4';
				variablesDiv.innerHTML = `
					<h3 class="font-bold text-lg mb-2">Variáveis Importantes</h3>
					<ul class="list-disc pl-5">
						${result.variaveis_importantes.map(variable => `<li>${variable}</li>`).join('')}
					</ul>
				`;
				hypothesisList.appendChild(variablesDiv);

				showModal(true, response.data.message);
				overlay.classList.add('hidden');
				stopTimer()
				
				setTimeout(hideModal, 3000);
			} else {
				showModal(false, response.data.message);
				overlay.classList.add('hidden');
				stopTimer()
				setTimeout(hideModal, 3000);
				
				sendGAEvent('Hypothesis Generator', 'Generation Failed', response.data.message);
			}
		}catch(err){
			console.error(err)
			showModal(false, err.response.data.message || 'Erro de servidor. Tente mais tarde!')
			overlay.classList.add('hidden')
			stopTimer()
			setTimeout(hideModal, 3000)
			
			sendGAEvent('Hypothesis Generator', 'Server Error', err.message);
		}
		
		
		
	})
})