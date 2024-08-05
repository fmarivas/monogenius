document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textField = document.querySelector('.editable');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const underlineBtn = document.getElementById('underline-btn');
    const unorderedListBtn = document.getElementById('unordered-list-btn');
    const orderedListBtn = document.getElementById('ordered-list-btn');
    const overlay = document.getElementById('overlay');
    const form = document.getElementById('formCreator');
    const temaInput = document.getElementById('tema');
    const ideiaInicialInput = document.getElementById('ideia-inicial');
    
    const referenciasContainer = document.getElementById('referencias-container');

    const fileInput = document.getElementById('manuais');
    const selectedFilesDiv = document.getElementById('selected-files');
    const fileInfo = document.getElementById('file-info');

    // Event Listeners
    boldBtn.addEventListener('click', () => formatText('bold'));
    italicBtn.addEventListener('click', () => formatText('italic'));
    underlineBtn.addEventListener('click', () => formatText('underline'));
    document.getElementById('copy-btn-create').addEventListener('click', copyToClipboard);
    document.getElementById('like-btn-create').addEventListener('click', () => showFeedbackModal('gostou'));
    document.getElementById('dislike-btn-create').addEventListener('click', () => showFeedbackModal('não gostou'));
    form.addEventListener('submit', handleFormSubmit);

    if (document.getElementById('close-modal')) {
        document.getElementById('close-modal').addEventListener('click', hideModal);
    }

    // Feedback-related event listeners
    setupFeedbackEventListeners();


    function setupFeedbackEventListeners() {
        document.getElementById('feedback-reason-create').addEventListener('change', function() {
            document.getElementById('feedback-other-create').classList.toggle('hidden', this.value === '');
        });

        document.getElementById('submit-feedback-create').addEventListener('click', submitFeedback);
        document.getElementById('closeFeedback-modal-create').addEventListener('click', () => {
            document.getElementById('feedback-modal').classList.add('hidden');
        });
    }


    // Timer
    let timerInterval;
    let startTime;

    // Functions
    function sendGAEvent(category, action, label = null, value = null) {
        gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'value': value
        });
    }

    function formatText(command) {
        document.execCommand(command, false, null);
        sendGAEvent('Monograph Creator', 'Formatting Used', command);
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

	function formatMonographyHTML(mono) {
		let formattedHTML = '';
		
		// Introdução
		formattedHTML += '<h1>1. Introdução</h1>';
		formattedHTML += `<h2>1.1 Contextualização</h2>${mono.contextualizacao.replace(/\n/g, '<br>')}<br><br>`;
		formattedHTML += `<h2>1.2 Problematização</h2>${mono.problematizacao.replace(/\n/g, '<br>')}<br><br>`;
		formattedHTML += `<h2>1.3 Justificativa</h2>${mono.justificativa.replace(/\n/g, '<br>')}<br><br>`;
		formattedHTML += '<h2>1.4 Objetivos</h2>';
		formattedHTML += `<h3>1.4.1 Objetivo Geral</h3>${mono.objetivo_geral.replace(/\n/g, '<br>')}<br><br>`;
		formattedHTML += '<h3>1.4.2 Objetivos Específicos</h3><ul>';
		mono.objetivos_especificos.forEach(obj => {
			formattedHTML += `<li> =>${obj.replace(/\n/g, '<br>')}</li>`;
		});
		formattedHTML += '</ul><br>';
		formattedHTML += `<h2>1.5 Delimitação da Pesquisa</h2>${mono.delimitacao_pesquisa.replace(/\n/g, '<br>')}<br><br>`;
		formattedHTML += `<h2>1.6 Estrutura do Trabalho</h2>${mono.estrutura_trabalho.replace(/\n/g, '<br>')}<br><br>`;

		// Revisão Bibliográfica
		// formattedHTML += '<h1>2. Revisão Bibliográfica</h1>';
		// formattedHTML += `${mono.revisao_bibliografica.replace(/\n/g, '<br>')}<br><br>`;

		return formattedHTML;
	}
	
    fileInput.addEventListener('change', function(e) {
        selectedFilesDiv.innerHTML = ''; // Limpa a lista anterior
        const files = Array.from(e.target.files);

        if (files.length > 0) {
            files.forEach(file => {
                const fileElement = document.createElement('div');
                fileElement.className = 'flex items-center space-x-2';
                fileElement.innerHTML = `
                    <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                    <span class="text-sm text-gray-600">${file.name}</span>
                `;
                selectedFilesDiv.appendChild(fileElement);
            });
        } else {
            fileInfo.textContent = 'Você pode fazer upload de manuais de apoio para ajudar na geração de referências bibliográficas.';
        }
    });
	
    function copyToClipboard() {
        navigator.clipboard.writeText(textField.textContent)
            .then(() => {
                updateCopyButton(true);
                sendGAEvent('Monograph Creator', 'Content Copied');
            })
            .catch(err => {
                console.error('Erro ao copiar texto: ', err);
                sendGAEvent('Monograph Creator', 'Error while copying');
            });
    }

    function updateCopyButton(copied) {
        const button = document.getElementById('copy-btn-create');
        button.innerHTML = copied ? '<i class="fa-solid fa-check"></i> Copiado' : '<i class="fas fa-copy mr-2"></i> Copiar';
        button.classList.toggle('bg-green-500', copied);
        button.classList.toggle('text-white', copied);
        button.classList.toggle('bg-gray-200', !copied);
        button.classList.toggle('text-gray-600', !copied);

        if (copied) {
            setTimeout(() => updateCopyButton(false), 3000);
        }
    }

    function saveContent() {
        const content = {
            tema: temaInput.value,
            ideiaInicial: ideiaInicialInput.value,
            content: textField.innerHTML,
            referencias: document.getElementById('referencias-lista').innerHTML
        };

        Object.entries(content).forEach(([key, value]) => {
            if (value) localStorage.setItem(`monografia${key.charAt(0).toUpperCase() + key.slice(1)}`, value);
        });
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        sendGAEvent('Monograph Creator', 'Form Submitted');

        if (!validateForm()) return;

        const formData = new FormData(form);
        overlay.classList.remove('hidden');
        startTimer();
        referenciasContainer.classList.add('hidden');

        try {
            const response = await axios.post('/api/create', formData);
            handleApiResponse(response);
        } catch (error) {
            console.error('Erro ao enviar dados:', error);
            showModal(false, error.response?.data?.message || 'Falha ao criar Monografia. Tente mais tarde!');
            sendGAEvent('Monograph Creator', 'Generation Error', error.message);
        } finally {
            overlay.classList.add('hidden');
            stopTimer();
			setTimeout(hideModal,3000)
        }
    }
	
    async function submitFeedback() {
        const feedbackData = {
            functionality: document.getElementById('functionality-create').value,
            feedback_type: document.getElementById('feedback-type-create').textContent,
            reason: document.getElementById('feedback-reason-create').value,
            description: document.getElementById('feedback-other-create').value
        };

        try {
            const response = await axios.post('/api/feedback', feedbackData);
            if (response.data.success) {
                showModal(true, response.data.message);
                document.getElementById('feedback-modal-create').classList.add('hidden');
                sendGAEvent('Monograph Creator', 'Feedback Submitted', feedbackData.feedback_type);
            } else {
                showModal(false, response.data.message);
            }
        } catch (err) {
            console.error(err);
            showModal(false, 'Erro ao enviar feedback');
        } finally {
            setTimeout(hideModal, 3000);
        }
    }

    function showFeedbackModal(type) {
        document.getElementById('feedback-modal-create').classList.remove('hidden');
        document.getElementById('feedback-type-create').textContent = type;
    }
    function validateForm() {
        if (!temaInput.value.trim()) {
            alert('Por favor, insira um tema.');
            temaInput.focus();
            return false;
        }
        if (!ideiaInicialInput.value.trim()) {
            alert('Por favor, insira uma ideia inicial.');
            ideiaInicialInput.focus();
            return false;
        }
        return true;
    }

    function handleApiResponse(response) {
        if (response.data.redirect) {
            window.location.href = response.data.redirect;
            return;
        }
		
		
        if (response.data.success) {
            referenciasContainer.classList.remove('hidden');
            sendGAEvent('Monograph Creator', 'Monograph Generated', 'Success');
            
			console.log(response.data.mono)
            const formattedMono = formatMonographyHTML(response.data.mono);
            textField.innerHTML = formattedMono;
            
            updateReferences(response.data.refer);
            showModal(true, response.data.message);
            saveContent();
        } else {
            showModal(false, response.data.message);
        }

        setTimeout(hideModal, 3000);
    }

    function updateReferences(references) {
        const referenciasList = document.getElementById('referencias-lista');
        if (referenciasList) {
            referenciasList.innerHTML = '';
            references.forEach(ref => {
                const li = document.createElement('li');
                li.textContent = ref;
                referenciasList.appendChild(li);
            });
        }
    }	
    function loadSavedContent() {
        const savedContent = {
            Tema: temaInput,
            IdeiaInicial: ideiaInicialInput,
            Content: textField,
            Referencias: document.getElementById('referencias-lista')
        };

        Object.entries(savedContent).forEach(([key, element]) => {
            const saved = localStorage.getItem(`monografia${key}`);
            if (saved) {
                if (element.tagName === 'INPUT') {
                    element.value = saved;
                } else {
                    element.innerHTML = saved;
                }
            }
        });

        if (localStorage.getItem('monografiaReferencias')) {
            referenciasContainer.classList.remove('hidden');
        }
    }


    // Autosave
    setInterval(saveContent, 30000);
    window.addEventListener('beforeunload', saveContent);

    // Load saved content on page load
    loadSavedContent();

    // Initial GA event
    sendGAEvent('Monograph Creator', 'Page View');

});
