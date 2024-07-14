document.addEventListener('DOMContentLoaded', ()=>{
	const themeGeneratorForm = document.getElementById('themeGeneratorForm')
	const studyArea = document.getElementById('studyArea')
	const specificInterest = document.getElementById('specificInterest')
	const academicLevel = document.getElementById('academicLevel')
	const themeCount = document.getElementById('themeCount')

	const resultsContainer = document.getElementById('results')
	const themeOutput = document.getElementById('themeOutput')
	const overlay = document.getElementById('overlay')	
	
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
	
	
	themeGeneratorForm.addEventListener('submit', async function(e){
		e.preventDefault()
		
		const data = {
			studyArea: studyArea.value,
			specificInterest: specificInterest.value,
			academicLevel: academicLevel.value,
			themeCount: themeCount.value,
			typeOfFeature: 'themeCreator',
		}
		
		overlay.classList.remove('hidden')
		resultsContainer.classList.add('hidden');
		
		try{
			const response = await axios.post('/additionalFeatures', data)
			
			if(response.data.success){
				console.log(response.data.result)
				showModal(true, response.data.message);
				overlay.classList.add('hidden');
				setTimeout(hideModal, 3000);
				
				themeOutput.innerHTML = '';

				// Adicionar os temas ao themeOutput
				response.data.result.themes.forEach(theme => {
					const themeElement = document.createElement('p');
					themeElement.textContent = theme;
					themeElement.className = 'p-3 bg-white rounded shadow';
					themeOutput.appendChild(themeElement);
				});		
				
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