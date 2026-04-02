// ─────────────────────────────────────────────────────────────
// auth.js  —  Autenticação via WhatsApp (Evolution API + Backend Node.js)
// ─────────────────────────────────────────────────────────────
const BACKEND_URL = 'http://localhost:3000';

// ─────────────────────────────────────────
// PASSO 1 — Botão "Fazer login" clicado
// ─────────────────────────────────────────
export async function fazerLogin() {
    const telefoneInput = document.getElementById('telefone-input');
    const erroTexto     = document.getElementById('telefone-error');
    const inputGroup    = document.querySelector('.input-group');
    let telefone        = telefoneInput.value.replace(/\D/g, '');

    // Valida o número
    if (telefone.length < 10) {
        const modal = document.getElementById('modal-validacao');
        if (modal)      modal.style.display    = 'flex';
        if (erroTexto)  erroTexto.style.display = 'block';
        if (inputGroup) inputGroup.style.border  = '1px solid #e73d4a';
        return;
    }

    if (erroTexto)  erroTexto.style.display = 'none';
    if (inputGroup) inputGroup.style.border  = '1px solid #ccc';

    // Formata para exibição: XX XXXXX-XXXX
    let telFormatado = telefone;
    if (telefone.length === 11) {
        telFormatado = telefone.replace(/(\d{2})(\d{5})(\d{4})/, '$1 $2-$3');
    } else if (telefone.length === 10) {
        telFormatado = telefone.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2-$3');
    }

    const numeroCompletoExibicao = `+55 ${telFormatado}`;
    exibirTelaOpcaoEnvio(telefone, numeroCompletoExibicao);
}

// ─────────────────────────────────────────
// PASSO 2 — Escolha: WhatsApp ou SMS
// ─────────────────────────────────────────
function exibirTelaOpcaoEnvio(telefonePuro, telefoneFormatado) {
    const portletTitle = document.querySelector('.portlet-title');
    const portletBody  = document.querySelector('.portlet-body.form');

    portletTitle.innerHTML = `<i class="fa fa-lock"></i> CONFIRMAÇÃO`;
    portletBody.innerHTML = `
        <div class="confirmacao-container">
            <p class="confirmacao-msg">
                Localizamos sua conta no telefone <strong>${telefoneFormatado}</strong>,
                como deseja receber o código de confirmação para login?
            </p>

            <button class="btn-confirm-option" id="btn-whatsapp">
                <span class="option-title">Código por WhatsApp</span>
                <span class="option-subtitle">⚡ Recebimento rápido do código</span>
            </button>

            <div class="text-divisor">ou</div>

            <button class="btn-confirm-option" id="btn-sms" style="opacity: 0.5; cursor: not-allowed;" disabled title="Em breve">
                <span class="option-title">Código por SMS</span>
                <span class="option-subtitle">🚧 Indisponível no momento</span>
            </button>
        </div>
    `;

    document.getElementById('btn-whatsapp').addEventListener('click', () => {
        enviarCodigoPorWhatsApp(telefonePuro, telefoneFormatado);
    });
}

