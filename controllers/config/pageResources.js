const pageResources = {
	plagiarism: {
		css: ['/static/assets/css/plagiarism.css'],
		js: ['/static/assets/js/plagiarism.js']
	},
	template: {
		js: ['/static/assets/js/template.js'],
		inlineStyles: `
			[contenteditable]:focus {
				outline: none;
				border-color: #3b82f6; /* Tailwind's blue-500 */
			}
			
		  .content {
			font-family: 'Times New Roman', Times, serif;
		  }
		  
		  .inactive{
			  display: none
		  }
		`,
	},
	create: {
		css: [
			'/static/assets/css/simple-editor.css',
			'/static/assets/css/create-styles.css'
		],
		js: [
			'/static/assets/js/create.js',
			'/static/assets/js/simple-editor.js',
		],
		inlineStyles: `
			#modal {
			  visibility: visible;
			  opacity: 1;
			  transition: opacity 0.3s ease;
			}
			#modal.invisible {
			  visibility: hidden;
			  opacity: 0;
			}
			#modal-icon.text-green-500 {
			  color: #22c55e;
			}
			#modal-icon.text-red-500 {
			  color: #ef4444;
			}
			
			.loader {
				border: 5px solid #f3f3f3;
				border-top: 5px solid #3498db;
				border-radius: 50%;
				width: 50px;
				height: 50px;
				animation: spin 1s linear infinite;
				margin: 20px auto;
			}

			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`
	},
	settings: {
		js: ['/static/assets/js/settings.js']
	},
	support: {
		js: ['/static/assets/js/support.js']
	},
	pricing:{
		js: ['/static/assets/js/checkout.js']
	},
	hypothesis:{
		js: ['/static/assets/js/hypothesisCreator.js'],
	},
	themes:{
		js: ['/static/assets/js/themeCreator.js'],
	},
	references:{
		js: ['/static/assets/js/referencesCreator.js']
	},
	favorites:{
		js: ['/static/assets/js/favorites.js'],
	},
	defense:{
		js: ['/static/assets/js/defense.js'],
		inlineStyles: `
			.loader {
				border: 5px solid #f3f3f3;
				border-top: 5px solid #3498db;
				border-radius: 50%;
				width: 50px;
				height: 50px;
				animation: spin 1s linear infinite;
				margin: 20px auto;
			}

			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
			
			#waveform {
			  width: 100%;
			  height: 100px;
			  background: #f0f0f0;
			}
		`
	},
	resume:{
		js: ['/static/assets/js/resume.js'],
	},
	paraphrase:{
		js: ['/static/assets/js/paraphrase.js'],
	},
	progress:{
		js: ['/static/assets/js/progress.js'],
	},
};

module.exports = pageResources;