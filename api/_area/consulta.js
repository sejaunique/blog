// Consultas públicas que preenchem o CRM sozinhas: CNPJ (Receita), CEP e cidades do IBGE.
// Cada uma tem uma fonte reserva e o resultado fica em cache no Redis.
const C = require('./campos.js');
const json = s => { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } };

async function pega(url, ms) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 6000);
  try { const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json', 'User-Agent': 'UniqueWorkspace/1.0' } }); if (!r.ok) return null; return await r.json(); }
  catch (e) { return null; } finally { clearTimeout(t); }
}
const titulo = s => String(s || '').toLowerCase().replace(/(^|[\s/(-])([a-zà-ú])/g, (m, a, b) => a + b.toUpperCase()).replace(/\b(De|Da|Do|Das|Dos|E|Em)\b/g, x => x.toLowerCase()).replace(/\b(Ltda|Me|Epp|Eireli|S\.?a)\b\.?/gi, x => x.toUpperCase()).trim();

// CNAE (2 primeiros dígitos) -> segmento da lista
function segmentoCnae(cod) {
  const c = String(cod || '').replace(/\D/g, ''), d = +c.slice(0, 2), q = c.slice(0, 4);
  if (!d) return '';
  if (q === '9602') return 'Estética e Beleza';
  if (q === '8230') return 'Eventos';
  if (q === '6911') return 'Jurídico';
  if (d <= 3) return 'Agronegócio';
  if (d <= 9) return 'Mineração';
  if (d === 13 || d === 14 || d === 15) return 'Moda e Confecção';
  if (d === 18) return 'Papelaria e Gráfica';
  if (d <= 33) return 'Indústria';
  if (d === 35) return 'Energia';
  if (d <= 39) return 'Limpeza e Facilities';
  if (d <= 43 || d === 71) return 'Construção Civil';
  if (d === 45) return 'Automotivo';
  if (d === 46) return 'Comércio';
  if (d === 47) return /^47(81|82)/.test(c) ? 'Moda e Confecção' : 'Varejo';
  if (d <= 53) return 'Transporte e Logística';
  if (d === 55) return 'Hotelaria';
  if (d === 56) return 'Alimentação e Bebidas';
  if (d === 61) return 'Telecomunicações';
  if (d === 59 || d === 60 || d === 73) return 'Marketing e Publicidade';
  if (d <= 63) return 'Tecnologia';
  if (d <= 66 || d === 69) return 'Financeiro';
  if (d === 68) return 'Imobiliário';
  if (d === 78) return 'Recursos Humanos';
  if (d === 79) return 'Turismo';
  if (d === 80) return 'Segurança';
  if (d === 81) return 'Limpeza e Facilities';
  if (d === 84) return 'Setor Público';
  if (d === 85) return 'Educação';
  if (d <= 88 && d >= 86) return 'Saúde';
  if (d === 90 || d === 91) return 'Eventos';
  if (d === 93) return 'Esporte e Lazer';
  if (d === 94) return 'Terceiro Setor (ONGs e Associações)';
  return ''; // sem segmento equivalente: fica para você escolher
}
function tempoDe(abertura) {
  if (!abertura) return '';
  const anos = (Date.now() - new Date(abertura + 'T12:00:00Z').getTime()) / 31557600000;
  if (!isFinite(anos)) return '';
  return anos < 1 ? C.TEMPO[0] : anos < 3 ? C.TEMPO[1] : anos < 5 ? C.TEMPO[2] : anos < 10 ? C.TEMPO[3] : C.TEMPO[4];
}
const SIT = { ATIVA: 'Ativa', SUSPENSA: 'Suspensa', INAPTA: 'Inapta', BAIXADA: 'Baixada', NULA: 'Nula' };
const PORTE = p => /MICRO|PEQUENO|ME\b|EPP/i.test(p || '') ? 'Pequena' : '';

async function cnpj(redis, valor) {
  const n = C.so(valor);
  if (!C.cnpjOk(n)) return { ok: false, erro: 'CNPJ inválido. Confira os números.' };
  const [cache] = await redis([['GET', 'area:cache:cnpj:' + n]]);
  if (cache) return json(cache);
  let r = null;
  const a = await pega('https://brasilapi.com.br/api/cnpj/v1/' + n);
  if (a && a.cnpj) {
    const tel = String(a.ddd_telefone_1 || '').replace(/\D/g, '');
    r = { razao: a.razao_social, fantasia: a.nome_fantasia, situacao: SIT[String(a.descricao_situacao_cadastral || '').toUpperCase()] || '', abertura: a.data_inicio_atividade || '',
      cnae: [a.cnae_fiscal, a.cnae_fiscal_descricao].filter(Boolean).join(' · '), cnaeCod: a.cnae_fiscal, porte: PORTE(a.porte || a.descricao_porte),
      cep: a.cep, endereco: titulo([a.descricao_tipo_de_logradouro, a.logradouro].filter(Boolean).join(' ')), numero: a.numero, complemento: titulo(a.complemento), bairro: titulo(a.bairro), cidade: titulo(a.municipio), uf: a.uf,
      telefone: tel, email: a.email };
  } else {
    const b = await pega('https://publica.cnpj.ws/cnpj/' + n);
    if (b && b.estabelecimento) {
      const e = b.estabelecimento, at = e.atividade_principal || {};
      r = { razao: b.razao_social, fantasia: e.nome_fantasia, situacao: SIT[String(e.situacao_cadastral || '').toUpperCase()] || '', abertura: e.data_inicio_atividade || '',
        cnae: [at.subclasse || at.id, at.descricao].filter(Boolean).join(' · '), cnaeCod: at.subclasse || at.id, porte: PORTE(b.porte && b.porte.descricao),
        cep: e.cep, endereco: titulo([e.tipo_logradouro, e.logradouro].filter(Boolean).join(' ')), numero: e.numero, complemento: titulo(e.complemento), bairro: titulo(e.bairro), cidade: titulo(e.cidade && e.cidade.nome), uf: e.estado && e.estado.sigla,
        telefone: String((e.ddd1 || '') + (e.telefone1 || '')).replace(/\D/g, ''), email: e.email };
    }
  }
  if (!r) return { ok: false, erro: 'Não consegui consultar a Receita agora. Preencha à mão ou tente de novo.' };
  // a Receita devolve nomes sem acento: o CEP traz a grafia oficial de rua, bairro e cidade
  if (r.cep) { const c = await cep(redis, r.cep); if (c.ok) ['endereco', 'bairro', 'cidade', 'uf'].forEach(k => { if (c.dados[k]) r[k] = c.dados[k]; }); }
  r.segmento = segmentoCnae(r.cnaeCod); r.tempo = tempoDe(r.abertura); delete r.cnaeCod;
  const limpo = C.limpa(C.empresa, r);
  const out = { ok: true, dados: limpo, fantasia: titulo(r.fantasia || ''), razao: r.razao || '' };
  await redis([['SET', 'area:cache:cnpj:' + n, JSON.stringify(out), 'EX', 7 * 86400]]);
  return out;
}

async function cep(redis, valor) {
  const n = C.so(valor);
  if (n.length !== 8) return { ok: false, erro: 'CEP precisa ter 8 números.' };
  const [cache] = await redis([['GET', 'area:cache:cep:' + n]]);
  if (cache) return json(cache);
  let r = null;
  const a = await pega('https://viacep.com.br/ws/' + n + '/json/');
  if (a && !a.erro && a.uf) r = { endereco: a.logradouro, bairro: a.bairro, cidade: a.localidade, uf: a.uf };
  else {
    const b = await pega('https://brasilapi.com.br/api/cep/v2/' + n);
    if (b && b.state) r = { endereco: b.street, bairro: b.neighborhood, cidade: b.city, uf: b.state };
  }
  if (!r) return { ok: false, erro: 'CEP não encontrado.' };
  const out = { ok: true, dados: Object.assign({ cep: n.replace(/^(\d{5})(\d{3})$/, '$1-$2') }, r) };
  await redis([['SET', 'area:cache:cep:' + n, JSON.stringify(out), 'EX', 30 * 86400]]);
  return out;
}

async function cidades(redis, uf) {
  uf = String(uf || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(uf)) return { ok: false };
  const [cache] = await redis([['GET', 'area:cache:cidades:' + uf]]);
  if (cache) return { ok: true, cidades: json(cache) };
  const a = await pega('https://servicodados.ibge.gov.br/api/v1/localidades/estados/' + uf + '/municipios?orderBy=nome', 8000);
  if (!Array.isArray(a) || !a.length) return { ok: false };
  const L = a.map(x => x.nome).sort((x, y) => x.localeCompare(y, 'pt-BR'));
  await redis([['SET', 'area:cache:cidades:' + uf, JSON.stringify(L), 'EX', 90 * 86400]]);
  return { ok: true, cidades: L };
}

// Foto de perfil do Instagram: tenta a API pública do Instagram e, se bloquear, o unavatar.io.
// Devolve a imagem como data URL (o navegador recorta e reduz antes de salvar).
async function imagem(url, ms) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms || 8000);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' } });
    const tipo = r.headers.get('content-type') || '';
    if (!r.ok || !/^image\//.test(tipo)) return null;
    const b = Buffer.from(await r.arrayBuffer());
    if (b.length < 500 || b.length > 3 * 1024 * 1024) return null;
    return 'data:' + tipo.split(';')[0] + ';base64,' + b.toString('base64');
  } catch (e) { return null; } finally { clearTimeout(t); }
}
async function fotoInstagram(valor) {
  const h = String(valor || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, '').toLowerCase();
  if (!/^[a-z0-9._]{1,30}$/.test(h)) return { ok: false, erro: 'Informe um @ do Instagram válido.' };
  let url = '';
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 7000);
    const r = await fetch('https://i.instagram.com/api/v1/users/web_profile_info/?username=' + h, { signal: ctl.signal, headers: { 'x-ig-app-id': '936619743392459', 'User-Agent': 'Instagram 219.0.0.12.117 Android', Accept: 'application/json' } });
    clearTimeout(t);
    if (r.ok) { const j = await r.json(); const u = j && j.data && j.data.user; if (u) url = u.profile_pic_url_hd || u.profile_pic_url || ''; }
  } catch (e) { /* segue para a reserva */ }
  // reserva 1: a página pública do perfil traz a foto na etiqueta og:image (a mesma que aparece ao compartilhar o link)
  if (!url) {
    try {
      const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 7000);
      const r = await fetch('https://www.instagram.com/' + h + '/', { signal: ctl.signal, headers: { 'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)', 'Accept-Language': 'pt-BR' } });
      clearTimeout(t);
      if (r.ok) { const html = await r.text(); const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i); if (m) url = m[1].replace(/&amp;/g, '&'); }
    } catch (e) { /* segue */ }
  }
  let dados = url ? await imagem(url) : null;
  // reserva 2: unavatar.io
  if (!dados) dados = await imagem('https://unavatar.io/instagram/' + h + '?fallback=false');
  if (!dados) return { ok: false, erro: 'O Instagram não liberou a foto de @' + h + ' agora. Use "Enviar foto".' };
  return { ok: true, dados, perfil: '@' + h };
}

// Foto automática a partir do @: salva se ainda não houver foto, ou se a atual veio de outro @ do Instagram.
// Nunca troca uma foto que você enviou à mão.
async function fotoAuto(redis, slug, email, insta) {
  try {
    const h = String(insta || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, '').toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(h)) return null;
    const kReg = email ? 'area:user:' + slug + ':' + email : 'area:emp:' + slug;
    const [v] = await redis([['GET', kReg]]); const reg = json(v); if (!reg) return null;
    if (reg.foto && reg.fotoOrigem !== undefined && reg.fotoOrigem === '@' + h) return null;
    if (reg.foto && !(reg.fotoOrigem || '').startsWith('@')) return null;
    const f = await fotoInstagram(h);
    if (!f.ok || f.dados.length > 400000) return null;
    reg.foto = Date.now().toString(36); reg.fotoOrigem = '@' + h;
    await redis([['SET', 'area:foto:' + (email ? 'p:' + slug + ':' + email : 'emp:' + slug), f.dados], ['SET', kReg, JSON.stringify(reg)]]);
    return reg.foto;
  } catch (e) { return null; }
}

module.exports = { cnpj, cep, cidades, segmentoCnae, fotoInstagram, fotoAuto };
