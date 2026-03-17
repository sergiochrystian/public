import { auth, db } from './firebase-init.js';
import { RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configura o ReCaptcha invisível
function configurarRecaptcha() {
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible',
            'callback': (response) => {
                // reCAPTCHA resolvido
            }
        });
    }
}

// Função para processar o clique inicial do login
export async function fazerLogin() {
    const telefoneInput = document.querySelector('.form-control');
    const erroTexto = document.getElementById('telefone-error');
    const inputGroup = document.querySelector('.input-group');
    let telefone = telefoneInput.value.replace(/\D/g, '');

    if (telefone.length < 10) {
        const modal = document.getElementById('modal-validacao');
        if (modal) modal.style.display = 'flex';
        if (erroTexto) erroTexto.style.display = 'block';
        if (inputGroup) inputGroup.style.border = '1px solid #e73d4a';
        return;
    }

    if (erroTexto) erroTexto.style.display = 'none';
    if (inputGroup) inputGroup.style.border = '1px solid #ccc';

    // Formata para exibição: +55 XX XXXXX-XXXX
    let telFormatado = telefone;
    if (telefone.length === 11) {
        telFormatado = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '$1 $2-$3');
    } else if (telefone.length === 10) {
        telFormatado = telefone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2-$3');
    }

    const ddi = "+55";
    const numeroCompletoExibicao = `${ddi} ${telFormatado}`;

    exibirTelaConfirmacao(telefone, numeroCompletoExibicao);
}

function exibirTelaConfirmacao(telefonePuro, telefoneFormatado) {
    const portletTitle = document.querySelector('.portlet-title');
    const portletBody = document.querySelector('.portlet-body.form');

    // Altera o título
    portletTitle.innerHTML = `<i class="fa fa-lock"></i> CONFIRMAÇÃO`;

    // Altera o conteúdo
    portletBody.innerHTML = `
        <div class="confirmacao-container">
            <p class="confirmacao-msg">
                Localizamos sua conta no telefone <strong>${telefoneFormatado}</strong>, como deseja receber o código de confirmação para login?
            </p>

            <button class="btn-confirm-option" id="btn-whatsapp">
                <span class="option-title">Código por WhatsApp</span>
                <span class="option-subtitle">⚡ Recebimento rápido do código</span>
            </button>

            <div class="text-divisor">ou</div>

            <button class="btn-confirm-option" id="btn-sms">
                <span class="option-title">Código por SMS</span>
                <span class="option-subtitle">🐢 Código pode demorar para chegar</span>
            </button>
        </div>
    `;

    document.getElementById('btn-whatsapp').addEventListener('click', () => {
        // Simulação de envio por WhatsApp
        processarEnvioSMS(telefonePuro, telefoneFormatado, "WhatsApp");
    });

    document.getElementById('btn-sms').addEventListener('click', () => {
        processarEnvioSMS(telefonePuro, telefoneFormatado, "SMS");
    });
}

// Função para enviar o SMS via Firebase e mostrar o sucesso
async function processarEnvioSMS(telefone, telefoneFormatado, metodo) {
    console.log("Selecionado método:", metodo);

    // Transição imediata para a tela de código para o usuário ver a mudança
    exibirTelaVerificacaoCodigo(telefone, telefoneFormatado);

    const telefoneCompleto = "+55" + telefone;
    configurarRecaptcha();
    const appVerifier = window.recaptchaVerifier;

    try {
        const confirmationResult = await signInWithPhoneNumber(auth, telefoneCompleto, appVerifier);
        window.confirmationResult = confirmationResult;

        // Só mostra o modal de sucesso se o envio realmente acontecer
        exibirModalSucesso(telefoneFormatado, metodo);
        console.log("Mensagem enviada via " + metodo + " para: " + telefoneCompleto);
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error);

        // Reseta o reCAPTCHA para permitir nova tentativa
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
        }

        if (error.code === 'auth/too-many-requests') {
            exibirModalErroTemporizador(120);
        } else {
            alert("Ocorreu um problema ao enviar o código. Verifique se o telefone está correto ou tente novamente.");
        }
    }
}

