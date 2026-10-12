// Campos personalizados do CRM (modelo CRM B2B do Notion: EMPRESA, PESSOA, NEGÓCIO).
// Fonte única: a API valida por aqui e entrega a lista em admin-resumo (R.campos), e o
// workspace/app montam os formulários a partir dela.
// t: txt | longo | sel | multi | data | url | email | tel | num | moeda | pct | contatos

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const SEGMENTOS = ['Alimentação e Bebidas', 'Agronegócio', 'Automotivo', 'Comércio', 'Construção Civil', 'Educação', 'Energia', 'Esporte e Lazer', 'Estética e Beleza', 'Eventos', 'Financeiro', 'Franquias', 'Hotelaria', 'Imobiliário', 'Indústria', 'Jurídico', 'Limpeza e Facilities', 'Marketing e Publicidade', 'Mineração', 'Moda e Confecção', 'Papelaria e Gráfica', 'Recursos Humanos', 'Saúde', 'Segurança', 'Setor Público', 'Tecnologia', 'Telecomunicações', 'Terceiro Setor (ONGs e Associações)', 'Transporte e Logística', 'Turismo', 'Varejo'];
const CAMPANHAS = ['Dia das Mães', 'Dia dos Pais', 'Dia das Crianças', 'Black Friday', 'Cyber Monday', 'Natal', 'Ano Novo', 'Campanha Mês Janeiro', 'Carnaval', 'Páscoa', 'Dia do Consumidor', 'Semana do Cliente'];
const RESP = ['Carlos Ribeiro'];

const empresa = [
  { k: 'razao', r: 'Razão social', t: 'txt', g: 'Identificação' },
  { k: 'cnpj', r: 'CNPJ', t: 'txt', g: 'Identificação', mask: 'cnpj' },
  { k: 'segmento', r: 'Segmento', t: 'sel', op: SEGMENTOS, g: 'Identificação', livre: true },
  { k: 'porte', r: 'Porte da empresa', t: 'sel', op: ['Pequena', 'Média', 'Grande'], g: 'Identificação' },
  { k: 'responsavel', r: 'Responsável', t: 'sel', op: RESP, livre: true, g: 'Gestão' },
  { k: 'tipoCliente', r: 'Tipo de cliente', t: 'sel', op: ['Ativo', 'Inativo', 'Inadimplente', 'Inoperante', 'Problemático'], g: 'Gestão' },
  { k: 'grupo', r: 'Grupo estratégico', t: 'sel', op: ['G1', 'G2', 'G3', 'G4', 'G5'], g: 'Gestão' },
  { k: 'frequencia', r: 'Frequência', t: 'sel', op: ['Anual', 'Semestral', 'Trimestral', 'Bimestral', 'Mensal', 'Quinzenal', 'Semanal'], g: 'Gestão' },
  { k: 'statusCliente', r: 'Status do cliente', t: 'sel', op: ['Cliente satisfeito', 'Cliente insatisfeito'], g: 'Gestão' },
  { k: 'site', r: 'Site', t: 'url', g: 'Contato' },
  { k: 'email', r: 'E-mail', t: 'email', g: 'Contato' },
  { k: 'telefone', r: 'Telefone', t: 'tel', g: 'Contato' },
  { k: 'instagram', r: 'Instagram', t: 'url', g: 'Contato' },
  { k: 'linkedin', r: 'LinkedIn', t: 'url', g: 'Contato' },
  { k: 'endereco', r: 'Endereço', t: 'txt', g: 'Endereço' },
  { k: 'cidade', r: 'Cidade', t: 'txt', g: 'Endereço' },
  { k: 'uf', r: 'UF', t: 'sel', op: UF, g: 'Endereço' },
  { k: 'tempo', r: 'Tempo de mercado', t: 'txt', g: 'Do diagnóstico' },
  { k: 'faturamento', r: 'Faturamento', t: 'txt', g: 'Do diagnóstico' },
  { k: 'colaboradores', r: 'Colaboradores', t: 'txt', g: 'Do diagnóstico' },
  { k: 'obs', r: 'Observações', t: 'longo', g: 'Do diagnóstico' }
];

const pessoa = [
  { k: 'responsavel', r: 'Responsável', t: 'txt' },
  { k: 'tipoContato', r: 'Tipo de contato', t: 'sel', op: ['Lead', 'Lead qualificado', 'Cliente', 'Fornecedor', 'Colaborador', 'Transportadora', 'Motorista', 'Candidatos emprego', 'Prestadores de serviço', 'Representantes', 'Terceirizados', 'Indicadores', 'SPAM', 'Outros'] },
  { k: 'cargo', r: 'Cargo', t: 'sel', op: ['Dono / Proprietário', 'Sócio', 'CEO / Diretor', 'Gerente', 'Coordenador', 'Supervisor', 'Comprador', 'Analista', 'Assistente', 'Financeiro', 'Contador', 'Administrativo', 'Vendedor', 'Representante Comercial', 'Consultor', 'Técnico', 'Engenheiro', 'Operacional', 'Recepcionista', 'Secretária'], livre: true },
  { k: 'influencia', r: 'Grau de influência', t: 'sel', op: ['Decisor', 'Influenciador', 'Operacional', 'Bloqueador'] },
  { k: 'instagram', r: 'Instagram', t: 'url' },
  { k: 'cpf', r: 'CPF', t: 'txt', mask: 'cpf' },
  { k: 'nascimento', r: 'Data de nascimento', t: 'data' },
  { k: 'sexo', r: 'Sexo', t: 'sel', op: ['Masculino', 'Feminino'] },
  { k: 'endereco', r: 'Endereço', t: 'txt' },
  { k: 'cidade', r: 'Cidade', t: 'txt' },
  { k: 'uf', r: 'UF', t: 'sel', op: UF },
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

// valida e limpa um objeto conforme a lista de campos
function limpa(defs, entrada) {
  const d = {}, o = entrada || {};
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
    v = String(v).replace(/\s+$/, '').trim().slice(0, c.t === 'longo' ? 2000 : 200);
    if (!v) return;
    if (c.t === 'data' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
    if (c.t === 'sel' && c.op.indexOf(v) < 0 && !c.livre) return;
    d[c.k] = v;
  });
  return d;
}

module.exports = { empresa, pessoa, negocio, ETAPAS_NEG, limpa, defs: { empresa, pessoa, negocio } };
