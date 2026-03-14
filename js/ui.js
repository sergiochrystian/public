// Função para mostrar erro (Loja Fechada)
export function mostrarFeedbackErro() {
    const modalErro = document.getElementById('modal-erro');
    if (modalErro) modalErro.style.display = 'flex';
}

// Função global para fechar o erro
window.fecharErro = () => {
    const modalErro = document.getElementById('modal-erro');
    if (modalErro) modalErro.style.display = 'none';
};