// Google Agenda ligado ao workspace, nos dois sentidos.
// - Ida: ação/reunião com data no workspace vira evento na agenda principal do Carlos (e é atualizada/apagada junto).
// - Volta: ao abrir o workspace, os eventos do Google são lidos; se ele mudou a data no Google, a ação muda junto,
//   e os compromissos criados direto no Google aparecem no workspace.
// Credenciais: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET na Vercel ou, se não houver, as que o Carlos salvar no admin
// (area:google:app). O acesso autorizado fica em area:google:conta {refresh, email}. Vínculos: area:gcal (id da ação -> id do evento).

const SITE = 'https://sejaunique.vercel.app';
const VOLTA = SITE + '/api/agenda?a=volta';
const ESCOPO = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/userinfo.email openid';
const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

async function app(redis) {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) return { id: process.env.GOOGLE_CLIENT_ID, segredo: process.env.GOOGLE_CLIENT_SECRET, origem: 'vercel' };
  const [v] = await redis([['GET', 'area:google:app']]);
  const a = json(v);
  return a && a.id && a.segredo ? Object.assign(a, { origem: 'admin' }) : null;
}
async function conta(redis) { const [v] = await redis([['GET', 'area:google:conta']]); return json(v); }

async function token(redis) {
  const [c, cache] = await redis([['GET', 'area:google:conta'], ['GET', 'area:google:token']]);
  if (cache) return cache;
  const cv = json(c), a = await app(redis);
  if (!cv || !cv.refresh || !a) return null;
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: a.id, client_secret: a.segredo, refresh_token: cv.refresh, grant_type: 'refresh_token' })
  });
  const j = await r.json().catch(() => ({}));
  if (!j.access_token) {
    if (j.error === 'invalid_grant') await redis([['SET', 'area:google:conta', JSON.stringify(Object.assign(cv, { erro: 'Acesso revogado ou expirado. Conecte de novo.' }))]]);
    return null;
  }
  await redis([['SET', 'area:google:token', j.access_token, 'EX', Math.max(60, (j.expires_in || 3600) - 120)]]);
  return j.access_token;
}

async function g(redis, metodo, url, corpo) {
  const t = await token(redis);
  if (!t) return { ok: false, off: true };
  const r = await fetch(url, { method: metodo, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: corpo ? JSON.stringify(corpo) : undefined });
  if (r.status === 204) return { ok: true };
  const j = await r.json().catch(() => ({}));
  return Object.assign({ ok: r.ok, status: r.status }, j);
}

function urlConectar(a, estado) {
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: a.id, redirect_uri: VOLTA, response_type: 'code', scope: ESCOPO,
    access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: estado
  });
}

async function trocaCodigo(redis, code) {
  const a = await app(redis);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ code, client_id: a.id, client_secret: a.segredo, redirect_uri: VOLTA, grant_type: 'authorization_code' })
  });
  const j = await r.json().catch(() => ({}));
  if (!j.refresh_token) return { ok: false, erro: j.error_description || j.error || 'O Google não devolveu o acesso permanente.' };
  let email = '';
  try { const u = await (await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: 'Bearer ' + j.access_token } })).json(); email = u.email || ''; } catch (e) { /* segue */ }
  await redis([['SET', 'area:google:conta', JSON.stringify({ refresh: j.refresh_token, email, conectado: new Date().toISOString() })], ['SET', 'area:google:token', j.access_token, 'EX', Math.max(60, (j.expires_in || 3600) - 120)]]);
  return { ok: true, email };
}

// monta o evento a partir da ação
function evento(m, nomes, emails) {
  const base = { summary: m.titulo, description: [m.detalhe, m.link ? (m.link.charAt(0) === '/' ? SITE + m.link : m.link) : '', nomes ? 'Cliente: ' + nomes : '', 'Workspace: ' + SITE + '/area/admin/#acoes'].filter(Boolean).join('\n\n'), extendedProperties: { private: { unique: m.id } } };
  const dia = s => s.slice(0, 10);
  const mais1 = s => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
  if (m.inicio && m.inicio.length > 10) {
    const ini = new Date(m.inicio + ':00-03:00'), fim = new Date(ini.getTime() + (m.duracao || 60) * 60000);
    base.start = { dateTime: ini.toISOString(), timeZone: 'America/Sao_Paulo' };
    base.end = { dateTime: fim.toISOString(), timeZone: 'America/Sao_Paulo' };
  } else {
    const d = m.prazo || m.inicio;
    if (!d) return null;
    if (m.prazo && m.tipo !== 'reuniao') base.summary = 'Entrega: ' + m.titulo;
    base.start = { date: dia(d) }; base.end = { date: mais1(dia(d)) };
  }
  if (emails && emails.length) base.attendees = emails.map(e => ({ email: e }));
  return base;
}

