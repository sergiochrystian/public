import { estaAberto } from './api.js';
import { mostrarFeedbackErro } from './ui.js';

// Estado global do carrinho
let carrinho = [];

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
    atualizarRodape();
    mostrarFeedbackSucesso();
}

// Vincula ao window para o onclick do HTML dinâmico funcionar
window.adicionarAoCarrinho = adicionarAoCarrinho;

function atualizarRodape() {
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

// Funções para renderizar a tela do carrinho (depois)
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
            <div class="item-carrinho-linha">
                <div class="item-info">
                    <span class="item-qtd">${item.quantidade}x</span>
                    <span class="item-nome">${item.nome}</span>
                </div>
                <div class="item-preco-area">
                    <span>R$ ${valorItem.toFixed(2).replace('.', ',')}</span>
                    <button onclick="removerItem(${index})" class="btn-remove">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });

    if (resumoSubtotal) resumoSubtotal.innerText = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
}

window.removerItem = (index) => {
    carrinho.splice(index, 1);
    renderizarItensCarrinho();
    atualizarRodape();
};