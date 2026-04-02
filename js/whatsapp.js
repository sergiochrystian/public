const EVOLUTION_URL = 'http://localhost:8081';
const API_KEY = '123456789';

/**
 * Cria uma nova instância na Evolution API.
 * @param {string} instanceName Nome da sua loja ou bot.
 */
async function createInstance(instanceName = 'delivery_bot_v2') {
    try {
        const response = await fetch(`${EVOLUTION_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                instanceName: instanceName,
                token: "my_secure_token",
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS'
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao criar instância:', error);
    }
}

/**
 * Busca o QR Code da instância criada.
 */
async function getQRCode(instanceName = 'delivery_bot_v2') {
    try {
        const response = await fetch(`${EVOLUTION_URL}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
                'apikey': API_KEY
            }
        });
        const data = await response.json();
        return data; // Contém o base64 do QR Code
    } catch (error) {
        console.error('Erro ao buscar QR Code:', error);
    }
}

/**
 * Envia uma mensagem de texto (ex: Código de Login ou Status).
 */
async function sendMessage(number, text, instanceName = 'delivery_bot_v2') {
    try {
        const response = await fetch(`${EVOLUTION_URL}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': API_KEY
            },
            body: JSON.stringify({
                number: number,
                text: text
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
    }
}