// ─────────────────────────────────────────
// PASSO 3 — Chama o backend para enviar o código via Evolution
// ─────────────────────────────────────────
async function enviarCodigoPorWhatsApp(telefonePuro, telefoneFormatado) {
    const portletBody = document.querySelector('.portlet-body.form');

    // Mostra loading enquanto envia
    portletBody.innerHTML = `
        <div class="confirmacao-container" style="text-align: center; padding: 30px 0;">
            <i class="fa fa-spinner fa-spin" style="font-size: 36px; color: #25D366;"></i>
            <p style="margin-top: 15px; color: #555;">Enviando código via WhatsApp...</p>
        </div>
    `;

    const numeroCompleto = '55' + telefonePuro; // Formato para a Evolution: 5599999999999

    try {
        const res  = await fetch(`${BACKEND_URL}/auth/enviar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero: numeroCompleto })
        });
        const data = await res.json();

        if (data.sucesso) {
            exibirTelaVerificacaoCodigo(telefonePuro, telefoneFormatado);
            exibirModalSucesso(telefoneFormatado, 'WhatsApp');
        } else {
            throw new Error(data.erro || 'Erro desconhecido');
        }
    } catch (err) {
        console.error('Erro ao enviar código:', err);
        portletBody.innerHTML = `
            <div class="confirmacao-container" style="text-align:center; padding: 30px 0;">
                <i class="fa fa-times" style="font-size: 36px; color: #e73d4a;"></i>
                <p style="margin-top: 15px; color: #e73d4a;">
                    Erro ao enviar o código. Verifique sua conexão e se o WhatsApp está conectado à Evolution API.
                </p>
                <button class="btn-login" onclick="window.location.reload()">Tentar novamente</button>
            </div>
        `;
    }
}

// ─────────────────────────────────────────
// PASSO 4 — Tela de inserção do código recebido
// ─────────────────────────────────────────
function exibirTelaVerificacaoCodigo(telefonePuro, telefoneFormatado) {
    const portletBody = document.querySelector('.portlet-body.form');
    if (!portletBody) return;

    portletBody.innerHTML = `
        <div class="confirmacao-container">
            <p class="confirmacao-msg" style="margin-bottom: 20px;">
                Código enviado para <strong>${telefoneFormatado}</strong> via WhatsApp.
            </p>

            <button class="btn-confirm-option" id="btn-resend-whatsapp" style="opacity: 0.7; cursor: default; background-color: #666;" disabled>
                <span class="option-title">Código por WhatsApp</span>
                <span class="option-subtitle">⚡ Recebimento rápido do código</span>
            </button>

            <div id="verificacao-form-area" style="margin-top: 0px; border-top: 1px solid #ebebeb; padding-top: 0px;">
                <p class="timer-text" id="area-timer">
                    Você precisa aguardar <strong id="timer-segundos">60</strong> segundos para solicitar um novo código.
                </p>

                <div class="form-group" style="margin-top: 25px;">
                    <label class="input-codigo-label">Código <span>*</span></label>
                    <input type="number" id="codigo-verificacao" class="form-control-codigo" placeholder="Digite o código recebido" maxlength="6">
                </div>

                <p class="help-text-small">
                    Caso não receba o código, verifique se o número de WhatsApp está correto e se o app está aberto no celular.
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

    // Timer de reenvio (60 segundos)
    const btnResend    = document.getElementById('btn-resend-whatsapp');
    const timerElement = document.getElementById('timer-segundos');
    const areaTimer    = document.getElementById('area-timer');

    let segundos = 60;
    const interval = setInterval(() => {
        segundos--;
        if (timerElement) timerElement.innerText = segundos;

        if (segundos <= 0) {
            clearInterval(interval);
            if (areaTimer) areaTimer.innerText = 'Você já pode solicitar um novo código.';
            if (btnResend) {
                btnResend.disabled = false;
                btnResend.style.opacity = '1';
                btnResend.style.cursor  = 'pointer';
                btnResend.style.backgroundColor = '#4b4b4b';
                btnResend.addEventListener('click', () => enviarCodigoPorWhatsApp(telefonePuro, telefoneFormatado));
            }
        }
    }, 1000);

    // Botão Confirmar
    const btnVerificar = document.getElementById('btn-verificar-codigo');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', () => verificarCodigo(telefonePuro));
    }
}

// ─────────────────────────────────────────
// PASSO 5 — Verifica o código com o backend
// ─────────────────────────────────────────
async function verificarCodigo(telefonePuro) {
    const codigoInput  = document.getElementById('codigo-verificacao');
    const codigoRaw    = codigoInput ? codigoInput.value.trim() : '';
    const codigo       = codigoRaw.replace(/\D/g, ''); // Remove hífens ou outros caracteres

    if (codigo.length !== 6) {
        exibirModalErroCodigo();
        return;
    }

    const btnVerificar = document.getElementById('btn-verificar-codigo');
    if (btnVerificar) {
        btnVerificar.disabled   = true;
        btnVerificar.innerHTML  = '<i class="fa fa-spinner fa-spin"></i> Verificando...';
    }

    try {
        const res  = await fetch(`${BACKEND_URL}/auth/verificar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numero: '55' + telefonePuro, codigo })
        });
        const data = await res.json();

        if (data.sucesso) {
            // Salva sessão local simples
            localStorage.setItem('auth_numero',    '55' + telefonePuro);
            localStorage.setItem('auth_loggedin',  'true');

            // Atualiza a UI mostrando os pedidos
            mostrarTelaPedidos();
        } else {
            exibirModalErroCodigo();
            if (btnVerificar) {
                btnVerificar.disabled  = false;
                btnVerificar.innerHTML = 'Confirmar <i class="fa fa-check"></i>';
            }
        }
    } catch (err) {
        console.error('Erro ao verificar código:', err);
        exibirModalErroCodigo();
        if (btnVerificar) {
            btnVerificar.disabled  = false;
            btnVerificar.innerHTML = 'Confirmar <i class="fa fa-check"></i>';
        }
    }
}

// ─────────────────────────────────────────
// STATE — Verifica se já está logado ao carregar a página
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('auth_loggedin') === 'true') {
        mostrarTelaPedidos();
    }
});

function mostrarTelaPedidos() {
    const loginView  = document.getElementById('webapp-login');
    const ordersView = document.getElementById('webapp-orders');
    const logoSec    = document.getElementById('header-logo-container');
    const titleSec   = document.getElementById('header-title-container');
    const btnSair    = document.getElementById('btn-sair-header');

    if (loginView)  loginView.style.display  = 'none';
    if (ordersView) ordersView.style.display = 'block';
    if (logoSec)    logoSec.style.display    = 'none';
    if (titleSec)   titleSec.style.display   = 'flex';
    if (btnSair)    btnSair.style.display    = 'block';

    carregarMeusPedidos();
}

// ─────────────────────────────────────────
// Carrega e renderiza os pedidos (mock por enquanto)
// ─────────────────────────────────────────
async function carregarMeusPedidos() {
    const container = document.getElementById('orders-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; padding: 20px;">Buscando seus pedidos...</p>';

    // Pedidos fixos solicitados
    // Busca pedidos do localStorage para persistir os reais
    const pedidosSalvos = JSON.parse(localStorage.getItem('meus_pedidos') || '[]');
    let todosOsPedidos = [...pedidosSalvos];

    // Se não tiver nada, mantém os mocks para demonstração
    if (todosOsPedidos.length === 0) {
        todosOsPedidos = [
            { id: "S4SF7IXI", data: "25/03/2026 - 12:40", itens: [{ nome: "FEIJOADA PARA 2 PESSOAS COMPLETA (750ml)", qtd: 1 }], status: "Andamento", total: 45.00, pagamento: "pix" },
            { id: "TDA4NDXQ", data: "22/03/2026 - 11:25", itens: [{ nome: "FEIJOADA PARA 2 PESSOAS COMPLETA (750ml)", qtd: 1 }], status: "Andamento", total: 45.00, pagamento: "cartao" }
        ];
    }

    // Se houver um novo pedido na URL, adiciona ele no topo da lista
    const params = new URLSearchParams(window.location.search);
    if (params.get('new_order') === 'true') {
        const id = params.get('id') || 'NOVO_PEDIDO';
        const payment = params.get('payment') || 'pix';
        const totalStr = params.get('total') || 'R$ 0,00';
        const totalNum = parseFloat(totalStr.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

        // Evita duplicar se já estiver na lista
        if (!todosOsPedidos.find(p => p.id === id)) {
            todosOsPedidos.unshift({
                id: id,
                data: new Date().toLocaleDateString('pt-BR') + " - " + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
                itens: [{ nome: "NOVO PEDIDO DO CARRINHO", qtd: 1 }],
                status: "Andamento",
                total: totalNum,
                pagamento: payment
            });
        }
    }

    window.pedidosCache = todosOsPedidos;
    renderizarListaPedidos(todosOsPedidos);
}

function renderizarListaPedidos(pedidos) {
    const container = document.getElementById('orders-container');
    container.innerHTML = pedidos.map(p => {
        const rawId = p.id.toString().startsWith('ORDER_') ? p.id.replace('ORDER_', '') : p.id;
        return `
            <div class="order-card">
                <div class="order-id"><i class="fa fa-slack"></i> ${rawId}</div>
                <div class="order-date">${p.data}</div>
                <div class="order-items-label">Itens do pedido</div>
                <div class="order-items-list">
                    ${p.itens.map(item => `
                        <div class="order-item">
                            <span class="qty">${item.quantidade || item.qtd || 1}</span>
                            <span class="name">${item.nome}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-actions">
                    <button class="btn-order-status" onclick="verAndamentoPedido('${p.id}')">
                        <i class="fa fa-list-ul"></i> Andamento
                    </button>
                    <button class="btn-order-action"><i class="fa fa-star"></i> Avaliar</button>
                    <button class="btn-order-action" onclick="verAndamentoPedido('${p.id}')"><i class="fa fa-search"></i> Detalhes</button>
                    <button class="btn-order-action"><i class="fa fa-refresh"></i> Refazer pedido</button>
                </div>
            </div>
        `;
    }).join('');
}

window.verAndamentoPedido = function (id, isApproved = false) {
    const ordersView = document.getElementById('webapp-orders');
    const listSec    = document.getElementById('order-list-section');
    const trackSec   = document.getElementById('order-tracking-section');
    const idBanner   = document.getElementById('tracking-order-id');
    const timeline   = document.getElementById('tracking-timeline');

    // Forçar visibilidade do container mestre e seções com prioridade máxima
    if (ordersView) ordersView.style.setProperty('display', 'block', 'important');
    if (listSec)    listSec.style.setProperty('display', 'none', 'important');
    if (trackSec)   trackSec.style.setProperty('display', 'block', 'important');

    if (!id) return;
    const rawId = id.toString().startsWith('ORDER_') ? id.toString().replace('ORDER_', '') : id;
    if (idBanner) idBanner.innerText = `#PEDIDO ${rawId}`;

    // Lógica para o Box do Pix
    const pixSec = document.getElementById('pix-tracking-box');
    const noteSec = document.getElementById('box-notificacoes');
    const pedido = (window.pedidosCache || []).find(p => p.id === id);
    
    // Detecta forma de pagamento com fallback agressivo
    const params = new URLSearchParams(window.location.search);
    const formaPagamento = pedido ? pedido.pagamento : (params.get('payment') || 'pix');
    const valorTotalStr = params.get('total') || (pedido ? pedido.total : '0');
    const valorTotal = pedido ? (pedido.total || 0) : parseFloat((valorTotalStr.toString()).replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    // Garante que a barra de notificações e a timeline apareçam
    if (noteSec) noteSec.style.display = 'block'; 
    if (timeline) timeline.style.display = 'block'; 

    if (pixSec) {
        // Se for Pix, mostramos o box obrigatoriamente (a menos que já aprovado) com prioridade
        if (formaPagamento === 'pix' && !isApproved) {
            pixSec.style.setProperty('display', 'block', 'important');
            
            const totalEl = pixSec.querySelector('.pix-total');
            if (totalEl) totalEl.innerText = `TOTAL: R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
            
            const btnWhatsApp = pixSec.querySelector('.btn-pix-whatsapp');
            if (btnWhatsApp) {
                btnWhatsApp.onclick = (e) => {
                    e.stopPropagation();
                    const msg = `Olá, estou enviando o comprovante do pedido #${rawId}`;
                    window.open(`https://api.whatsapp.com/send?phone=559991388338&text=${encodeURIComponent(msg)}`, '_blank');
                };
            }
        } else {
            pixSec.style.display = 'none';
        }
    }

    const etapas = [
        { titulo: "Realizado",           time: (pedido && pedido.data) ? pedido.data : (new Date().toLocaleDateString('pt-BR') + " - " + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})), active: true },
        { titulo: "Aceito",              time: isApproved ? new Date().toLocaleString('pt-BR').split(',')[0] + " - " + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "Data não definida", active: isApproved },
        { titulo: "Em preparo",           time: "Data não definida", active: false },
        { titulo: "Saiu para entrega",   time: "Data não definida", active: false },
        { titulo: "Entregador no local", time: "Data não definida", active: false },
        { titulo: "Entregue",            time: "Data não definida", active: false }
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

document.addEventListener('DOMContentLoaded', () => {
    const btnTodos = document.getElementById('btn-todos-track');
    if (btnTodos) {
        btnTodos.onclick = () => {
            document.getElementById('order-list-section').style.display  = 'block';
            document.getElementById('order-tracking-section').style.display = 'none';
        };
    }
});

// ─────────────────────────────────────────
// Logout
// ─────────────────────────────────────────
export async function fazerLogout() {
    localStorage.removeItem('auth_numero');
    localStorage.removeItem('auth_loggedin');
    window.location.reload();
}

// ─────────────────────────────────────────
// Modais de Feedback
// ─────────────────────────────────────────
function exibirModalSucesso(telefoneFormatado, metodo) {
    let modal = document.getElementById('modal-sucesso-container');
    if (!modal) {
        modal          = document.createElement('div');
        modal.id       = 'modal-sucesso-container';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-success-card">
            <div class="success-icon-circle"><i class="fa fa-check"></i></div>
            <h2>Código Enviado!</h2>
            <p>Um código foi enviado para <strong>${telefoneFormatado}</strong> por ${metodo}.</p>
            <button class="btn-modal-ok" id="btn-modal-sucesso-ok">OK</button>
        </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('btn-modal-sucesso-ok').onclick = () => { modal.style.display = 'none'; };
}

function exibirModalErroCodigo() {
    let modal = document.getElementById('modal-erro-codigo');
    if (!modal) {
        modal          = document.createElement('div');
        modal.id       = 'modal-erro-codigo';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-success-card">
            <div class="success-icon-circle" style="border-color: #f27474; color: #f27474;">
                <span class="material-symbols-outlined" style="font-size: 50px;">close</span>
            </div>
            <h2 style="color: #595959; font-weight: 300;">Código Inválido</h2>
            <p style="color: #545454; font-size: 14px; margin-bottom: 25px;">
                O código digitado não corresponde ou expirou. Tente novamente!
            </p>
            <button class="btn-modal-ok" style="background-color: #f27474;" id="btn-modal-erro-codigo-ok">OK</button>
        </div>
    `;
    modal.style.display = 'flex';
    document.getElementById('btn-modal-erro-codigo-ok').onclick = () => { modal.style.display = 'none'; };
}
