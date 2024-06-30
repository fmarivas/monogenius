document.addEventListener('DOMContentLoaded', () => {
	function gerarCapa() {
		// Obter valores dos campos de entrada
		const logoInput = document.getElementById('logo')
		const instituicao = document.getElementById('instituicao').value;
		const tema = document.getElementById('tema').value;
		const autor = document.getElementById('autor').value;
		const supervisor = document.getElementById('supervisor').value;
		const local = document.getElementById('local').value;
		const mes = document.getElementById('mes').value;
		const ano = document.getElementById('ano').value;

		// Adicionar logo se disponível
		if (logoInput.files && logoInput.files[0]) {
			const reader = new FileReader();
			reader.onload = function(e) {
				const logoContainer = document.getElementById('logoContainer');
				logoContainer.innerHTML = ''
				const img = document.createElement('img');
				img.src = e.target.result;
				img.width = 100;
				img.height = 100;
				logoContainer.appendChild(img);
			};
			reader.readAsDataURL(logoInput.files[0]);
		} 
			// Adicionar o restante do conteúdo sem logo
			adicionarConteudo(instituicao, tema, autor, supervisor, local, mes, ano);
		

		// Abrir o modal
		abrirModal();
	}
		
	function adicionarConteudo(instituicao, tema, autor, supervisor, local, mes, ano) {
		document.getElementById('instituicaoContainer').textContent = instituicao;
		document.getElementById('temaContainer').innerHTML = `<span class="font-bold">${tema}</span>`;
		document.getElementById('autorContainer').innerHTML = `<span class="font-bold">Autor:</span> ${autor}`;
		document.getElementById('supervisorContainer').innerHTML = `<span class="font-bold">Supervisor:</span> ${supervisor}`;
		document.getElementById('dataContainer').textContent = `${local}, ${mes} de ${ano}`;
	}		

	function abrirModal() {
		const modal = document.getElementById('modal-template');
		modal.classList.remove('hidden');
	}


	function fecharModal() {
		const modal = document.getElementById('modal-template');
		modal.classList.add('hidden');
	}

	function refazerPersonalizacao() {
		fecharModal();
		document.getElementById('logo').value = ''
		document.getElementById('instituicao').value = ''
		document.getElementById('tema').value = ''
		document.getElementById('autor').value = ''
		document.getElementById('supervisor').value = ''
		document.getElementById('local').value = ''
		document.getElementById('mes').value = ''
		document.getElementById('ano').value = ''
	} 


	const formElement = document.getElementById('dataForm');
	// Função para validar os inputs
	function validateInputs() {
		const inputs = document.querySelectorAll('.inputTemplate');
		let isValid = true;
		let firstEmptyInput = null;

		inputs.forEach(input => {
			if (input.value.trim() === '') {
				isValid = false;
				input.classList.add('border-red-500');
				if (!firstEmptyInput) {
					firstEmptyInput = input;
				}
			} else {
				input.classList.remove('border-red-500');
			}
		});

		if (firstEmptyInput) {
			firstEmptyInput.focus();
		}
		return isValid;
	}

	//Moodal Success and Fail
	function showModal(success, message) {
		const modal = document.getElementById('modalMessage');
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
		const modal = document.getElementById('modalMessage');
		modal.classList.add('invisible');
	}

// Adicionar evento de input para cada campo
document.querySelectorAll('.inputTemplate').forEach(input => {
    input.addEventListener('input', function() {
		if(input.value.trim() === ''){
			this.classList.add('border-red-500');			
		}else{
			this.classList.remove('border-red-500');			
		}
    });
});

// Evento do botão create
const logoInput = document.getElementById('logo');
document.getElementById('create').addEventListener('click', () => {
    if (validateInputs()) {
        if (logoInput.files.length === 0) {
            if (confirm('Você não selecionou um logo. Deseja gerar a capa sem o logo da instituição?')) {
                gerarCapa();
            }
        } else {
            gerarCapa();
        }
    } else {
		showModal(false, 'Por favor, preencha todos os campos')
		setTimeout(hideModal, 3000)
    }
});
document.getElementById('downloadModal').addEventListener('click', async () => {
    formElement.submit();
});


document.getElementById('redoModal').addEventListener('click', refazerPersonalizacao)
document.getElementById('closeModal').addEventListener('click', fecharModal)
 
});
