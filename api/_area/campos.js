// Campos personalizados do CRM (modelo CRM B2B do Notion: EMPRESA, PESSOA, NEGÓCIO).
// Fonte única: a API valida por aqui e entrega a lista em admin-resumo (R.campos), e o
// workspace/app montam os formulários a partir dela.
// t: txt | longo | sel | multi | data | url | email | tel | num | moeda | pct | contatos | cidade (lista do IBGE pelo UF)
// mask: cnpj | cpf | cep | tel | insta | site (formata e valida; CNPJ/CPF com dígito verificador)

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const SEGMENTOS = ['Alimentação e Bebidas', 'Agronegócio', 'Automotivo', 'Comércio', 'Construção Civil', 'Educação', 'Energia', 'Esporte e Lazer', 'Estética e Beleza', 'Eventos', 'Financeiro', 'Franquias', 'Hotelaria', 'Imobiliário', 'Indústria', 'Jurídico', 'Limpeza e Facilities', 'Marketing e Publicidade', 'Mineração', 'Moda e Confecção', 'Papelaria e Gráfica', 'Recursos Humanos', 'Saúde', 'Segurança', 'Setor Público', 'Tecnologia', 'Telecomunicações', 'Terceiro Setor (ONGs e Associações)', 'Transporte e Logística', 'Turismo', 'Varejo'];
const CAMPANHAS = ['Dia das Mães', 'Dia dos Pais', 'Dia das Crianças', 'Black Friday', 'Cyber Monday', 'Natal', 'Ano Novo', 'Campanha Mês Janeiro', 'Carnaval', 'Páscoa', 'Dia do Consumidor', 'Semana do Cliente'];
const RESP = ['Carlos Ribeiro'];

const TEMPO = ['Menos de 1 ano', 'De 1 a 3 anos', 'De 3 a 5 anos', 'De 5 a 10 anos', 'Mais de 10 anos'];
const FATURAMENTO = ['Até R$ 50 mil', 'R$ 50 mil a R$ 100 mil', 'R$ 100 mil a R$ 300 mil', 'R$ 300 mil a R$ 1 milhão', 'R$ 1 milhão a R$ 5 milhões', 'Acima de R$ 5 milhões', 'Prefiro não informar'];
const COLAB = ['1 a 5', '6 a 15', '16 a 50', '51 a 100', 'Mais de 100'];
// respostas do diagnóstico que viram um segmento da lista
const SEG_ALIAS = { 'Distribuidora / Atacado': 'Comércio', 'Varejo / Loja física': 'Varejo', 'E-commerce': 'Varejo', 'Saúde e estética': 'Estética e Beleza', 'Construção e engenharia': 'Construção Civil', 'Alimentação': 'Alimentação e Bebidas' };

