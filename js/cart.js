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
                <span class="cart-item-name">${item.nome}</span>
                <div class="cart-item-details">
                    <div class="cart-item-controls">
                        <button class="btn-qty minus" onclick="alterarQuantidade(${index}, -1)">
                            <i class="fa fa-minus-circle"></i>
                        </button>
                        <span class="cart-item-qty">${item.quantidade}</span>
                        <button class="btn-qty plus" onclick="alterarQuantidade(${index}, 1)">
                            <i class="fa fa-plus-circle"></i>
                        </button>
                    </div>
                    <div class="cart-item-price">
                        R$ ${valorItem.toFixed(2).replace('.', ',')}
                    </div>
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

window.fecharPedido = () => {
    if (!estaAberto()) {
        mostrarFeedbackErro();
        return;
    }

    // Avança para o 2º passo do carrinho
    window.irParaPasso(2);
};

window.irParaPasso = (passo) => {
    // Validação para avançar do passo 2 para o 3
    if (passo === 3) {
        const tipoRecebimento = document.getElementById('tipo-recebimento')?.value;
        if (!tipoRecebimento) {
            const modal = document.getElementById('modal-aviso-recebimento');
            if (modal) modal.style.display = 'flex';
            return;
        }

        // Validação de endereço se for Entrega
        if (tipoRecebimento === 'entrega') {
            // Validar Pedido Mínimo para Entrega
            const totalProdutos = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
            if (totalProdutos < 20) {
                const modalMinimo = document.getElementById('modal-erro-pedido-minimo');
                if (modalMinimo) {
                    const falta = 20 - totalProdutos;
                    const pText = document.getElementById('texto-erro-pedido-minimo');
                    if (pText) {
                        pText.innerText = `O pedido mínimo para ENTREGA é de R$ 20,00 ainda falta R$ ${falta.toFixed(2).replace('.', ',')}.`;
                    }
                    modalMinimo.style.display = 'flex';
                }
                return;
            }

            const radioEndereco = document.querySelector('input[name="endereco_selecionado"]:checked');
            if (!radioEndereco) {
                const modal = document.getElementById('modal-aviso-endereco');
                if (modal) {
                    modal.querySelector('p').innerText = "Por favor, selecione um endereço cadastrado ou cadastre um novo para continuar.";
                    modal.style.display = 'flex';
                }
                return;
            }

            // Se selecionou 'novo', validar campos obrigatórios (Rua e Bairro)
            if (radioEndereco.value === 'novo') {
                const rua = document.getElementById('rua-passo2')?.value;
                const bairro = document.getElementById('bairro-passo2')?.value;
                if (!rua || !bairro) {
                    const modal = document.getElementById('modal-aviso-endereco');
                    if (modal) {
                        modal.querySelector('p').innerText = "Por favor, preencha o nome da rua e o bairro do novo endereço.";
                        modal.style.display = 'flex';
                    }
                    return;
                }
            }
        }
    }

    const passos = ['carrinho-passo1', 'carrinho-passo2', 'carrinho-passo3', 'carrinho-passo4'];

    passos.forEach(p => {
        const el = document.getElementById(p);
        if (el) el.style.display = 'none';
    });

    const atual = document.getElementById(`carrinho-passo${passo}`);
    if (atual) atual.style.display = 'block';

    // Se entrar no passo 3, atualizamos o títlo do troco com o valor atual
    if (passo === 3) {
        configurarPasso3();
    }

    // Se entrar no passo 4, preenchemos o resumo
    if (passo === 4) {
        configurarPasso4();
    }

    window.scrollTo(0, 0);
};

function configurarPasso3() {
    const selectPagamento = document.getElementById('forma-pagamento');
    const blocoTroco = document.getElementById('bloco-troco');
    const labelTroco = blocoTroco?.querySelector('label span');

    const valorTotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const totalFormatado = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;

    if (labelTroco) {
        labelTroco.innerText = `Troco para ${totalFormatado}`;
    }

    if (selectPagamento) {
        const handlePagamentoChange = (e) => {
            if (e.target.value === 'dinheiro') {
                blocoTroco.style.display = 'block';
            } else {
                blocoTroco.style.display = 'none';
            }
        };
        // Remove listener anterior se existir (para evitar duplicatas)
        selectPagamento.removeEventListener('change', handlePagamentoChange);
        selectPagamento.addEventListener('change', handlePagamentoChange);
    }
}