function exibirModalErroTemporizador(segundos) {
    let modal = document.getElementById('modal-erro-temporizador');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-erro-temporizador';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-success-card">
            <div class="success-icon-circle" style="border-color: #f27474; color: #f27474;">
                <i class="fa fa-times"></i>
            </div>
            <h2 style="color: #595959;">Erro</h2>
            <p>Você precisa aguardar ${segundos} segundos para gerar um novo código.</p>
            <button class="btn-modal-ok" style="background-color: #f27474;" id="btn-modal-erro-ok">OK</button>
        </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('btn-modal-erro-ok').onclick = () => {
        modal.style.display = 'none';
    };
}

function exibirModalErroCodigo() {
    let modal = document.getElementById('modal-erro-codigo');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-erro-codigo';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-success-card">
            <div class="success-icon-circle" style="border-color: #f27474; color: #f27474;">
                <span class="material-symbols-outlined" style="font-size: 50px;">close</span>
            </div>
            <h2 style="color: #595959; font-weight: 300;">Erro</h2>
            <p style="color: #545454; font-size: 14px; margin-bottom: 25px;">O código digitado não corresponde com o código enviado, tente novamente!</p>
            <button class="btn-modal-ok" style="background-color: #f27474;" id="btn-modal-erro-codigo-ok">OK</button>
        </div>
    `;

    modal.style.display = 'flex';

    document.getElementById('btn-modal-erro-codigo-ok').onclick = () => {
        modal.style.display = 'none';
    };
}

function exibirModalSucesso(telefoneFormatado, metodo) {
    let modal = document.getElementById('modal-sucesso-container');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-sucesso-container';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-success-card">
            <div class="success-icon-circle">
                <i class="fa fa-check"></i>
            </div>
            <h2>Sucesso</h2>
            <p>Um código foi enviado para o seu telefone <strong>${telefoneFormatado}</strong> por ${metodo}.</p>
            <button class="btn-modal-ok" id="btn-modal-sucesso-ok">OK</button>
        </div>
    `;

    modal.style.display = 'flex';

    const btnOk = document.getElementById('btn-modal-sucesso-ok');
    if (btnOk) {
        btnOk.onclick = () => {
            modal.style.display = 'none';
        };
    }
}