const empresa = [
  { k: 'cnpj', r: 'CNPJ', t: 'txt', g: 'Identificação', mask: 'cnpj', dica: 'Digite o CNPJ e o resto se preenche com os dados da Receita.' },
  { k: 'razao', r: 'Razão social', t: 'txt', g: 'Identificação' },
  { k: 'situacao', r: 'Situação cadastral', t: 'sel', op: ['Ativa', 'Suspensa', 'Inapta', 'Baixada', 'Nula'], g: 'Identificação' },
  { k: 'abertura', r: 'Data de abertura', t: 'data', g: 'Identificação' },
  { k: 'cnae', r: 'Atividade principal (CNAE)', t: 'txt', g: 'Identificação' },
  { k: 'segmento', r: 'Segmento', t: 'sel', op: SEGMENTOS, g: 'Identificação', alias: SEG_ALIAS },
  { k: 'fantasia', r: 'Nome fantasia', t: 'txt', g: 'Identificação' },
  { k: 'natureza', r: 'Natureza jurídica', t: 'sel', op: ['Empresário Individual (EI)', 'Sociedade Limitada (LTDA)', 'Sociedade Limitada Unipessoal (SLU)', 'Sociedade Anônima Fechada', 'Sociedade Anônima Aberta', 'Sociedade Simples', 'EIRELI (antiga)', 'Cooperativa', 'Associação', 'Outra'], livre: true, g: 'Identificação' },
  { k: 'porte', r: 'Porte da empresa', t: 'sel', op: ['Microempresa (ME)', 'Empresa de Pequeno Porte (EPP)', 'Demais'], alias: { 'Pequena': 'Empresa de Pequeno Porte (EPP)', 'Média': 'Demais', 'Grande': 'Demais' }, g: 'Identificação' },
  { k: 'simples', r: 'Simples / MEI', t: 'sel', op: ['Não optante', 'Optante pelo Simples Nacional', 'MEI', 'Não / Não'], livre: true, g: 'Identificação' },
  { k: 'capital', r: 'Capital social', t: 'moeda', g: 'Identificação' },
  { k: 'socios', r: 'Sócios', t: 'longo', g: 'Identificação' },
  { k: 'tempo', r: 'Tempo de mercado', t: 'sel', op: TEMPO, g: 'Identificação' },
  { k: 'faturamento', r: 'Faturamento mensal', t: 'sel', op: FATURAMENTO, g: 'Identificação' },
  { k: 'colaboradores', r: 'Colaboradores', t: 'sel', op: COLAB, g: 'Identificação' },
  { k: 'responsavel', r: 'Responsável', t: 'sel', op: RESP, livre: true, g: 'Gestão' },
  { k: 'tipoCliente', r: 'Tipo de cliente', t: 'sel', op: ['Ativo', 'Inativo', 'Inadimplente', 'Inoperante', 'Problemático'], g: 'Gestão' },
  { k: 'grupo', r: 'Grupo estratégico', t: 'sel', op: ['G1', 'G2', 'G3', 'G4', 'G5'], g: 'Gestão' },
  { k: 'frequencia', r: 'Frequência', t: 'sel', op: ['Anual', 'Semestral', 'Trimestral', 'Bimestral', 'Mensal', 'Quinzenal', 'Semanal'], g: 'Gestão' },
  { k: 'statusCliente', r: 'Status do cliente', t: 'sel', op: ['Cliente satisfeito', 'Cliente insatisfeito'], g: 'Gestão' },
  { k: 'rating', r: 'Rating', t: 'sel', op: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'], g: 'Gestão' },
  { k: 'resumo', r: 'Resumo da empresa', t: 'longo', g: 'Gestão' },
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
  { k: 'cargo', r: 'Cargo', t: 'multi', livre: true, op: ['Proprietário', 'Sócio', 'Braço Direito', 'Diretor', 'Diretor Financeiro', 'Diretor Produção', 'Gerente', 'Gerente de Marketing', 'Coordenador', 'Supervisor', 'Comercial', 'Vendedor', 'Consultor', 'Atendimento', 'Comprador', 'Cotação', 'Financeiro', 'Administrativo', 'Auxiliar', 'Recepcão', 'Redes Sociais', 'Designer', 'Fotografo', 'Videomaker', 'Desenvolvedor TI', 'Prestador de Serviço', 'Estagiário', 'Barbeiro', 'Analista', 'Assistente', 'Contador', 'Técnico', 'Engenheiro', 'Operacional'],
    alias: { 'Dono / Proprietário': 'Proprietário', 'CEO / Diretor': 'Diretor', 'Representante Comercial': 'Comercial', 'Recepcionista': 'Recepcão', 'Secretária': 'Administrativo' } },
  { k: 'ativa', r: 'Ativa na empresa?', t: 'sel', op: ['Sim', 'Não'] },
  { k: 'telComercial', r: 'Telefone comercial', t: 'tel', mask: 'tel' },
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
  { k: 'indicacoes', r: 'Indicações', t: 'longo' },
  // só para o Carlos (nunca vão para a área do cliente)
  { k: 'daOnde', r: 'Da onde', t: 'txt', priv: true },
  { k: 'hobbie', r: 'Hobbie', t: 'txt', priv: true },
  { k: 'bebida', r: 'Bebida', t: 'txt', priv: true },
  { k: 'comida', r: 'Comida', t: 'sel', op: ['Doce', 'Salgado'], priv: true },
  { k: 'presente', r: 'Presente', t: 'multi', op: ['Utilidade', 'Emocional', 'Tecnológico'], livre: true, priv: true }
];

// mesmas etapas do funil de Leads do Notion
const ETAPAS_NEG = ['Cadastrado', 'Qualificação', 'Orçamento', 'Negociação', 'Objeção', 'Perdido', 'Fazer Contrato', 'Sucesso: Ativo', 'Sucesso: Inativo'];
const ETAPA_ANTIGA = { 'Lead': 'Cadastrado', 'Orçamento enviado': 'Orçamento', 'Aguardando': 'Negociação', 'Vendido': 'Fazer Contrato', 'Sucesso': 'Sucesso: Ativo', 'Lixo': 'Perdido', 'SAC': 'Sucesso: Ativo' };
const CANAIS = ['Isca', 'Diagnóstico', 'Indicação', 'Google', 'Instagram', 'Facebook', 'LinkedIn', 'Site', 'WhatsApp', 'Prospecção ativa', 'Amizade', 'Parceria', 'Legendários', 'Familia', 'Evento', 'Base de Cliente', 'TêxtilClub'];
const CANAL_ANTIGO = { 'Base de clientes': 'Base de Cliente', 'Blog': 'Site', 'Chat do site': 'Site', 'E-mail marketing': 'Site', 'Feira': 'Evento', 'Formulário': 'Site', 'Google (orgânico)': 'Google', 'Google Ads': 'Google', 'Instagram (orgânico)': 'Instagram', 'Landing page': 'Site', 'LinkedIn (orgânico)': 'LinkedIn', 'LinkedIn Ads': 'LinkedIn', 'Meta Ads': 'Facebook', 'Parcerias': 'Parceria', 'QR Code': 'Site', 'Remarketing': 'Google', 'TikTok (orgânico)': 'Site', 'TikTok Ads': 'Site', 'YouTube Ads': 'Google', 'Ligação recebida': 'WhatsApp', 'Loja física': 'Base de Cliente', 'Marketplace': 'Site', 'Rádio / TV': 'Evento', 'Representante comercial': 'Parceria', 'SMS': 'WhatsApp' };
const negocio = [
  { k: 'nome', r: 'Nome do negócio', t: 'txt', obrig: true },
  { k: 'responsavel', r: 'Responsável', t: 'sel', op: RESP, livre: true },
  { k: 'valor', r: 'Valor', t: 'moeda' },
  { k: 'etapa', r: 'Etapa do funil', t: 'sel', op: ETAPAS_NEG, alias: ETAPA_ANTIGA },
  { k: 'tipoContato', r: 'Tipo de contato', t: 'sel', op: ['Lead', 'Lead Qualificado', 'Cliente'] },
  { k: 'produtos', r: 'Serviço / Produto', t: 'multi', livre: true, op: ['AldaCRM', 'TêxtilClub Imersão', 'TêxtilClub Mentoria', 'TêxtilClub Mentoria Advisor', 'TêxtilClub Mentoria Elite', 'Unique Consulting', 'Unique Service', 'Unique Talk', 'Unique WorkShop'] },
  { k: 'probabilidade', r: 'Probabilidade', t: 'pct' },
  { k: 'contatos', r: 'Contatos', t: 'contatos' },
  { k: 'origem', r: 'Canal de origem', t: 'multi', livre: true, op: CANAIS, alias: CANAL_ANTIGO },
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
      v = v.map(x => String(x).trim().slice(0, 120)).map(x => (c.alias && c.alias[x]) || x).filter(x => x && (c.t === 'contatos' || c.livre || c.op.indexOf(x) >= 0)).slice(0, 30);
      v = v.filter((x, i) => v.indexOf(x) === i);
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

module.exports = { empresa, pessoa, negocio, ETAPAS_NEG, CANAIS, SEGMENTOS, TEMPO, limpa, so, cnpjOk, defs: { empresa, pessoa, negocio } };
