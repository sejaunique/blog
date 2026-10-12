// Campos personalizados do CRM (modelo CRM B2B do Notion: EMPRESA, PESSOA, NEGÓCIO).
// Fonte única: a API valida por aqui e entrega a lista em admin-resumo (R.campos), e o
// workspace/app montam os formulários a partir dela.
// t: txt | longo | sel | multi | data | url | email | tel | num | moeda | pct | contatos | cidade (lista do IBGE pelo UF)
// mask: cnpj | cpf | cep | tel | insta | site (formata e valida; CNPJ/CPF com dígito verificador)

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const SEGMENTOS = ['Alimentação e Bebidas', 'Agronegócio', 'Automotivo', 'Comércio', 'Construção Civil', 'Distribuição e Atacado', 'E-commerce', 'Educação', 'Energia', 'Esporte e Lazer', 'Estética e Beleza', 'Eventos', 'Financeiro', 'Franquias', 'Hotelaria', 'Imobiliário', 'Indústria', 'Jurídico', 'Limpeza e Facilities', 'Marketing e Publicidade', 'Mineração', 'Moda e Confecção', 'Papelaria e Gráfica', 'Prestação de Serviços', 'Recursos Humanos', 'Saúde', 'Segurança', 'Setor Público', 'Tecnologia', 'Telecomunicações', 'Terceiro Setor (ONGs e Associações)', 'Transporte e Logística', 'Turismo', 'Varejo'];
const CAMPANHAS = ['Dia das Mães', 'Dia dos Pais', 'Dia das Crianças', 'Black Friday', 'Cyber Monday', 'Natal', 'Ano Novo', 'Campanha Mês Janeiro', 'Carnaval', 'Páscoa', 'Dia do Consumidor', 'Semana do Cliente'];
const RESP = ['Carlos Ribeiro'];

const TEMPO = ['Menos de 1 ano', 'De 1 a 3 anos', 'De 3 a 5 anos', 'De 5 a 10 anos', 'Mais de 10 anos'];
const FATURAMENTO = ['Até R$ 50 mil', 'R$ 50 mil a R$ 100 mil', 'R$ 100 mil a R$ 300 mil', 'R$ 300 mil a R$ 1 milhão', 'R$ 1 milhão a R$ 5 milhões', 'Acima de R$ 5 milhões', 'Prefiro não informar'];
const COLAB = ['1 a 5', '6 a 15', '16 a 50', '51 a 100', 'Mais de 100'];
// respostas do diagnóstico que viram um segmento da lista
const SEG_ALIAS = { 'Distribuidora / Atacado': 'Distribuição e Atacado', 'Varejo / Loja física': 'Varejo', 'Prestação de serviços': 'Prestação de Serviços', 'Saúde e estética': 'Estética e Beleza', 'Construção e engenharia': 'Construção Civil', 'Alimentação': 'Alimentação e Bebidas', 'E-commerce': 'E-commerce' };

