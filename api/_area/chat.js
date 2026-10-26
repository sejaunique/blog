// Assistente com IA do admin: consulta todo o painel (empresas, pessoas, ações, reuniões, vitórias, leituras, Notion)
// e propõe mudanças. Ler roda na hora; mudar vira um cartão "pendente" que só executa quando o Carlos confirma
// (a execução reaproveita as rotas do admin, com as mesmas validações e a ida para o Notion).
// Conversas: area:chat:conv:<id> (30 dias) e area:chat:lista (lista com as mais recentes primeiro). Pendências: area:chat:pend:<id> (1 dia).

const crypto = require('crypto');
const MODELO = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
const hojeSP = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const semTags = h => String(h || '').replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|h\d|li|div|blockquote|tr)>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\n{3,}/g, '\n\n').trim();
const ST = { a_fazer: 'A fazer', fazendo: 'Em andamento', feito: 'Concluída', cancelado: 'Cancelada', arquivado: 'Arquivada' };

const FERRAMENTAS = [
  { name: 'listar_empresas', description: 'Lista as empresas (clientes e leads) do painel, com etapa, número de pessoas, ações abertas e atrasadas.', input_schema: { type: 'object', properties: {} } },
  { name: 'ver_empresa', description: 'Tudo de uma empresa: dados, pessoas (e-mail, papel, último acesso), ações (status, datas, responsáveis), reuniões, negócios, vitórias, lista de leitura e diagnóstico.', input_schema: { type: 'object', properties: { slug: { type: 'string', description: 'slug da empresa (veja listar_empresas)' } }, required: ['slug'] } },
  { name: 'listar_acoes', description: 'Ações do plano com filtros. Sem slug, busca em todas as empresas.', input_schema: { type: 'object', properties: { slug: { type: 'string' }, status: { type: 'string', enum: ['a_fazer', 'fazendo', 'feito', 'cancelado'] }, atrasadas: { type: 'boolean' }, responsavel: { type: 'string', description: 'e-mail da pessoa ou "unique" para o Carlos' }, entrega_de: { type: 'string', description: 'AAAA-MM-DD' }, entrega_ate: { type: 'string', description: 'AAAA-MM-DD' }, texto: { type: 'string', description: 'palavra no título ou na descrição' } } } },
  { name: 'ver_reuniao', description: 'Uma reunião (base de reuniões do Notion) com data, participantes, links de gravação/Drive/transcrição e o conteúdo da página no Notion (resumo/ata, quando houver). Use mais_recente para a última da empresa.', input_schema: { type: 'object', properties: { slug: { type: 'string' }, id: { type: 'string' }, mais_recente: { type: 'boolean' } } } },
  { name: 'pessoas_sem_acesso', description: 'Pessoas dos clientes que não entram na área do cliente há N dias (ou nunca entraram).', input_schema: { type: 'object', properties: { dias: { type: 'number' } }, required: ['dias'] } },
  { name: 'buscar', description: 'Busca uma palavra em empresas, pessoas, ações, reuniões e vitórias.', input_schema: { type: 'object', properties: { texto: { type: 'string' } }, required: ['texto'] } },
  // ---------- mudanças (viram cartão para o Carlos confirmar) ----------
  { name: 'criar_acao', description: 'PROPÕE criar uma ação no plano de uma empresa (o Carlos confirma antes).', input_schema: { type: 'object', properties: { slug: { type: 'string' }, titulo: { type: 'string' }, detalhe: { type: 'string', description: 'descrição/passo a passo' }, prazo: { type: 'string', description: 'entrega AAAA-MM-DD' }, inicio: { type: 'string', description: 'AAAA-MM-DD' }, dono: { type: 'string', enum: ['unique', 'cliente'] }, tipo: { type: 'string', enum: ['acao', 'tecnica', 'isca', 'reuniao', 'video', 'material', 'post'] }, prioridade: { type: 'string', enum: ['', 'URGENTE', 'P1', 'P2', 'P3'] }, responsaveis: { type: 'array', items: { type: 'string' }, description: 'e-mails das pessoas e/ou "unique"' }, observadores: { type: 'array', items: { type: 'string' } } }, required: ['slug', 'titulo'] } },
  { name: 'alterar_acao', description: 'PROPÕE mudar uma ação existente (status, datas, responsáveis, observadores, quem faz, título, descrição, prioridade).', input_schema: { type: 'object', properties: { slug: { type: 'string' }, id: { type: 'string' }, status: { type: 'string', enum: ['a_fazer', 'fazendo', 'feito', 'cancelado', 'arquivado'] }, prazo: { type: 'string' }, inicio: { type: 'string' }, dono: { type: 'string', enum: ['unique', 'cliente'] }, responsaveis: { type: 'array', items: { type: 'string' } }, observadores: { type: 'array', items: { type: 'string' } }, titulo: { type: 'string' }, detalhe: { type: 'string' }, prioridade: { type: 'string' } }, required: ['slug', 'id'] } },
  { name: 'mudar_papel', description: 'PROPÕE mudar o papel de uma pessoa na empresa (adm, gestor ou usuario).', input_schema: { type: 'object', properties: { slug: { type: 'string' }, email: { type: 'string' }, papel: { type: 'string', enum: ['adm', 'gestor', 'usuario'] } }, required: ['slug', 'email', 'papel'] } },
  { name: 'agendar_reuniao', description: 'PROPÕE criar uma reunião no Google Agenda com uma empresa (opcional: link do Meet e convite para as pessoas).', input_schema: { type: 'object', properties: { slug: { type: 'string' }, titulo: { type: 'string' }, inicio: { type: 'string', description: 'AAAA-MM-DDTHH:MM (horário de Brasília)' }, duracao: { type: 'number', description: 'minutos' }, pauta: { type: 'string' }, meet: { type: 'boolean' }, convidar: { type: 'boolean' } }, required: ['slug', 'titulo', 'inicio'] } },
  { name: 'adicionar_leitura', description: 'PROPÕE pôr um post do blog na Lista de Leitura (Adquirir Consciência) de uma pessoa ou da empresa toda.', input_schema: { type: 'object', properties: { slug: { type: 'string' }, email: { type: 'string', description: 'e-mail da pessoa ou "*" para a empresa toda' }, post: { type: 'string', description: 'slug do post do blog' }, titulo: { type: 'string' } }, required: ['slug', 'email', 'post', 'titulo'] } },
  { name: 'registrar_vitoria', description: 'PROPÕE registrar uma vitória do cliente no mural de Resultados (assinada pela Unique).', input_schema: { type: 'object', properties: { slug: { type: 'string' }, titulo: { type: 'string' }, numero: { type: 'string' }, texto: { type: 'string' } }, required: ['slug', 'titulo'] } }
];
const ESCRITA = ['criar_acao', 'alterar_acao', 'mudar_papel', 'agendar_reuniao', 'adicionar_leitura', 'registrar_vitoria'];

