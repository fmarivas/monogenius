document.addEventListener('DOMContentLoaded', () => {
	function sendGAEvent(category, action, label = null, value = null) {
	  gtag('event', action, {
		'event_category': category,
		'event_label': label,
		'value': value
	  });
	}

sendGAEvent('Plagiarism Checker', 'Page View');

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


if(document.getElementById('close-modal')){
	document.getElementById('close-modal').addEventListener('click', hideModal);	
}
	
// contar quantas palavras serao permitidas no input
function updateCount() {
    const textInput = document.getElementById('text-input').value;
    const words = textInput.trim().split(/\s+/).filter(Boolean).length;
    const chars = textInput.length;

    document.getElementById('word-count').textContent = words === 0 ? 'Limit: 0 / 500 palavras' : `Limit: ${words} / 500 palavras`;
    document.getElementById('char-count').textContent = `Total Caracteres: ${chars}`;
}

document.getElementById('text-input').addEventListener('input', updateCount);


//verificar o tamanh do documento que foi enviad
function validateFileSize(input) {
    const maxSize = 5 * 1024 * 1024; // 5 MB em bytes

    if (input.files && input.files[0]) {
        const fileSize = input.files[0].size;

        if (fileSize > maxSize) {
            alert('O arquivo selecionado excede o tamanho máximo permitido de 5 MB.');
            input.value = ''; // Limpa a seleção do arquivo
        }
    }
}

const overlay = document.getElementById('overlay');

async function uploadFile(files) {
    if (files && files[0]) {
        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);
		
		// Exibir o overlay
		overlay.classList.remove('hidden');
		startTimer();
		try{
			
			const responseToken = await axios.get('/get-public-token')
			const token = responseToken.data.token
			
			const config = {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: token,					
				}
			}
			
			const response = await axios.post('/api/read-file', formData, config)
						
			if(response.data.success){
				const fileContent = response.data.content;
				document.getElementById('text-input').value = fileContent;
				updateCount()	
				
				sendGAEvent('Plagiarism Checker', 'File Uploaded', file.name, file.size);
				
				overlay.classList.add('hidden');
				stopTimer();
			}else{
                const errorMessage = response.data.message || 'Ocorreu um erro ao ler o arquivo.';
                showModal(false, errorMessage);				
			}
			
		}catch(err){
			console.error(err)
			showModal(false,"Ocorreu um erro ao ler o arquivo.");
			
			sendGAEvent('Plagiarism Checker', 'Error', err.message);
		}
    }
}

document.getElementById('file-input').addEventListener('change', (evt)=>{
	validateFileSize(evt.target)
	uploadFile(evt.target.files)
})

