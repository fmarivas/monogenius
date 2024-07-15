document.addEventListener('DOMContentLoaded', function(){
	const overlay = document.getElementById('overlay');

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

	//Processando pagamento
	const payBtn = document.getElementById('pay-btn');
	const payMethods = document.querySelectorAll('input[name="payment"]');
	const phoneModal = document.getElementById('phoneModal');
	const phoneInput = document.getElementById('phoneNumber');
	const confirmPhoneBtn = document.getElementById('confirmPhone');

	let currentPayType; // Variável global para armazenar o payType

	function showPhoneModal() {
		phoneModal.classList.remove('hidden');
	}

	function hidePhoneModal() {
		phoneModal.classList.add('hidden');
	}

	function validatePhoneNumber(phone) {
		const phoneRegex = /^258(84|85)\d{7}$/;
		return phoneRegex.test(phone);
	}

	async function processPayment(payType, phoneNumber) {
		overlay.classList.remove('hidden')
		startTimer()
		
		sendGAEvent('Checkout', 'Payment Processing Started', payType);
		
		try {
			const response = await axios.post('/process-payment', { payType, phoneNumber });
			
			if(response.data.success){
				overlay.classList.add('hidden')
				stopTimer()
				showModal(true, response.data.message);
				
				sendGAEvent('Checkout', 'Payment Successful', payType, response.data.amount);
				
				if(response.data.redirectUrl){
					window.location.href = response.data.redirectUrl;
				}
			} else {
				overlay.classList.add('hidden')
				stopTimer()
				showModal(false, response.data.message);
				
				sendGAEvent('Checkout', 'Payment Failed', payType, response.data.errorMessage);
			}
			setTimeout(hideModal, 3000);
		} catch (err) {
			overlay.classList.add('hidden')
			stopTimer()
			console.error(err);
			showModal(false, 'Falha ao processar o pagamento. Tente mais tarde!');
			
			setTimeout(hideModal, 3000);
			sendGAEvent('Checkout', 'Payment Error', payType, 'Server Error');
		}
	}

	payBtn.addEventListener('click', () => {
		let selectedMethod = Array.from(payMethods).find(method => method.checked);
		if (!selectedMethod) {
			alert('Escolha um método de pagamento!');
			return;
		}
		currentPayType = selectedMethod.value; // Armazena o payType na variável global
		
		sendGAEvent('Checkout', 'Payment Method Selected', currentPayType);
		
		if(currentPayType.toLowerCase() === 'mpesa' || currentPayType.toLowerCase() === 'emola'){
			showPhoneModal();
		}
	});

	confirmPhoneBtn.addEventListener('click', () => {
		const phoneNumber = phoneInput.value.trim();
		if (!validatePhoneNumber(phoneNumber)) {
			alert('Por favor, insira um número de celular válido (258 seguido de 84 ou 85 e mais 7 dígitos).');
			return;
		}
		hidePhoneModal();
		
		sendGAEvent('Checkout', 'Phone Number Confirmed', currentPayType);
		
		processPayment(currentPayType, phoneNumber); // Usa a variável global currentPayType
	});	
	
})