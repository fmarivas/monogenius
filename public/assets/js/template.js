document.addEventListener('DOMContentLoaded', () => {
	function sendGAEvent(category, action, label = null, value = null) {
	  gtag('event', action, {
		'event_category': category,
		'event_label': label,
		'value': value
	  });
	}

  // Controle de visibilidade das páginas e elementos
	document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
	  checkbox.addEventListener('change', function() {
		if (this.id.endsWith('Check')) {
		  const pageName = this.id.replace('Check', '');
		  const isVisible = this.checked;
		  const pageElement = document.getElementById(pageName + 'Page');
		  if (pageElement) {
			pageElement.style.display = isVisible ? 'block' : 'none';
		  }
		  
		  // Desabilitar/habilitar e desmarcar/marcar os checkboxes de conteúdo
		  const contentCheckboxes = document.querySelectorAll(`input[type="checkbox"][id^="${pageName}_"]`);
		  contentCheckboxes.forEach(contentCheckbox => {
			contentCheckbox.disabled = !isVisible;
			if (!isVisible) {
			  contentCheckbox.checked = false;
			  // Ocultar o elemento correspondente
			  const [_, elementName] = contentCheckbox.id.split('_');
			  const element = document.querySelector(`#${pageName}Page [data-element="${elementName}"]`);
			  if (element) {
				element.style.display = 'none';
			  }
			} else {
			  contentCheckbox.checked = true;
			  // Mostrar o elemento correspondente
			  const [_, elementName] = contentCheckbox.id.split('_');
			  const element = document.querySelector(`#${pageName}Page [data-element="${elementName}"]`);
			  if (element) {
				element.style.display = 'block';
			  }
			}
		  });

		  sendGAEvent('Page Visibility', isVisible ? 'Shown' : 'Hidden', pageName);
		} else {
		  const [pageName, elementName] = this.id.split('_');
		  let element;
		  if (elementName === 'local' || elementName === 'ano') {
			element = document.querySelector(`#${pageName}Page [data-element="localAno"]`);
		  } else {
			element = document.querySelector(`#${pageName}Page [data-element="${elementName}"]`);
		  }
		  if (element) {
			const isVisible = this.checked;
			element.style.display = isVisible ? 'block' : 'none';
			sendGAEvent('Element Visibility', isVisible ? 'Shown' : 'Hidden', `${pageName}_${elementName}`);
		  }
		}
	  });
	});
	
  // Placeholder text para elementos editáveis
  document.querySelectorAll('[contenteditable]').forEach(element => {
    element.addEventListener('focus', function() {
      if (this.textContent.trim() === this.getAttribute('data-placeholder')) {
        this.textContent = '';
      }
    });
    element.addEventListener('blur', function() {
      if (this.textContent.trim() === '') {
        this.textContent = this.getAttribute('data-placeholder');
		sendGAEvent('Document', 'Content Edited', this.getAttribute('data-element'));
      }
    });
    
    element.addEventListener('mouseover', function() {
      this.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'; // Leve highlight azul
    });
    element.addEventListener('mouseout', function() {
      this.style.backgroundColor = '';
    }); 
  });

  // Funcionalidade de zoom
  document.getElementById('zoom').addEventListener('input', function(e) {
    const zoom = e.target.value / 100;
    document.querySelectorAll('.pageA4').forEach(page => {
      page.style.transform = `scale(${zoom})`;
    });
	sendGAEvent('Document', 'Zoom Adjusted', 'Zoom Level', Math.round(zoom * 100));
  });

  // Funcionalidade de download
  document.getElementById('downloadBtn').addEventListener('click', function() {
    // Implemente a lógica de download aqui
    alert('Funcionalidade de download a ser implementada');
	sendGAEvent('Document', 'Download Initiated');
  });

  // Upload de logo
  document.getElementById('uploadLogoBtn').addEventListener('click', function() {
    document.getElementById('logoUpload').click();
  });

  document.getElementById('logoUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
		sendGAEvent('Document', 'Logo Uploaded', file.type);
      const reader = new FileReader();
      reader.onload = function(e) {
        const logoContainers = document.querySelectorAll('[data-element="logo"]');
        logoContainers.forEach(container => {
          const img = container.querySelector('img');
          if (img) {
            img.src = e.target.result;
            container.classList.remove('border-2', 'border-dashed');
          }
        });
      }
      reader.readAsDataURL(file);
    }
  });

  // Melhorar acessibilidade
  document.querySelectorAll('[contenteditable]').forEach(element => {
    element.setAttribute('role', 'textbox');
    element.setAttribute('aria-label', element.getAttribute('data-placeholder'));
  });

  // Função para ajustar a altura dos elementos de texto
  function adjustTextAreaHeight(element) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }

  // Ajustar altura dos elementos de texto ao carregar e ao digitar
  document.querySelectorAll('[contenteditable]').forEach(element => {
    adjustTextAreaHeight(element);
    element.addEventListener('input', function() {
      adjustTextAreaHeight(this);
    });
  });

  // Permitir arrastar e soltar elementos (se necessário)
  let draggedElement = null;

  document.querySelectorAll('.draggable').forEach(element => {
    element.addEventListener('dragstart', function(e) {
      draggedElement = this;
      e.dataTransfer.setData('text/plain', '');
    });

    element.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    element.addEventListener('drop', function(e) {
      e.preventDefault();
      if (draggedElement !== this) {
        const parent = this.parentNode;
        const placeholder = document.createElement('div');
        parent.insertBefore(placeholder, draggedElement);
        parent.insertBefore(draggedElement, this);
        parent.insertBefore(this, placeholder);
        parent.removeChild(placeholder);
		
		sendGAEvent('Document', 'Element Reordered', draggedElement.getAttribute('data-element'));
      }
    });
  });
});