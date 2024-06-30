document.addEventListener('DOMContentLoaded', ()=>{
//Moodal Success and Fail
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

document.getElementById('close-modal').addEventListener('click', hideModal);
	
    const notificationBar = document.getElementById('notification-bar');
    // const closeButton = document.getElementById('close-notification');
    const updateLink = notificationBar.querySelector('a');
	
    document.getElementById('suporte-btn').addEventListener('click', function() {
        var numero = "258877734582";
        var mensagem = "Olá! Preciso de ajuda com o Monogenius."; // Você pode personalizar esta mensagem
        var url = "https://api.whatsapp.com/send?phone=" + numero + "&text=" + encodeURIComponent(mensagem);
        window.open(url, '_blank');
    });	
	
	
	//funcao para verificar novas atualizacoes ao usuario
	async function checkForUpdates() {
		try {
			const response = await axios.get('/api/verify-updates');
			
			if (response.data.success) {
				checkNotificationStatus()
			}
			
		} catch (err) {
			console.error('Erro ao verificar atualizações:', err);
		}
	}

	checkForUpdates()
	
	// Função para verificar se o usuário já viu a notificação
	async function checkNotificationStatus() {
		try{
			const response = await axios.get('/api/check-notification-status')
			
			if(response.data.seen){
				notificationBar.classList.add('hidden');
			}else{
				notificationBar.classList.remove('hidden');
			}
		}catch(err){
			console.error(err)
		}
	}
	
	// Função para marcar a notificação como vista
	updateLink.addEventListener('click', async function (e){
		e.preventDefault();
		
		try{
			const response = await axios.post('/api/mark-notification-seen')
			
			if(response.data.success){
				checkNotificationStatus()
				notificationBar.classList.add('hidden')//remova a barra de notificacao
				window.location.href = response.data.url;
			}else{
				notificationBar.classList.remove('hidden')//mostre a barra de notificacao
			}
		}catch(err){
			console.error(err)
		}
	})	
	
//feedback
document.getElementById('feedback-reason').addEventListener('change', function() {
    if (this.value === '') {
        document.getElementById('feedback-other').classList.add('hidden');
    } else {
        document.getElementById('feedback-other').classList.remove('hidden');
    }
});

document.getElementById('submit-feedback').addEventListener('click', async () => {
    // Aqui você pode implementar a lógica para enviar o feedback para o servidor
    const feedbackType = document.getElementById('feedback-type').textContent;
    const reason = document.getElementById('feedback-reason').value;
    const otherReason = document.getElementById('feedback-other').value;
    const functionality = document.getElementById('functionality').value;
	
    const formData = new FormData()
	
	formData.append('functionality', functionality)
	if(feedbackType){
		formData.append('feedback_type', feedbackType)		
	}
	formData.append('reason', reason)
	formData.append('description', otherReason)
	
	try{
		console.log(functionality)
		console.log(feedbackType)
		console.log(reason)
		console.log(otherReason)
		const response = await axios.post('/api/feedback', formData)
		
		if(response.data.success){
			showModal(response.data.success, response.data.message)
			document.getElementById('feedback-modal').classList.add('hidden');
			
			setTimeout(hideModal, 3000)	
		}else{
			showModal(response.data.success, response.data.message)			
			setTimeout(hideModal, 3000)	
		}
	}catch(err){
		console.error(err)
	}
});

document.getElementById('closeFeedback-modal').addEventListener('click', () => {
	document.getElementById('feedback-modal').classList.add('hidden');
});

document.getElementById('like-btn').addEventListener('click', () => showFeedbackModal('gostou'));
document.getElementById('dislike-btn').addEventListener('click', () => showFeedbackModal('não gostou'));

function showFeedbackModal(type) {
    document.getElementById('feedback-modal').classList.remove('hidden');
    document.getElementById('feedback-type').textContent = type;
}
















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
		
		try{
			// Exibir o overlay
			overlay.classList.remove('hidden');
			
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
				updateCount();	
				
				overlay.classList.add('hidden');
			}else{
                const errorMessage = response.data.message || 'Ocorreu um erro ao ler o arquivo.';
                alert(errorMessage);				
			}
			
		}catch(err){
			console.error(err)
			alert("Ocorreu um erro ao ler o arquivo.");
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

			const response = await axios.post('/api/plagiarism', formData, config)
			
			if(response.data.success){
				const resultado = response.data.result
				
				
				overlay.classList.add('hidden');
				exibirResultado(resultado);	

			}else{
				overlay.classList.add('hidden');
				const resultadoDiv = document.getElementById('resultado');
				
				resultadoDiv.innerHTML = `<span class="text-red-500">${response.data.message}</span>`
				
				resultadoDiv.classList.remove('hidden')
			}
		}catch(err){
			console.error(err)
			overlay.classList.add('hidden');
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
document.getElementById('feedback-reason').addEventListener('change', function() {
    if (this.value === '') {
        document.getElementById('feedback-other').classList.add('hidden');
    } else {
        document.getElementById('feedback-other').classList.remove('hidden');
    }
});

document.getElementById('submit-feedback').addEventListener('click', async () => {
    // Aqui você pode implementar a lógica para enviar o feedback para o servidor
    // Por exemplo:
    const feedbackType = document.getElementById('feedback-type').textContent;
    const reason = document.getElementById('feedback-reason').value;
    const otherReason = document.getElementById('feedback-other').value;
    const functionality = document.getElementById('functionality').value;
	
    const formData = new FormData()
	
	formData.append('functionality', functionality)
	formData.append('feedback_type', feedbackType)
	formData.append('reason', reason)
	formData.append('description', otherReason)
	
	try{
		const response = await axios.post('/api/feedback', formData)
		
		
		if(response.data.success){
			showModal(response.data.success, response.data.message)
			document.getElementById('feedback-modal').classList.add('hidden');
			
			setTimeout(hideModal, 3000)	
		}else{
			showModal(response.data.success, response.data.message)			
			setTimeout(hideModal, 3000)	
		}
	}catch(err){
		console.error(err)
	}
});

document.getElementById('closeFeedback-modal').addEventListener('click', () => {
    document.getElementById('feedback-modal').classList.add('hidden');
});
	

document.getElementById('like-btn').addEventListener('click', () => showFeedbackModal('gostou'));
document.getElementById('dislike-btn').addEventListener('click', () => showFeedbackModal('não gostou'));

function showFeedbackModal(type) {
    document.getElementById('feedback-modal').classList.remove('hidden');
    document.getElementById('feedback-type').textContent = type;
}
	
})