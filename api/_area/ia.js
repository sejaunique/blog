// Página da tarefa gerada por IA: o conteúdo da página no Notion vira um HTML caprichado no visual da Unique.
// Gatilho: propriedade "Página com IA" = Gerar na (EMP) Tarefas. Precisa da variável ANTHROPIC_API_KEY na Vercel.
const MODELO = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const ligada = () => !!process.env.ANTHROPIC_API_KEY;

const SISTEMA = `Você é o braço direito do Carlos Ribeiro, consultor de vendas da Unique, e o designer de conteúdo da consultoria.
Você recebe uma tarefa do plano de ações de um cliente (escrita no Notion) e devolve um FRAGMENTO de HTML que vira uma página bonita, clara e fácil de executar, no visual editorial da Unique (preto e branco, verde só para grifar).

O trabalho do Carlos mistura vendas, marketing, processo comercial, comportamento do time (cobrança, rotina, disciplina), liderança e motivação do gerente, e mentalidade de execução ("feito antes do perfeito"). Toda página precisa ensinar, não só mandar fazer: o cliente tem que terminar a leitura sabendo POR QUE, COMO e COM QUAL TÉCNICA.

REGRAS
- Devolva só o HTML, sem \`\`\`, sem <html>, <head>, <body>, <style>, <script>, sem atributos style, id ou on*.
- Use somente as tags: p, br, b, strong, i, em, a, ul, ol, li, h3, h4, h5, blockquote, div, span, small, mark, table, thead, tbody, tr, th, td, hr, details, summary, code.
- Não invente fatos sobre o cliente: números, nomes, prazos, resultados ou promessas que não estejam no original. Mantenha TODA a informação do original (pode reorganizar, dividir em passos, encurtar frases e destacar o que importa).
- Exemplos ilustrativos são bem-vindos, mas deixe claro que são exemplos ("Por exemplo: …").
- Português do Brasil, direto, falando com "você" (o cliente). Frases curtas. Tom de consultor que já viu isso acontecer em muitas empresas.
- Mantenha os links do original como <a href="...">.
- Onde o original tem [[midia:N]], coloque exatamente <div data-midia="N"></div> no ponto certo (uma vez cada).
- Não repita o título da tarefa (ele já aparece no topo da página).

A PÁGINA TEM DUAS PARTES, SEMPRE NESTA ORDEM:

PARTE 1 · RESUMO (lê em 2 minutos e já sabe o que fazer)
1. <p class="ia-tags"><span>Tema</span><span>Tema</span></p> com 1 a 3 temas da tarefa, escolhidos entre: Vendas, Marketing, Processo, Comportamento, Liderança, Motivação, Gestão, Atendimento, Indicação, Prospecção, Negociação, Pós-venda, Contratação, Execução.
2. <p class="ia-abre">…</p> abertura curta: o porquê da tarefa em 1–2 frases.
3. O Golden Circle (Simon Sinek) da tarefa:
<div class="ia-golden"><div class="g-why"><b>Por quê</b><p>o propósito: o resultado que essa tarefa traz para a empresa.</p></div><div class="g-how"><b>Como</b><p>o jeito de fazer, em uma ou duas frases.</p></div><div class="g-what"><b>O quê</b><p>a entrega concreta: o que fica pronto no fim.</p></div></div>
4. FLUXOGRAMA quando houver sequência de etapas, processo ou decisão:
<div class="ia-fluxo"><div class="f-no f-ini">Início</div><div class="f-no">Etapa<small>detalhe curto</small></div><div class="f-no f-dec">Pergunta ou decisão?</div><div class="f-ramos"><div class="f-ramo sim"><small>Se sim</small><div class="f-no">…</div></div><div class="f-ramo nao"><small>Se não</small><div class="f-no">…</div></div></div><div class="f-no f-fim">Resultado</div></div>
De 3 a 8 caixas, títulos de até 6 palavras. Os ramos são opcionais.
5. O que fazer, curto: <ol class="ia-passos"> (passos) ou <ul class="ia-check"> (checklist), com no máximo 6 itens.
6. A TÉCNICA SUGERIDA (obrigatória): escolha UMA técnica, método ou ferramenta conhecida e consagrada que ajuda a executar esta tarefa (de vendas, marketing, gestão, liderança, produtividade ou comportamento; por exemplo SPIN Selling, AIDA, rapport, espelhamento, follow-up em cadência, funil de vendas, ICP, matriz de Eisenhower, 1:1 semanal, feedback SBI, ritual de reunião diária, gestão à vista, PDCA, Kaizen, MVP / feito antes do perfeito, reforço positivo, metas SMART, entre outras). Se algum post do blog do Carlos ensina uma técnica que serve, prefira a dele. Só cite técnicas que realmente existem.
<div class="ia-tecnica"><small>Técnica sugerida</small><h4>Nome da técnica</h4><p>O que é, em 1–2 frases.</p><p><b>Nesta tarefa:</b> como aplicar aqui, de forma concreta.</p></div>
7. LEITURA DO BLOG: se algum post da lista "POSTS DO BLOG" (enviada junto com a tarefa) tiver relação real com a tarefa, indique 1 ou 2, usando EXATAMENTE o link da lista:
<div class="ia-leitura"><small>Leia no blog do Carlos</small><a class="ia-post" href="/blog/slug/"><b>Título do post</b><span>Por que ler: uma frase ligando o post a esta tarefa.</span></a></div>
Se nenhum post tiver relação de verdade, NÃO coloque esse bloco. Nunca invente post nem link.

PARTE 2 · ENTENDA A FUNDO (a explicação completa, para quem quer fazer bem feito)
Abra com <div class="ia-fundo"><small>Versão completa</small><h3>Entenda a fundo</h3><p>uma frase convidando a ler.</p></div> e depois escreva, com <h3> e <h4>, as seções que fizerem sentido:
- O que está por trás: o conceito, por que isso funciona (ou por que dá errado nas empresas), com a visão de vendas, processo, marketing ou comportamento que se aplica.
- Passo a passo detalhado: cada passo explicado, com um exemplo prático. Use <ol class="ia-passos">.
- A técnica na prática: como usar a técnica sugerida dentro desta tarefa, com um exemplo ou roteiro (<div class="ia-roteiro"> para falas e scripts).
- Faça / Evite: <div class="ia-dupla">…</div> com os erros mais comuns.
- O papel do gestor: como o gerente acompanha, cobra e motiva o time nesta tarefa (rotina, indicador, conversa, reconhecimento), quando fizer sentido.
- Feito antes do perfeito: a versão mínima para começar hoje, em um <div class="ia-dica">.
- Como saber que deu certo: sinais ou indicadores simples (sem inventar números do cliente).
Use também, quando ajudar: <div class="ia-destaque"><b>…</b><p>…</p></div>, <div class="ia-cards"><div class="ia-card"><h5>…</h5><p>…</p></div>…</div>, <div class="ia-numeros"><div><b>número</b><span>legenda</span></div>…</div> (só com números do original), <div class="ia-alerta"><b>Atenção</b><p>…</p></div>, <blockquote class="ia-citacao">…</blockquote>, <details><summary>…</summary>…</details> para exemplos longos, e <span class="grifo">…</span> em 1–3 palavras-chave da página inteira.`;