function exibirTelaVerificacaoCodigo(telefonePuro, telefoneFormatado) {
    const portletBody = document.querySelector('.portlet-body.form');
    if (!portletBody) return;

    portletBody.innerHTML = `
        <div class="confirmacao-container">
            <p class="confirmacao-msg" style="margin-bottom: 20px;">
                Localizamos sua conta no telefone <strong>${telefoneFormatado}</strong>, como deseja receber o código de confirmação para login?
            </p>

            <button class="btn-confirm-option" id="btn-resend-whatsapp" style="opacity: 0.7; cursor: default; background-color: #666;">
                <span class="option-title">Código por WhatsApp</span>
                <span class="option-subtitle">⚡ Recebimento rápido do código</span>
            </button>

            <div class="text-divisor" style="margin: 10px 0;">ou</div>

            <button class="btn-confirm-option" id="btn-resend-sms" style="opacity: 0.7; cursor: default; background-color: #666;">
                <span class="option-title">Código por SMS</span>
                <span class="option-subtitle">🐢 Código pode demorar para chegar</span>
            </button>

            <div id="verificacao-form-area" style="margin-top: 0px; border-top: 1px solid #ebebeb; padding-top: 0px;">
                <p class="timer-text" id="area-timer">Você precisa aguardar <strong id="timer-segundos">120</strong> segundos, para solicitar um novo código.</p>

                <div class="form-group" style="margin-top: 25px;">
                    <label class="input-codigo-label">Código <span>*</span></label>
                    <input type="number" id="codigo-verificacao" class="form-control-codigo" placeholder="Digite o código recebido">
                </div>

                <p class="help-text-small">
                    Caso não receba o código, verifique o seu número, se tem sinal, se a linha está funcionando, ou tente reiniciar seu aparelho.
                </p>

                <div class="verify-footer-actions">
                    <button class="btn-voltar" onclick="window.location.reload()">
                        <i class="fa fa-angle-left"></i> Voltar
                    </button>
                    <button class="btn-confirmar-final" id="btn-verificar-codigo">
                        Confirmar <i class="fa fa-check"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    const btnWhatsApp = document.getElementById('btn-resend-whatsapp');
    const btnSMS = document.getElementById('btn-resend-sms');
    const timerElement = document.getElementById('timer-segundos');
    const areaTimer = document.getElementById('area-timer');

    // Inicia o Timer
    let segundos = 120;
    if (timerElement) {
        const interval = setInterval(() => {
            segundos--;
            if (timerElement) timerElement.innerText = segundos;

            if (segundos <= 0) {
                clearInterval(interval);
                if (areaTimer) areaTimer.innerText = "Você já pode solicitar um novo código.";

                // REATIVA OS BOTÕES
                [btnWhatsApp, btnSMS].forEach(btn => {
                    if (btn) {
                        btn.style.opacity = "1";
                        btn.style.cursor = "pointer";
                        btn.style.backgroundColor = "#4b4b4b"; // Volta para a cor original (grafite)
                    }
                });

                // Adiciona os eventos de clique novamente
                if (btnWhatsApp) btnWhatsApp.onclick = () => processarEnvioSMS(telefonePuro, telefoneFormatado, "WhatsApp");
                if (btnSMS) btnSMS.onclick = () => processarEnvioSMS(telefonePuro, telefoneFormatado, "SMS");
            }
        }, 1000);
    }

    const btnVerificar = document.getElementById('btn-verificar-codigo');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', confirmarCodigo);
    }
}

// Pequeno ajuste para pegar o telefone puro corretamente dentro da função
function obterTelefonePuro(formatado) {
    return formatado.replace(/\D/g, '').replace(/^55/, '');
}


async function confirmarCodigo() {
    const codigoInput = document.getElementById('codigo-verificacao');
    const codigo = codigoInput.value;

    if (codigo.length !== 6) {
        exibirModalErroCodigo();
        return;
    }

    try {
        const result = await window.confirmationResult.confirm(codigo);
        const user = result.user;
        console.log("Usuário logado com sucesso:", user);

        // Se estiver na login.html, a mudança de estado cuidará do resto
        if (window.location.pathname.includes('login.html')) {
            // Apenas recarrega ou o listener cuidará
        } else {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error("Erro ao verificar código:", error);
        exibirModalErroCodigo();
    }
}

// Monitora o estado da autenticação
onAuthStateChanged(auth, (user) => {
    const loginView = document.getElementById('webapp-login');
    const ordersView = document.getElementById('webapp-orders');

    if (!loginView || !ordersView) return; // Não estamos na página de login

    const logoSec = document.getElementById('header-logo-container');
    const titleSec = document.getElementById('header-title-container');
    const btnSair = document.getElementById('btn-sair-header');

    if (user) {
        loginView.style.display = 'none';
        ordersView.style.display = 'block';
        if (logoSec) logoSec.style.display = 'none';
        if (titleSec) titleSec.style.display = 'flex';
        if (btnSair) btnSair.style.display = 'block';
        carregarMeusPedidos(user.uid);
    } else {
        loginView.style.display = 'block';
        ordersView.style.display = 'none';
        if (logoSec) logoSec.style.display = 'block';
        if (titleSec) titleSec.style.display = 'none';
        if (btnSair) btnSair.style.display = 'none';
    }
});

async function carregarMeusPedidos(uid) {
    const container = document.getElementById('orders-container');
    if (!container) return;

    container.innerHTML = '<p style="text-align:center; padding: 20px;">Buscando seus pedidos...</p>';

    try {
        // Mock de pedidos para demonstração rápida (conforme imagens do usuário)
        const mockPedidos = [
            {
                id: "S4SF7IXI",
                data: "19/10/2025 - 12:40",
                itens: [{ nome: "FEIJOADA PARA 2 PESSOAS COMPLETA (750ml)", qtd: 1 }],
                status: "Andamento"
            },
            {
                id: "TDA4NDXQ",
                data: "12/07/2025 - 11:25",
                itens: [{ nome: "FEIJOADA PARA 2 PESSOAS COMPLETA (750ml)", qtd: 1 }],
                status: "Andamento"
            },
            {
                id: "R2POU7UE",
                data: "10/11/2024 - 12:03",
                itens: [{ nome: "FEIJOADA FAMÍLIA COMPLETA (1000ml)", qtd: 1 }],
                status: "Andamento"
            },
            {
                id: "TDQG7S3Y",
                data: "20/10/2024 - 11:33",
                itens: [{ nome: "FEIJOADA INDIVIDUAL COMPLETA (500ml)", qtd: 1 }],
                status: "Andamento"
            }
        ];

        renderizarListaPedidos(mockPedidos);

    } catch (error) {
        console.error("Erro ao carregar pedidos:", error);
        container.innerHTML = '<p>Erro ao carregar pedidos.</p>';
    }
}

function renderizarListaPedidos(pedidos) {
    const container = document.getElementById('orders-container');
    container.innerHTML = pedidos.map(p => `
        <div class="order-card">
            <div class="order-id">#${p.id}</div>
            <div class="order-date">${p.data}</div>
            <div class="order-items-label">Itens do pedido</div>
            <div class="order-items-list">
                ${p.itens.map(item => `
                    <div class="order-item">
                        <span class="qty">${item.qtd}</span>
                        <span class="name">${item.nome}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-status-badge">
                <i class="fa fa-list-ul"></i> ${p.status}
            </div>
            <div class="order-actions">
                <button class="btn-order-action"><i class="fa fa-star-o"></i> Avaliar</button>
                <button class="btn-order-action" onclick="verAndamentoPedido('${p.id}')"><i class="fa fa-search"></i> Detalhes</button>
                <button class="btn-order-action"><i class="fa fa-refresh"></i> Refazer pedido</button>
            </div>
        </div>
    `).join('');
}

window.verAndamentoPedido = function (id) {
    const listSec = document.getElementById('order-list-section');
    const trackSec = document.getElementById('order-tracking-section');
    const idBanner = document.getElementById('tracking-order-id');
    const timeline = document.getElementById('tracking-timeline');

    listSec.style.display = 'none';
    trackSec.style.display = 'block';
    idBanner.innerText = `#PEDIDO ${id}`;

    // Timeline mockada baseada na imagem
    const etapas = [
        { titulo: "Realizado", time: "19/10/2025 - 12:49", active: true },
        { titulo: "Aceito", time: "19/10/2025 - 12:51", active: true },
        { titulo: "Preparado", time: "19/10/2025 - 13:28", active: true },
        { titulo: "Saiu para entrega", time: "19/10/2025 - 13:28", active: true },
        { titulo: "Entregador no local", time: "19/10/2025 - 13:36", info: "Entregador: MARCELO FERNANDES. Placa: NJO 8103", active: true },
        { titulo: "Entregue", time: "19/10/2025 - 15:10", active: true }
    ];

    timeline.innerHTML = etapas.map(e => `
        <div class="timeline-item ${e.active ? 'active' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <span class="timeline-title">${e.titulo}</span>
                <span class="timeline-time">${e.time}</span>
                ${e.info ? `<span class="timeline-info">${e.info}</span>` : ''}
            </div>
        </div>
    `).join('');
};

document.getElementById('btn-todos-track').onclick = () => {
    document.getElementById('order-list-section').style.display = 'block';
    document.getElementById('order-tracking-section').style.display = 'none';
};

export async function fazerLogout() {
    try {
        await signOut(auth);
        window.location.reload();
    } catch (error) {
        console.error("Erro ao deslogar:", error);
    }
}

