import { adicionarAoCarrinho } from './cart.js';

// ... dentro da sua função de abrir modal ou no evento do botão:
document.getElementById('btn-adicionar-carrinho').onclick = () => {
    const qtd = parseInt(document.getElementById('qtd-input').value);
    const produtoAtual = {
        nome: document.getElementById('modal-titulo').innerText,
        preco: parseFloat(document.getElementById('modal-preco').innerText.replace('R$ ', '')),
        // Adicione aqui a imagem e descrição se quiser salvar no carrinho
    };

    adicionarAoCarrinho(produtoAtual, qtd);
    window.fecharModal();
};

// Função para mostrar erro (Loja Fechada)
export function mostrarFeedbackErro() {
    const modalErro = document.getElementById('modal-erro');
    modalErro.style.display = 'flex';
}

// Função global para fechar o erro
window.fecharErro = () => {
    document.getElementById('modal-erro').style.display = 'none';
};