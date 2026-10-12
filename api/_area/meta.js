// Conexão oficial com a Meta (Instagram Graph API) para puxar a foto de perfis comerciais pelo @.
// O Instagram bloqueia consultas comuns vindas de servidor; com a conexão oficial ("business_discovery")
// a busca é permitida para contas Comerciais/Criador de conteúdo.
//
// O Carlos cola no workspace: ID do app, chave secreta do app e um token de acesso gerado no Graph API Explorer.
// O servidor troca por um token de longa duração e pega o token da Página do Facebook (que não expira) e o ID
// da conta profissional do Instagram ligada a ela. Fica em area:meta {token, igId, igUser, pagina, conectado}.
const V = 'https://graph.facebook.com/v21.0';
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

async function gj(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
  try { const r = await fetch(url, { signal: ctl.signal }); return await r.json(); }
  catch (e) { return { error: { message: 'Sem resposta da Meta.' } }; } finally { clearTimeout(t); }
}

async function conf(redis) { const [v] = await redis([['GET', 'area:meta']]); return json(v); }

async function conecta(redis, d) {
  const app = String(d.app || '').trim(), seg = String(d.segredo || '').trim(), tk = String(d.token || '').trim();
  if (!/^\d{5,25}$/.test(app) || !seg || !tk) return { ok: false, erro: 'Preencha o ID do app, a chave secreta e o token.' };
  // 1) token de usuário de longa duração
  const longo = await gj(V + '/oauth/access_token?' + new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: app, client_secret: seg, fb_exchange_token: tk }));
  if (!longo.access_token) return { ok: false, erro: 'A Meta recusou: ' + ((longo.error && longo.error.message) || 'token inválido') };
  // 2) páginas e a conta do Instagram ligada a cada uma
  const pg = await gj(V + '/me/accounts?fields=name,access_token,instagram_business_account{id,username}&limit=50&access_token=' + encodeURIComponent(longo.access_token));
  const lista = (pg.data || []).filter(p => p.instagram_business_account);
  if (!lista.length) return { ok: false, erro: (pg.error && pg.error.message) || 'Nenhuma Página do Facebook com Instagram profissional ligado foi encontrada nesse login. Confira as permissões do token.' };
  const p = lista[0];
  const c = { token: p.access_token, igId: p.instagram_business_account.id, igUser: p.instagram_business_account.username || '', pagina: p.name, app, conectado: new Date().toISOString() };
  // 3) teste: a própria conta pela busca oficial
  const t = await foto({ token: c.token, igId: c.igId }, c.igUser || 'instagram');
  if (!t.url && t.erro) return { ok: false, erro: 'Conectou, mas a busca falhou: ' + t.erro };
  await redis([['SET', 'area:meta', JSON.stringify(c)]]);
  return { ok: true, igUser: c.igUser, pagina: c.pagina };
}

// endereço da foto de um perfil comercial pelo @
async function foto(c, handle) {
  const r = await gj(V + '/' + c.igId + '?' + new URLSearchParams({ fields: 'business_discovery.username(' + handle + '){profile_picture_url,username,name}', access_token: c.token }));
  const b = r && r.business_discovery;
  if (b && b.profile_picture_url) return { url: b.profile_picture_url, nome: b.name || '' };
  const msg = (r.error && (r.error.error_user_msg || r.error.message)) || '';
  return { url: '', erro: /not found|Invalid user|cannot be found|business/i.test(msg) ? 'perfil pessoal ou inexistente' : msg };
}

module.exports = { conf, conecta, foto };