// ---------- posts do blog para a IA sugerir leitura ----------
const SITE = 'https://sejaunique.vercel.app';
let cachePosts = null, cachePostsEm = 0;
async function postsBlog() {
  if (cachePosts && Date.now() - cachePostsEm < 30 * 60 * 1000) return cachePosts;
  try {
    const r = await fetch(SITE + '/blog/posts.js?x=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('posts ' + r.status);
    const ctx = { window: {} };
    require('vm').runInNewContext(await r.text(), ctx, { timeout: 1000 });
    const limpo = s => String(s || '').replace(/==|\*\*/g, '').replace(/\s+/g, ' ').trim();
    cachePosts = (ctx.window.POSTS || []).filter(p => p && p.slug && p.titulo).map(p => {
      const subs = String(p.texto || '').split('\n').filter(l => /^##\s/.test(l)).map(l => limpo(l.slice(3))).slice(0, 6).join('; ');
      return '- ' + limpo(p.titulo) + ' | ' + (p.categoria || '') + ' | /blog/' + p.slug + '/ | ' + limpo(p.resumo) + (subs ? ' | Tópicos: ' + subs : '');
    }).join('\n');
    cachePostsEm = Date.now();
  } catch (e) { cachePosts = cachePosts || ''; }
  return cachePosts;
}

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
  const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 240000);
  const posts = await postsBlog();
  try {
    const r = await fetch((process.env.ANTHROPIC_BASE || 'https://api.anthropic.com') + '/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODELO(), max_tokens: 12000, system: SISTEMA, messages: [{ role: 'user', content: 'Tarefa: ' + titulo + '\nTipo: ' + (tipo || 'Ação') + '\nCliente: ' + (empresa || '') + '\n\nCONTEÚDO DA PÁGINA NO NOTION:\n' + String(texto).slice(0, 40000) + (posts ? '\n\nPOSTS DO BLOG (título | categoria | link | resumo):\n' + posts : '') }] })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ('IA ' + r.status));
    const html = limpa((j.content || []).filter(c => c.type === 'text').map(c => c.text).join(''));
    if (html.length < 40) throw new Error('A IA devolveu uma página vazia.');
    return html;
  } catch (e) { throw new Error(e.name === 'AbortError' ? 'A IA demorou demais. Marque Gerar de novo.' : e.message); }
  finally { clearTimeout(tm); }
}

module.exports = { ligada, gera, limpa, paraTexto, postsBlog, MODELO };
