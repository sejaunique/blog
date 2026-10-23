// Eventos ao vivo da Unique (treinamentos, workshops, palestras) — inscrição pela página /evento/.
// Os eventos ficam em api/_eventos.js: é lá que se troca o banner e o link do Meet de cada evento.
// Público:
//   GET  ?e=slug        -> dados do evento para montar o banner (SEM o link do Meet). Sem ?e= devolve o evento ativo.
//   POST {a:'inscrever', e, nome, whatsapp, nomeWhats, empresa, email, aceite, site}
//     -> 1. guarda a inscrição em ev:insc:<slug> (hash e-mail -> json; reenviar só atualiza)
//        2. cria a empresa no CRM da Área do Cliente como "lead", com a etiqueta do evento, e a pessoa sem senha
//           (status "convite"), sem mexer em empresa ou pessoa que já existem
//        3. inscreve o e-mail na newsletter do blog (news:assinantes)
//        4. avisa o Carlos no app (push)
//        5. devolve o link do Meet (só aqui ele sai do servidor; vazio enquanto não estiver em api/_eventos.js)
// Admin (sessão do workspace, cookie ua_sess):
//   GET  ?a=adm&e=slug          -> total e últimos inscritos (a página mostra uma barra para o Carlos)
//   GET  ?a=csv&e=slug          -> planilha com todos os inscritos
// Dados (Redis): ev:insc:<slug>, rl:ev:<ip>, e as chaves area:* e news:* já usadas pelo site.

const crypto = require('crypto');
const EVENTOS = require('./_eventos.js');
const { slugify } = require('./_area/lead.js');
const { notifica } = require('./_area/push.js');
const URL_DB = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmds) {
  const r = await fetch(URL_DB.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('db ' + r.status);
  return (await r.json()).map(x => x.result);
}
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };
function corpo(req) { if (req.body && typeof req.body === 'object') return req.body; try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; } }
const EMAIL = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const limpa = (s, n) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ').slice(0, n);
const csv = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

const acha = slug => (slug ? EVENTOS.find(e => e.slug === slug) : EVENTOS.find(e => e.ativo)) || null;
const temMeet = e => /^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}/.test(String(e.meet || ''));
function publico(e) { const { meet, ...resto } = e; return resto; }

