// Contratos: modelo editável com variáveis {{...}}, preenchido com os dados da proposta, da empresa e do contato.
// A assinatura é pelo Gov.br (assinador.iti.br), feita por cada parte no PDF; o painel só guarda o PDF assinado.
const RICO = require('./rico.js');

const UNIQUE_PADRAO = { razao: 'Unique Consultoria Comercial', cnpj: '', endereco: '', cidade: 'Goiânia', uf: 'GO', representante: 'Carlos Ribeiro', cpf: '', email: 'contato@sejaunique.com', foro: 'Goiânia/GO' };

const VARIAVEIS = [
  ['empresa', 'Nome da empresa cliente'], ['razao_social', 'Razão social do cliente'], ['cnpj', 'CNPJ do cliente'], ['endereco', 'Endereço completo do cliente'],
  ['contato', 'Nome de quem assina pelo cliente'], ['contato_cpf', 'CPF de quem assina'], ['contato_email', 'E-mail de quem assina'],
  ['servico', 'Serviço da proposta'], ['titulo', 'Título da proposta'], ['objetivos', 'Objetivos (lista)'], ['escopo', 'O que está incluso (lista)'], ['etapas', 'Etapas e prazos (lista)'],
  ['investimento', 'Itens do investimento (lista com valores)'], ['total', 'Valor total (R$)'], ['total_extenso', 'Valor total por extenso'], ['pagamento', 'Forma de pagamento'],
  ['data', 'Data de hoje por extenso'], ['unique_razao', 'Razão social da Unique'], ['unique_cnpj', 'CNPJ da Unique'], ['unique_endereco', 'Endereço da Unique'],
  ['unique_representante', 'Quem assina pela Unique'], ['unique_cpf', 'CPF de quem assina pela Unique'], ['foro', 'Foro (cidade/UF)']
];

const MODELO_PADRAO = [
  '<h3>Contrato de prestação de serviços de consultoria comercial</h3>',
  '<p><b>CONTRATADA:</b> {{unique_razao}}, inscrita no CNPJ sob o nº {{unique_cnpj}}, com sede em {{unique_endereco}}, neste ato representada por {{unique_representante}}, CPF {{unique_cpf}}.</p>',
  '<p><b>CONTRATANTE:</b> {{razao_social}}, inscrita no CNPJ sob o nº {{cnpj}}, com sede em {{endereco}}, neste ato representada por {{contato}}, CPF {{contato_cpf}}.</p>',
  '<p>As partes acima identificadas têm entre si justo e acertado o presente contrato, que se regerá pelas cláusulas seguintes.</p>',
  '<h4>Cláusula 1ª · Do objeto</h4>',
  '<p>O objeto deste contrato é a prestação, pela CONTRATADA, de serviços de {{servico}} para a CONTRATANTE, conforme a proposta “{{titulo}}”, com os seguintes objetivos:</p>{{objetivos}}',
  '<h4>Cláusula 2ª · Do escopo</h4>',
  '<p>Estão incluídos nos serviços:</p>{{escopo}}<p>Qualquer atividade fora deste escopo será tratada em proposta à parte.</p>',
  '<h4>Cláusula 3ª · Das etapas e prazos</h4>',
  '{{etapas}}',
  '<h4>Cláusula 4ª · Do investimento e da forma de pagamento</h4>',
  '<p>Pelos serviços, a CONTRATANTE pagará à CONTRATADA o valor total de <b>{{total}}</b> ({{total_extenso}}), composto por:</p>{{investimento}}',
  '<p>Forma de pagamento: {{pagamento}}</p>',
  '<p>O atraso no pagamento sujeita a CONTRATANTE a multa de 2% e juros de 1% ao mês sobre o valor em aberto, além de permitir à CONTRATADA suspender os serviços até a regularização.</p>',
  '<h4>Cláusula 5ª · Das obrigações da CONTRATADA</h4>',
  '<ul><li>Executar os serviços com zelo, técnica e dentro dos prazos combinados.</li><li>Manter a CONTRATANTE informada do andamento, pelo painel da Unique e nas reuniões combinadas.</li><li>Guardar sigilo sobre as informações da CONTRATANTE.</li></ul>',
  '<h4>Cláusula 6ª · Das obrigações da CONTRATANTE</h4>',
  '<ul><li>Fornecer as informações, os acessos e as pessoas necessárias para a execução dos serviços.</li><li>Participar das reuniões e executar as ações que forem de sua responsabilidade.</li><li>Efetuar os pagamentos nas datas combinadas.</li></ul>',
  '<p>Os resultados dependem também da execução das ações pela equipe da CONTRATANTE. A CONTRATADA se obriga pelos meios, não por um resultado específico de vendas.</p>',
  '<h4>Cláusula 7ª · Da confidencialidade e dos dados pessoais</h4>',
  '<p>As partes manterão sigilo sobre as informações a que tiverem acesso em razão deste contrato, durante a sua vigência e por 2 (dois) anos após o seu término, e tratarão os dados pessoais envolvidos conforme a Lei nº 13.709/2018 (LGPD), apenas para a execução deste contrato.</p>',
  '<h4>Cláusula 8ª · Da propriedade intelectual</h4>',
  '<p>Os métodos, materiais, modelos e ferramentas da CONTRATADA continuam de sua propriedade. A CONTRATANTE recebe o direito de usá-los internamente, sem repassar a terceiros.</p>',
  '<h4>Cláusula 9ª · Da rescisão</h4>',
  '<p>Qualquer das partes pode rescindir este contrato mediante aviso por escrito com 30 (trinta) dias de antecedência. Os valores dos serviços já prestados continuam devidos.</p>',
  '<h4>Cláusula 10ª · Da assinatura eletrônica</h4>',
  '<p>As partes reconhecem como válida a assinatura deste contrato por meio eletrônico, com assinatura avançada do Gov.br, nos termos da Lei nº 14.063/2020 e da MP nº 2.200-2/2001.</p>',
  '<h4>Cláusula 11ª · Do foro</h4>',
  '<p>Fica eleito o foro da comarca de {{foro}} para dirimir quaisquer dúvidas oriundas deste contrato.</p>',
  '<p>{{foro}}, {{data}}.</p>'
].join('');

