document.addEventListener('DOMContentLoaded', function(){
	const overlay = document.getElementById('overlay');

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
		try {
			const response = await axios.post('/process-payment', { payType, phoneNumber });
			
			if(response.data.success){
				overlay.classList.add('hidden')
				showModal(true, response.data.message);
				if(response.data.redirectUrl){
					window.location.href = response.data.redirectUrl;
				}
			} else {
				overlay.classList.add('hidden')
				showModal(false, response.data.message);
			}
			setTimeout(hideModal, 3000);
		} catch (err) {
			overlay.classList.add('hidden')
			console.error(err);
			showModal(false, 'Falha ao processar o pagamento. Tente mais tarde!');
			setTimeout(hideModal, 3000);
		}
	}

	payBtn.addEventListener('click', () => {
		let selectedMethod = Array.from(payMethods).find(method => method.checked);
		if (!selectedMethod) {
			alert('Escolha um método de pagamento!');
			return;
		}
		currentPayType = selectedMethod.value; // Armazena o payType na variável global
		
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
		processPayment(currentPayType, phoneNumber); // Usa a variável global currentPayType
	});	
	
})