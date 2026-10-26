// Canivete de Vendas: biblioteca de palestras, aulas, tutoriais, iscas, ferramentas e posts da Unique.
// O Carlos alimenta pelo admin (um a um ou em lote); o cliente só vê o que foi liberado para a empresa dele.
// area:canivete  hash id -> {id, tipo, titulo, link, descricao, tags[], capa, destino:'todos'|[slugs], origem, criado}
// Posts do blog e materiais do site entram sozinhos (origem 'site'), mas começam fechados (destino []).
const TIPOS = ['palestra', 'aula', 'tutorial', 'isca', 'ferramenta', 'post', 'video', 'material'];
const NOME = { palestra: 'Palestra', aula: 'Aula', tutorial: 'Tutorial', isca: 'Isca', ferramenta: 'Ferramenta', post: 'Post do blog', video: 'Vídeo', material: 'Material' };
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const limpo = (s, n) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const yt = u => { const m = String(u || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/); return m ? m[1] : ''; };
function capaDe(link) { const id = yt(link); return id ? 'https://img.youtube.com/vi/' + id + '/hqdefault.jpg' : ''; }
function adivinhaTipo(link, titulo) {
  const t = (String(titulo || '') + ' ' + String(link || '')).toLowerCase();
  if (/palestra/.test(t)) return 'palestra';
  if (/tutorial|passo a passo|como fazer/.test(t)) return 'tutorial';
  if (/aula|curso|treinamento|mentoria/.test(t)) return 'aula';
  if (/ferramenta|calculadora|planilha|template|gerador|docs\.google\.com\/spreadsheets/.test(t)) return 'ferramenta';
  if (/isca|e-?book|checklist|guia|manual/.test(t)) return 'isca';
  if (yt(link) || /vimeo\.com/.test(t)) return 'video';
  return 'material';
}
function limpa(i) {
  let link = limpo(i.link, 600); if (link && !/^https?:\/\//i.test(link) && !/^\//.test(link)) link = 'https://' + link;
  if (link && !/^(https:\/\/[^\s"<>]+|\/[^\s"<>]*)$/i.test(link)) link = '';
  const d = i.destino === 'todos' ? 'todos' : (Array.isArray(i.destino) ? i.destino.map(x => String(x).toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean).slice(0, 300) : []);
  return {
    id: /^[a-z0-9-]{3,60}$/.test(i.id || '') ? i.id : 'cv' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    tipo: TIPOS.indexOf(i.tipo) >= 0 ? i.tipo : adivinhaTipo(link, i.titulo),
    titulo: limpo(i.titulo, 200) || (link ? link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 80) : ''),
    link, descricao: limpo(i.descricao, 600),
    tags: (Array.isArray(i.tags) ? i.tags : String(i.tags || '').split(',')).map(t => limpo(t, 40)).filter(Boolean).slice(0, 12),
    capa: /^https:\/\//.test(i.capa || '') ? limpo(i.capa, 600) : capaDe(link),
    destino: d, origem: i.origem === 'site' ? 'site' : 'manual', criado: i.criado || new Date().toISOString()
  };
}
// linhas coladas: "link" ou "tipo; título; link" ou "título; link" (também aceita tab ou vírgula de planilha)
function lote(texto) {
  return String(texto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(0, 200).map(l => {
    const p = l.split(/\t|;|,(?=\s*(?:https?:\/\/|\/))/).map(x => x.trim()).filter(Boolean);
    const link = p.find(x => /^(https?:\/\/|\/|www\.)/i.test(x)) || '';
    const resto = p.filter(x => x !== link);
    let tipo = '', titulo = '';
    if (resto.length >= 2 && TIPOS.concat(Object.values(NOME).map(n => n.toLowerCase())).indexOf(resto[0].toLowerCase()) >= 0) { tipo = resto[0].toLowerCase(); titulo = resto.slice(1).join(' '); }
    else titulo = resto.join(' ');
    const porNome = Object.keys(NOME).find(k => NOME[k].toLowerCase() === tipo);
    return limpa({ link, titulo, tipo: TIPOS.indexOf(tipo) >= 0 ? tipo : porNome || '' });
  }).filter(i => i.link || i.titulo);
}
// posts do blog e materiais do site (para entrar sozinhos na biblioteca)
async function doSite(SITE) {
  const out = [];
  try {
    const r = await fetch(SITE + '/blog/posts.js?x=' + Date.now(), { cache: 'no-store' });
    if (r.ok) { const ctx = { window: {} }; require('vm').runInNewContext(await r.text(), ctx, { timeout: 1000 });
      (ctx.window.POSTS || []).filter(p => p && p.slug && p.titulo).forEach(p => out.push({ id: 'post-' + p.slug, tipo: 'post', titulo: String(p.titulo).replace(/==|\*\*/g, ''), link: '/blog/' + p.slug + '/', descricao: p.resumo || '', tags: p.categoria ? [p.categoria] : [], capa: p.capa ? (/^https?:/.test(p.capa) ? p.capa : SITE + '/blog/' + String(p.capa).replace(/^\/?(blog\/)?/, '')) : capaDe(p.video), origem: 'site', criado: p.data || '' })); }
  } catch (e) { /* sem blog agora */ }
  try { const M = require('../material.js').MATERIAIS || {}; Object.keys(M).forEach(k => out.push({ id: 'mat-' + k, tipo: /palestra/i.test(M[k].tag || '') ? 'palestra' : /aula/i.test(M[k].tag || '') ? 'aula' : 'isca', titulo: M[k].titulo, link: M[k].url, descricao: M[k].descricao, tags: M[k].tag ? [M[k].tag] : [], origem: 'site' })); } catch (e) { /* sem materiais */ }
  return out;
}
async function lista(redis, SITE, importa) {
  const [h] = await redis([['HGETALL', 'area:canivete']]);
  const pares = Array.isArray(h) ? h : Object.keys(h || {}).flatMap(k => [k, h[k]]);
  const itens = {}; for (let i = 0; i < pares.length; i += 2) { const v = json(pares[i + 1]); if (v) itens[pares[i]] = v; }
  if (importa) {
    const [ja] = await redis([['GET', 'area:canivete:importado']]);
    if (!ja) {
      const novos = (await doSite(SITE)).filter(x => !itens[x.id]).map(x => limpa(Object.assign(x, { destino: [] })));
      if (novos.length) await redis(novos.map(x => ['HSET', 'area:canivete', x.id, JSON.stringify(x)]));
      novos.forEach(x => { itens[x.id] = x; });
      await redis([['SET', 'area:canivete:importado', '1', 'EX', 3600]]);
    }
  }
  return Object.values(itens).sort((a, b) => String(b.criado || '').localeCompare(String(a.criado || '')));
}
const liberadoPara = (i, slug) => i.destino === 'todos' || (Array.isArray(i.destino) && i.destino.indexOf(slug) >= 0);
module.exports = { TIPOS, NOME, limpa, lote, lista, liberadoPara, capaDe };
