// Fecha as páginas de cliente (/clientes/<empresa>/...) para quem não está logado na área do cliente.
// Quem é da empresa (ou o Carlos, como admin) passa; o resto vai para o login em /area/.
// A sessão é o cookie ua_sess, criado por /api/area e guardado no Redis (area:sess:<token>).

export const config = { matcher: ['/clientes/:path*'] };

const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const segue = () => new Response(null, { headers: { 'x-middleware-next': '1' } });
const vai = (url, destino) => new Response(null, { status: 302, headers: { Location: new URL(destino, url).toString(), 'Cache-Control': 'no-store' } });

function cookie(req, nome) {
  const c = req.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + nome + '=([^;]+)'));
  return m ? decodeURIComponent(m[1]) : '';
}

export default async function middleware(req) {
  const url = new URL(req.url);
  const slug = (url.pathname.split('/')[2] || '').toLowerCase();
  const volta = '/area/?volta=' + encodeURIComponent(url.pathname);
  if (!slug) return vai(req.url, '/area/');

  const t = cookie(req, 'ua_sess');
  if (!/^[a-f0-9]{48}$/.test(t) || !URL_DB || !TOKEN) return vai(req.url, volta);

  let s = null;
  try {
    const r = await fetch(URL_DB.replace(/\/$/, '') + '/get/' + encodeURIComponent('area:sess:' + t), { headers: { Authorization: 'Bearer ' + TOKEN } });
    const out = await r.json();
    s = out && out.result ? JSON.parse(out.result) : null;
  } catch (e) { s = null; }

  if (!s) return vai(req.url, volta);
  if (s.admin || s.slug === slug) return segue();
  return vai(req.url, '/area/painel/?negado=1');
}
