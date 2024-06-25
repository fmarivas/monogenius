document.addEventListener('DOMContentLoaded', () => {
    const textField = document.querySelector('.editable');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const underlineBtn = document.getElementById('underline-btn');
    const unorderedListBtn = document.getElementById('unordered-list-btn');
    const orderedListBtn = document.getElementById('ordered-list-btn');
	const overlay = document.getElementById('overlay');
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

//FOrmatacao do texto do textField
	function formatText(command) {
		document.execCommand(command, false, null);
	}
	

    boldBtn.addEventListener('click', () => {
        formatText('bold')
    });

    italicBtn.addEventListener('click', () => {
        formatText('italic')
    });

    underlineBtn.addEventListener('click', () => {
        formatText('underline')
    });
	
	
//validaca dos campos de referencia
function formatMonographyHTML(mono) {
    let formattedHTML = '';

    formattedHTML += `<h1>Introdução</h1>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Contextualização</h2><p>${mono.contextualizacao}</p>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Problematização</h2><p>${mono.problematizacao}</p>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Justificativa</h2><p>${mono.justificativa}</p>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Objetivo Geral</h2><p>${mono.objetivo_geral}</p>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Objetivos Específicos</h2><ul>${mono.objetivos_especificos.map(obj => `<li>${obj}</li>`).join('')}</ul>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Delimitação da Pesquisa</h2><p>${mono.delimitacao_pesquisa}</p>`;
    formattedHTML += `<br>`;
    formattedHTML += `<h2>Estrutura do Trabalho</h2><p>${mono.estrutura_trabalho}</p>`;

    return formattedHTML;
}

const form = document.getElementById('formCreator');
const temaInput = document.getElementById('tema');
const ideiaInicialInput = document.getElementById('ideia-inicial');
const manuaisInput = document.getElementById('manuais');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Validar campos obrigatórios
  if (!temaInput.value.trim()) {
    alert('Por favor, insira um tema.');
    temaInput.focus();
    return;
  }

  if (!ideiaInicialInput.value.trim()) {
    alert('Por favor, insira uma ideia inicial.');
    ideiaInicialInput.focus();
    return;
  }

  // Criar um objeto FormData para enviar os dados
  const formData = new FormData();
  formData.append('tema', temaInput.value.trim());
  formData.append('ideiaInicial', ideiaInicialInput.value.trim());

  // Adicionar arquivos selecionados, se houver
  if (manuaisInput.files.length > 0) {
    Array.from(manuaisInput.files).forEach((file) => {
      formData.append('manuais', file);
    });
  }
  
  overlay.classList.remove('hidden')
  try {
    // Enviar os dados para o servidor usando Axios
	const responseToken = await axios.get('/get-public-token')
	const token = responseToken.data.token
	
		
    const response = await axios.post('/api/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
		Authorization: token,
      },
    });

    if(response.data.success){
		const formattedMono = formatMonographyHTML(response.data.mono);
		textField.innerHTML = formattedMono;
		overlay.classList.add('hidden')
		
		showModal(true, );
		setTimeout(hideModal, 3000)
		
	}else{
		overlay.classList.add('hidden')
		showModal(false, response.data.message);
		setTimeout(hideModal, 3000)
	}
    
  } catch (error) {
    console.error('Erro ao enviar dados:', error);
	showModal(false, error.response.data.message || 'Falha ao criar Monografia. Tente mais tarde!');
	overlay.classList.add('hidden')
	setTimeout(hideModal, 3000)
    
  }
});





	
});
