document.addEventListener('DOMContentLoaded', function() {
	function sendGAEvent(category, action, label = null, value = null) {
	  gtag('event', action, {
		'event_category': category,
		'event_label': label,
		'value': value
	  });
	}
	
    var suporteBtn = document.getElementById('suporte-btn');
    if (suporteBtn) {
        suporteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var numero = "258877734582";
            var mensagem = "Olá! Preciso de ajuda com o Monogenius.";
            var url = "https://api.whatsapp.com/send?phone=" + numero + "&text=" + encodeURIComponent(mensagem);
            
			sendGAEvent('Support', 'WhatsApp Support Clicked');
			
			window.open(url, '_blank');
        });
    }
});