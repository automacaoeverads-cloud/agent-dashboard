/* ─── EverIA Agent Dashboard ──────────────────────────────── */

let config = {};
let currentAgent = null;

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
  const grid = document.getElementById('agentsGrid');
  const empty = document.getElementById('emptyState');

  if (!agents.length) {
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  // Stats
  const active = agents.filter(a => a.status === 'active').length;
  const waDisconnected = agents.filter(a => !a.connections?.whatsapp?.connected).length;
  document.getElementById('statActive').textContent = active;
  document.getElementById('statTotal').textContent = agents.length;
  document.getElementById('statWhatsapp').textContent = waDisconnected;

  grid.innerHTML = agents.map(agent => buildCard(agent)).join('');

  // Attach connect handlers
  grid.querySelectorAll('[data-connect]').forEach(btn => {
    btn.addEventListener('click', () => {
      const agentId = btn.getAttribute('data-connect');
      const agent = agents.find(a => a.id === agentId);
      if (agent) openModal(agent);
    });
  });
}

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
    </div>
  ` : '';

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
    </div>
  ` : '';

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
              : escHtml(agent.client || '')
            }
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
        <div class="connections">
          ${tgRow}
          ${waRow}
        </div>
      </div>
    </div>
  `;
}

/* ─── Modal ───────────────────────────────────────────────── */

function openModal(agent) {
  currentAgent = agent;
  const modal = document.getElementById('waModal');
  document.getElementById('modalAgentName').textContent = `Conectar WhatsApp — ${agent.name}`;
  document.getElementById('modalAccountId').textContent = `account_id: ${agent.connections?.whatsapp?.account_id || '—'}`;

  // Control UI link
  const cuiUrl = (config.openclaw_url || '') + '/channels/whatsapp';
  document.getElementById('openControlUI').href = cuiUrl;

  // Reset pairing
  document.getElementById('pairingInput').value = '';
  document.getElementById('pairingDisplay').classList.add('hidden');

  // Reset tabs
  switchTab('qr');

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('waModal').classList.add('hidden');
  currentAgent = null;
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tab));
  document.getElementById('tabQr').classList.toggle('hidden', tab !== 'qr');
  document.getElementById('tabPairing').classList.toggle('hidden', tab !== 'pairing');
}

/* ─── Pairing Code ────────────────────────────────────────── */

function showPairing() {
  const raw = document.getElementById('pairingInput').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (raw.length < 4) {
    alert('Digite pelo menos 4 caracteres do código de pareamento.');
    return;
  }
  // Format: XXXX-XXXX
  const formatted = raw.length >= 8 ? raw.slice(0, 4) + '-' + raw.slice(4, 8) : raw;
  document.getElementById('pairingCode').textContent = formatted;
  document.getElementById('pairingDisplay').classList.remove('hidden');
}

/* ─── Events ──────────────────────────────────────────────── */

document.getElementById('modalClose').addEventListener('click', closeModal);

document.getElementById('waModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab.getAttribute('data-tab')));
});

document.getElementById('showPairingCode').addEventListener('click', showPairing);

document.getElementById('pairingInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') showPairing();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* ─── Utils ───────────────────────────────────────────────── */

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ─── Init ────────────────────────────────────────────────── */
loadAgents();
