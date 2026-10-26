// Texto formatado da descrição da ação (negrito, tamanhos, cores da marca, listas, links).
// O editor do admin gera HTML; aqui ele é limpo (lista de permissões), vira texto do Notion com formatação
// (negrito, itálico, sublinhado, riscado, cor e link) e volta do Notion para HTML.
// `detalhe` (texto puro) continua existindo para busca, IA e trechos; `detalheHtml` é o texto formatado.

const CORES = ['magenta', 'marinho', 'verde', 'cinza'];
const MARCAS = ['verde', 'magenta', 'cinza'];
const HEX = { '#e0055e': 'magenta', '#1e2357': 'marinho', '#00c853': 'verde', '#00e676': 'verde', '#6b6b72': 'cinza', '#5e5e66': 'cinza' };
const NOTION_COR = { magenta: 'pink', marinho: 'blue', verde: 'green', cinza: 'gray' };
const NOTION_MARCA = { verde: 'green_background', magenta: 'pink_background', cinza: 'gray_background' };
const DE_NOTION = { pink: ['c', 'magenta'], red: ['c', 'magenta'], blue: ['c', 'marinho'], purple: ['c', 'marinho'], green: ['c', 'verde'], gray: ['c', 'cinza'], brown: ['c', 'cinza'], green_background: ['m', 'verde'], yellow_background: ['m', 'verde'], pink_background: ['m', 'magenta'], red_background: ['m', 'magenta'], gray_background: ['m', 'cinza'] };

const TAGS = new Set('p br b strong i em u s strike h3 h4 ul ol li blockquote a span mark div'.split(' '));
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ent = s => String(s).replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&');

