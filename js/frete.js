// Tabela de Preços (Aqui você define os valores)
// Você pode definir por nome do bairro ou por uma "chave" de distância simulada
const CONFIG_FRETE = {
    "Bacuri": 7.00,
    "Vilinha": 5.00,
    "Centro": 5.00,
    "Vila Nova": 10.00,
    "Nova Imperatriz": 8.00,
    "Beira Rio": 6.00,
    // Valor padrão caso o bairro não esteja na lista
    "PADRAO": 15.00
};

// Se você preferir por DISTÂNCIA (faixas), a lógica seria:
const TAXAS_POR_DISTANCIA = [
    { ate_km: 3, valor: 5.00 },
    { ate_km: 7, valor: 10.00 },
    { ate_km: 15, valor: 18.00 }
];

export function calcularValorFrete(bairro) {
    // Busca o valor na tabela de bairros
    return CONFIG_FRETE[bairro] || CONFIG_FRETE["PADRAO"];
}

// Função para exibir o resultado no modal
export function exibirResultadoFrete(valor) {
    const modal = document.getElementById('success-modal');
    const modalTitle = modal.querySelector('h2');
    const modalText = modal.querySelector('p');
    
    if (modal) {
        modalTitle.innerText = "Taxa de Entrega";
        modalText.innerHTML = `O valor da taxa de entrega para este endereço é de <strong>R$ ${valor.toFixed(2).replace('.', ',')}</strong>`;
        modal.style.display = 'flex';
    }
}
