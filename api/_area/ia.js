// Página da tarefa gerada por IA: o conteúdo da página no Notion vira um HTML caprichado no visual da Unique.
// Gatilho: propriedade "Página com IA" = Gerar na (EMP) Tarefas. Precisa da variável ANTHROPIC_API_KEY na Vercel.
const MODELO = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const ligada = () => !!process.env.ANTHROPIC_API_KEY;

const SISTEMA = `Você é o designer de conteúdo da Unique, consultoria de vendas do Carlos Ribeiro.
Você recebe o texto de uma tarefa do plano de ações de um cliente (escrito no Notion) e devolve um FRAGMENTO de HTML que vira uma página bonita, clara e fácil de executar, no visual editorial da Unique (preto e branco, verde só para grifar).

REGRAS
- Devolva só o HTML, sem \`\`\`, sem <html>, <head>, <body>, <style>, <script>, sem atributos style, id ou on*.
- Use somente as tags: p, br, b, strong, i, em, a, ul, ol, li, h3, h4, h5, blockquote, div, span, small, mark, table, thead, tbody, tr, th, td, hr, details, summary, code.
- Não invente fatos, números, nomes, prazos ou promessas. Mantenha TODA a informação do original (pode reorganizar, dividir em passos, encurtar frases e destacar o que importa).
- Português do Brasil, direto, falando com "você" (o cliente). Frases curtas.
- Mantenha os links do original como <a href="...">.
- Onde o original tem [[midia:N]], coloque exatamente <div data-midia="N"></div> no ponto certo (uma vez cada).
- Não repita o título da tarefa (ele já aparece no topo da página).

COMPONENTES (classes prontas; use os que fizerem sentido, sem exagero):
- <p class="ia-abre">…</p> parágrafo de abertura maior: o porquê da tarefa em 1–2 frases.
- <span class="grifo">…</span> grifo verde em 1–3 palavras-chave da página.
- <div class="ia-destaque"><b>…</b><p>…</p></div> bloco escuro para a ideia central.
- <ol class="ia-passos"><li><b>Título do passo</b><p>Como fazer.</p></li>…</ol> passo a passo numerado.
- <ul class="ia-check"><li>…</li></ul> checklist.
- <div class="ia-cards"><div class="ia-card"><h5>…</h5><p>…</p></div>…</div> 2 a 4 cartões lado a lado.
- <div class="ia-numeros"><div><b>número</b><span>legenda</span></div>…</div> só se o original tiver números.
- <div class="ia-dupla"><div class="ia-sim"><h5>Faça</h5><ul>…</ul></div><div class="ia-nao"><h5>Evite</h5><ul>…</ul></div></div>
- <div class="ia-roteiro"><div class="ia-fala"><b>Vendedor</b><p>…</p></div><div class="ia-fala cli"><b>Cliente</b><p>…</p></div></div> para scripts e diálogos.
- <div class="ia-dica"><b>Dica</b><p>…</p></div> e <div class="ia-alerta"><b>Atenção</b><p>…</p></div>
- <blockquote class="ia-citacao">…</blockquote> frase de efeito que já esteja no original.
- <details><summary>…</summary>…</details> para conteúdo longo/opcional (ex.: objeções, exemplos).
- <h3> para seções, <h4> para subseções.
Termine com uma seção curta "Como saber que deu certo" se o original permitir deduzir isso sem inventar; senão, não coloque.`;