async function eAdmin(req) {
  const c = String(req.headers.cookie || '').match(/(?:^|;\s*)ua_sess=([a-f0-9]{48})/);
  if (!c) return false;
  const [s] = await redis([['GET', 'area:sess:' + c[1]]]);
  const v = json(s);
  return !!(v && v.admin);
}
async function inscritos(slug) {
  const [h] = await redis([['HVALS', 'ev:insc:' + slug]]);
  return (h || []).map(json).filter(Boolean).sort((a, b) => (a.data < b.data ? 1 : -1));
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_DB || !TOKEN) return res.status(500).json({ ok: false, erro: 'Banco não configurado.' });
  const q = req.query || {};

  if (req.method === 'GET') {
    const ev = acha(q.e);
    if (!ev) return res.status(404).json({ ok: false, erro: 'Evento não encontrado.' });

    if (q.a === 'adm' || q.a === 'csv') {
      try {
        if (!(await eAdmin(req))) return q.a === 'csv' ? res.status(401).send('Entre no workspace da Unique para baixar a lista.') : res.json({ ok: true, admin: false });
        const lista = await inscritos(ev.slug);
        if (q.a === 'csv') {
          const cab = ['Data do cadastro', 'Nome', 'WhatsApp', 'Nome no WhatsApp', 'Empresa', 'E-mail'];
          const fmt = d => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
          const linhas = lista.map(x => [fmt(x.data), x.nome, x.whatsapp, x.nomeWhats, x.empresa, x.email].map(csv).join(';'));
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', 'attachment; filename="inscritos-' + ev.slug + '.csv"');
          return res.status(200).send('﻿' + [cab.map(csv).join(';')].concat(linhas).join('\n'));
        }
        const hoje = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
        return res.json({
          ok: true, admin: true, total: lista.length, meet: temMeet(ev) ? ev.meet : '',
          hoje: lista.filter(x => new Date(x.data).toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) === hoje).length
        });
      } catch (e) { return res.json({ ok: true, admin: false }); }
    }
    return res.json({ ok: true, evento: publico(ev) });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false });
  try {
    const b = corpo(req);
    if (b.a !== 'inscrever') return res.status(400).json({ ok: false });
    if (b.site) return res.json({ ok: true }); // campo isca: robô
    const ev = acha(b.e);
    if (!ev || !ev.ativo) return res.status(404).json({ ok: false, erro: 'As inscrições deste evento estão fechadas.' });

    const nome = limpa(b.nome, 80), empresa = limpa(b.empresa, 80), nomeWhats = limpa(b.nomeWhats, 60);
    const whatsapp = String(b.whatsapp || '').replace(/\D/g, '').slice(0, 13);
    const email = String(b.email || '').toLowerCase().trim().slice(0, 120);
    if (nome.length < 2) return res.status(400).json({ ok: false, erro: 'Informe o seu nome.' });
    if (whatsapp.length < 10) return res.status(400).json({ ok: false, erro: 'Confira o seu WhatsApp com DDD.' });
    if (!nomeWhats) return res.status(400).json({ ok: false, erro: 'Informe o nome que aparece no seu WhatsApp.' });
    if (empresa.length < 2) return res.status(400).json({ ok: false, erro: 'Informe o nome da empresa.' });
    if (!EMAIL.test(email)) return res.status(400).json({ ok: false, erro: 'Confira o seu e-mail.' });
    if (b.aceite !== true) return res.status(400).json({ ok: false, erro: 'Para se inscrever, marque que concorda em receber os conteúdos e com a LGPD.' });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
    const [n] = await redis([['INCR', 'rl:ev:' + ip], ['EXPIRE', 'rl:ev:' + ip, 3600]]);
    if (n > 20) return res.status(429).json({ ok: false, erro: 'Muitas tentativas. Tente de novo mais tarde.' });

    const agora = new Date().toISOString();
    const slug = slugify(empresa);
    const consentimento = { data: agora, evento: ev.slug, texto: ACEITE, ip };

    // 1. inscrição (uma por e-mail; reenviar atualiza os dados e mantém a data original)
    const [antiga] = await redis([['HGET', 'ev:insc:' + ev.slug, email]]);
    const anterior = json(antiga);
    const cmds = [['HSET', 'ev:insc:' + ev.slug, email, JSON.stringify({ nome, whatsapp, nomeWhats, empresa, slug, email, data: anterior ? anterior.data : agora, consentimento })]];

    // 2. lead no CRM (sem sobrescrever o que já existe)
    if (slug.length >= 2) {
      cmds.push(
        ['SET', 'area:emp:' + slug, JSON.stringify({ slug, nome: empresa, criado: agora, etapa: 'lead', tags: [ev.tag || 'Evento'], origem: 'evento' }), 'NX'],
        ['SADD', 'area:emps', slug],
        ['SET', 'area:user:' + slug + ':' + email, JSON.stringify({ email, nome, whatsapp, nomeWhats, slug, empresaNome: empresa, status: 'convite', criado: agora, origem: 'evento' }), 'NX'],
        ['SADD', 'area:users:' + slug, email]
      );
    }
    const r1 = await redis(cmds);
    const empresaNova = slug.length >= 2 && r1[1] === 'OK';

    // 3. newsletter (mesmo formato de api/newsletter.js)
    const [v] = await redis([['HGET', 'news:assinantes', email]]);
    const atual = json(v);
    const ass = atual || { email, token: crypto.randomBytes(16).toString('hex'), data: agora, origem: 'evento-' + ev.slug };
    if (!ass.nome) ass.nome = nome;
    ass.consentimento = consentimento; ass.anuncios = true; ass.whatsapp = ass.whatsapp || whatsapp;
    await redis([['HSET', 'news:assinantes', email, JSON.stringify(ass)], ['SREM', 'news:saiu', email]]);

    // 4. aviso no app (só na primeira inscrição da pessoa)
    if (!anterior && !b.silencioso) await notifica(redis, { titulo: 'Inscrição: ' + ev.tipo, texto: empresa + ' · ' + nome + (empresaNova ? ' (lead novo)' : ''), url: '/area/admin/#empresas/' + slug });

    // 5. link do Meet
    return res.json({ ok: true, ja: !!anterior, meet: temMeet(ev) ? ev.meet : '' });
  } catch (e) {
    return res.status(500).json({ ok: false, erro: 'Não deu certo agora. Tente de novo em instantes.' });
  }
};

const ACEITE = 'Concordo em receber o blog, novidades, conteúdos e anúncios da Unique por e-mail e WhatsApp, e autorizo o tratamento dos meus dados conforme a LGPD (Lei 13.709/2018) e a Política de Privacidade. Posso cancelar quando quiser.';
module.exports.ACEITE = ACEITE;
