document.addEventListener('DOMContentLoaded', () => {
// contar quantas palavras serao permitidas no input
function updateCount() {
    const textInput = document.getElementById('text-input').value;
    const words = textInput.trim().split(/\s+/).filter(Boolean).length;
    const chars = textInput.length;

    document.getElementById('word-count').textContent = words === 0 ? 'Limit: 0 / 500 palavras' : `Limit: ${words} / 500 palavras`;
    document.getElementById('char-count').textContent = `Total Caracteres: ${chars}`;
}

document.getElementById('text-input').addEventListener('input', updateCount);

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
			alert('Ocorreu um erro ao ler o arquivo.');
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



});