function classeOk(tag, v) {
  v = String(v || '').trim();
  if (tag === 'span' && /^c-(magenta|marinho|verde|cinza)$/.test(v)) return v;
  if (tag === 'mark' && /^m-(verde|magenta|cinza)$/.test(v)) return v;
  if (tag === 'ul' && v === 'ck') return v;
  if (tag === 'li' && v === 'ok') return v;
  return '';
}
// limpa o HTML do editor: só as tags e classes da lista; <font color> e style="color" viram as cores da marca
function limpa(html) {
  let h = String(html || '').slice(0, 60000);
  h = h.replace(/<(script|style|iframe|object|embed|svg|math|template|noscript|head|title|textarea|select)[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  const pilha = [];
  h = h.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (m, fecha, tag, attrs) => {
    tag = tag.toLowerCase();
    if (tag === 'strong') tag = 'b'; if (tag === 'em') tag = 'i'; if (tag === 'strike') tag = 's'; if (tag === 'del') tag = 's';
    if (tag === 'h1' || tag === 'h2') tag = 'h3'; if (tag === 'h5' || tag === 'h6') tag = 'h4';
    if (tag === 'font') {
      if (fecha) return pilha.pop() || '';
      const cor = (attrs.match(/color\s*=\s*["']?([#a-z0-9]+)/i) || [])[1] || '';
      const k = HEX[cor.toLowerCase()];
      pilha.push(k ? '</span>' : ''); return k ? '<span class="c-' + k + '">' : '';
    }
    if (!TAGS.has(tag)) return '';
    if (fecha) return tag === 'br' ? '' : '</' + tag + '>';
    const ok = [];
    const cls = (attrs.match(/class\s*=\s*["']([^"']*)["']/i) || [])[1];
    let c = classeOk(tag, cls);
    if (!c && (tag === 'span' || tag === 'mark')) {
      const st = (attrs.match(/style\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
      const col = (st.match(/(?:^|;)\s*color\s*:\s*(#[0-9a-f]{6})/i) || [])[1], bg = (st.match(/background(?:-color)?\s*:\s*(#[0-9a-f]{6})/i) || [])[1];
      if (tag === 'span' && col && HEX[col.toLowerCase()]) c = 'c-' + HEX[col.toLowerCase()];
      if (tag === 'mark' && bg && HEX[bg.toLowerCase()] && MARCAS.indexOf(HEX[bg.toLowerCase()]) >= 0) c = 'm-' + HEX[bg.toLowerCase()];
    }
    if (c) ok.push('class="' + c + '"');
    if (tag === 'a') {
      const href = (attrs.match(/href\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
      if (/^https?:\/\/[^\s"<>]+$/i.test(href) || /^\/[^\s"<>]*$/.test(href) || /^mailto:[^\s"<>]+$/i.test(href)) ok.push('href="' + href.replace(/"/g, '') + '"', 'target="_blank"', 'rel="noopener"');
    }
    if (tag === 'div') tag = 'p';
    return '<' + tag + (ok.length ? ' ' + ok.join(' ') : '') + '>';
  });
  h = h.replace(/<\/div>/g, '</p>').replace(/<(span|mark)>([\s\S]*?)<\/\1>/g, '$2').replace(/<p>\s*<\/p>/g, '');
  return h.trim();
}

// HTML -> pedaços de texto do Notion (com formatação). As quebras de bloco viram "\n".
function paraNotion(html) {
  const h = limpa(html);
  const runs = [];
  const est = { b: 0, i: 0, u: 0, s: 0, cor: [], marca: [], link: [] };
  const listas = [];
  const add = txt => {
    if (!txt) return;
    const cor = est.marca.length ? NOTION_MARCA[est.marca[est.marca.length - 1]] : est.cor.length ? NOTION_COR[est.cor[est.cor.length - 1]] : 'default';
    const ann = { bold: est.b > 0, italic: est.i > 0, underline: est.u > 0, strikethrough: est.s > 0, code: false, color: cor || 'default' };
    const link = est.link.length ? est.link[est.link.length - 1] : '';
    const ult = runs[runs.length - 1];
    if (ult && JSON.stringify(ult.annotations) === JSON.stringify(ann) && (ult.text.link ? ult.text.link.url : '') === link) { ult.text.content += txt; return; }
    runs.push({ type: 'text', text: link ? { content: txt, link: { url: /^\//.test(link) ? 'https://sejaunique.com' + link : link } } : { content: txt }, annotations: ann });
  };
  const quebra = () => { const ult = runs[runs.length - 1]; if (ult && !/\n$/.test(ult.text.content)) add('\n'); };
  const re = /<(\/?)([a-z0-9]+)([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(h))) {
    if (m[4] !== undefined) { add(ent(m[4])); continue; }
    const fecha = !!m[1], tag = m[2], attrs = m[3] || '';
    const cls = (attrs.match(/class="([^"]*)"/) || [])[1] || '';
    if (tag === 'br') { add('\n'); continue; }
    if (tag === 'b') est.b += fecha ? -1 : 1;
    else if (tag === 'i') est.i += fecha ? -1 : 1;
    else if (tag === 'u') est.u += fecha ? -1 : 1;
    else if (tag === 's') est.s += fecha ? -1 : 1;
    else if (tag === 'span') { if (fecha) est.cor.pop(); else est.cor.push(cls.replace('c-', '')); }
    else if (tag === 'mark') { if (fecha) est.marca.pop(); else est.marca.push(cls.replace('m-', '')); }
    else if (tag === 'a') { if (fecha) est.link.pop(); else est.link.push((attrs.match(/href="([^"]*)"/) || [])[1] || ''); }
    else if (tag === 'h3' || tag === 'h4') { if (fecha) { est.b--; quebra(); } else { quebra(); est.b++; } }
    else if (tag === 'p' || tag === 'blockquote') { if (fecha) quebra(); else { quebra(); if (tag === 'blockquote') add('> '); } }
    else if (tag === 'ul' || tag === 'ol') { if (fecha) { listas.pop(); quebra(); } else { quebra(); listas.push({ tipo: tag, ck: cls === 'ck', n: 0 }); } }
    else if (tag === 'li') {
      if (fecha) { quebra(); continue; }
      quebra();
      const l = listas[listas.length - 1] || { tipo: 'ul' };
      const salvo = { b: est.b, i: est.i, u: est.u, s: est.s }; est.b = est.i = est.u = est.s = 0; const c0 = est.cor, m0 = est.marca; est.cor = []; est.marca = [];
      add(l.ck ? (cls === 'ok' ? '☑ ' : '☐ ') : l.tipo === 'ol' ? (++l.n) + '. ' : '• ');
      Object.assign(est, salvo); est.cor = c0; est.marca = m0;
    }
  }
  // tira quebras do fim e divide pedaços grandes (o Notion aceita até 2.000 caracteres por pedaço e 100 pedaços)
  while (runs.length && /^\n*$/.test(runs[runs.length - 1].text.content)) runs.pop();
  if (runs.length) runs[runs.length - 1].text.content = runs[runs.length - 1].text.content.replace(/\n+$/, '');
  const out = [];
  runs.forEach(r => { let t = r.text.content; while (t.length > 2000) { out.push(Object.assign({}, r, { text: Object.assign({}, r.text, { content: t.slice(0, 2000) }) })); t = t.slice(2000); } out.push(Object.assign({}, r, { text: Object.assign({}, r.text, { content: t }) })); });
  if (out.length > 100) {
    const resto = out.slice(99).map(r => r.text.content).join('');
    const fim = out.slice(0, 99);
    for (let i = 0; i < resto.length && fim.length < 100; i += 2000) fim.push({ type: 'text', text: { content: resto.slice(i, i + 2000) }, annotations: { bold: false, italic: false, underline: false, strikethrough: false, code: false, color: 'default' } });
    return fim;
  }
  return out;
}
const plano = html => paraNotion(html).map(r => r.text.content).join('');

// texto do Notion (com formatação) -> HTML do editor
function deNotion(rt) {
  const linhas = [[]];
  (rt || []).forEach(r => {
    const t = r.plain_text !== undefined ? r.plain_text : ((r.text || {}).content || '');
    const partes = String(t).split('\n');
    partes.forEach((p, k) => { if (k > 0) linhas.push([]); if (p) linhas[linhas.length - 1].push({ t: p, a: r.annotations || {}, href: r.href || ((r.text || {}).link || {}).url || '' }); });
  });
  const inline = arr => arr.map(x => {
    let s = esc(x.t);
    const a = x.a;
    if (a.code) s = s;
    if (a.bold) s = '<b>' + s + '</b>';
    if (a.italic) s = '<i>' + s + '</i>';
    if (a.underline) s = '<u>' + s + '</u>';
    if (a.strikethrough) s = '<s>' + s + '</s>';
    const cor = DE_NOTION[a.color];
    if (cor) s = cor[0] === 'c' ? '<span class="c-' + cor[1] + '">' + s + '</span>' : '<mark class="m-' + cor[1] + '">' + s + '</mark>';
    if (x.href && /^https?:\/\//.test(x.href)) s = '<a href="' + esc(x.href) + '" target="_blank" rel="noopener">' + s + '</a>';
    return s;
  }).join('');
  const tira = (arr, re) => { if (!arr.length) return arr; const c = arr.slice(); c[0] = Object.assign({}, c[0], { t: c[0].t.replace(re, '') }); return c; };
  let out = '', lista = '';
  const fechaLista = () => { if (lista) { out += '</' + (lista === 'ck' ? 'ul' : lista) + '>'; lista = ''; } };
  linhas.forEach(l => {
    const txt = l.map(x => x.t).join('');
    if (!txt.trim()) { fechaLista(); return; }
    let tipo = '', re = null, ok = false;
    if (/^[•\-\*]\s/.test(txt)) { tipo = 'ul'; re = /^[•\-\*]\s/; }
    else if (/^\d+[.)]\s/.test(txt)) { tipo = 'ol'; re = /^\d+[.)]\s/; }
    else if (/^[☐☑]\s/.test(txt)) { tipo = 'ck'; ok = txt.charAt(0) === '☑'; re = /^[☐☑]\s/; }
    if (tipo) {
      if (lista !== tipo) { fechaLista(); out += tipo === 'ck' ? '<ul class="ck">' : '<' + tipo + '>'; lista = tipo; }
      out += '<li' + (ok ? ' class="ok"' : '') + '>' + inline(tira(l, re)) + '</li>';
      return;
    }
    fechaLista();
    if (/^>\s/.test(txt)) { out += '<blockquote>' + inline(tira(l, /^>\s/)) + '</blockquote>'; return; }
    out += '<p>' + inline(l) + '</p>';
  });
  fechaLista();
  return out;
}

// texto puro antigo -> HTML simples (para abrir no editor)
function deTexto(t) {
  return deNotion([{ plain_text: String(t || ''), annotations: {} }]);
}

module.exports = { limpa, paraNotion, plano, deNotion, deTexto, CORES, MARCAS };