// ---------- Notion -> texto para a IA ----------
const txtRt = arr => (arr || []).map(t => t.href ? t.plain_text + ' (' + t.href + ')' : t.plain_text).join('');
async function paraTexto(filhos, B, nivel, midia) {
  let out = [];
  let n = 0;
  for (const b of B) {
    if (b.archived) continue;
    const t = b.type, v = b[t] || {}, pre = '  '.repeat(nivel - 1);
    const txt = txtRt(v.rich_text);
    if (t === 'paragraph') out.push(pre + txt);
    else if (/^heading_/.test(t)) out.push(pre + '#'.repeat(+t.slice(-1) + 1) + ' ' + txt);
    else if (t === 'bulleted_list_item') out.push(pre + '- ' + txt);
    else if (t === 'numbered_list_item') out.push(pre + (++n) + '. ' + txt);
    else if (t === 'to_do') out.push(pre + (v.checked ? '[x] ' : '[ ] ') + txt);
    else if (t === 'quote') out.push(pre + '> ' + txt);
    else if (t === 'callout') out.push(pre + '[destaque] ' + txt);
    else if (t === 'toggle') out.push(pre + '[alternável] ' + txt);
    else if (t === 'divider') out.push('---');
    else if (t === 'code') out.push('```\n' + txt + '\n```');
    else if (t === 'table_row') out.push(pre + '| ' + (v.cells || []).map(c => txtRt(c)).join(' | ') + ' |');
    else if (t === 'image' || t === 'video' || t === 'embed' || t === 'file' || t === 'pdf' || t === 'bookmark') {
      const url = v.type === 'file' ? (v.file || {}).url : (v.external || {}).url || v.url || '';
      if (url) { midia.push({ tipo: t, bloco: b.id, externo: v.type !== 'file', url: v.type === 'file' ? '' : url, legenda: txtRt(v.caption) || v.name || '' }); out.push(pre + '[[midia:' + midia.length + ']]' + (txtRt(v.caption) ? ' (' + txtRt(v.caption) + ')' : '')); }
    }
    if (t !== 'numbered_list_item') n = 0;
    if (b.has_children && nivel < 3) out = out.concat(await paraTexto(filhos, await filhos(b.id), nivel + 1, midia));
  }
  return out;
}

// ---------- limpeza do HTML da IA (lista de permissões) ----------
const TAGS = new Set('p br b strong i em a ul ol li h3 h4 h5 blockquote div span small mark table thead tbody tr th td hr details summary code'.split(' '));
function limpa(html) {
  let h = String(html || '').replace(/^```(?:html)?\s*|\s*```\s*$/g, '');
  h = h.replace(/<(script|style|iframe|object|embed|svg|math|template|noscript|head|title)[\s\S]*?<\/\1\s*>/gi, '').replace(/<!--[\s\S]*?-->/g, '');
  h = h.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (m, fecha, tag, attrs) => {
    tag = tag.toLowerCase();
    if (tag === 'h1' || tag === 'h2') tag = 'h3';
    if (!TAGS.has(tag)) return '';
    if (fecha) return '</' + tag + '>';
    const ok = [];
    const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let x;
    while ((x = re.exec(attrs))) {
      const nome = x[1].toLowerCase(), val = (x[3] !== undefined ? x[3] : x[4] !== undefined ? x[4] : x[5] || '');
      if (nome === 'class' && /^[a-z0-9 _-]{1,80}$/i.test(val)) ok.push('class="' + val + '"');
      else if (nome === 'href' && tag === 'a' && (/^https?:\/\/[^\s"<>]+$/i.test(val) || /^\/[^\s"<>]*$/.test(val))) ok.push('href="' + val.replace(/"/g, '') + '"');
      else if (nome === 'data-midia' && tag === 'div' && /^\d{1,3}$/.test(val)) ok.push('data-midia="' + val + '"');
      else if ((nome === 'colspan' || nome === 'rowspan') && /^\d{1,2}$/.test(val)) ok.push(nome + '="' + val + '"');
    }
    if (tag === 'a') ok.push('target="_blank" rel="noopener"');
    return '<' + tag + (ok.length ? ' ' + ok.join(' ') : '') + (tag === 'br' || tag === 'hr' ? '>' : '>');
  });
  return h.trim();
}

// ---------- chamada à IA ----------
async function gera({ titulo, tipo, empresa, texto }) {
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 52000);
  try {
    const r = await fetch((process.env.ANTHROPIC_BASE || 'https://api.anthropic.com') + '/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODELO(), max_tokens: 6000, system: SISTEMA, messages: [{ role: 'user', content: 'Tarefa: ' + titulo + '\nTipo: ' + (tipo || 'Ação') + '\nCliente: ' + (empresa || '') + '\n\nCONTEÚDO DA PÁGINA NO NOTION:\n' + String(texto).slice(0, 40000) }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ('IA ' + r.status));
    const html = limpa((j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''));
    if (html.length < 40) throw new Error('A IA devolveu uma página vazia.');
    return html;
  } catch (e) { throw new Error(e.name === 'AbortError' ? 'A IA demorou demais. Marque Gerar de novo.' : e.message); }
  finally { clearTimeout(tm); }
}

module.exports = { ligada, gera, limpa, paraTexto, MODELO };
