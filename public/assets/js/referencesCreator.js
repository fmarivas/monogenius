document.addEventListener('DOMContentLoaded', ()=>{
	
	const referenceForm = document.getElementById('referenceForm')
	const researchTopic = document.getElementById('researchTopic')
	const initialIdea = document.getElementById('initialIdea')
	
	const resultsContainer = document.getElementById('results')
	const referenceOutput = document.getElementById('referenceOutput')
	const overlay = document.getElementById('overlay')	
	
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

	document.getElementById('close-modal').addEventListener('click', hideModal);
	
	
	referenceForm.addEventListener('submit', async function(e){
		e.preventDefault()
		
		const data = {
			researchTopic: researchTopic.value,
			initialIdea: initialIdea.value,
			typeOfFeature: 'referencesCreator',
		}
		
		overlay.classList.remove('hidden')
		resultsContainer.classList.add('hidden');
		
		try{
			const response = await axios.post('/additionalFeatures', data)
			
			if(response.data.success){
				showModal(true, response.data.message);
				overlay.classList.add('hidden');
				setTimeout(hideModal, 3000);
				
				referenceOutput.innerHTML = '';
				
				const ul = document.createElement('ul');
				ul.className = 'list-disc pl-5 space-y-2';				
				
				// Adicionar cada referência como um item da lista
				response.data.result.forEach(reference => {
					const li = document.createElement('li');
					li.textContent = reference;
					li.className = 'p-2 bg-white rounded shadow';
					ul.appendChild(li);
				});

				// Adicionar a lista completa ao referenceOutput
				referenceOutput.appendChild(ul);	
				
			 // Mostrar o container de resultados
				resultsContainer.classList.remove('hidden');				
			}else{
				showModal(false, response.data.message);
				overlay.classList.add('hidden');
				setTimeout(hideModal, 3000);
			}
		}catch(err){
			console.error(err)
			showModal(false, response.data.message);
			overlay.classList.add('hidden');
			setTimeout(hideModal, 3000);			
		}
	})
	
	
	
	
	
	
	
	
})