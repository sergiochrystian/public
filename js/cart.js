// Estado global do carrinho
let carrinho = [];

export function adicionarAoCarrinho(produto, quantidade) {
    const itemExistente = carrinho.find(item => item.nome === produto.nome);

    if (itemExistente) {
        itemExistente.quantidade += quantidade;
    } else {
        carrinho.push({ ...produto, quantidade });
    }

    atualizarRodape();
    mostrarFeedbackSucesso();
}

function atualizarRodape() {
    const totalItens = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);

    // Atualiza o rodapé preto (image_cbd4c0.png)
    document.querySelector('.cart-badge').innerText = totalItens;
    document.querySelector('.cart-total').innerText = `R$ ${valorTotal.toFixed(2)}`;
    
    // Mostra o rodapé se houver itens
    if (totalItens > 0) {
        document.getElementById('cart-footer').style.display = 'flex';
    }
}

function mostrarFeedbackSucesso() {
    // Aqui vamos disparar o modal de "Adicionado com sucesso" (image_cbd53b.png)
    alert("Adicionado com sucesso!"); 
    // Dica: No próximo passo, trocaremos esse alert por um modal bonitão.
}

import { estaAberto } from './api.js';
import { mostrarFeedbackSucesso, mostrarFeedbackErro } from './ui.js';

export function tentarAdicionar(produto, qtd) {
    if (estaAberto()) {
        // Lógica de adicionar que já fizemos...
        mostrarFeedbackSucesso();
    } else {
        mostrarFeedbackErro();
    }
}


// No final do arquivo public/js/cart.js

export function renderizarItensCarrinho() {
    const container = document.getElementById('lista-itens-carrinho');
    const resumoSubtotal = document.getElementById('resumo-subtotal');
    
    // Limpa a lista antes de renderizar para não duplicar
    container.innerHTML = ''; 
    
    let subtotal = 0;

    carrinho.forEach((item, index) => {
        const valorItem = item.preco * item.quantidade;
        subtotal += valorItem;

        // Criando o HTML do item do carrinho (Baseado na foto 10)
        const itemHTML = `
            <div class="item-carrinho-linha">
                <div class="item-info">
                    <span class="item-qtd">${item.quantidade}x</span>
                    <span class="item-nome">${item.nome}</span>
                </div>
                <div class="item-preco-area">
                    <span>R$ ${valorItem.toFixed(2)}</span>
                    <button onclick="removerItem(${index})" class="btn-remove">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });

    resumoSubtotal.innerText = `R$ ${subtotal.toFixed(2)}`;
}

// Função global para o botão de lixeira funcionar
window.removerItem = (index) => {
    carrinho.splice(index, 1); // Remove o item do array
    renderizarItensCarrinho(); // Redesenha a tela
    // atualizarRodape(); // (Opcional) Atualiza o rodapé preto também
};