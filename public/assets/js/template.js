document.addEventListener('DOMContentLoaded', () => {
  // Controle de visibilidade das páginas e elementos
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      if (this.id.endsWith('Check')) {
        const pageName = this.id.replace('Check', 'Page');
        document.getElementById(pageName).style.display = this.checked ? 'block' : 'none';
      } else {
        const [pageName, elementName] = this.id.split('_');
        const element = document.querySelector(`#${pageName}Page [data-element="${elementName}"]`);
        if (element) {
          element.style.display = this.checked ? 'block' : 'none';
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
  });

  // Funcionalidade de download
  document.getElementById('downloadBtn').addEventListener('click', function() {
    // Implemente a lógica de download aqui
    alert('Funcionalidade de download a ser implementada');
  });

  // Upload de logo
  document.getElementById('uploadLogoBtn').addEventListener('click', function() {
    document.getElementById('logoUpload').click();
  });

  document.getElementById('logoUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
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
      }
    });
  });
});