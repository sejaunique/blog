// Fecha as páginas de cliente (/clientes/<empresa>/<pagina>/) para quem não está logado na área do cliente.
// Passam: quem é da empresa, o Carlos (admin) e qualquer pessoa se a página foi marcada como pública.
// Robôs de prévia de link (WhatsApp, Instagram, LinkedIn...) recebem só título, descrição e capa,
// para o link compartilhado mostrar a thumbnail mesmo com a página fechada.
// A sessão é o cookie ua_sess, criado por /api/area e guardado no Redis (area:sess:<token>).

export const config = { matcher: ['/clientes/:path*'] };

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const ROBO = /whatsapp|facebookexternalhit|facebot|meta-externalagent|instagram|linkedinbot|twitterbot|slackbot|telegrambot|discordbot|skypeuripreview|pinterest|embedly|google-pagerenderer|applebot|iframely|vkshare|redditbot/i;

const segue = () => new Response(null, { headers: { 'x-middleware-next': '1' } });
const vai = (url, destino) => new Response(null, { status: 302, headers: { Location: new URL(destino, url).toString(), 'Cache-Control': 'no-store' } });
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function cookie(req, nome) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

async function redis(cmds) {
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  return (await r.json()).map(x => x.result);
}

async function previa(req, slug, pasta, volta) {
  const u = new URL(req.url);
  let m = null;
  try {
    const r = await fetch(u.origin + '/api/area?a=og&e=' + slug + '&p=' + encodeURIComponent(pasta));
    if (r.ok) m = await r.json();
  } catch (e) { m = null; }
  const titulo = m ? m.titulo + ' · ' + m.empresa : 'Área do cliente · Unique';
  const desc = m ? (m.descricao || 'Conteúdo exclusivo da consultoria Unique.') : 'Conteúdo exclusivo da consultoria Unique.';
  const capa = m ? m.capa : u.origin + '/assets/og-site.jpg';
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${esc(titulo)}</title><meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article"><meta property="og:site_name" content="Unique Consultoria">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(u.origin + u.pathname)}"><meta property="og:image" content="${esc(capa)}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(desc)}"><meta name="twitter:image" content="${esc(capa)}">
<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${esc(volta)}">
</head><body></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const partes = url.pathname.split('/');
  const slug = (partes[2] || '').toLowerCase();
  const pasta = (partes[3] || '').toLowerCase();
  const volta = '/area/?volta=' + encodeURIComponent(url.pathname);
  if (!slug) return vai(req.url, '/area/');
  if (!URL_DB || !TOKEN) return vai(req.url, volta);

  const t = cookie(req, 'ua_sess');
  const temSessao = /^[a-f0-9]{48}$/.test(t);
  let s = null, publico = false;
  try {
    const [sv, pv] = await redis([
      ['GET', 'area:sess:' + (temSessao ? t : '-')],
      ['HGET', 'area:publico:' + slug, pasta || '-']
    ]);
    s = sv ? JSON.parse(sv) : null;
    publico = pv === '1';
  } catch (e) { s = null; }

  if (publico) return segue();
  if (s && (s.admin || s.slug === slug)) return segue();
  if (pasta && ROBO.test(req.headers.get('user-agent') || '')) return previa(req, slug, pasta, volta);
  if (s) return vai(req.url, '/area/painel/?negado=1');
  return vai(req.url, volta);
}
