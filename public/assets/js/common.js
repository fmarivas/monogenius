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
document.getElementById('close-modal').addEventListener('click', hideModal);
	
    const notificationBar = document.getElementById('notification-bar');
    // const closeButton = document.getElementById('close-notification');
    const updateLink = notificationBar.querySelector('a');
	
	if(document.getElementById('suporte-btn')){
		document.getElementById('suporte-btn').addEventListener('click', function() {
			var numero = "258877734582";
			var mensagem = "Olá! Preciso de ajuda com o Monogenius."; // Você pode personalizar esta mensagem
			var url = "https://api.whatsapp.com/send?phone=" + numero + "&text=" + encodeURIComponent(mensagem);
			window.open(url, '_blank');
		});			
	}
	
	
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


if(document.getElementById('file-input')){
	document.getElementById('file-input').addEventListener('change', (evt)=>{
		validateFileSize(evt.target)
		uploadFile(evt.target.files)
	})
}


	
})