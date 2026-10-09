// Notificações push para o app do Carlos (workspace instalado no celular/computador).
// Sem bibliotecas: usa Web Push "sem conteúdo" (o aviso só acorda o app, que busca o
// texto em /api/area?a=admin-notif). As chaves VAPID são criadas na primeira vez e
// ficam guardadas no Redis (area:vapid), então não precisa configurar nada na Vercel.
//
// Redis: area:vapid {publica, jwk}, area:push hash endpoint -> inscrição, area:notif lista (mais novo primeiro)

const crypto = require('crypto');
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function chaves(redis) {
  const [v] = await redis([['GET', 'area:vapid']]);
  if (v) { try { return JSON.parse(v); } catch (e) { /* recria */ } }
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
  const pub = publicKey.export({ format: 'jwk' });
  const k = {
    publica: b64u(Buffer.concat([Buffer.from([4]), Buffer.from(pub.x, 'base64'), Buffer.from(pub.y, 'base64')])),
    jwk: privateKey.export({ format: 'jwk' })
  };
  const [ok] = await redis([['SET', 'area:vapid', JSON.stringify(k), 'NX']]);
  if (!ok) { const [v2] = await redis([['GET', 'area:vapid']]); return JSON.parse(v2); }
  return k;
}

function jwt(k, aud) {
  const cab = b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const corpo = b64u(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: 'mailto:contato@sejaunique.com' }));
  const chave = crypto.createPrivateKey({ key: k.jwk, format: 'jwk' });
  const ass = crypto.sign('sha256', Buffer.from(cab + '.' + corpo), { key: chave, dsaEncoding: 'ieee-p1363' });
  return cab + '.' + corpo + '.' + b64u(ass);
}

// registra o aviso e acorda todos os aparelhos inscritos
async function notifica(redis, n) {
  try {
    const item = { id: Date.now().toString(36) + crypto.randomBytes(2).toString('hex'), titulo: String(n.titulo || 'Unique').slice(0, 80), texto: String(n.texto || '').slice(0, 200), url: n.url || '/area/admin/#notificacoes', data: new Date().toISOString() };
    const [, , subs] = await redis([['LPUSH', 'area:notif', JSON.stringify(item)], ['LTRIM', 'area:notif', 0, 199], ['HGETALL', 'area:push']]);
    const lista = [];
    if (Array.isArray(subs)) for (let i = 0; i < subs.length; i += 2) lista.push(subs[i]);
    else if (subs) Object.keys(subs).forEach(e => lista.push(e));
    if (!lista.length) return;
    const k = await chaves(redis);
    const mortas = [];
    await Promise.all(lista.map(async ep => {
      try {
        const u = new URL(ep);
        const r = await fetch(ep, { method: 'POST', headers: { TTL: '86400', Urgency: 'high', 'Content-Length': '0', Authorization: 'vapid t=' + jwt(k, u.origin) + ', k=' + k.publica } });
        if (r.status === 404 || r.status === 410) mortas.push(ep);
      } catch (e) { /* aparelho fora do ar: tenta na próxima */ }
    }));
    if (mortas.length) await redis(mortas.map(ep => ['HDEL', 'area:push', ep]));
  } catch (e) { /* aviso nunca derruba a ação principal */ }
}

module.exports = { notifica, chaves };
