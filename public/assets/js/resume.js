document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resumo-form');
    const textArea = document.getElementById('texto-completo');
    const fileInput = document.getElementById('upload-file');
    const resultadoSection = document.getElementById('resultado-section');
    const resumoTexto = document.getElementById('resumo-texto');
    const palavrasChave = document.getElementById('palavras-chave');
    const abstractTexto = document.getElementById('abstract-texto');
    const keywords = document.getElementById('keywords');

    fileInput.addEventListener('change', handleFileUpload);
    form.addEventListener('submit', handleSubmit);
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

	async function handleFileUpload(event) {
		const file = event.target.files[0];
		if (file) {
			const formData = new FormData();
			formData.append('file', file);
			
			overlay.classList.remove('hidden')
			startTimer()
			
			try {
				const response = await fetch('/api/read-file', {
					method: 'POST',
					body: formData
				});

				if (!response.ok) {
					throw new Error('Erro ao ler o arquivo');
				}

				const data = await response.json();

				if (data.success) {
					textArea.value = data.content;
				} else {
					showModal(false, data.message || 'Ocorreu um erro ao ler o arquivo.');
				}
			} catch (error) {
				console.error('Erro:', error);
				showModal(false, 'Ocorreu um erro ao ler o arquivo. Por favor, tente novamente.');
			}finally{
				overlay.classList.add('hidden')
				stopTimer()
				setTimeout(hideModal,3000)
			}
		}
	}

	async function handleSubmit(event) {
		event.preventDefault();

		const texto = textArea.value.trim();
		if (texto === '') {
			showModal(false, 'Por favor, insira um texto ou faça upload de um arquivo.');
			return;
		}

		overlay.classList.remove('hidden');
		startTimer();

		try {
			const response = await fetch('/api/generate-resume', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ texto: texto }),
			});

			if (!response.ok) {
				throw new Error('Erro ao gerar o resumo');
			}

			const data = await response.json();
			if (data.error) {
				showModal(false, data.message);
				if (data.redirect) {
					window.location.href = data.redirect;
				}
				return;
			}

			showModal(true, 'Resumo gerado com sucesso!');
			displayResults(data);
		} catch (error) {
			console.error('Erro:', error);
			showModal(false, 'Ocorreu um erro ao gerar o resumo. Por favor, tente novamente.');
		} finally {
			overlay.classList.add('hidden');
			stopTimer();
			setTimeout(hideModal, 3000);
		}
	}

	function displayResults(data) {
		resumoTexto.textContent = data.resumo;
		palavrasChave.textContent = data.palavrasChave.join(', ');
		abstractTexto.textContent = data.abstract;
		keywords.textContent = data.keywords.join(', ');
		resultadoSection.classList.remove('hidden');
	}
});