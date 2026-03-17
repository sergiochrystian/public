import { db } from './firebase-init.js';
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuração da loja (será buscada do banco futuramente)
const configLoja = {
    nome: "Feijoão Delivery",
    horarioAbertura: 18,
    horarioFechamento: 23
};

export function estaAberto() {
    const data = new Date();
    const horaAtual = data.getHours();
    const diaSemana = data.getDay(); // 0 (Domingo) até 6 (Sábado)

    // Fechado na Segunda (dia 1)
    if (diaSemana === 1) return false;

    return horaAtual >= configLoja.horarioAbertura && horaAtual < configLoja.horarioFechamento;
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

        // Ordenar as categorias para que 'FEIJOADA' venha antes de 'ADICIONAIS'
        // Usamos reverse para que 'F' venha antes de 'A' na ordem alfabética reversa
        const categoriasOrdenadas = Object.keys(categorias).sort().reverse();

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
                        <div class="product-card">
                            <div class="product-content ${!p.imagem ? 'adicional-product-content' : ''}">
                                ${p.imagem ? `<img src="${p.imagem}" alt="${p.nome}">` : ''}
                                <div class="info">
                                    <h4>${p.nome}</h4>
                                    ${p.descricao ? `<p>${p.descricao}</p>` : ''}
                                    <span class="preco">R$ ${p.preco.toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                            <button class="btn-comprar" onclick="adicionarAoCarrinho('${p.id}')">+ COMPRAR</button>
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

    // Fecha outros que estiverem abertos (opcional)
    document.querySelectorAll('.category-content').forEach(el => {
        if (el !== conteudo) {
            el.classList.remove('active');
            let prevIcon = el.previousElementSibling.querySelector('span');
            if (prevIcon) prevIcon.innerText = '+';
        }
    });

    conteudo.classList.toggle('active');
    icone.innerText = conteudo.classList.contains('active') ? '-' : '+';
};