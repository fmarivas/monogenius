document.addEventListener('DOMContentLoaded', ()=>{
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
	
	function copyToClipboard() {
		const textField = document.getElementById('paraphrased-text');
		navigator.clipboard.writeText(textField.value)
			.then(() => {
				showModal(true, 'Texto copiado!')
				updateCopyButton(true);
				sendGAEvent('Monograph Creator', 'Content Copied');
			})
			.catch(err => {
				console.error('Erro ao copiar texto: ', err);
				sendGAEvent('Monograph Creator', 'Error while copying');
				showModal(false, 'Erro ao copiar texto!')
			});
	}
	
    function updateCopyButton(copied) {
        const button = document.getElementById('copy-btn');
        button.innerHTML = copied ? '<i class="fa-solid fa-check"></i> Copiado' : '<i class="fas fa-copy mr-2"></i> Copiar';
        button.classList.toggle('bg-green-500', copied);
        button.classList.toggle('text-white', copied);
        button.classList.toggle('bg-gray-200', !copied);
        button.classList.toggle('text-gray-600', !copied);

        if (copied) {
            setTimeout(() => updateCopyButton(false), 3000);
        }
    }
	
	document.getElementById('copy-btn').addEventListener('click', function(event) {
		event.preventDefault();
		copyToClipboard();
	});

    // Lógica JavaScript para chamar a API de parafrasear
    document.getElementById('paraphrase-btn').addEventListener('click', async () => {
      const originalText = document.getElementById('original-text').value;
	  
	  overlay.classList.remove('hidden')
	  startTimer()
	  
      try {
        const response = await fetch('/api/paraphrase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text: originalText })
        });

        const data = await response.json();
        document.getElementById('paraphrased-text').value = data.paraphrased;
		
		
      } catch (error) {
        console.error('Erro ao parafrasear:', error);
        showModal(false, 'Ocorreu um erro ao parafrasear o texto. Tente novamente mais tarde.');
      }finally{
		  overlay.classList.add('hidden')
		  stopTimer()
		  setTimeout(hideModal,3000)
	  }
    });

















})