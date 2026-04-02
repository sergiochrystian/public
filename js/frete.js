// Coordenadas fixas da Loja (R. Arame, 289, Imperatriz/MA)
const STORE_COORDS = { lat: -5.5391143, lon: -47.4600746 };

// Tabela de Preços por Distância (Aqui você define os valores conforme necessário)
const TAXAS_POR_DISTANCIA = [
    { ate_km: 1, valor: 4.00, desc: "Abaixo de 1km" },
    { ate_km: 2, valor: 6.00, desc: "Abaixo de 2km" },
    { ate_km: 3, valor: 8.00, desc: "Abaixo de 3km" },
    { ate_km: 5, valor: 10.00, desc: "Abaixo de 5km" },
    { ate_km: 8, valor: 15.00, desc: "Abaixo de 8km" },
    { ate_km: 12, valor: 20.00, desc: "Abaixo de 12km" },
    { ate_km: 999, valor: 25.00, desc: "Acima de 12km" }
];

/**
 * Função principal que calcula o frete com estratégia de busca resiliente.
 * Tenta encontrar o endereço por diferentes combinações de dados caso a busca inicial falhe.
 */
export async function calcularValorFrete(enderecoData) {
    const { rua, numero, bairro, cidade, estado, cep } = enderecoData;

    // Diferentes estratégias de busca para aumentar a chance de sucesso
    const queries = [
        `${rua}, ${numero ? numero + ',' : ''} ${bairro}, ${cidade}, ${estado}, Brasil, ${cep}`,
        `${rua}, ${cidade}, ${estado}, ${cep}`,
        `${cep}, ${cidade}, Brasil`
    ];

    let data = [];
    
    // Tenta cada query até encontrar um resultado
    for (const query of queries) {
        try {
            console.log(`Tentando geocodificar com: ${query}`);
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: {
                    'User-Agent': 'DeliverySaas-App-FeijoAyla/1.1 (contato: sergio@exemplo.com)' 
                }
            });
            
            if (!response.ok) continue;

            data = await response.json();
            if (data && data.length > 0) break; // Sucesso! Sai do loop
        } catch (err) {
            console.error("Erro na tentativa de geocodificação:", err);
        }
    }

    if (data && data.length > 0) {
        const userLat = parseFloat(data[0].lat);
        const userLon = parseFloat(data[0].lon);

        // Calcula distância usando o Leaflet (método distanceTo retorna metros)
        const storePos = L.latLng(STORE_COORDS.lat, STORE_COORDS.lon);
        const userPos = L.latLng(userLat, userLon);
        const distanceInMeters = storePos.distanceTo(userPos);
        const distanceInKm = distanceInMeters / 1000;

        console.log(`Distância calculada: ${distanceInKm.toFixed(2)} km`);

        // Busca na tabela de distâncias o regime correspondente 
        const taxa = TAXAS_POR_DISTANCIA.find(t => distanceInKm <= t.ate_km) || TAXAS_POR_DISTANCIA[TAXAS_POR_DISTANCIA.length - 1];

        return { 
            valor: taxa.valor, 
            distancia: distanceInKm.toFixed(2)
        };
    } else {
        // Se após todas as tentativas nada foi encontrado
        throw new Error("Não conseguimos localizar seu endereço exato no mapa. Por favor, verifique o CEP e Nome da Rua.");
    }
}

// Função para exibir o resultado no modal
export function exibirResultadoFrete(resultado) {
    const modal = document.getElementById('success-modal');
    if (modal) {
        const { valor, distancia } = resultado;
        
        modal.querySelector('h2').innerText = "Taxa de Entrega";
        
        const valorFormatado = valor.toFixed(2).replace('.', ',');
        const distanciaFormatada = distancia.replace('.', ',');

        modal.querySelector('p').innerHTML = `
            O valor da taxa de entrega para este endereço é de <strong>R$ ${valorFormatado}</strong>
            <br><small style="color: #666;">Distância: ${distanciaFormatada} km</small>
        `;
        
        modal.style.display = 'flex';
    }
}
