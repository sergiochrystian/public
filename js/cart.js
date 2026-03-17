import { estaAberto } from './api.js';
import { mostrarFeedbackErro } from './ui.js';

// Estado global do carrinho
let carrinho = carregarCarrinho();

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function carregarCarrinho() {
    const salvo = localStorage.getItem('carrinho');
    try {
        return salvo ? JSON.parse(salvo) : [];
    } catch (e) {
        return [];
    }
}

// Função principal exposta para o HTML
export function adicionarAoCarrinho(itemOuId, quantidade = 1) {
    let produto;

    console.log("Tentando adicionar:", itemOuId);

    // Lógica para aceitar tanto o objeto completo quanto apenas o ID (do cache da API)
    if (typeof itemOuId === 'string') {
        produto = window.produtosCache ? window.produtosCache[itemOuId] : null;
    } else {
        produto = itemOuId;
    }

    if (!produto) {
        console.error("Produto não encontrado no cache! ID:", itemOuId);
        return;
    }

    // Garante que o ID exista para a comparação
    const idIdentificador = produto.id || produto.nome;
    const itemExistente = carrinho.find(item => (item.id || item.nome) === idIdentificador);

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        // Garante que o preço seja um número
        const precoNum = typeof produto.preco === 'string'
            ? parseFloat(produto.preco.replace(',', '.'))
            : produto.preco;

        carrinho.push({ ...produto, preco: precoNum, quantidade });
    }

    console.log("Carrinho atualizado:", carrinho);
    salvarCarrinho();
    atualizarRodape();
    mostrarFeedbackSucesso();
}

// Vincula ao window para o onclick do HTML dinâmico funcionar
window.adicionarAoCarrinho = adicionarAoCarrinho;

export function atualizarRodape() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    const badge = document.querySelector('.cart-badge');
    const total = document.querySelector('.cart-total');
    const footer = document.getElementById('cart-footer');

    if (badge) badge.innerText = totalItens;
    if (total) total.innerText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;

    // Mostra o rodapé se houver itens
    if (footer && totalItens > 0) {
        footer.style.display = 'flex';
    }
}

function mostrarFeedbackSucesso() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Funções para renderizar a tela do carrinho
export function renderizarItensCarrinho() {
    const container = document.getElementById('lista-itens-carrinho');
    const resumoSubtotal = document.getElementById('resumo-subtotal');
    if (!container) return;

    container.innerHTML = '';
    let subtotal = 0;

    carrinho.forEach((item, index) => {
        const valorItem = item.preco * item.quantidade;
        subtotal += valorItem;

        const itemHTML = `
            <div class="cart-item-row">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.nome}</span>
                    <div class="cart-item-controls">
                        <button class="btn-qty minus" onclick="alterarQuantidade(${index}, -1)">
                            <i class="fa fa-minus-circle"></i>
                        </button>
                        <span class="cart-item-qty">${item.quantidade}</span>
                        <button class="btn-qty plus" onclick="alterarQuantidade(${index}, 1)">
                            <i class="fa fa-plus-circle"></i>
                        </button>
                    </div>
                </div>
                <div class="cart-item-price">
                    R$ ${valorItem.toFixed(2).replace('.', ',')}
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });

    if (resumoSubtotal) {
        resumoSubtotal.innerText = `(=) R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    }
}

window.alterarQuantidade = (index, delta) => {
    if (carrinho[index]) {
        carrinho[index].quantidade += delta;
        
        if (carrinho[index].quantidade <= 0) {
            carrinho.splice(index, 1);
        }
        
        salvarCarrinho();
        renderizarItensCarrinho();
        atualizarRodape();
        
        // Se deletou o último item, volta para a mensagem de vazio
        if (carrinho.length === 0) {
            window.switchPage('carrinho');
        }
    }
};

window.limparCarrinho = () => {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.style.display = 'flex';
};

window.executarLimparCarrinho = () => {
    carrinho = [];
    salvarCarrinho();
    renderizarItensCarrinho();
    atualizarRodape();
    window.switchPage('carrinho');
    
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.style.display = 'none';
};

window.removerItem = (index) => {
    carrinho.splice(index, 1);
    salvarCarrinho();
    renderizarItensCarrinho();
    atualizarRodape();
    if (carrinho.length === 0) {
        window.switchPage('carrinho');
    }
};

// Inicializa o rodapé no carregamento
atualizarRodape();