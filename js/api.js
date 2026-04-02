import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { adicionarAoCarrinho } from './cart.js';

// Configuração da loja (será buscada do banco futuramente)
const configLoja = {
    nome: "Feijoão Delivery",
    horarioAbertura: 8,
    horarioFechamento: 22
};

export function estaAberto() {
    // Loja configurada para funcionamento 24h
    return true;
}


// Cache global para facilitar o acesso aos produtos pelo ID nos cliques
window.produtosCache = {};

// 1. Função para carregar os produtos na tela
export async function carregarCardapio() {
    const container = document.getElementById('categories-container');
    if (!container) return;

    // Limpa o container IMEDIATAMENTE para remover as "marcas" estáticas do HTML
    // Isso garante que o usuário só veja o que vem do Banco de Dados
    container.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando cardápio...</p>';

    try {
        // Buscamos sem orderBy para evitar erros de índice no Firebase iniciante
        const q = query(collection(db, "produtos"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log("Nenhum produto encontrado no banco.");
            container.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhum produto encontrado. Use a página de configuração.</p>';
            return;
        }

        // Agrupar produtos por categoria e alimentar o cache
        const categorias = {};
        querySnapshot.forEach((doc) => {
            const produto = { id: doc.id, ...doc.data() };
            window.produtosCache[doc.id] = produto; // Salva no cache

            if (!categorias[produto.categoria]) {
                categorias[produto.categoria] = [];
            }
            categorias[produto.categoria].push(produto);
        });

        // Limpa novamente antes de renderizar os itens reais
        container.innerHTML = '';

        // Definir a ordem específica: 1. FEIJOADA, 2. ADICIONAIS, 3. BEBIDAS
        const ordemDefinida = {
            'FEIJOADA': 1,
            'ADICIONAIS (ACOMPANHAMENTOS)': 2,
            'BEBIDAS': 3
        };

        const categoriasOrdenadas = Object.keys(categorias).sort((a, b) => {
            return (ordemDefinida[a] || 99) - (ordemDefinida[b] || 99);
        });

        for (const nomeCategoria of categoriasOrdenadas) {
            // Ordena os produtos de forma inteligente para manter a lógica original do cardápio
            const produtos = categorias[nomeCategoria].sort((a, b) => {
                // Se for a categoria principal de Feijoada, ordem de preço crescente (Baby primeiro)
                if (nomeCategoria === 'FEIJOADA') {
                    return a.preco - b.preco;
                }

                // Para Adicionais, criamos grupos lógicos de prioridade
                const getPrioridade = (nome) => {
                    if (nome.includes("Adicional de Feijoada")) return 1;
                    if (nome.includes("Arroz")) return 2;
                    if (nome.includes("Pururuca")) return 3;
                    return 4; // Itens como Farofa, Couve e Laranja (os últimos)
                };

                const pA = getPrioridade(a.nome);
                const pB = getPrioridade(b.nome);

                if (pA !== pB) return pA - pB; // Ordena pelos grupos
                return a.preco - b.preco;     // Se for do mesmo grupo, ordena pelo preço
            });

            const section = document.createElement('div');
            section.className = 'category-section';

            section.innerHTML = `
                <div class="category-header" onclick="toggleCategoria(this)">
                    <h3>${nomeCategoria.toUpperCase()}</h3>
                    <span style="font-size: 20px; color: #999; font-weight: 300;">+</span>
                </div>
                <div class="category-content">
                    ${produtos.map(p => `
                        <div class="product-card" onclick="comprarProduto('${p.id}')" style="cursor: pointer;">
                            <div class="product-content ${
                                (p.categoria === 'ADICIONAIS (ACOMPANHAMENTOS)' && p.nome.includes('Arroz')) ? 'adicional-product-content' : 
                                (p.categoria === 'BEBIDAS' ? 'bebida-product-content' : '')
                            }">
                                ${p.imagem ? `<img src="${p.imagem}" alt="${p.nome}" style="pointer-events: none;">` : ''}
                                <div class="info" style="pointer-events: none;">
                                    <h4>${p.nome}</h4>
                                    ${p.descricao ? `<p>${p.descricao}</p>` : ''}
                                    <span class="preco">R$ ${p.preco.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                            <button class="btn-comprar" onclick="event.stopPropagation(); comprarProduto('${p.id}')">+ COMPRAR</button>
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(section);
        }
    } catch (error) {
        console.error("Erro ao carregar cardápio:", error);
    }
}

// 2. Inicializa quando o arquivo carregar (caso seja importado)
// Apenas se não houver já uma chamada no HTML
if (document.getElementById('categories-container')) {
    carregarCardapio();
}

// 3. Função para abrir/fechar a categoria
window.toggleCategoria = function (elemento) {
    const conteudo = elemento.nextElementSibling;
    const icone = elemento.querySelector('span');

    conteudo.classList.toggle('active');
    icone.innerText = conteudo.classList.contains('active') ? '-' : '+';
};

// --- LOGICA DE COMPRA DIRETA ---
window.comprarProduto = function (id) {
    const produto = window.produtosCache[id];
    if (produto) {
        adicionarAoCarrinho(produto, 1);
    }
};

// --- LOGICA MODAL DETALHES ---
let produtoAtualDetalhes = null;
let quantidadeAtualDetalhes = 1;

window.openProductDetails = function (id) {
    const produto = window.produtosCache[id];
    if (!produto) return;

    produtoAtualDetalhes = produto;
    quantidadeAtualDetalhes = 1;

    // Preencher dados
    const imgEl = document.getElementById('details-product-image');
    if (imgEl) imgEl.src = produto.imagem || '';

    const nameEl = document.getElementById('details-product-name');
    if (nameEl) nameEl.innerText = produto.nome;

    const descEl = document.getElementById('details-product-description');
    if (descEl) descEl.innerText = produto.descricao || '';

    const qtyEl = document.getElementById('detail-quantity');
    if (qtyEl) qtyEl.innerText = quantidadeAtualDetalhes;

    atualizarPrecoBotaoDetalhes();

    // Mostrar modal
    const modal = document.getElementById('modal-product-details');
    if (modal) modal.style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Trava o scroll do fundo
};

window.closeProductDetails = function () {
    const modal = document.getElementById('modal-product-details');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Destrava o scroll
};

window.changeDetailQuantity = function (delta) {
    quantidadeAtualDetalhes += delta;
    if (quantidadeAtualDetalhes < 1) quantidadeAtualDetalhes = 1;

    const qtyEl = document.getElementById('detail-quantity');
    if (qtyEl) qtyEl.innerText = quantidadeAtualDetalhes;
    atualizarPrecoBotaoDetalhes();
};

function atualizarPrecoBotaoDetalhes() {
    if (!produtoAtualDetalhes) return;
    const total = produtoAtualDetalhes.preco * quantidadeAtualDetalhes;
    const totalPriceEl = document.getElementById('details-product-total-price');
    if (totalPriceEl) totalPriceEl.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

// Configurar o clique do botão de adicionar dentro do modal
document.addEventListener('DOMContentLoaded', () => {
    const btnAdd = document.getElementById('btn-add-detail');
    if (btnAdd) {
        btnAdd.onclick = function () {
            if (produtoAtualDetalhes) {
                adicionarAoCarrinho(produtoAtualDetalhes, quantidadeAtualDetalhes);
                window.closeProductDetails();
            }
        };
    }
});