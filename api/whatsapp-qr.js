/**
 * Vercel Serverless Function — WhatsApp QR Proxy
 * Calls OpenClaw /tools/invoke (whatsapp_login) and returns the QR code data.
 *
 * GET /api/whatsapp-qr?account=amanda-ga&action=start
 * GET /api/whatsapp-qr?account=amanda-ga&action=wait
 */

const OPENCLAW_URL  = process.env.OPENCLAW_URL;   // e.g. http://srv1451643.hstgr.cloud:18789
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN; // gateway auth token

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!OPENCLAW_URL || !OPENCLAW_TOKEN) {
    return res.status(500).json({ error: 'OPENCLAW_URL or OPENCLAW_TOKEN not configured' });
  }

  const action  = req.query.action  || 'start';   // 'start' | 'wait'
  const account = req.query.account || undefined;  // e.g. 'amanda-ga'
  const force   = req.query.force === 'true';
  const timeout = parseInt(req.query.timeout || '30000', 10);

  if (!['start', 'wait'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Use start or wait.' });
  }

  try {
    const body = {
      tool: 'whatsapp_login',
      args: { action, force, timeoutMs: timeout },
    };

    // If account is specified, pass it via header
    const headers = {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json',
    };
    if (account) {
      headers['x-openclaw-account-id'] = account;
    }

    const upstream = await fetch(`${OPENCLAW_URL}/tools/invoke`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout + 5000),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: data?.error || 'Upstream error', detail: data });
    }

    // data.result contains the whatsapp_login response
    return res.status(200).json({ ok: true, result: data.result });

  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'Timeout waiting for QR code' : err.message,
    });
  }
}
