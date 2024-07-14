document.addEventListener('DOMContentLoaded', function() {
    var suporteBtn = document.getElementById('suporte-btn');
    if (suporteBtn) {
        suporteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var numero = "258877734582";
            var mensagem = "Olá! Preciso de ajuda com o Monogenius.";
            var url = "https://api.whatsapp.com/send?phone=" + numero + "&text=" + encodeURIComponent(mensagem);
            window.open(url, '_blank');
        });
    }
});