function configurarPasso4() {
    // 1. Preenche Dados Pessoais
    const nome = document.getElementById('nome-passo3')?.value;
    const telefone = document.getElementById('celular-passo3')?.value;
    const tipoRecebimento = document.getElementById('tipo-recebimento')?.value;

    document.getElementById('summary-nome').innerText = nome;
    document.getElementById('summary-telefone').innerText = telefone;
    document.getElementById('summary-tipo-pedido').innerText = tipoRecebimento === 'entrega' ? 'Pedido para entrega' : 'Pedido para retirada';

    // 2. Preenche Endereço (se for entrega)
    const summaryEndereco = document.getElementById('summary-endereco');
    if (tipoRecebimento === 'entrega') {
        const radioSelecionado = document.querySelector('input[name="endereco_selecionado"]:checked');
        if (radioSelecionado) {
            const spanEndereco = radioSelecionado.parentElement.querySelector('span:last-child');
            summaryEndereco.innerText = spanEndereco ? spanEndereco.innerText : 'Endereço não selecionado';
        } else {
            summaryEndereco.innerText = 'Endereço não selecionado';
        }
        summaryEndereco.parentElement.style.display = 'block';
    } else {
        summaryEndereco.parentElement.style.display = 'none';
    }

    // 3. Preenche Forma de Pagamento
    const pagamento = document.getElementById('forma-pagamento');
    const summaryPagamento = document.getElementById('summary-pagamento');
    const pixCheckoutBox = document.getElementById('pix-checkout-box');
    
    if (pagamento && summaryPagamento) {
        const opcaoSelecionada = pagamento.options[pagamento.selectedIndex];
        const valorPagamento = opcaoSelecionada?.value;
        const textoPagamento = opcaoSelecionada?.text;
        
        summaryPagamento.innerText = textoPagamento || 'Não selecionado';

        if (valorPagamento === 'pix' && pixCheckoutBox) {
            pixCheckoutBox.style.display = 'block';
            const total = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
            const taxaEntrega = tipoRecebimento === 'entrega' ? 7.00 : 0;
            const totalGeral = total + taxaEntrega;
            
            const pixTotalEl = document.getElementById('pix-total-checkout');
            if (pixTotalEl) pixTotalEl.innerText = `TOTAL: R$ ${totalGeral.toFixed(2).replace('.', ',')}`;
        } else if (pixCheckoutBox) {
            pixCheckoutBox.style.display = 'none';
        }
    }

    // 4. Renderiza Itens do Resumo
    const containerItens = document.getElementById('summary-itens-lista');
    if (containerItens) {
        containerItens.innerHTML = '';
        carrinho.forEach(item => {
            const itemHTML = `
                <div style="margin-bottom: 12px; border-bottom: 1px dotted #ccc; padding-bottom: 10px;">
                    <strong style="display: block; font-size: 14px; margin-bottom: 4px; color: #333;">${item.nome}</strong>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #666;">
                        <span>Qtde: ${item.quantidade}</span>
                        <span style="color: #00A808;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
            `;
            containerItens.innerHTML += itemHTML;
        });
    }

    // 5. Calcula Totais
    const subtotal = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const taxaEntrega = tipoRecebimento === 'entrega' ? 7.00 : 0; // Taxa fixa exemplo
    const totalRaw = subtotal + taxaEntrega;

    document.getElementById('summary-subtotal').innerText = `(=) R$ ${subtotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('summary-entrega').innerText = `(+) R$ ${taxaEntrega.toFixed(2).replace('.', ',')}`;
    document.getElementById('summary-total').innerText = `(=) R$ ${totalRaw.toFixed(2).replace('.', ',')}`;

    // Tempo estimado (vindo da tela anterior ou fixo para o resumo)
    const tempoMin = document.getElementById('tempo-minimo')?.value || '40';
    const tempoMax = document.getElementById('tempo-maximo')?.value || '100';
    document.getElementById('summary-tempo-estimado').innerText = `${tempoMin} à ${tempoMax} minutos`;
}

window.finalizarPedido = () => {
    const nome = document.getElementById('nome-passo3')?.value;
    const pagamento = document.getElementById('forma-pagamento')?.value;

    if (!nome || !pagamento) {
        const modal = document.getElementById('modal-aviso-pagamento');
        if (modal) modal.style.display = 'flex';
        return;
    }

    window.irParaPasso(4);
};

window.confirmarPedido = () => {
    const nome = document.getElementById('nome-passo3')?.value;
    const pagamento = document.getElementById('forma-pagamento')?.value;
    const tipoRecebimento = document.getElementById('tipo-recebimento')?.value;
    const totalStr = document.getElementById('summary-total')?.innerText || 'R$ 0,00';

    // Montar mensagem para o WhatsApp
    let mensagem = `*Novo Pedido - FeijoAyla*\n\n`;
    mensagem += `👤 Nome: ${nome}\n`;
    mensagem += `📦 Tipo: ${tipoRecebimento === 'entrega' ? 'Entrega' : 'Retirada'}\n`;
    mensagem += `💳 Pagamento: ${pagamento}\n`;
    mensagem += `💰 Total: ${totalStr}\n\n`;
    mensagem += `🛒 Itens:\n`;
    carrinho.forEach(item => {
        mensagem += `- ${item.quantidade}x ${item.nome}\n`;
    });

    if (pagamento === 'pix') {
        mensagem += `\n⚠️ *Aguardo o comprovante do PIX para iniciar o preparo!*`;
    }

    // Abre o WhatsApp (REMOVIDO A PEDIDO DO USUÁRIO)
    // const foneLoja = '559991388338';
    // window.open(`https://api.whatsapp.com/send?phone=${foneLoja}&text=${encodeURIComponent(mensagem)}`, '_blank');

    // Aqui simulamos o salvamento do pedido para o "Andamento"
    const totalNum = parseFloat(totalStr.replace(/[^\d,]/g, '').replace(',', '.'));

    const novoPedido = {
        id: "ORDER_" + Math.random().toString(36).substr(2, 8).toUpperCase(),
        data: new Date().toLocaleDateString('pt-BR') + " - " + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
        itens: [...carrinho],
        status: "Andamento",
        total: totalNum,
        pagamento: pagamento
    };

    // Salva nos pedidos do localStorage (para o login.html ler)
    const pedidosSalvos = JSON.parse(localStorage.getItem('meus_pedidos') || '[]');
    pedidosSalvos.unshift(novoPedido);
    localStorage.setItem('meus_pedidos', JSON.stringify(pedidosSalvos));

    // Limpar carrinho
    carrinho = [];
    salvarCarrinho();
    atualizarRodape();

    // Redireciona para Meus Pedidos com parâmetros para mostrar o modal de sucesso
    const totalLimpo = totalStr.replace('(=) ', '');
    window.location.href = `login.html?new_order=true&id=${novoPedido.id}&payment=${pagamento}&total=${encodeURIComponent(totalLimpo)}`;
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