const empresa = [
  { k: 'cnpj', r: 'CNPJ', t: 'txt', g: 'Identificação', mask: 'cnpj', dica: 'Digite o CNPJ e o resto se preenche com os dados da Receita.' },
  { k: 'razao', r: 'Razão social', t: 'txt', g: 'Identificação' },
  { k: 'situacao', r: 'Situação cadastral', t: 'sel', op: ['Ativa', 'Suspensa', 'Inapta', 'Baixada', 'Nula'], g: 'Identificação' },
  { k: 'abertura', r: 'Data de abertura', t: 'data', g: 'Identificação' },
  { k: 'cnae', r: 'Atividade principal (CNAE)', t: 'txt', g: 'Identificação' },
  { k: 'segmento', r: 'Segmento', t: 'sel', op: SEGMENTOS, g: 'Identificação', alias: SEG_ALIAS },
  { k: 'porte', r: 'Porte da empresa', t: 'sel', op: ['Pequena', 'Média', 'Grande'], g: 'Identificação' },
  { k: 'tempo', r: 'Tempo de mercado', t: 'sel', op: TEMPO, g: 'Identificação' },
  { k: 'faturamento', r: 'Faturamento mensal', t: 'sel', op: FATURAMENTO, g: 'Identificação' },
  { k: 'colaboradores', r: 'Colaboradores', t: 'sel', op: COLAB, g: 'Identificação' },
  { k: 'responsavel', r: 'Responsável', t: 'sel', op: RESP, livre: true, g: 'Gestão' },
  { k: 'tipoCliente', r: 'Tipo de cliente', t: 'sel', op: ['Ativo', 'Inativo', 'Inadimplente', 'Inoperante', 'Problemático'], g: 'Gestão' },
  { k: 'grupo', r: 'Grupo estratégico', t: 'sel', op: ['G1', 'G2', 'G3', 'G4', 'G5'], g: 'Gestão' },
  { k: 'frequencia', r: 'Frequência', t: 'sel', op: ['Anual', 'Semestral', 'Trimestral', 'Bimestral', 'Mensal', 'Quinzenal', 'Semanal'], g: 'Gestão' },
  { k: 'statusCliente', r: 'Status do cliente', t: 'sel', op: ['Cliente satisfeito', 'Cliente insatisfeito'], g: 'Gestão' },
  { k: 'telefone', r: 'Telefone', t: 'tel', mask: 'tel', g: 'Contato' },
  { k: 'email', r: 'E-mail', t: 'email', g: 'Contato' },
  { k: 'site', r: 'Site', t: 'url', mask: 'site', g: 'Contato' },
  { k: 'instagram', r: 'Instagram', t: 'txt', mask: 'insta', g: 'Contato' },
  { k: 'linkedin', r: 'LinkedIn', t: 'url', mask: 'site', g: 'Contato' },
  { k: 'cep', r: 'CEP', t: 'txt', mask: 'cep', g: 'Endereço', dica: 'Digite o CEP e o endereço se preenche.' },
  { k: 'endereco', r: 'Rua / avenida', t: 'txt', g: 'Endereço' },
  { k: 'numero', r: 'Número', t: 'txt', g: 'Endereço' },
  { k: 'complemento', r: 'Complemento', t: 'txt', g: 'Endereço' },
  { k: 'bairro', r: 'Bairro', t: 'txt', g: 'Endereço' },
  { k: 'uf', r: 'Estado (UF)', t: 'sel', op: UF, g: 'Endereço' },
  { k: 'cidade', r: 'Cidade', t: 'cidade', g: 'Endereço' },
  { k: 'obs', r: 'Observações', t: 'longo', g: 'Observações' }
];

const pessoa = [
  { k: 'responsavel', r: 'Responsável', t: 'sel', op: RESP, livre: true },
  { k: 'tipoContato', r: 'Tipo de contato', t: 'sel', op: ['Lead', 'Lead qualificado', 'Cliente', 'Fornecedor', 'Colaborador', 'Transportadora', 'Motorista', 'Candidatos emprego', 'Prestadores de serviço', 'Representantes', 'Terceirizados', 'Indicadores', 'SPAM', 'Outros'] },
  { k: 'cargo', r: 'Cargo', t: 'sel', op: ['Dono / Proprietário', 'Sócio', 'CEO / Diretor', 'Gerente', 'Coordenador', 'Supervisor', 'Comprador', 'Analista', 'Assistente', 'Financeiro', 'Contador', 'Administrativo', 'Vendedor', 'Representante Comercial', 'Consultor', 'Técnico', 'Engenheiro', 'Operacional', 'Recepcionista', 'Secretária'] },
  { k: 'influencia', r: 'Grau de influência', t: 'sel', op: ['Decisor', 'Influenciador', 'Operacional', 'Bloqueador'] },
  { k: 'instagram', r: 'Instagram', t: 'txt', mask: 'insta' },
  { k: 'cpf', r: 'CPF', t: 'txt', mask: 'cpf' },
  { k: 'nascimento', r: 'Data de nascimento', t: 'data' },
  { k: 'sexo', r: 'Sexo', t: 'sel', op: ['Masculino', 'Feminino'] },
  { k: 'cep', r: 'CEP', t: 'txt', mask: 'cep', dica: 'Digite o CEP e o endereço se preenche.' },
  { k: 'endereco', r: 'Rua / avenida', t: 'txt' },
  { k: 'numero', r: 'Número', t: 'txt' },
  { k: 'complemento', r: 'Complemento', t: 'txt' },
  { k: 'bairro', r: 'Bairro', t: 'txt' },
  { k: 'uf', r: 'Estado (UF)', t: 'sel', op: UF },
  { k: 'cidade', r: 'Cidade', t: 'cidade' },
  { k: 'avaliouGoogle', r: 'Avaliou no Google', t: 'sel', op: ['Ainda não', 'Sim', 'Não'] },
  { k: 'pedimosIndicacao', r: 'Pedimos indicação', t: 'sel', op: ['Ainda não', 'Sim', 'Não'] },
  { k: 'indicacoes', r: 'Indicações', t: 'longo' }
];