//Resultado
	const btnResult = document.getElementById('result-btn')
	
	async function verificarPlagio() {
		sendGAEvent('Plagiarism Checker', 'Check Started', textInput.length);
		
		const textInput = document.getElementById('text-input').value;
		
		
		if(textInput == ''){
			alert('Não foi encontrado texto suficiente! Insira o texto para verificar')
			document.getElementById('text-input').focus()
			return
		}
		
        const formData = {
			textInput: textInput
		}
		
		try{

			const responseToken = await axios.get('/get-public-token')
			const token = responseToken.data.token
			
			const config = {
				headers: {
					Authorization: token,					
				}
			}
			// Exibir o overlay
			overlay.classList.remove('hidden');
			startTimer()
			const response = await axios.post('/api/plagiarism', formData, config)
			

			if (response.data.redirect) {
				window.location.href = response.data.redirect;
				return;
			}
			
			if(response.data.success){
				const resultado = response.data.result
				
				sendGAEvent('Plagiarism Checker', 'Result Displayed', 'Plagiarism Percentage', resultado.percentPlagiarism);
				sendGAEvent('Plagiarism Checker', 'Result Displayed', 'Source Count', resultado.sources.length);				
				
				overlay.classList.add('hidden');
				stopTimer()
				exibirResultado(resultado);	

			}else{
				overlay.classList.add('hidden');
				stopTimer()
				const resultadoDiv = document.getElementById('resultado');
				
				resultadoDiv.innerHTML = `<span class="text-red-500">${response.data.message}</span>`
				
				resultadoDiv.classList.remove('hidden')
			}
		}catch(err){
			console.error(err)
			overlay.classList.add('hidden');
			stopTimer()
			
			sendGAEvent('Plagiarism Checker', 'Error', err.message);
			exibirResultado('<span class="text-red-500">Não foi possivel processar o seu pedido</span>')
		}
	}


	function exibirResultado(resultado) {
		const resultadoDiv = document.getElementById('resultado');
		
		// Preencher percentual de plágio e contagem de fontes
		document.getElementById('percentPlagiarism').textContent = `${resultado.percentPlagiarism}%`;
		document.getElementById('sourceCount').textContent = resultado.sources.length;

		// Preencher correspondências
		const matchesDiv = document.getElementById('matches');
		matchesDiv.innerHTML = ''; // Limpar conteúdo anterior
		resultado.sources.forEach(source => {
			source.matches.forEach(match => {
				const matchElement = document.createElement('p');
				matchElement.innerHTML = `<span class="font-semibold">${match.matchText}</span> - Score: ${match.score}`;
				matchesDiv.appendChild(matchElement);
			});
		});

		// Preencher fontes
		const sourcesUl = document.getElementById('sources');
		sourcesUl.innerHTML = ''; // Limpar conteúdo anterior
		resultado.sources.forEach(source => {
			const li = document.createElement('li');
			li.innerHTML = `<a href="${source.url}" target="_blank" class="text-blue-600 hover:underline">${source.title}</a>`;
			sourcesUl.appendChild(li);
		});

		// Preencher citações
		const citationsUl = document.getElementById('citations');
		citationsUl.innerHTML = ''; // Limpar conteúdo anterior
		resultado.citations.forEach(citation => {
			const li = document.createElement('li');
			li.innerHTML = `${citation.title} - Score: ${citation.score}`;
			citationsUl.appendChild(li);
		});

		resultadoDiv.classList.remove('hidden');
	}
	
	
	btnResult.addEventListener('click', ()=>{
		document.getElementById('resultado').classList.add('hidden')
		verificarPlagio()
	})


//feedback
document.getElementById('feedback-reason-plagiarism').addEventListener('change', function() {
    if (this.value === '') {
        document.getElementById('feedback-other-plagiarism').classList.add('hidden');
    } else {
        document.getElementById('feedback-other-plagiarism').classList.remove('hidden');
    }
});

document.getElementById('submit-feedback-plagiarism').addEventListener('click', async () => {
    const feedbackType = document.getElementById('feedback-type-plagiarism').textContent;
    const reason = document.getElementById('feedback-reason-plagiarism').value;
    const otherReason = document.getElementById('feedback-other-plagiarism').value;
    const functionality = document.getElementById('functionality-plagiarism').value;
	
    const formData = new FormData()
	
	formData.append('functionality', functionality)
	formData.append('feedback_type', feedbackType)
	formData.append('reason', reason)
	formData.append('description', otherReason)
	
	try{
		const response = await axios.post('/api/feedback', formData)
		
		
		if(response.data.success){
			showModal(response.data.success, response.data.message)
			document.getElementById('feedback-modal-plagiarism').classList.add('hidden');
			
			sendGAEvent('Plagiarism Checker', 'Feedback Submitted', feedbackType);
			
			setTimeout(hideModal, 3000)	
		}else{
			showModal(response.data.success, response.data.message)			
			setTimeout(hideModal, 3000)	
			
			sendGAEvent('Plagiarism Checker', 'Feedback Failed', feedbackType);
		}
	}catch(err){
		console.error(err)
	}
});

document.getElementById('closeFeedback-modal-plagiarism').addEventListener('click', () => {
    document.getElementById('feedback-modal-plagiarism').classList.add('hidden');
});
	

document.getElementById('like-btn-plagiarism').addEventListener('click', () => showFeedbackModal('gostou'));
document.getElementById('dislike-btn-plagiarism').addEventListener('click', () => showFeedbackModal('não gostou'));

function showFeedbackModal(type) {
    document.getElementById('feedback-modal-plagiarism').classList.remove('hidden');
    document.getElementById('feedback-type-plagiarism').textContent = type;
}







});

