// Simulação de configuração da loja vinda do Firebase
const configLoja = {
    nome: "Feijoão Delivery",
    horarioAbertura: 10, // 10:00h
    horarioFechamento: 22 // 22:00h
};

export function estaAberto() {
    const horaAtual = new Date().getHours();
    return horaAtual >= configLoja.horarioAbertura && horaAtual < configLoja.horarioFechamento;
}


// js/api.js

// 1. Simulando dados que viriam do Firebase
const produtosMock = [
    {
        id: 1,
        nome: "Feijoada Baby Completa",
        descricao: "Arroz, farofa, pururuca, couve e laranja.",
        preco: 25.00,
        imagem: "https://cdn.pixabay.com/photo/2014/06/11/17/00/food-366875_1280.jpg",
        categoria: "Feijoada"
    },
    {
        id: 2,
        nome: "Coca-Cola 350ml",
        descricao: "Lata gelada",
        preco: 6.00,
        imagem: "https://cdn.pixabay.com/photo/2014/09/26/19/51/coca-cola-462776_1280.jpg",
        categoria: "Bebidas"
    }
];

// 2. Função para carregar os produtos na tela
export function carregarCardapio() {
    const container = document.getElementById('categories-container');
    
    // Criando o HTML dinamicamente
    let html = '<h2>Destaques</h2>';
    
    produtosMock.forEach(produto => {
        html += `
            <div class="product-card" onclick="prepararModal(${produto.id})">
                <div class="product-content">
                    <img src="${produto.imagem}" alt="${produto.nome}">
                    <div class="info">
                        <h4>${produto.nome}</h4>
                        <p>${produto.descricao}</p>
                        <span class="preco">R$ ${produto.preco.toFixed(2)}</span>
                    </div>
                </div>
                <button class="btn-comprar">+ COMPRAR</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Inicializa quando o arquivo carregar
carregarCardapio();

// js/api.js

export function carregarCardapio() {
    const container = document.getElementById('categories-container');
    const categorias = ["FEIJOADA", "COMBO DE FEIJOADA", "ADICIONAIS", "BEBIDAS"];
    
    container.innerHTML = ""; // Limpa o container

    categorias.forEach(cat => {
        const catSection = document.createElement('div');
        catSection.className = 'category-section';
        
        catSection.innerHTML = `
            <div class="category-header" onclick="toggleCategoria(this)">
                <h3>${cat}</h3>
                <span class="material-symbols-outlined">add</span>
            </div>
            <div class="category-content">
                <p style="padding: 20px; color: #666;">Nenhum item disponível ainda.</p>
            </div>
        `;
        
        container.appendChild(catSection);
    });
}

// Função para abrir/fechar a categoria
window.toggleCategoria = function(elemento) {
    const conteudo = elemento.nextElementSibling;
    const icone = elemento.querySelector('span');
    
    // Fecha outros que estiverem abertos (opcional)
    document.querySelectorAll('.category-content').forEach(el => {
        if(el !== conteudo) el.classList.remove('active');
    });

    conteudo.classList.toggle('active');
    icone.innerText = conteudo.classList.contains('active') ? 'remove' : 'add';
};