const ETAPAS_NEG = ['Lead', 'Qualificação', 'Orçamento enviado', 'Negociação', 'Objeção', 'Aguardando', 'Perdido', 'Vendido', 'Sucesso', 'Lixo', 'SAC'];
const negocio = [
  { k: 'nome', r: 'Nome do negócio', t: 'txt', obrig: true },
  { k: 'responsavel', r: 'Responsável', t: 'sel', op: RESP, livre: true },
  { k: 'valor', r: 'Valor', t: 'moeda' },
  { k: 'etapa', r: 'Etapa', t: 'sel', op: ETAPAS_NEG },
  { k: 'probabilidade', r: 'Probabilidade', t: 'pct' },
  { k: 'contatos', r: 'Contatos', t: 'contatos' },
  { k: 'origem', r: 'Origem', t: 'sel', op: ['Base de clientes', 'Blog', 'Chat do site', 'Diagnóstico', 'E-mail marketing', 'Evento', 'Feira', 'Formulário', 'Google (orgânico)', 'Google Ads', 'Indicação', 'Instagram (orgânico)', 'Landing page', 'Ligação recebida', 'LinkedIn (orgânico)', 'LinkedIn Ads', 'Loja física', 'Marketplace', 'Meta Ads', 'Parcerias', 'Prospecção ativa', 'QR Code', 'Rádio / TV', 'Remarketing', 'Representante comercial', 'SMS', 'TikTok (orgânico)', 'TikTok Ads', 'WhatsApp', 'YouTube Ads'] },
  { k: 'campanhas', r: 'Campanha ofertada', t: 'multi', op: CAMPANHAS },
  { k: 'fechouPela', r: 'Fechou pela', t: 'sel', op: CAMPANHAS },
  { k: 'ultimoContato', r: 'Último contato em', t: 'data' },
  { k: 'orcamentoEm', r: 'Orçamento enviado em', t: 'data' },
  { k: 'fechamentoEsperado', r: 'Fechamento esperado', t: 'data' },
  { k: 'proximaAtividade', r: 'Próxima atividade', t: 'data' },
  { k: 'vendidoEm', r: 'Vendido em', t: 'data' },
  { k: 'perdaEm', r: 'Data da perda', t: 'data' },
  { k: 'entregaEm', r: 'Data de entrega', t: 'data' },
  { k: 'obs', r: 'Observações', t: 'longo' }
];