// cria/atualiza/apaga o evento ligado à ação (silencioso se o Google não estiver conectado)
async function sincroniza(redis, m, op) {
  try {
    const c = await conta(redis);
    if (!c || !c.refresh || c.erro) return null;
    const [ev] = await redis([['HGET', 'area:gcal', m.id]]);
    if (op === 'apagar') {
      if (ev) { await g(redis, 'DELETE', API + '/' + ev + '?sendUpdates=all'); await redis([['HDEL', 'area:gcal', m.id]]); }
      return null;
    }
    const corpo = evento(m, op && op.nomes, op && op.emails);
    if (corpo && op && op.meet) corpo.conferenceData = { createRequest: { requestId: 'u' + m.id + Date.now(), conferenceSolutionKey: { type: 'hangoutsMeet' } } };
    if (!corpo) { if (ev) { await g(redis, 'DELETE', API + '/' + ev); await redis([['HDEL', 'area:gcal', m.id]]); } return null; }
    const avisar = op && op.convidar ? 'all' : 'none';
    let r = ev ? await g(redis, 'PATCH', API + '/' + ev + '?conferenceDataVersion=1&sendUpdates=' + avisar, corpo) : null;
    if (!r || r.status === 404 || r.status === 410 || (r.ok && r.status === 'cancelled')) r = await g(redis, 'POST', API + '?conferenceDataVersion=1&sendUpdates=' + avisar, corpo);
    if (r && r.ok && r.id) { await redis([['HSET', 'area:gcal', m.id, r.id]]); return r; }
    return null;
  } catch (e) { return null; }
}

// lê os eventos do Google e traz para o workspace o que mudou lá
async function eventos(redis, de, ate) {
  const q = new URLSearchParams({ singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeMin: de, timeMax: ate, showDeleted: 'true' });
  const r = await g(redis, 'GET', API + '?' + q);
  if (!r.ok) return { ok: false, off: !!r.off, erro: r.error && r.error.message };
  const [mH, vinc] = await redis([['HGETALL', 'area:modelos'], ['HGETALL', 'area:gcal']]);
  const pares = h => { const o = {}; if (Array.isArray(h)) for (let i = 0; i < h.length; i += 2) o[h[i]] = h[i + 1]; else Object.assign(o, h || {}); return o; };
  const mods = pares(mH), lig = pares(vinc), cmds = [], lista = [];
  (r.items || []).forEach(e => {
    const id = e.extendedProperties && e.extendedProperties.private && e.extendedProperties.private.unique;
    if (id && lig[id] === e.id && e.status === 'cancelled') { cmds.push(['HDEL', 'area:gcal', id]); return; }
    if (id && mods[id] && lig[id] === e.id) {
      const m = json(mods[id]);
      // a data mudou no Google: atualiza a ação
      if (m) {
        let mudou = false;
        if (e.start.dateTime && m.inicio && m.inicio.length > 10) { const n = e.start.dateTime.slice(0, 16); if (n !== m.inicio) { m.inicio = n; mudou = true; } }
        else if (e.start.date) { const campo = m.prazo ? 'prazo' : 'inicio'; if (m[campo] !== e.start.date) { m[campo] = e.start.date; mudou = true; } }
        const t = String(e.summary || '').replace(/^Entrega: /, '');
        if (t && t !== m.titulo) { m.titulo = t.slice(0, 200); mudou = true; }
        if (mudou) cmds.push(['HSET', 'area:modelos', id, JSON.stringify(m)]);
      }
    }
    if (e.status === 'cancelled') return;
    lista.push({ id: e.id, titulo: e.summary || '(sem título)', inicio: e.start.dateTime || e.start.date, fim: e.end && (e.end.dateTime || e.end.date), diaInteiro: !!e.start.date, link: e.htmlLink, meet: e.hangoutLink || '', local: e.location || '', unique: id || '', convidados: (e.attendees || []).map(a => a.email).slice(0, 20) });
  });
  if (cmds.length) await redis(cmds);
  return { ok: true, eventos: lista };
}

async function criaEvento(redis, d) {
  const corpo = { summary: d.titulo, description: d.detalhe || '', location: d.local || '' };
  if (d.inicio && d.inicio.length > 10) {
    const a = new Date(d.inicio + ':00-03:00'), b = new Date(a.getTime() + (d.duracao || 60) * 60000);
    corpo.start = { dateTime: a.toISOString(), timeZone: 'America/Sao_Paulo' }; corpo.end = { dateTime: b.toISOString(), timeZone: 'America/Sao_Paulo' };
  } else { const x = new Date((d.inicio || '') + 'T12:00:00Z'); if (isNaN(x)) return { ok: false, erro: 'Data inválida.' }; const y = new Date(x); y.setUTCDate(y.getUTCDate() + 1); corpo.start = { date: x.toISOString().slice(0, 10) }; corpo.end = { date: y.toISOString().slice(0, 10) }; }
  if (d.emails && d.emails.length) corpo.attendees = d.emails.map(e => ({ email: e }));
  if (d.meet) corpo.conferenceData = { createRequest: { requestId: 'u' + Date.now(), conferenceSolutionKey: { type: 'hangoutsMeet' } } };
  if (d.unique) corpo.extendedProperties = { private: { unique: d.unique } };
  const r = await g(redis, 'POST', API + '?conferenceDataVersion=1&sendUpdates=' + (d.convidar ? 'all' : 'none'), corpo);
  if (r.ok && d.unique) await redis([['HSET', 'area:gcal', d.unique, r.id]]);
  return r;
}

module.exports = { app, conta, urlConectar, trocaCodigo, sincroniza, eventos, criaEvento, g, API, VOLTA };
