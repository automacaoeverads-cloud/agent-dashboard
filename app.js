/* ─── EverIA Agent Dashboard ─────────────────────────────── */

let config = {};
let currentAgent = null;
let qrPollTimer = null;
let countdownInterval = null;
const QR_TTL_MS = 60000; // WhatsApp QR codes expire in ~60s

async function loadAgents() {
  try {
    const res = await fetch('agents.json?t=' + Date.now());
    config = await res.json();
    render();
  } catch (e) {
    console.error('Falha ao carregar agents.json:', e);
    document.getElementById('emptyState').classList.remove('hidden');
  }
}

function render() {
  const agents = config.agents || [];
  const grid   = document.getElementById('agentsGrid');
  const empty  = document.getElementById('emptyState');

  if (!agents.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  document.getElementById('statActive').textContent   = agents.filter(a => a.status === 'active').length;
  document.getElementById('statTotal').textContent    = agents.length;
  document.getElementById('statWhatsapp').textContent = agents.filter(a => !a.connections?.whatsapp?.connected).length;

  grid.innerHTML = agents.map(buildCard).join('');

  grid.querySelectorAll('[data-connect]').forEach(btn => {
    btn.addEventListener('click', () => {
      const agent = agents.find(a => a.id === btn.getAttribute('data-connect'));
      if (agent) openModal(agent);
    });
  });
}

/* ─── Card Builder ──────────────────────────────────────── */

function buildCard(agent) {
  const tg = agent.connections?.telegram;
  const wa = agent.connections?.whatsapp;
  const isActive = agent.status === 'active';

  const tgIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>`;
  const waIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;

  const tgRow = tg ? `
    <div class="connection-row">
      <div class="conn-left">
        <div class="conn-icon tg">${tgIcon}</div>
        <div class="conn-details">
          <div class="conn-name">Telegram</div>
          <div class="conn-info">${tg.bot_username ? '@' + tg.bot_username : '—'}</div>
        </div>
      </div>
      <div class="conn-status">
        <span class="pill ${tg.connected ? 'connected' : 'disconnected'}">
          ${tg.connected ? '● Conectado' : '○ Desconectado'}
        </span>
      </div>
    </div>` : '';

  const waRow = wa ? `
    <div class="connection-row">
      <div class="conn-left">
        <div class="conn-icon wa">${waIcon}</div>
        <div class="conn-details">
          <div class="conn-name">WhatsApp</div>
          <div class="conn-info">${wa.phone || (wa.connected ? 'Conectado' : 'Não conectado')}</div>
        </div>
      </div>
      <div class="conn-status">
        ${wa.connected
          ? '<span class="pill connected">● Conectado</span>'
          : `<span class="pill disconnected">○ Pendente</span>
             <button class="btn-connect" data-connect="${agent.id}">Conectar</button>`
        }
      </div>
    </div>` : '';

  return `
    <div class="agent-card ${isActive ? '' : 'inactive'}">
      <div class="card-top">
        <div class="agent-avatar">${agent.avatar || '🤖'}</div>
        <div class="card-info">
          <div class="agent-name">
            ${escHtml(agent.name)}
            ${agent.role ? `<span class="badge-role">${escHtml(agent.role)}</span>` : ''}
          </div>
          <div class="agent-client">
            ${agent.client_url
              ? `<a href="${escHtml(agent.client_url)}" target="_blank" rel="noopener">${escHtml(agent.client)}</a>`
              : escHtml(agent.client || '')}
          </div>
          <span class="status-badge ${isActive ? 'active' : 'inactive'}">
            <span class="status-dot"></span>
            ${isActive ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>
      ${agent.description ? `<p class="agent-desc">${escHtml(agent.description)}</p>` : ''}
      <div>
        <div class="connections-label">Canais</div>
        <div class="connections">${tgRow}${waRow}</div>
      </div>
    </div>`;
}

/* ─── Modal ─────────────────────────────────────────────── */

function openModal(agent) {
  currentAgent = agent;
  document.getElementById('modalAgentName').textContent = `Conectar WhatsApp — ${agent.name}`;
  document.getElementById('modalAccountId').textContent = `account: ${agent.connections?.whatsapp?.account_id || '—'}`;
  resetQrState();
  document.getElementById('waModal').classList.remove('hidden');
}

function closeModal() {
  stopQrFlow();
  document.getElementById('waModal').classList.add('hidden');
  currentAgent = null;
}

/* ─── QR State Machine ──────────────────────────────────── */

function resetQrState() {
  stopQrFlow();
  show('qrPlaceholder'); hide('qrCanvas'); hide('qrSpinner'); hide('qrSuccess'); hide('qrError'); hide('qrTimer');
  document.getElementById('btnGenerateQrLabel').textContent = 'Gerar QR Code';
  document.getElementById('btnGenerateQr').disabled = false;
}

function showSpinner() {
  hide('qrPlaceholder'); hide('qrCanvas'); show('qrSpinner'); hide('qrSuccess'); hide('qrError');
}

function showQr(dataUrl) {
  hide('qrPlaceholder'); hide('qrSpinner'); hide('qrSuccess'); hide('qrError');
  const canvas = document.getElementById('qrCanvas');
  // Draw the QR onto our canvas
  QRCode.toCanvas(canvas, dataUrl, {
    width: 200,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  }, (err) => {
    if (err) { showError('Erro ao renderizar QR'); return; }
    show('qrCanvas');
    startCountdown();
  });
}

function showSuccess() {
  stopQrFlow();
  hide('qrPlaceholder'); hide('qrCanvas'); hide('qrSpinner'); hide('qrError'); hide('qrTimer');
  show('qrSuccess');
  document.getElementById('btnGenerateQrLabel').textContent = 'Gerar Novo QR';
  document.getElementById('btnGenerateQr').disabled = false;
  // Reload agents to update status
  setTimeout(loadAgents, 1500);
}

function showError(msg) {
  stopQrFlow();
  hide('qrPlaceholder'); hide('qrCanvas'); hide('qrSpinner'); hide('qrSuccess'); hide('qrTimer');
  document.getElementById('qrErrorMsg').textContent = msg;
  show('qrError');
  document.getElementById('btnGenerateQrLabel').textContent = 'Tentar Novamente';
  document.getElementById('btnGenerateQr').disabled = false;
}

/* ─── Countdown Timer ───────────────────────────────────── */

function startCountdown() {
  show('qrTimer');
  const bar = document.getElementById('timerBar');
  const secs = document.getElementById('timerSecs');
  const total = QR_TTL_MS / 1000;
  let remaining = total;

  bar.style.width = '100%';
  bar.className = 'timer-bar';
  secs.textContent = total;

  countdownInterval = setInterval(() => {
    remaining--;
    const pct = (remaining / total) * 100;
    bar.style.width = pct + '%';
    secs.textContent = remaining;
    if (remaining <= 10) bar.className = 'timer-bar critical';
    else if (remaining <= 20) bar.className = 'timer-bar urgent';

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      // QR expired — auto regenerate
      generateQr();
    }
  }, 1000);
}

function stopQrFlow() {
  if (qrPollTimer)      { clearTimeout(qrPollTimer);   qrPollTimer = null; }
  if (countdownInterval){ clearInterval(countdownInterval); countdownInterval = null; }
}

/* ─── QR Generation Flow ────────────────────────────────── */

async function generateQr() {
  if (!currentAgent) return;

  stopQrFlow();
  showSpinner();
  document.getElementById('btnGenerateQr').disabled = true;
  document.getElementById('btnGenerateQrLabel').textContent = 'Aguardando…';

  const accountId = currentAgent.connections?.whatsapp?.account_id || '';

  try {
    const url = `/api/whatsapp-qr?action=start&account=${encodeURIComponent(accountId)}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.ok) {
      showError(data.error || 'Falha ao conectar ao servidor');
      return;
    }

    const result = data.result;

    // whatsapp_login with action=start returns:
    // { status: 'qr', qr: '<qr-string>' }  → show QR
    // { status: 'open' }                    → already connected
    // { status: 'connecting' }              → still connecting

    if (result?.status === 'open' || result?.connected) {
      showSuccess();
      return;
    }

    if (result?.qr) {
      showQr(result.qr);
      pollForConnection(accountId);
      return;
    }

    // Unexpected response — show error
    showError('Resposta inesperada do servidor: ' + JSON.stringify(result).slice(0, 80));

  } catch (err) {
    showError('Erro de rede: ' + err.message);
  }
}

async function pollForConnection(accountId) {
  // Poll every 3 seconds to check if the QR was scanned
  qrPollTimer = setTimeout(async () => {
    if (!currentAgent) return;

    try {
      const url = `/api/whatsapp-qr?action=wait&account=${encodeURIComponent(accountId)}&timeout=5000`;
      const res  = await fetch(url);
      const data = await res.json();

      if (!res.ok) { pollForConnection(accountId); return; }

      const result = data.result;

      if (result?.status === 'open' || result?.connected) {
        showSuccess();
        return;
      }

      if (result?.status === 'qr' && result?.qr) {
        // New QR received (rotated) — update display
        stopQrFlow();
        showQr(result.qr);
        pollForConnection(accountId);
        return;
      }

      // Still waiting — poll again
      pollForConnection(accountId);

    } catch {
      // Network error — retry
      pollForConnection(accountId);
    }
  }, 3000);
}

/* ─── Events ─────────────────────────────────────────────── */

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('waModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});
document.getElementById('btnGenerateQr').addEventListener('click', generateQr);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

/* ─── Helpers ─────────────────────────────────────────────── */

function show(id) { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id) { document.getElementById(id)?.classList.add('hidden'); }

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ─── Init ───────────────────────────────────────────────── */
loadAgents();
