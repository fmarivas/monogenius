document.addEventListener('DOMContentLoaded', () => {
	const overlay = document.getElementById('overlay')
    // Utility Functions
    function sendGAEvent(category, action, label = null, value = null) {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value
        });
    }

    function showModal(success, message) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modalIcon = document.getElementById('modal-icon');

        modalTitle.textContent = success ? 'Sucesso' : 'Erro';
        modalIcon.classList.toggle('text-green-500', success);
        modalIcon.classList.toggle('text-red-500', !success);
        modalMessage.textContent = message;
        modal.classList.remove('invisible');
    }

    function hideModal() {
        document.getElementById('modal').classList.add('invisible');
    }

    // Timer Functions
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

        if (seconds >= 120 && seconds % 30 === 0) {
            showModal(false, "A resposta está demorando mais que o esperado. Por favor, aguarde.");
        }
    }

    // Word Count Function
    function updateCount() {
        const textInput = document.getElementById('text-input').value;
        const words = textInput.trim().split(/\s+/).filter(Boolean).length;
        const chars = textInput.length;

        document.getElementById('word-count').textContent = `${words === 1 ? '1 palavra' : `${words} palavras`}`;
        document.getElementById('char-count').textContent = `Total Caracteres: ${chars}`;
    }

    // File Upload Functions
    function validateFileSize(input) {
        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (input.files && input.files[0] && input.files[0].size > maxSize) {
            showModal(false, 'O arquivo selecionado excede o tamanho máximo permitido de 5 MB.');
            input.value = '';
            setTimeout(hideModal, 3000);
        }		
    }

    async function uploadFile(files) {
        if (!files || !files[0]) return;

        const file = files[0];
        const formData = new FormData();
        formData.append('file', file);

        overlay.classList.remove('hidden');
        startTimer();

        try {
            const response = await axios.post('/api/read-file', formData);

            if (response.data.success) {
				sendGAEvent('Plagiarism Checker', 'File Uploaded', file.name, file.size);
				
				showModal(true, "Arquivo lido com sucesso!");

				document.getElementById('text-input').value = response.data.content;
				updateCount()
            } else {
                showModal(false, response.data.message || 'Ocorreu um erro ao ler o arquivo.');
            }
        } catch (err) {
            console.error(err);
            showModal(false, "Ocorreu um erro ao ler o arquivo.");
            sendGAEvent('Plagiarism Checker', 'Error', err.message);
        } finally {
            stopTimer();
            overlay.classList.add('hidden');
            setTimeout(hideModal, 3000);
        }
    }

	// Adicionar event listener para reabrir o modal
	document.getElementById('reopen-modal').addEventListener('click', () => {
	  modal.classList.remove('hidden');
	});

    // Plagiarism Check Function
    async function verificarPlagio() {
        const textInput = document.getElementById('text-input').value;
        
        if(textInput === ''){
            showModal(true, 'Não foi encontrado texto suficiente! Insira o texto para verificar');
            document.getElementById('text-input').focus();
            setTimeout(hideModal, 3000);
            return;
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
				
				exibirResultado(resultado);	

			}else{
				const resultadoDiv = document.getElementById('resultado');
				
				resultadoDiv.innerHTML = `<span class="text-red-500">${response.data.message}</span>`
				
				resultadoDiv.classList.remove('hidden')
			}
		}catch(err){
			console.error(err)
			
			sendGAEvent('Plagiarism Checker', 'Error', err.message);
			exibirResultado('<span class="text-red-500">Não foi possivel processar o seu pedido</span>')
        }finally {
            stopTimer();
            overlay.classList.add('hidden');
            setTimeout(hideModal, 3000);
        }
    }

    // Result Display Function
    function exibirResultado(resultado) {
        const resultadoDiv = document.getElementById('resultado');
        
		const percentPlagiarismElement = document.getElementById('percentPlagiarism');
		if (percentPlagiarismElement) {
		  percentPlagiarismElement.textContent = `${resultado.percentPlagiarism}%`;
		}
        document.getElementById('sourceCount').textContent = resultado.sources.length;

        const matchesDiv = document.getElementById('matches');
        matchesDiv.innerHTML = '';
				
		// Armazenar os matchTexts encontrados
		const matchTexts = [];

		// Iterar sobre os matches encontrados
		resultado.sources.forEach(source => {
			source.matches.forEach(match => {
			  matchTexts.push(match.matchText);
			});
		});

		// Obter o texto do campo de entrada do usuário
		const textInput = document.getElementById('text-input').value.trim().split(/\s+/);

		// Criar o conteúdo do modal
		const modalContent = document.getElementById('modal-content');
		modalContent.innerHTML = '';

		matchTexts.forEach(matchText => {
		const matchWords = matchText.trim().split(/\s+/);
		const matchStartIndex = textInput.findIndex(word => word === matchWords[0]);
		const matchEndIndex = matchStartIndex + matchWords.length - 1;

		const matchElement = document.createElement('p');
		matchElement.innerHTML = textInput
		  .map((word, index) => {
			if (index >= matchStartIndex && index <= matchEndIndex) {
			  return `<span class="bg-red-200 text-red-800 font-semibold px-1">${word}</span>`;
			} else {
			  return word;
			}
		  })
		  .join(' ');
		modalContent.appendChild(matchElement);
		});

		// Exibir o modal
		const modal = document.getElementById('match-div')
		modal.classList.remove('hidden');

		// Adicionar event listener para fechar o modal
		document.getElementById('close-modal-matches').addEventListener('click', () => {
			modal.classList.add('hidden');
		});


        const sourcesUl = document.getElementById('sources');
        sourcesUl.innerHTML = '';
        resultado.sources.forEach(source => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${source.url}" target="_blank" class="text-blue-600 hover:underline">${source.title}</a>`;
            sourcesUl.appendChild(li);
        });

        const citationsUl = document.getElementById('citations');
        citationsUl.innerHTML = '';
        resultado.citations.forEach(citation => {
            const li = document.createElement('li');
            li.innerHTML = `${citation.title}`;
            citationsUl.appendChild(li);
        });

        resultadoDiv.classList.remove('hidden');
    }

    // Feedback Functions
    function showFeedbackModal(type) {
        document.getElementById('feedback-modal-plagiarism').classList.remove('hidden');
        document.getElementById('feedback-type-plagiarism').textContent = type;
    }

    async function submitFeedback() {
        const feedbackType = document.getElementById('feedback-type-plagiarism').textContent;
        const reason = document.getElementById('feedback-reason-plagiarism').value;
        const otherReason = document.getElementById('feedback-other-plagiarism').value;
        const functionality = document.getElementById('functionality-plagiarism').value;
        
        const formData = new FormData();
        formData.append('functionality', functionality);
        formData.append('feedback_type', feedbackType);
        formData.append('reason', reason);
        formData.append('description', otherReason);
        
        try {
            const response = await axios.post('/api/feedback', formData);
            
            if(response.data.success){
                showModal(response.data.success, response.data.message);
                document.getElementById('feedback-modal-plagiarism').classList.add('hidden');
                sendGAEvent('Plagiarism Checker', 'Feedback Submitted', feedbackType);
            } else {
                showModal(response.data.success, response.data.message);
                sendGAEvent('Plagiarism Checker', 'Feedback Failed', feedbackType);
            }
            
        } catch(err) {
            console.error(err);
            showModal(false, "Erro ao enviar feedback");
        }finally {
            stopTimer();
            overlay.classList.add('hidden');
            setTimeout(hideModal, 3000);
        }
    }

    // Event Listeners
    sendGAEvent('Plagiarism Checker', 'Page View');

    if(document.getElementById('close-modal')){
        document.getElementById('close-modal').addEventListener('click', hideModal);    
    }

    document.getElementById('text-input').addEventListener('input', updateCount);

    document.getElementById('file-input').addEventListener('change', (evt) => {
        validateFileSize(evt.target);
        uploadFile(evt.target.files);
    });

    document.getElementById('result-btn').addEventListener('click', () => {
        document.getElementById('resultado').classList.add('hidden');
        verificarPlagio();
    });

    document.getElementById('feedback-reason-plagiarism').addEventListener('change', function() {
        document.getElementById('feedback-other-plagiarism').classList.toggle('hidden', this.value === '');
    });

    document.getElementById('submit-feedback-plagiarism').addEventListener('click', submitFeedback);

    document.getElementById('closeFeedback-modal-plagiarism').addEventListener('click', () => {
        document.getElementById('feedback-modal-plagiarism').classList.add('hidden');
    });

    document.getElementById('like-btn-plagiarism').addEventListener('click', () => showFeedbackModal('gostou'));
    document.getElementById('dislike-btn-plagiarism').addEventListener('click', () => showFeedbackModal('não gostou'));
});