const brl = v => (+v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
function dataExtenso(d) { d = d || new Date(); const b = new Date(d.getTime() - 3 * 3600e3); return b.getUTCDate() + ' de ' + MESES[b.getUTCMonth()] + ' de ' + b.getUTCFullYear(); }

// número por extenso (reais e centavos)
const U = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const D = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const C = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
function ate999(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const c = Math.floor(n / 100), r = n % 100, p = [];
  if (c) p.push(C[c]);
  if (r) p.push(r < 20 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? ' e ' + U[r % 10] : ''));
  return p.join(' e ');
}
function inteiro(n) {
  if (n === 0) return 'zero';
  const grupos = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
  const partes = []; let i = 0;
  while (n > 0 && i < grupos.length) {
    const g = n % 1000;
    if (g) { const nome = i === 0 ? '' : (g === 1 ? grupos[i][0] : grupos[i][1]); partes.unshift({ g, t: (i === 1 && g === 1 ? '' : ate999(g)) + (nome ? (i === 1 && g === 1 ? '' : ' ') + nome : '') }); }
    n = Math.floor(n / 1000); i++;
  }
  return partes.map((p, k) => (k > 0 && k === partes.length - 1 && (p.g < 100 || p.g % 100 === 0) ? 'e ' : '') + p.t).join(' ').replace(/\s+/g, ' ').trim();
}
function extenso(v) {
  v = Math.round((+v || 0) * 100);
  const r = Math.floor(v / 100), c = v % 100, p = [];
  if (r) { const t = inteiro(r); p.push(t + (/(lhão|lhões)$/.test(t) ? ' de' : '') + (r === 1 ? ' real' : ' reais')); }
  if (c) p.push(inteiro(c) + (c === 1 ? ' centavo' : ' centavos'));
  return p.join(' e ') || 'zero reais';
}

function lista(a) { return (a || []).length ? '<ul>' + a.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '<p>–</p>'; }

function variaveis(prop, emp, pessoa, uni) {
  const d = (emp && emp.dados) || {}, pd = (pessoa && pessoa.dados) || {};
  uni = Object.assign({}, UNIQUE_PADRAO, uni || {});
  const end = [[d.endereco, d.numero].filter(Boolean).join(', '), d.complemento, d.bairro, [d.cidade, d.uf].filter(Boolean).join('/'), d.cep ? 'CEP ' + d.cep : ''].filter(Boolean).join(' · ');
  const vazio = '<mark class="m-magenta">________</mark>';
  const v = {
    empresa: esc((emp && emp.nome) || prop.empresa), razao_social: esc(d.razao || (emp && emp.nome) || prop.empresa), cnpj: esc(d.cnpj) || vazio, endereco: esc(end) || vazio,
    contato: esc(prop.contato || (pessoa && pessoa.nome)) || vazio, contato_cpf: esc(pd.cpf) || vazio, contato_email: esc(pessoa && pessoa.email) || vazio,
    servico: esc(prop.servico || 'consultoria comercial'), titulo: esc(prop.titulo), objetivos: lista(prop.objetivos), escopo: lista(prop.escopo), etapas: lista(prop.etapas),
    investimento: (prop.itens || []).length ? '<ul>' + prop.itens.map(i => '<li>' + esc(i.descricao) + ': <b>' + (i.valor ? brl(i.valor) : 'incluso') + '</b></li>').join('') + '</ul>' : '<p>–</p>',
    total: brl(prop.total), total_extenso: extenso(prop.total), pagamento: esc(prop.pagamento) || vazio, data: dataExtenso(),
    unique_razao: esc(uni.razao) || vazio, unique_cnpj: esc(uni.cnpj) || vazio, unique_endereco: esc([uni.endereco, [uni.cidade, uni.uf].filter(Boolean).join('/')].filter(Boolean).join(' · ')) || vazio,
    unique_representante: esc(uni.representante) || vazio, unique_cpf: esc(uni.cpf) || vazio, foro: esc(uni.foro) || vazio
  };
  return v;
}

function preenche(modelo, vars) {
  // listas soltas dentro de <p> viram blocos
  const html = String(modelo || MODELO_PADRAO).replace(/<p>\s*\{\{\s*(\w+)\s*\}\}\s*<\/p>/g, (m, k) => /^(objetivos|escopo|etapas|investimento)$/.test(k) && vars[k] != null ? vars[k] : m)
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => vars[k] != null ? vars[k] : m);
  return RICO.limpa(html);
}

module.exports = { MODELO_PADRAO, UNIQUE_PADRAO, VARIAVEIS, variaveis, preenche, extenso, dataExtenso };