function cria(d) {
  // d: { redis, lerPares, conteudo, empresa, pessoasDe, vitoriasDe, CATALOGO, NOTION, SITE }
  const { redis, lerPares } = d;
  async function slugs() { const [s] = await redis([['SMEMBERS', 'area:emps']]); return Array.from(new Set((s || []).concat(Object.keys(d.CATALOGO || {})))).sort(); }
  const linkAcao = (slug, a) => '/area/admin/#acoes/' + encodeURIComponent((a.compartilhada ? 'm:' + a.id : 'p:' + slug + ':' + a.id) + '|' + slug);
  const resumoAcao = (slug, a) => ({ id: a.id, titulo: a.titulo, status: ST[a.status] || a.status, entrega: a.prazo || '', inicio: a.inicio || '', quem_faz: a.dono === 'cliente' ? 'Cliente' : 'Unique', responsaveis: a.responsaveis || [], observadores: a.observadores || [], tipo: a.tipo || 'acao', prioridade: a.prioridade || '', atrasada: !!(a.prazo && a.prazo < hojeSP() && a.status !== 'feito' && a.status !== 'cancelado' && a.status !== 'arquivado'), descricao: String(a.detalhe || '').slice(0, 400), empresa: slug, link: linkAcao(slug, a) });
  async function reunioesDe(slug) { const [h] = await redis([['HGETALL', 'area:reun:' + slug]]); return lerPares(h).map(([, v]) => json(v)).filter(Boolean).sort((a, b) => String(b.data).localeCompare(String(a.data))); }

  async function ler(nome, x) {
    const hoje = hojeSP();
    if (nome === 'listar_empresas') {
      const out = [];
      for (const s of await slugs()) {
        const e = await d.empresa(s); if (!e) continue;
        const c = await d.conteudo(s), A = (c.acoes || []).filter(a => a.status !== 'arquivado' && a.status !== 'cancelado');
        const [n] = await redis([['SCARD', 'area:users:' + s]]);
        out.push({ slug: s, nome: e.nome, etapa: e.etapa || e.origem || '', pessoas: n || 0, acoes_abertas: A.filter(a => a.status !== 'feito').length, atrasadas: A.filter(a => a.prazo && a.prazo < hoje && a.status !== 'feito').length, link: '/area/admin/#empresas/' + s });
      }
      return out;
    }
    if (nome === 'ver_empresa') {
      const s = String(x.slug || ''); const e = await d.empresa(s); if (!e) return { erro: 'Empresa não encontrada: ' + s };
      const c = await d.conteudo(s), P = await d.pessoasDe(s);
      const [ems] = await redis([['SMEMBERS', 'area:users:' + s]]);
      const us = (ems || []).length ? (await redis(ems.map(m => ['GET', 'area:user:' + s + ':' + m]))).map(json).filter(Boolean) : [];
      const [negH, leitH] = await redis([['HGETALL', 'area:neg:' + s], ['HGETALL', 'area:leit:' + s]]);
      return {
        slug: s, nome: e.nome, dados: e.dados || {}, link: '/area/admin/#empresas/' + s,
        pessoas: us.map(u => ({ nome: u.nome, email: u.email, papel: (P.find(p => p.email === u.email) || {}).papel || 'adm', status: u.status, ultimo_acesso: u.ultimo || 'nunca', cargo: (u.crm || {}).cargo || '' })),
        acoes: (c.acoes || []).filter(a => a.status !== 'arquivado').map(a => resumoAcao(s, a)),
        reunioes: (await reunioesDe(s)).slice(0, 15).map(r => ({ id: r.id, nome: r.nome, data: r.data, tipo: r.tipo, gravacao: r.gravacao || '', transcricao: r.transcricao || '', drive: r.drive || '' })),
        negocios: lerPares(negH).map(([, v]) => json(v)).filter(Boolean).map(n => ({ nome: (n.dados || {}).nome, etapa: (n.dados || {}).etapa, valor: (n.dados || {}).valor })),
        vitorias: (await d.vitoriasDe(s)).slice(0, 15).map(v => ({ titulo: v.titulo, numero: v.numero, por: v.nome, data: v.data })),
        leituras: lerPares(leitH).map(([, v]) => json(v)).filter(Boolean).map(l => ({ titulo: l.titulo, pessoa: l.pessoa, lido: l.lido || '' })),
        diagnostico: e.diagnostico || null
      };
    }
    if (nome === 'listar_acoes') {
      const lista = x.slug ? [String(x.slug)] : await slugs(), out = [];
      const t = String(x.texto || '').toLowerCase();
      for (const s of lista) {
        const c = await d.conteudo(s);
        (c.acoes || []).forEach(a => {
          if (a.status === 'arquivado' && x.status !== 'arquivado') return;
          if (x.status && a.status !== x.status) return;
          const r = resumoAcao(s, a);
          if (x.atrasadas && !r.atrasada) return;
          if (x.responsavel && (a.responsaveis || []).indexOf(String(x.responsavel).toLowerCase()) < 0) return;
          if (x.entrega_de && !(a.prazo && a.prazo >= x.entrega_de)) return;
          if (x.entrega_ate && !(a.prazo && a.prazo <= x.entrega_ate)) return;
          if (t && (a.titulo + ' ' + (a.detalhe || '')).toLowerCase().indexOf(t) < 0) return;
          out.push(r);
        });
      }
      return out.slice(0, 80);
    }
    if (nome === 'ver_reuniao') {
      let R = [];
      if (x.slug) R = (await reunioesDe(String(x.slug))).map(r => Object.assign(r, { slug: x.slug }));
      else for (const s of await slugs()) (await reunioesDe(s)).forEach(r => R.push(Object.assign(r, { slug: s })));
      R.sort((a, b) => String(b.data).localeCompare(String(a.data)));
      const passadas = R.filter(r => String(r.data).slice(0, 10) <= hoje);
      const r = x.id ? R.find(z => z.id === x.id) : (passadas[0] || R[0]);
      if (!r) return { erro: 'Nenhuma reunião encontrada.' };
      let conteudo = '';
      try { if (r.id && d.NOTION.ligado()) conteudo = semTags(await d.NOTION.conteudoTarefa(redis, String(r.id).replace(/-/g, ''), '')).slice(0, 14000); } catch (e) { conteudo = ''; }
      return Object.assign({}, r, { conteudo_da_pagina: conteudo || '(sem conteúdo na página do Notion)' });
    }
    if (nome === 'pessoas_sem_acesso') {
      const lim = new Date(Date.now() - (+x.dias || 15) * 864e5).toISOString(), out = [];
      for (const s of await slugs()) {
        const e = await d.empresa(s); if (!e) continue;
        const [ems] = await redis([['SMEMBERS', 'area:users:' + s]]);
        const us = (ems || []).length ? (await redis(ems.map(m => ['GET', 'area:user:' + s + ':' + m]))).map(json).filter(Boolean) : [];
        us.filter(u => u.status !== 'recusado' && (!u.ultimo || u.ultimo < lim)).forEach(u => out.push({ empresa: e.nome, slug: s, nome: u.nome, email: u.email, status: u.status, ultimo_acesso: u.ultimo || 'nunca' }));
      }
      return out;
    }
    if (nome === 'buscar') {
      const t = String(x.texto || '').toLowerCase(), out = [];
      if (t.length < 2) return [];
      for (const s of await slugs()) {
        const e = await d.empresa(s); if (!e) continue;
        if (String(e.nome).toLowerCase().indexOf(t) >= 0) out.push({ tipo: 'empresa', nome: e.nome, slug: s, link: '/area/admin/#empresas/' + s });
        (await d.pessoasDe(s)).forEach(p => { if ((p.nome + ' ' + p.email).toLowerCase().indexOf(t) >= 0) out.push({ tipo: 'pessoa', nome: p.nome, email: p.email, empresa: e.nome, slug: s }); });
        ((await d.conteudo(s)).acoes || []).forEach(a => { if ((a.titulo + ' ' + (a.detalhe || '')).toLowerCase().indexOf(t) >= 0) out.push(Object.assign({ tipo: 'acao' }, resumoAcao(s, a))); });
        (await reunioesDe(s)).forEach(r => { if (String(r.nome + ' ' + (r.descricao || '')).toLowerCase().indexOf(t) >= 0) out.push({ tipo: 'reuniao', id: r.id, nome: r.nome, data: r.data, empresa: e.nome, slug: s }); });
        (await d.vitoriasDe(s)).forEach(v => { if ((v.titulo + ' ' + (v.texto || '')).toLowerCase().indexOf(t) >= 0) out.push({ tipo: 'vitoria', titulo: v.titulo, empresa: e.nome, slug: s }); });
      }
      return out.slice(0, 60);
    }
    return { erro: 'ferramenta desconhecida' };
  }

  // mudança proposta -> descrição para o cartão + chamada da rota do admin que executa
  async function proposta(nome, x) {
    const e = x.slug ? await d.empresa(String(x.slug)) : null;
    const emp = e ? e.nome : x.slug;
    const lista = v => (Array.isArray(v) ? v : []).map(m => m === 'unique' ? 'Carlos Ribeiro' : m).join(', ');
    if (!e) return { erro: 'Empresa não encontrada: ' + x.slug };
    if (nome === 'criar_acao') return {
      titulo: 'Criar ação em ' + emp, linhas: [['Ação', x.titulo], ['Entrega', x.prazo || 'sem data'], ['Quem faz', x.dono === 'cliente' ? 'Cliente' : 'Unique'], ['Responsáveis', lista(x.responsaveis) || '—'], ['Tipo', ({ acao: 'Ação', tecnica: 'Técnica', isca: 'Isca', reuniao: 'Reunião', video: 'Vídeo', material: 'Material', post: 'Post' })[x.tipo || 'acao'] || 'Ação'], ['Prioridade', x.prioridade || '—'], ['Descrição', String(x.detalhe || '').slice(0, 300) || '—']],
      corpo: { a: 'admin-acao', slug: x.slug, acao: { titulo: x.titulo, detalhe: x.detalhe || '', prazo: x.prazo || '', inicio: x.inicio || hojeSP(), dono: x.dono || 'unique', tipo: x.tipo || 'acao', prioridade: x.prioridade || '', responsaveis: x.responsaveis || [], observadores: x.observadores || [] } }
    };
    if (nome === 'alterar_acao') {
      const c = await d.conteudo(String(x.slug)), a = (c.acoes || []).find(z => z.id === x.id);
      if (!a) return { erro: 'Ação não encontrada: ' + x.id };
      const mud = [];
      ['status', 'prazo', 'inicio', 'dono', 'prioridade', 'titulo', 'detalhe'].forEach(k => { if (x[k] !== undefined && x[k] !== a[k]) mud.push([k === 'prazo' ? 'Entrega' : k === 'detalhe' ? 'Descrição' : k.charAt(0).toUpperCase() + k.slice(1), (k === 'status' ? (ST[a[k]] || a[k]) : (a[k] || '—')) + ' → ' + (k === 'status' ? (ST[x[k]] || x[k]) : String(x[k]).slice(0, 200))]); });
      if (x.responsaveis) mud.push(['Responsáveis', (lista(a.responsaveis) || '—') + ' → ' + (lista(x.responsaveis) || '—')]);
      if (x.observadores) mud.push(['Observadores', (lista(a.observadores) || '—') + ' → ' + (lista(x.observadores) || '—')]);
      if (!mud.length) return { erro: 'Nada para mudar.' };
      const texto = x.titulo !== undefined || x.detalhe !== undefined || x.prioridade !== undefined;
      const corpos = [];
      if (texto && !a.compartilhada) corpos.push({ a: 'admin-acao', slug: x.slug, acao: Object.assign({}, a, { titulo: x.titulo !== undefined ? x.titulo : a.titulo, detalhe: x.detalhe !== undefined ? x.detalhe : a.detalhe, detalheHtml: x.detalhe !== undefined ? '' : a.detalheHtml, prioridade: x.prioridade !== undefined ? x.prioridade : a.prioridade }) });
      const st = { a: 'acao-status', slug: x.slug, id: x.id, status: x.status || a.status };
      ['prazo', 'inicio', 'dono', 'responsaveis', 'observadores'].forEach(k => { if (x[k] !== undefined) st[k] = x[k]; });
      corpos.push(st);
      return { titulo: 'Alterar "' + a.titulo + '" (' + emp + ')', linhas: mud, corpos, link: linkAcao(x.slug, a) };
    }
    if (nome === 'mudar_papel') return { titulo: 'Mudar papel em ' + emp, linhas: [['Pessoa', x.email], ['Novo papel', { adm: 'ADM', gestor: 'Gestor', usuario: 'Usuário' }[x.papel]]], corpo: { a: 'admin-papel', slug: x.slug, email: x.email, papel: x.papel } };
    if (nome === 'agendar_reuniao') {
      const ini = String(x.inicio || '').slice(0, 16), [ems] = await redis([['SMEMBERS', 'area:users:' + x.slug]]);
      return { titulo: 'Agendar reunião com ' + emp, linhas: [['Título', x.titulo], ['Quando', ini.replace('T', ' às ')], ['Duração', (x.duracao || 60) + ' min'], ['Meet', x.meet === false ? 'não' : 'sim'], ['Convidar as pessoas', x.convidar ? 'sim (' + (ems || []).length + ')' : 'não'], ['Pauta', x.pauta || '—']],
        corpo: { a: 'admin-modelo', modelo: { titulo: x.titulo, detalhe: x.pauta || '', inicio: ini, tipo: 'reuniao', dono: 'unique', destino: [x.slug] }, google: { emails: x.convidar ? (ems || []) : [], convidar: !!x.convidar, meet: x.meet !== false } } };
    }
    if (nome === 'adicionar_leitura') return { titulo: 'Lista de Leitura · ' + emp, linhas: [['Post', x.titulo], ['Para', x.email === '*' ? 'a empresa toda' : x.email]], corpo: { a: 'admin-leitura', slug: x.slug, email: x.email, posts: [{ slug: x.post, titulo: x.titulo }] } };
    if (nome === 'registrar_vitoria') return { titulo: 'Registrar vitória de ' + emp, linhas: [['Vitória', x.titulo], ['Número', x.numero || '—'], ['Texto', x.texto || '—']], corpo: { a: 'vitoria', slug: x.slug, titulo: x.titulo, numero: x.numero || '', texto: x.texto || '' } };
    return { erro: 'ferramenta desconhecida' };
  }

  function sistema(empresas) {
    return 'Você é o assistente do Carlos Ribeiro, consultor de vendas da Unique Consultoria, dentro do painel (workspace) dele. Hoje é ' + hojeSP() + ' (horário de Brasília).\n' +
      'Responda em português do Brasil, direto, curto e prático, como um braço direito. Use **negrito** para o que importa e listas curtas. Nada de enrolação.\n' +
      'Use as ferramentas para consultar dados reais antes de responder; não invente números, nomes, datas ou status. Se não achar, diga que não achou.\n' +
      'Sempre que citar uma empresa, ação ou reunião, inclua o link que a ferramenta devolveu, em markdown: [texto](link).\n' +
      'Para criar ou mudar algo, use as ferramentas de mudança: elas NÃO executam, viram um cartão para o Carlos confirmar. Depois de propor, diga em uma frase o que vai acontecer quando ele confirmar. Nunca diga que já fez.\n' +
      'Se o pedido for ambíguo (qual empresa, qual pessoa, qual data), pergunte antes de propor. Datas relativas ("quinta", "dia 15") viram AAAA-MM-DD a partir de hoje.\n' +
      'Responsáveis e observadores são e-mails das pessoas da empresa (use ver_empresa para achar) ou "unique" para o Carlos.\n' +
      'Papéis: ADM vê tudo, inclusive reuniões; Gestor vê o plano e o que for de gestor; Usuário vê o plano e o que é aberto a todos.\n' +
      'Anexos (prints, PDFs, planilhas, atas) que o Carlos mandar podem virar ações: leia, resuma e proponha as ações uma a uma.\n' +
      'Empresas no painel: ' + empresas.map(e => e.nome + ' (' + e.slug + ')').join(', ') + '.';
  }

  async function chamaIA(system, messages) {
    const ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), 100000);
    try {
      const r = await fetch((process.env.ANTHROPIC_BASE || 'https://api.anthropic.com') + '/v1/messages', { method: 'POST', signal: ctl.signal, headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model: MODELO(), max_tokens: 3000, system, tools: FERRAMENTAS, messages }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j.error && j.error.message) || ('IA ' + r.status));
      return j;
    } catch (e) { throw new Error(e.name === 'AbortError' ? 'A IA demorou demais. Tente de novo.' : e.message); } finally { clearTimeout(tm); }
  }

  // um turno: texto + anexos do Carlos -> resposta (texto) + cartões pendentes
  async function turno(convId, texto, anexos) {
    if (!process.env.ANTHROPIC_API_KEY) return { ok: false, erro: 'Falta a chave da IA (ANTHROPIC_API_KEY) na Vercel.' };
    const id = /^[a-f0-9]{16}$/.test(convId || '') ? convId : crypto.randomBytes(8).toString('hex');
    const [cv] = await redis([['GET', 'area:chat:conv:' + id]]);
    const conv = json(cv) || { id, titulo: String(texto || 'Conversa').slice(0, 70), criado: new Date().toISOString(), api: [], tela: [] };
    const conteudo = [];
    const nomesAnexos = [];
    (anexos || []).slice(0, 6).forEach(a => {
      const tipo = String(a.tipo || ''), dados = String(a.dados || '');
      if (!dados) return;
      nomesAnexos.push(a.nome || 'anexo');
      if (/^image\/(png|jpeg|gif|webp)$/.test(tipo)) conteudo.push({ type: 'image', source: { type: 'base64', media_type: tipo, data: dados } });
      else if (tipo === 'application/pdf') conteudo.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: dados }, title: String(a.nome || 'documento').slice(0, 100) });
      else conteudo.push({ type: 'text', text: 'Arquivo anexado "' + (a.nome || 'arquivo') + '":\n' + Buffer.from(dados, 'base64').toString('utf8').slice(0, 60000) });
    });
    conteudo.push({ type: 'text', text: String(texto || '').slice(0, 8000) || '(veja o anexo)' });
    const msgs = conv.api.concat([{ role: 'user', content: conteudo }]);
    const empresas = [];
    for (const s of await slugs()) { const e = await d.empresa(s); if (e) empresas.push({ slug: s, nome: e.nome }); }
    const sys = sistema(empresas);
    const pendentes = [];
    let resposta = '';
    for (let volta = 0; volta < 8; volta++) {
      const j = await chamaIA(sys, msgs);
      msgs.push({ role: 'assistant', content: j.content });
      const usos = (j.content || []).filter(c => c.type === 'tool_use');
      resposta = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim() || resposta;
      if (j.stop_reason !== 'tool_use' || !usos.length) break;
      const resultados = [];
      for (const u of usos) {
        let out;
        try {
          if (ESCRITA.indexOf(u.name) >= 0) {
            const p = await proposta(u.name, u.input || {});
            if (p.erro) out = { erro: p.erro };
            else {
              const pid = crypto.randomBytes(8).toString('hex');
              const corpos = p.corpos || [p.corpo];
              await redis([['SET', 'area:chat:pend:' + pid, JSON.stringify({ corpos, titulo: p.titulo, conv: id }), 'EX', 86400]]);
              const cartao = { id: pid, titulo: p.titulo, linhas: p.linhas, link: p.link || '', estado: 'pendente' };
              pendentes.push(cartao);
              out = { status: 'aguardando confirmação do Carlos no cartão', cartao: p.titulo };
            }
          } else out = await ler(u.name, u.input || {});
        } catch (e) { out = { erro: String(e.message || e) }; }
        resultados.push({ type: 'tool_result', tool_use_id: u.id, content: JSON.stringify(out).slice(0, 60000) });
      }
      msgs.push({ role: 'user', content: resultados });
    }
    if (msgs[msgs.length - 1].role === 'user') msgs.push({ role: 'assistant', content: [{ type: 'text', text: resposta || 'Parei aqui. Quer que eu continue?' }] });
    // guarda a conversa sem os anexos pesados (ficam só os nomes)
    const leve = msgs.map(m => m.role !== 'user' || !Array.isArray(m.content) ? m : Object.assign({}, m, { content: m.content.map(c => (c.type === 'image' || c.type === 'document') ? { type: 'text', text: '[anexo enviado antes: ' + (c.title || 'imagem') + ']' } : (c.type === 'text' && /^Arquivo anexado /.test(c.text) ? { type: 'text', text: c.text.slice(0, 1500) + '…' } : c)) }));
    conv.api = leve.slice(-40);
    // não deixa a conversa começar com resultado de ferramenta solto
    while (conv.api.length && !(conv.api[0].role === 'user' && Array.isArray(conv.api[0].content) && conv.api[0].content.some(c => c.type === 'text'))) conv.api.shift();
    conv.tela.push({ de: 'eu', texto: String(texto || ''), anexos: nomesAnexos, em: new Date().toISOString() });
    conv.tela.push({ de: 'ia', texto: resposta, cartoes: pendentes, em: new Date().toISOString() });
    conv.tela = conv.tela.slice(-80);
    conv.atualizado = new Date().toISOString();
    await redis([['SET', 'area:chat:conv:' + id, JSON.stringify(conv), 'EX', 30 * 86400], ['LREM', 'area:chat:lista', 0, id], ['LPUSH', 'area:chat:lista', id], ['LTRIM', 'area:chat:lista', 0, 59]]);
    return { ok: true, conv: id, titulo: conv.titulo, resposta, cartoes: pendentes };
  }

  // confirma ou cancela um cartão; `chama(corpo)` executa a rota do admin e devolve o JSON dela
  async function decide(pid, ok, chama) {
    const [pv] = await redis([['GET', 'area:chat:pend:' + pid]]);
    const p = json(pv);
    if (!p) return { ok: false, erro: 'Esse cartão expirou. Peça de novo.' };
    let r = { ok: true };
    if (ok) for (const c of p.corpos) { r = await chama(c); if (!r || !r.ok) break; }
    await redis([['DEL', 'area:chat:pend:' + pid]]);
    // marca o cartão na conversa
    const [cv] = await redis([['GET', 'area:chat:conv:' + p.conv]]);
    const conv = json(cv);
    if (conv) { conv.tela.forEach(m => (m.cartoes || []).forEach(c => { if (c.id === pid) c.estado = !ok ? 'cancelado' : (r && r.ok ? 'feito' : 'erro'); })); await redis([['SET', 'area:chat:conv:' + p.conv, JSON.stringify(conv), 'EX', 30 * 86400]]); }
    // conta para a IA o que aconteceu, para a conversa seguir com o contexto certo
    if (conv) { conv.api.push({ role: 'user', content: [{ type: 'text', text: '[sistema] O Carlos ' + (ok ? (r && r.ok ? 'confirmou e foi feito' : 'confirmou, mas deu erro: ' + ((r && r.erro) || '')) : 'cancelou') + ': ' + p.titulo }] }, { role: 'assistant', content: [{ type: 'text', text: 'Anotado.' }] }); await redis([['SET', 'area:chat:conv:' + p.conv, JSON.stringify(conv), 'EX', 30 * 86400]]); }
    return ok ? Object.assign({ feito: !!(r && r.ok) }, r) : { ok: true, cancelado: true };
  }

  async function lista() {
    const [ids] = await redis([['LRANGE', 'area:chat:lista', 0, 39]]);
    if (!(ids || []).length) return [];
    const cs = await redis(ids.map(i => ['GET', 'area:chat:conv:' + i]));
    return cs.map(json).filter(Boolean).map(c => ({ id: c.id, titulo: c.titulo, atualizado: c.atualizado || c.criado }));
  }
  async function conversa(id) { const [cv] = await redis([['GET', 'area:chat:conv:' + id]]); const c = json(cv); return c ? { id: c.id, titulo: c.titulo, tela: c.tela } : null; }

  return { turno, decide, lista, conversa };
}

module.exports = { cria, FERRAMENTAS };
