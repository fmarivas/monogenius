document.addEventListener('DOMContentLoaded', ()=>{	
    const overlay = document.getElementById('overlay');
    const fileInput = document.getElementById('dropzone-file');
    const fileInfo = document.getElementById('file-info');
    const questionsSection = document.getElementById('questions-section');
    const questionsList = document.getElementById('questions-list');
    const audioRecording = document.getElementById('audio-recording');

	//Area de audio
	const listenButton = document.getElementById('listen-button');
	const audioContainer = document.getElementById('feedback-audio-container');
	const waveform = document.getElementById('waveform');
	const playPauseButton = document.getElementById('play-pause');
	const currentTimeSpan = document.getElementById('current-time');
	const durationSpan = document.getElementById('duration');


	let wavesurfer;
	
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
			sendGAEvent('References Generator', 'Long Response Time', `${minutes}:${seconds % 60}`);
		}
	}

	document.getElementById('close-modal').addEventListener('click', hideModal);
	
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            fileInfo.textContent = `Arquivo selecionado: ${file.name}`;
            
            // Mostrar overlay de carregamento
            overlay.classList.remove('hidden');
            startTimer();
            
            try {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await fetch('/api/prepare-defense', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                

				if (result && result.redirect) {
					setTimeout(()=>{
						window.location.href = result.redirect
					}, 2000)
					return;
				}
                if (result.success) {
                    // Exibir perguntas
                    displayQuestions(result.questions);
                    questionsSection.classList.remove('hidden');
                    audioRecording.classList.remove('hidden');
                    
                    // Opcional: exibir resumo se disponível
                    if (result.summary) {
                        showModal(true, `Resumo: ${result.summary}`);
                    }
                } else {
                    showModal(false, result.message || 'Ocorreu um erro ao processar o arquivo.');
                }
            } catch (error) {
                console.error('Erro:', error);
                showModal(false, 'Ocorreu um erro ao processar o arquivo.');
            } finally {
                // Esconder overlay de carregamento
                overlay.classList.add('hidden');
				setTimeout(hideModal,3000)
                stopTimer();
            }
        }
    });

    function displayQuestions(questions) {
        questionsList.innerHTML = ''; // Limpa questões anteriores
        questions.forEach((question, index) => {
            const div = document.createElement('div');
            div.textContent = `${index + 1}. ${question}`;
            div.className = "p-3 bg-gray-100 rounded";
            questionsList.appendChild(div);
        });
    }
	

	let mediaRecorder;
	let audioChunks = [];

	document.getElementById('start-recording').addEventListener('click', startRecording);
	document.getElementById('stop-recording').addEventListener('click', stopRecording);

	async function startRecording() {
		audioChunks = [];
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			
			mediaRecorder.addEventListener('dataavailable', event => {
				audioChunks.push(event.data);
			});

			mediaRecorder.start();

			document.getElementById('start-recording').classList.add('hidden');
			document.getElementById('stop-recording').classList.remove('hidden');
		} catch (err) {
			console.error('Erro ao iniciar gravação:', err);
			showModal(false, 'Não foi possível iniciar a gravação. Verifique as permissões do microfone.');
		}
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
			mediaRecorder.addEventListener('stop', () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				const audioUrl = URL.createObjectURL(audioBlob);
				document.querySelector('#audio-player audio').src = audioUrl;
				
				document.getElementById('stop-recording').classList.add('hidden');
				document.getElementById('start-recording').classList.remove('hidden');
				document.getElementById('audio-player').classList.remove('hidden');
				
				// Aqui você pode chamar uma função para enviar o áudio para o servidor
				sendAudioToServer(audioBlob);
			});
		}
	}

	async function sendAudioToServer(audioBlob) {
		const formData = new FormData();
		formData.append('audio', audioBlob, 'response.wav');

		// Mostrar overlay de carregamento
		overlay.classList.remove('hidden');
		startTimer();
		
		try {
			const response = await fetch('/api/submit-audio-response', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (result && result.redirect) {
				setTimeout(()=>{
					window.location.href = result.redirect
				}, 2000)
				return;
			}
			
			if (result.success) {
				showModal(true, 'Resposta de áudio enviada. Processamento iniciado.');
				
				// Exibir a transcrição
				// displayTranscription(result.transcription);
				
				// Exibir o feedback
				// displayFeedback(result.feedback);
				
				// Exibir o feedback em áudio
				// if (result.audioFeedback) {
					// displayAudioFeedback(result.audioFeedback);
				// }
                // Start polling for job status
				
                pollJobStatus(result.jobId);
			} else {
				showModal(false, result.message || 'Erro ao processar a resposta de áudio.');
			}
		} catch (error) {
			console.error('Erro ao enviar áudio:', error);
			showModal(false, 'Erro ao enviar a resposta de áudio.');
		} finally {
			// Esconder overlay de carregamento
			overlay.classList.add('hidden');
			setTimeout(hideModal,3000)
			stopTimer();
		}
	}
	
	async function pollJobStatus(jobId) {
		const processingIndicator = document.getElementById('processing-indicator');
		processingIndicator.classList.remove('hidden');
		
		const pollInterval = setInterval(async () => {
			try {
				const response = await fetch(`/api/job-status/feedbackQueue/${jobId}`);
				const result = await response.json();
				
				if (result.state === 'completed') {
					clearInterval(pollInterval);
					displayFeedback(result.feedback);
					if (result.audioFeedback) {
						displayAudioFeedback(result.audioFeedback);
					}
					showModal(true, 'Processamento concluído!');
					processingIndicator.classList.add('hidden');
				} else if (result.state === 'failed') {
					clearInterval(pollInterval);
					showModal(false, 'Ocorreu um erro durante o processamento.');
					processingIndicator.classList.add('hidden');
				}
				// For 'active' or 'waiting' states, continue polling
			} catch (error) {
				console.error('Erro ao verificar status do job:', error);
				clearInterval(pollInterval);
				showModal(false, 'Erro ao verificar o status do processamento.');
				processingIndicator.classList.add('hidden');
			}
		}, 5000); // Poll every 5 seconds
	}
	
    function displayTranscription(transcription) {
        const transcriptionSection = document.getElementById('transcription-section');
        const transcriptionContent = document.getElementById('transcription-content');
        
        if (transcriptionContent) {
            transcriptionContent.textContent = transcription;
            transcriptionSection.classList.remove('hidden');
        } else {
            console.error('Elemento de transcrição não encontrado');
        }
    }

    function displayFeedback(feedback) {
        const feedbackSection = document.getElementById('feedback-section');
        const feedbackContent = document.getElementById('feedback-content');
        
        if (feedbackContent) {
            feedbackContent.textContent = feedback;
            feedbackSection.classList.remove('hidden');
        } else {
            console.error('Elemento de feedback não encontrado');
        }
    }	
	
	  function displayAudioFeedback(audioFeedbackBase64) {
		  const feedbackSection = document.getElementById('feedback-section');
		  
		feedbackSection.classList.remove('hidden');
		audioContainer.classList.remove('hidden');
		
		if (typeof WaveSurfer === 'undefined') {
			console.error('WaveSurfer não está definido. Verifique se a biblioteca foi carregada corretamente.');
			return;
		}

		if (!wavesurfer) {
		  wavesurfer = WaveSurfer.create({
			container: waveform,
			waveColor: 'violet',
			progressColor: 'purple',
			responsive: true,
			cursorWidth: 1,
			height: 100
		  });

		  // Converter o base64 para Blob
		  const audioBlob = base64ToBlob(audioFeedbackBase64, 'audio/mp3');
		  
		  // Criar uma URL para o Blob
		  const audioUrl = URL.createObjectURL(audioBlob);

		  // Carregar o áudio no WaveSurfer
			wavesurfer.load(audioUrl);

			wavesurfer.on('ready', function() {
			  durationSpan.textContent = formatTime(wavesurfer.getDuration());
			  wavesurfer.play(); // Iniciar a reprodução automaticamente
			  playPauseButton.textContent = 'Pause';
			});

		  wavesurfer.on('audioprocess', function() {
			currentTimeSpan.textContent = formatTime(wavesurfer.getCurrentTime());
		  });
		  
		  playPauseButton.addEventListener('click', function() {
			wavesurfer.playPause();
			this.textContent = wavesurfer.isPlaying() ? 'Pause' : 'Play';
		  });
		}
	  }

	  function base64ToBlob(base64, mimeType) {
		const byteCharacters = atob(base64);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
		  byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);
		return new Blob([byteArray], { type: mimeType });
	  }

	  function formatTime(timeInSeconds) {
		const minutes = Math.floor(timeInSeconds / 60);
		const seconds = Math.floor(timeInSeconds % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	  }
})