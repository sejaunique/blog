// Transforma um diagnóstico recebido em lead da Área do Cliente.
// Cria (se ainda não existir) a empresa na etapa "lead", a pessoa sem senha
// (status "convite": ninguém recebe nada até o Carlos gerar o link de acesso)
// e publica o relatório do diagnóstico como entrega da empresa.

const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;

async function criaLead(redis, d) {
  const slug = slugify(d.empresa);
  if (slug.length < 2) return null;
  const agora = new Date().toISOString();
  const email = String(d.email || '').trim().toLowerCase();
  const cmds = [
    ['SET', 'area:emp:' + slug, JSON.stringify({ slug, nome: String(d.empresa).trim().slice(0, 80), criado: agora, etapa: 'lead', tags: [], origem: 'diagnostico' }), 'NX'],
    ['SADD', 'area:emps', slug],
    ['HSET', 'area:itens:' + slug, 'dg' + d.id, JSON.stringify({
      id: 'dg' + d.id,
      tipo: 'diagnostico',
      titulo: 'Diagnóstico de Maturidade Comercial',
      descricao: 'Respondido em ' + new Date(d.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) + '. Score, gargalos e plano de ação da sua empresa.',
      url: '/diagnostico/relatorio/?r=' + d.token,
      publicado: true,
      criado: agora
    })]
  ];
  if (emailOk(email)) {
    const u = { email, nome: String(d.nome || '').trim().slice(0, 80) || email, whatsapp: String(d.whatsapp || '').slice(0, 30), slug, empresaNome: String(d.empresa).trim().slice(0, 80), status: 'convite', criado: agora, origem: 'diagnostico' };
    cmds.push(['SET', 'area:user:' + slug + ':' + email, JSON.stringify(u), 'NX'], ['SADD', 'area:users:' + slug, email]);
  }
  // marca o último diagnóstico na empresa (para o Kanban mostrar)
  cmds.push(['HSET', 'area:diag', slug, JSON.stringify({ id: d.id, data: d.data, token: d.token })]);
  await redis(cmds);
  return slug;
}

module.exports = { criaLead, slugify };
