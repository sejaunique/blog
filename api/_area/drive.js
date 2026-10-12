// Arquivos de cada empresa no Google Drive do Carlos (mesma conexão do Google Agenda, com permissão do Drive).
// Estrutura: pasta "Clientes Unique" (area:drive:raiz) > uma pasta por empresa "Unique · <Empresa>" (area:emp:<slug>.drivePasta),
// compartilhada como editor com os e-mails dos contatos da empresa, sem o Google mandar e-mail (area:emp:<slug>.driveCompart).
const G = require('./google.js');
const D = 'https://www.googleapis.com/drive/v3/files';
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const PASTA = 'application/vnd.google-apps.folder';

async function pronto(redis) {
  const c = await G.conta(redis);
  if (!c || !c.refresh || c.erro) return { ok: false, falta: 'conectar' };
  if (!/auth\/drive(\s|$)/.test(c.escopos || '')) return { ok: false, falta: 'permissao' };
  return { ok: true };
}

async function criaPasta(redis, nome, pai) {
  const r = await G.g(redis, 'POST', D + '?fields=id,webViewLink', Object.assign({ name: nome, mimeType: PASTA }, pai ? { parents: [pai] } : {}));
  return r && r.id ? r : null;
}

async function raiz(redis) {
  const [v] = await redis([['GET', 'area:drive:raiz']]);
  if (v) { const r = await G.g(redis, 'GET', D + '/' + v + '?fields=id,trashed'); if (r.ok && !r.trashed) return v; }
  const p = await criaPasta(redis, 'Clientes Unique');
  if (!p) return null;
  await redis([['SET', 'area:drive:raiz', p.id]]);
  return p.id;
}

// garante a pasta da empresa e o compartilhamento com os contatos; devolve {id, link}
async function pastaEmpresa(redis, slug) {
  const [ev, emails] = await redis([['GET', 'area:emp:' + slug], ['SMEMBERS', 'area:users:' + slug]]);
  const e = json(ev);
  if (!e) return null;
  let mudou = false;
  if (e.drivePasta) {
    const r = await G.g(redis, 'GET', D + '/' + e.drivePasta + '?fields=id,trashed,webViewLink');
    if (!r.ok || r.trashed) { delete e.drivePasta; delete e.driveLink; e.driveCompart = []; mudou = true; }
  }
  if (!e.drivePasta) {
    const pai = await raiz(redis);
    const p = pai && await criaPasta(redis, 'Unique · ' + e.nome, pai);
    if (!p) return null;
    e.drivePasta = p.id; e.driveLink = p.webViewLink || ('https://drive.google.com/drive/folders/' + p.id); e.driveCompart = []; mudou = true;
  }
  const ja = e.driveCompart || [];
  for (const m of (emails || [])) {
    if (ja.indexOf(m) >= 0) continue;
    const r = await G.g(redis, 'POST', D + '/' + e.drivePasta + '/permissions?sendNotificationEmail=false', { role: 'writer', type: 'user', emailAddress: m });
    if (r.ok || r.id) { ja.push(m); mudou = true; }
  }
  e.driveCompart = ja;
  if (mudou) await redis([['SET', 'area:emp:' + slug, JSON.stringify(e)]]);
  return { id: e.drivePasta, link: e.driveLink };
}

async function lista(redis, pasta) {
  const q = new URLSearchParams({ q: "'" + pasta + "' in parents and trashed=false", orderBy: 'folder,modifiedTime desc', pageSize: '100', fields: 'files(id,name,mimeType,modifiedTime,size,iconLink,webViewLink,thumbnailLink,lastModifyingUser(displayName,emailAddress))' });
  const r = await G.g(redis, 'GET', D + '?' + q);
  if (!r.ok) return null;
  return (r.files || []).map(f => ({ id: f.id, nome: f.name, tipo: f.mimeType, pasta: f.mimeType === PASTA, data: f.modifiedTime, tamanho: +f.size || 0, icone: f.iconLink || '', link: f.webViewLink, miniatura: f.thumbnailLink || '', por: f.lastModifyingUser ? (f.lastModifyingUser.displayName || f.lastModifyingUser.emailAddress || '') : '' }));
}

async function envia(redis, pasta, nome, tipo, dados) {
  const t = await G.token(redis);
  if (!t) return null;
  const limite = 'unique' + Date.now().toString(36);
  const meta = JSON.stringify({ name: nome, parents: [pasta] });
  const corpo = Buffer.concat([
    Buffer.from('--' + limite + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + limite + '\r\nContent-Type: ' + (tipo || 'application/octet-stream') + '\r\n\r\n'),
    dados,
    Buffer.from('\r\n--' + limite + '--')
  ]);
  const r = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'multipart/related; boundary=' + limite }, body: corpo });
  const j = await r.json().catch(() => ({}));
  return r.ok && j.id ? j : null;
}

module.exports = { pronto, pastaEmpresa, lista, envia };
