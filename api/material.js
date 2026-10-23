// Materiais ricos do site (ex.: material de apoio da palestra Comercial Atleta).
// Público:
//   POST {a:'liberar', material, nome, empresa, whatsapp, email, site}
//     -> libera o material e transforma quem preencheu em lead:
//        1. guarda o cadastro em mat:leads (lista, mais novo primeiro)
//        2. cria a empresa no CRM da Área do Cliente como "lead", com a etiqueta do material (ex.: Palestra),
//           e a pessoa sem senha (status "convite"), sem mexer em empresa ou pessoa que já existem
//        3. publica o material como entrega da empresa
//        4. inscreve o e-mail na newsletter do blog (news:assinantes)
//        5. avisa o Carlos no app (push)
// Dados (Redis): mat:leads, rl:mat:<ip>, e as chaves area:* e news:* já usadas pelo site.

const crypto = require('crypto');
const { slugify } = require('./_area/lead.js');
const { notifica } = require('./_area/push.js');
const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const MATERIAIS = {
  'comercial-atleta': {
    titulo: 'Comercial Atleta · Material de apoio',
    descricao: 'Os 4 pilares comerciais, a rotina diária, semanal e mensal, o placar de indicadores e o desafio de 30 dias.',
    url: '/comercial-atleta/',
    tag: 'Palestra'
  },
  'icp': {
    titulo: 'ICP e ICP do lixo · Tarefa de qualificação',
    descricao: 'Defina quem é o seu cliente ideal, quem NÃO é (o ICP do lixo) e monte o termômetro de leads para atender primeiro quem vai respeitar o seu processo.',
    url: '/icp/',
    tag: 'Isca ICP',
    aceite: 'Concordo em receber o blog, novidades, conteúdos e anúncios da Unique por e-mail e WhatsApp, e autorizo o tratamento dos meus dados conforme a LGPD (Lei 13.709/2018) e a Política de Privacidade. Posso cancelar quando quiser.'
  },
  'orcamentos-parados': {
    titulo: 'Orçamentos parados · Manual de fechamento do mês',
    descricao: 'Supervisão, cliente x lead, oferta com condicional, calendário comercial, bonificação e CRM, com plano de 7 dias, auditoria de conversas, calculadora e gerador de oferta.',
    url: '/orcamentos-parados/',
    tag: 'Aula CRM',
    aceite: 'Concordo em receber o blog, novidades, conteúdos e anúncios da Unique por e-mail e WhatsApp, e autorizo o tratamento dos meus dados conforme a LGPD (Lei 13.709/2018) e a Política de Privacidade. Posso cancelar quando quiser.'
  }
};