const so = v => String(v || '').replace(/\D/g, '');
function cnpjOk(n) {
  if (n.length !== 14 || /^(\d)\1+$/.test(n)) return false;
  const dv = (base, pesos) => { const t = pesos.reduce((s, p, i) => s + (+base[i]) * p, 0) % 11; return t < 2 ? 0 : 11 - t; };
  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2], p2 = [6].concat(p1);
  return dv(n, p1) === +n[12] && dv(n, p2) === +n[13];
}
function cpfOk(n) {
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  const dv = k => { let t = 0; for (let i = 0; i < k; i++) t += (+n[i]) * (k + 1 - i); t = (t * 10) % 11; return t === 10 ? 0 : t; };
  return dv(9) === +n[9] && dv(10) === +n[10];
}
const FMT = {
  cnpj: n => n.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'),
  cpf: n => n.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4'),
  cep: n => n.replace(/^(\d{5})(\d{3})$/, '$1-$2'),
  tel: n => { if (n.length > 11 && n.indexOf('55') === 0) n = n.slice(2); return n.length === 11 ? n.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : n.length === 10 ? n.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3') : n; }
};
// normaliza um valor de campo com máscara; devolve {v} ou {erro}
function mascara(c, v) {
  const n = so(v);
  if (c.mask === 'cnpj') return cnpjOk(n) ? { v: FMT.cnpj(n) } : { erro: 'CNPJ inválido. Confira os números.' };
  if (c.mask === 'cpf') return cpfOk(n) ? { v: FMT.cpf(n) } : { erro: 'CPF inválido. Confira os números.' };
  if (c.mask === 'cep') return n.length === 8 ? { v: FMT.cep(n) } : { erro: 'CEP precisa ter 8 números.' };
  if (c.mask === 'tel') return n.length >= 10 && n.length <= 13 ? { v: FMT.tel(n) } : { erro: 'Telefone precisa ter DDD + número.' };
  if (c.mask === 'insta') { const h = String(v).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@+/, ''); return /^[A-Za-z0-9._]{1,30}$/.test(h) ? { v: '@' + h.toLowerCase() } : { erro: 'Instagram inválido. Use @perfil.' }; }
  if (c.mask === 'site') { let u = String(v).trim().replace(/\s/g, ''); if (!/^https?:\/\//i.test(u)) u = 'https://' + u; return /^https?:\/\/[^.\s]+\.[^\s]+$/i.test(u) ? { v: u.replace(/\/$/, '') } : { erro: 'Endereço de site inválido.' }; }
  return { v: v };
}

// valida e limpa um objeto conforme a lista de campos. Erros vão em d.__erros (lista de mensagens).
function limpa(defs, entrada) {
  const d = {}, o = entrada || {}, erros = [];
  defs.forEach(c => {
    let v = o[c.k];
    if (v === undefined || v === null || v === '') return;
    if (c.t === 'multi' || c.t === 'contatos') {
      if (!Array.isArray(v)) v = [v];
      v = v.map(x => String(x).trim().slice(0, 120)).filter(x => x && (c.t === 'contatos' || c.op.indexOf(x) >= 0)).slice(0, 30);
      if (v.length) d[c.k] = v;
      return;
    }
    if (c.t === 'moeda' || c.t === 'num' || c.t === 'pct') {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
      if (!isFinite(n)) return;
      d[c.k] = c.t === 'pct' ? Math.max(0, Math.min(100, Math.round(n))) : Math.round(n * 100) / 100;
      return;
    }
    v = String(v).replace(/\s+/g, c.t === 'longo' ? '$&' : ' ').trim().slice(0, c.t === 'longo' ? 2000 : 200);
    if (!v) return;
    if (c.mask) { const m = mascara(c, v); if (m.erro) { erros.push(m.erro); return; } v = m.v; }
    if (c.t === 'email') { v = v.toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { erros.push('E-mail inválido.'); return; } }
    if (c.t === 'data' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    if (c.t === 'sel' && c.op.indexOf(v) < 0) {
      if (c.alias && c.alias[v]) v = c.alias[v];
      else { const i = c.op.findIndex(x => x.toLowerCase() === v.toLowerCase()); if (i >= 0) v = c.op[i]; else if (!c.livre) return; }
    }
    d[c.k] = v;
  });
  if (erros.length) Object.defineProperty(d, '__erros', { value: erros, enumerable: false });
  return d;
}

module.exports = { empresa, pessoa, negocio, ETAPAS_NEG, SEGMENTOS, TEMPO, limpa, so, cnpjOk, defs: { empresa, pessoa, negocio } };