async function redis(cmds) {
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => x.result);
}
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
function corpo(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } }
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const limpa = (s, n) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ').slice(0, n);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN) return res.status(500).json({ ok: false, erro: 'Banco não configurado.' });

  // GET ?a=adm&material=X -> visualização ADM: com a sessão de admin do workspace (cookie ua_sess),
  // libera o material sem cadastro e devolve os cadastros recebidos daquele material.
  if (req.method === 'GET' && (req.query || {}).a === 'adm') {
    try {
      const mt = String((req.query || {}).material || '');
      const c = String(req.headers.cookie || '').match(/(?:^|;\s*)ua_sess=([a-f0-9]{48})/);
      if (!c || !MATERIAIS[mt]) return res.json({ ok: true, admin: false });
      const [s] = await redis([['GET', 'area:sess:' + c[1]]]);
      const v = json(s);
      if (!(v && v.admin)) return res.json({ ok: true, admin: false });
      const [lst] = await redis([['LRANGE', 'mat:leads', 0, 1999]]);
      const leads = (lst || []).map(json).filter(x => x && x.material === mt);
      const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
      return res.json({
        ok: true, admin: true, total: leads.length,
        hoje: leads.filter(x => new Date(x.data).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) === hoje).length,
        ultimos: leads.slice(0, 30).map(x => ({ nome: x.nome, empresa: x.empresa, slug: x.slug, whatsapp: x.whatsapp, email: x.email, data: x.data }))
      });
    } catch (e) { return res.json({ ok: true, admin: false }); }
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const b = corpo(req);
    if (b.a !== 'liberar') return res.status(400).json({ ok: false });
    if (b.site) return res.json({ ok: true }); // campo isca: robô
    const m = MATERIAIS[b.material];
    if (!m) return res.status(404).json({ ok: false, erro: 'Material não encontrado.' });

    const nome = limpa(b.nome, 80), empresa = limpa(b.empresa, 80), whatsapp = limpa(b.whatsapp, 30);
    const email = String(b.email || '').toLowerCase().trim().slice(0, 120);
    if (nome.length < 2) return res.status(400).json({ ok: false, erro: 'Informe o seu nome.' });
    if (!EMAIL.test(email)) return res.status(400).json({ ok: false, erro: 'Confira o seu e-mail.' });
    if (whatsapp.replace(/\D/g, '').length < 10) return res.status(400).json({ ok: false, erro: 'Confira o seu WhatsApp com DDD.' });
    if (empresa.length < 2) return res.status(400).json({ ok: false, erro: 'Informe o nome da empresa.' });
    if (m.aceite && b.aceite !== true) return res.status(400).json({ ok: false, erro: 'Para liberar, marque que concorda em receber os conteúdos e com a LGPD.' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const [n] = await redis([['INCR', 'rl:mat:' + ip], ['EXPIRE', 'rl:mat:' + ip, 3600]]);
    if (n > 20) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Tente de novo mais tarde.' });

    const agora = new Date().toISOString();
    const slug = slugify(empresa);
    // consentimento (LGPD): o que a pessoa aceitou, quando e de onde
    const consentimento = b.aceite === true ? { data: agora, material: b.material, texto: m.aceite || 'Newsletter do blog Unique', ip } : null;

    // 1. registro do cadastro
    const cmds = [
      ['LPUSH', 'mat:leads', JSON.stringify({ material: b.material, nome, empresa, slug, whatsapp, email, data: agora, consentimento })],
      ['LTRIM', 'mat:leads', 0, 1999]
    ];

    // 2 e 3. lead no CRM (sem sobrescrever o que já existe) + o material como entrega
    if (slug.length >= 2) {
      cmds.push(
        ['SET', 'area:emp:' + slug, JSON.stringify({ slug, nome: empresa, criado: agora, etapa: 'lead', tags: m.tag ? [m.tag] : [], origem: 'material' }), 'NX'],
        ['SADD', 'area:emps', slug],
        ['SET', 'area:user:' + slug + ':' + email, JSON.stringify({ email, nome, whatsapp, slug, empresaNome: empresa, status: 'convite', criado: agora, origem: 'material' }), 'NX'],
        ['SADD', 'area:users:' + slug, email],
        ['HSETNX', 'area:itens:' + slug, 'mt-' + b.material, JSON.stringify({ id: 'mt-' + b.material, tipo: 'pagina', titulo: m.titulo, descricao: m.descricao, url: m.url, publicado: true, criado: agora })]
      );
    }
    const r1 = await redis(cmds);
    const empresaNova = slug.length >= 2 && r1[2] === 'OK';

    // 4. newsletter (mesmo formato de api/newsletter.js)
    const [v] = await redis([['HGET', 'news:assinantes', email]]);
    const atual = json(v);
    const ass = atual || { email, token: crypto.randomBytes(16).toString('hex'), data: agora, origem: b.material };
    if (!ass.nome) ass.nome = nome;
    if (consentimento) { ass.consentimento = consentimento; ass.anuncios = true; ass.whatsapp = ass.whatsapp || whatsapp; }
    await redis([['HSET', 'news:assinantes', email, JSON.stringify(ass)], ['SREM', 'news:saiu', email]]);

    // 5. aviso no app
    await notifica(redis, { titulo: 'Material baixado: ' + m.titulo.split(' · ')[0], texto: empresa + ' · ' + nome + (empresaNova ? ' (lead novo)' : ''), url: '/area/admin/#empresas/' + slug });

    return res.json({ ok: true, newsletter: atual ? 'ja' : 'nova' });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: 'Não deu certo agora. Tente de novo em instantes.' });
  }
};
