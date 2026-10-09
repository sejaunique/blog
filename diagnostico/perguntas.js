/* Perguntas do Diagnóstico de Maturidade Comercial (Unique).
   Fonte única para o formulário, o painel (editar e importar) e o relatório.
   tipos: texto, email, tel, longo, unica, multipla, escala, snp (Sim / Em parte / Não)
   se: a pergunta (ou etapa) só aparece quando outra resposta bate. opc: opcional. */
(function(){
  'use strict';
  var ETAPAS = [
    { id:'identificacao', junto:1, titulo:'Identificação',
      desc:'Vamos começar com algumas informações básicas para identificar sua empresa e personalizar a análise.',
      q:[
        {id:'email', t:'email', p:'Seu melhor e-mail', ph:'nome@empresa.com.br'},
        {id:'nome', t:'texto', p:'Nome completo', a:'Nome do principal responsável pelo preenchimento.', ph:'Seu nome', auto:'name'},
        {id:'whatsapp', t:'tel', p:'WhatsApp', a:'Número usado para falar com você sobre o resultado.', ph:'(62) 99999-9999'},
        {id:'empresa', t:'texto', p:'Nome da empresa', a:'Razão social ou nome fantasia.', ph:'Nome da empresa', auto:'organization'},
        {id:'cnpj', t:'texto', p:'CNPJ', a:'Usamos apenas para identificação e análise do porte da empresa.', ph:'00.000.000/0000-00', mask:'cnpj'},
        {id:'instagram', t:'texto', p:'Instagram ou site', a:'Ajuda a entender seu posicionamento no mercado.', ph:'@suaempresa ou site.com.br'}
      ]},
    { id:'empresa', titulo:'Sobre a empresa',
      desc:'Queremos entender o contexto e o porte do seu negócio para comparar sua operação com empresas de perfil parecido.',
      q:[
        {id:'segmento', t:'unica', p:'Qual o segmento da empresa?', duas:1, outro:1,
          o:['Indústria','Distribuidora / Atacado','Varejo / Loja física','E-commerce','Prestação de serviços','Saúde e estética','Construção e engenharia','Alimentação','Educação','Tecnologia']},
        {id:'tempo', t:'unica', p:'Há quanto tempo a empresa atua?', duas:1,
          o:['Menos de 1 ano','De 1 a 3 anos','De 3 a 5 anos','De 5 a 10 anos','Mais de 10 anos']},
        {id:'faturamento', t:'unica', p:'Faturamento médio mensal', a:'Escolha a faixa mais próxima da realidade atual.', duas:1,
          o:['Até R$ 50 mil','R$ 50 mil a R$ 100 mil','R$ 100 mil a R$ 300 mil','R$ 300 mil a R$ 1 milhão','R$ 1 milhão a R$ 5 milhões','Acima de R$ 5 milhões','Prefiro não informar']},
        {id:'colaboradores', t:'unica', p:'Número de colaboradores', a:'Considere todos que participam da operação.', duas:1,
          o:['1 a 5','6 a 15','16 a 50','51 a 100','Mais de 100']}
      ]},
    { id:'momento', titulo:'Momento atual',
      desc:'Toda empresa enfrenta desafios diferentes. Aqui queremos entender o que você está vivendo hoje.',
      q:[
        {id:'frase', t:'unica', p:'Qual frase melhor representa sua empresa hoje?',
          o:['Vendemos bem, mas sem controle nem previsibilidade','Temos procura, mas convertemos pouco','Chegam poucos clientes novos','Vendemos, mas a margem está apertada','Crescemos rápido e a operação não está acompanhando','As vendas caíram e não sabemos bem o porquê']},
        {id:'dor', t:'unica', p:'Qual é a sua maior dor no comercial hoje?', outro:1,
          o:['Falta de clientes novos','Vendedores que não fecham','Tudo depende de mim para vender','Não sei o que está acontecendo nas vendas','Clientes que compram uma vez e somem','Muita negociação por preço']},
        {id:'prioridade', t:'multipla', p:'Qual sua maior prioridade hoje?', a:'Pode marcar mais de uma.', duas:1,
          o:['Vender mais','Organizar o comercial','Ter previsibilidade de faturamento','Montar ou treinar a equipe','Diminuir minha dependência nas vendas','Fidelizar clientes']}
      ]},
    { id:'estrutura', titulo:'Estrutura comercial',
      desc:'Agora vamos conhecer quem participa das vendas e como a equipe está organizada.',
      q:[
        {id:'pessoas', t:'unica', p:'Quantas pessoas atuam no departamento comercial?', duas:1,
          o:['Só o dono','1 pessoa','2 a 3','4 a 6','7 a 10','Mais de 10']},
        {id:'quem', t:'multipla', p:'Quem faz parte do comercial?', a:'Marque todos os envolvidos.', duas:1, outro:1,
          o:['Dono','Gerente comercial','Vendedor interno','Vendedor externo','Pré-vendas / SDR','Atendente / recepção','Representante']},
        {id:'aprovacao', t:'unica', p:'Para fechar uma venda, o vendedor precisa consultar você ou o gerente?',
          o:['Nunca, o time tem autonomia','Só em vendas grandes ou pedidos de desconto','Na maioria das vezes','Sempre, nada fecha sem aprovação']}
      ]},
    { id:'processo', titulo:'Processo de vendas',
      desc:'Empresas que crescem de forma previsível têm processos claros e que se repetem. Queremos entender como funciona hoje.',
      q:[
        {id:'canais', t:'multipla', p:'Por quais canais vocês vendem?', a:'Marque todos que usam.', duas:1, outro:1,
          o:['WhatsApp','Instagram','Telefone','Loja física','Visita ao cliente','Site','Marketplace','E-mail']},
        {id:'modelo', t:'multipla', p:'Que tipo de venda a empresa faz?', a:'Pode marcar mais de uma.',
          o:['Atacado','Varejo','E-commerce']},
        {id:'passo', t:'unica', p:'Existe um passo a passo de vendas que todo vendedor segue?',
          o:['Sim, está escrito e todos seguem','Existe, mas cada um faz do seu jeito','Não existe']},
        {id:'diferenciais', t:'unica', p:'Seus vendedores sabem explicar os diferenciais da empresa do mesmo jeito?',
          o:['Sim, foi passado para todos','Alguns sabem, outros não','Não, cada um fala o que acha']},
        {id:'proposta', t:'unica', p:'Existe uma proposta comercial em PDF padronizada?',
          o:['Sim, todos usam o mesmo modelo','Existe, mas nem todos usam','Não, cada orçamento sai de um jeito']},
        {id:'politica', t:'unica', p:'Existe uma política comercial escrita e clara para os vendedores?', a:'Regras de desconto, prazos e condições de pagamento.',
          o:['Sim, documentada e todos conhecem','Existe, mas só na cabeça do dono ou gerente','Não existe']}
      ]},
    { id:'tecnologia', titulo:'Tecnologia',
      desc:'A tecnologia pode acelerar resultados ou esconder gargalos. Vamos ver o que apoia o seu comercial.',
      q:[
        {id:'ferramentas', t:'multipla', p:'Quais ferramentas a empresa usa hoje?', a:'Marque todas que fazem parte do dia a dia.', duas:1, outro:1,
          o:['CRM','ERP / sistema de gestão','WhatsApp comum','WhatsApp Business','WhatsApp API / multiatendimento','Planilhas','Caderno / anotações']},
        {id:'usa_crm', t:'unica', p:'Vocês usam CRM?',
          o:['Sim','Não','Já usamos, mas paramos']}
      ]},
    { id:'crm', titulo:'Sobre o seu CRM', se:{id:'usa_crm', v:'Sim'},
      desc:'Muitas empresas têm CRM, mas usam só uma pequena parte do potencial. Queremos entender como ele funciona no dia a dia.',
      q:[
        {id:'qual_crm', t:'texto', p:'Qual CRM vocês usam?', ph:'Ex.: RD Station, Kommo, Pipedrive, HubSpot…'},
        {id:'nota_crm', t:'escala', p:'De 0 a 10, quanto o CRM traz de benefício real para a empresa hoje?', min:0, max:10, l:['Não ajuda em nada','Indispensável']}
      ]},
    { id:'contatos', titulo:'Contatos e vendas',
      desc:'Vamos olhar o volume de oportunidades que chega e como elas viram venda.',
      q:[
        {id:'contatos_semana', t:'unica', p:'Quantos contatos novos chegam por semana?', duas:1,
          o:['Até 10','11 a 30','31 a 50','51 a 100','Mais de 100','Não sei']},
        {id:'nunca_compraram', t:'unica', p:'Desses, quantos são de pessoas que nunca compraram com vocês?', duas:1,
          o:['Quase todos','Mais da metade','Metade','Menos da metade','Não sei']},
        {id:'conhece_taxa', t:'unica', p:'Você sabe, de cada 10 pessoas que chegam, quantas compram?',
          o:['Sim, acompanho esse número','Tenho uma ideia, mas não acompanho','Não sei']},
        {id:'taxa', t:'texto', p:'Qual é essa taxa aproximada?', ph:'Ex.: 3 de cada 10, ou 30%', se:{id:'conhece_taxa', v:'Sim, acompanho esse número'}},
        {id:'motivo_perda', t:'unica', p:'Quando vocês perdem uma venda, sabem o porquê?',
          o:['Sim, sempre registramos o motivo','Às vezes sabemos','Não, o cliente simplesmente some']},
        {id:'tentativas', t:'unica', p:'Quantas tentativas vocês fazem antes de considerar um cliente perdido?', a:'Contatos, mensagens, ligações e retornos.', duas:1,
          o:['1','2 a 3','4 a 5','6 ou mais','Não tem regra, depende do vendedor']}
      ]},
    { id:'p_prospeccao', pilar:'Prospecção', titulo:'Pilar 1 · Prospecção',
      desc:'Ir atrás de clientes novos, que nunca compraram de você.',
      nota:'Aqui não conta recuperar cliente antigo nem atender quem chega sozinho. Prospecção é o seu time sair para buscar quem ainda não te conhece.',
      q:[
        {id:'pr_quem', t:'unica', p:'Quem faz prospecção de clientes novos hoje?',
          o:['Um vendedor ou SDR dedicado a isso','Os vendedores, junto com o atendimento','Só o dono, quando sobra tempo','Ninguém faz prospecção ativa']},
        {id:'pr_rotina', t:'snp', p:'Alguém busca clientes novos toda semana, com ligação, visita ou mensagem?'},
        {id:'pr_lista', t:'snp', p:'Existe uma lista das empresas ou perfis que vocês querem conquistar?'},
        {id:'pr_canais', t:'snp', p:'A abordagem usa mais de um canal (ligação, WhatsApp, visita, LinkedIn)?'},
        {id:'pr_meta', t:'snp', p:'Existe meta de novas abordagens por vendedor?'},
        {id:'pr_roteiro', t:'snp', p:'Os vendedores usam um roteiro padrão na primeira abordagem?'}
      ]},
    { id:'p_recuperacao', pilar:'Recuperação', titulo:'Pilar 2 · Recuperação',
      desc:'Trazer de volta quem já comprou de você e parou de comprar.',
      nota:'Pense nos clientes inativos e nos orçamentos que ficaram parados. Eles já te conhecem, o trabalho é reativar.',
      q:[
        {id:'re_sabe', t:'snp', p:'Vocês sabem quais clientes pararam de comprar?'},
        {id:'re_contato', t:'snp', p:'Existe um contato programado com os clientes inativos?'},
        {id:'re_oferta', t:'snp', p:'Existe uma oferta ou condição específica para quem volta a comprar?'},
        {id:'re_motivo', t:'snp', p:'Vocês procuram entender por que o cliente parou?'},
        {id:'re_orcamentos', t:'snp', p:'Os orçamentos que não fecharam são retomados depois?'}
      ]},
    { id:'p_fidelizacao', pilar:'Fidelização', titulo:'Pilar 3 · Fidelização',
      desc:'Fazer quem já compra de você comprar mais vezes, mais itens e com mais valor.',
      nota:'É o cliente ativo. O que a empresa faz para ele não ir para o concorrente e aumentar o que compra?',
      q:[
        {id:'fi_posvenda', t:'snp', p:'Existe contato com o cliente depois da venda (pós-venda)?'},
        {id:'fi_satisfacao', t:'snp', p:'Vocês medem a satisfação dos clientes?'},
        {id:'fi_mix', t:'snp', p:'Oferecem outros produtos ou serviços para quem já compra?'},
        {id:'fi_beneficio', t:'snp', p:'Existe algum benefício ou programa para quem compra sempre?'},
        {id:'fi_recompra', t:'snp', p:'Vocês acompanham de quanto em quanto tempo o cliente volta a comprar?'}
      ]},
    { id:'p_nutricao', pilar:'Nutrição', titulo:'Pilar 4 · Nutrição',
      desc:'Cuidar de todo mundo que chega sem esforço do time: indicação, Instagram, Google, anúncios.',
      nota:'Tráfego pago entra aqui. É quem levantou a mão sozinho e precisa ser bem atendido e acompanhado até comprar.',
      q:[
        {id:'nu_origem', t:'snp', p:'Vocês sabem de onde veio cada contato que chega?'},
        {id:'nu_atracao', t:'snp', p:'Investem de forma constante em conteúdo ou anúncios para atrair contatos?'},
        {id:'nu_indicacao', t:'snp', p:'Existe uma forma organizada de pedir indicações aos clientes?'},
        {id:'nu_conteudo', t:'snp', p:'Têm material ou conteúdo para quem ainda não está pronto para comprar?'},
        {id:'nu_acompanha', t:'snp', p:'Mantêm contato com quem chegou e ainda não comprou?'}
      ]},
    { id:'gestao', titulo:'Gestão comercial',
      desc:'Gestão é o que transforma esforço em resultado. Aqui avaliamos controle, acompanhamento e previsibilidade.',
      q:[
        {id:'rotina', t:'unica', p:'O time tem uma rotina diária de vendas?', a:'Prospecção, retorno a clientes, metas do dia.',
          o:['Sim, todos os dias','Às vezes','Não, vendemos conforme o cliente chega']},
        {id:'prever', t:'unica', p:'Você consegue prever quanto vai faturar, no mínimo, no próximo mês?',
          o:['Sim, com boa precisão','Mais ou menos','Não faço ideia']},
        {id:'capacidade', t:'unica', p:'Seu time conseguiria atender mais clientes hoje sem contratar ninguém?',
          o:['Sim, com folga','Um pouco mais','Não, já estamos no limite']},
        {id:'base', t:'unica', p:'Você sabe quantos clientes tem na sua base hoje?',
          o:['Sim, sei o número exato','Tenho uma ideia aproximada','Não sei']}
      ]},
    { id:'maturidade', titulo:'Maturidade comercial',
      desc:'Nesta etapa identificamos o nível de maturidade da sua estrutura e o que pode estar limitando o crescimento.',
      q:[
        {id:'melhores_clientes', t:'multipla', p:'Por onde chegam seus melhores clientes?', a:'Os que compram mais e dão menos trabalho.', duas:1, outro:1,
          o:['Indicação','Instagram','Google','Anúncios pagos','Prospecção ativa','Loja física','Clientes antigos que voltam']},
        {id:'depende', t:'unica', p:'Hoje, suas vendas dependem principalmente de quê?',
          o:['De indicações','De uma pessoa específica (dono ou um vendedor)','De anúncios','De clientes antigos','De várias fontes equilibradas']},
        {id:'dificuldade', t:'unica', p:'Em qual momento você tem mais dificuldade para vender?', outro:1,
          o:['Atrair novos contatos','Responder e atender bem','Mostrar valor e gerar confiança','Negociar preço','Fechar a venda','Fazer o cliente comprar de novo']},
        {id:'disciplina', t:'escala', p:'De 1 a 10, como você avalia a disciplina da equipe comercial?', a:'Comprometimento, execução e cumprimento dos processos.', min:1, max:10, l:['Muito baixa','Excelente']},
        {id:'organizacao', t:'escala', p:'De 1 a 10, como você avalia a organização dos processos comerciais?', min:1, max:10, l:['Totalmente desorganizado','Totalmente estruturado']},
        {id:'previsibilidade', t:'escala', p:'De 1 a 10, como você avalia a previsibilidade das vendas?', min:1, max:10, l:['Não consigo prever nada','Sei exatamente quanto vou vender']}
      ]},
    { id:'crescimento', titulo:'Crescimento',
      desc:'Agora queremos entender sua visão de futuro e o que pode impedir a empresa de chegar ao próximo nível.',
      q:[
        {id:'impede_30', t:'longo', p:'O que impediria sua empresa de faturar 30% a mais nos próximos 6 meses?', a:'Pense no maior obstáculo para o crescimento comercial.', ph:'Escreva com suas palavras…'},
        {id:'objetivo', t:'unica', p:'Qual destes objetivos é prioridade para os próximos 12 meses?',
          o:['Aumentar o faturamento','Ter previsibilidade','Estruturar a equipe','Sair da operação de vendas','Abrir novos canais','Fidelizar clientes']},
        {id:'investir', t:'unica', p:'Você pretende investir em melhorias comerciais nos próximos 12 meses?', a:'Processos, tecnologia, treinamento ou gestão.',
          o:['Sim, já tenho verba separada','Sim, se fizer sentido','Talvez','Não no momento']},
        {id:'urgencia', t:'escala', p:'De 1 a 10, qual sua urgência para resolver os problemas comerciais?', min:1, max:10, l:['Sem pressa','Preciso resolver agora']}
      ]},
    { id:'final', titulo:'Para fechar',
      desc:'Imagine sua empresa operando exatamente como você gostaria.',
      q:[
        {id:'pergunta_ouro', t:'longo', p:'Imagine que estamos conversando daqui a 12 meses. O que precisaria ter acontecido para você dizer que o comercial da sua empresa foi transformado?', a:'Descreva os resultados que fariam do próximo ano uma grande conquista.', ph:'Daqui a 12 meses, eu quero…'},
        {id:'adicional', t:'longo', opc:1, p:'Tem algo importante sobre sua empresa que não perguntamos e você gostaria de contar?', ph:'Espaço livre'}
      ]}
  ];

  /* atalhos: lista plana de perguntas e busca por id */
  var TODAS = [];
  ETAPAS.forEach(function(e){ e.q.forEach(function(q){ TODAS.push(Object.assign({ etapa:e.id, secao:e.titulo, seEtapa:e.se||null }, q)); }); });
  var POR_ID = {}; TODAS.forEach(function(q){ POR_ID[q.id]=q; });
  /* identificação não entra no "completar" do cliente */
  var IDENT = ['email','nome','whatsapp','empresa','cnpj','instagram'];

  function bate(c,R){ if(!c) return true; var v=R[c.id]; return Array.isArray(v)? v.indexOf(c.v)>-1 : (v===c.v || (typeof v==='string' && v.split(', ').indexOf(c.v)>-1)); }
  /* perguntas que faltam responder (ou que vieram estimadas) para um conjunto de respostas */
  function pendentes(lista){
    var R={}, est={};
    (lista||[]).forEach(function(x){ if(x && x.id){ R[x.id]=x.resposta; if(x.obs==='estimado') est[x.id]=1; } });
    var out=[];
    TODAS.forEach(function(q){
      if(q.opc || IDENT.indexOf(q.id)>-1) return;
      if(!bate(q.seEtapa,R) || !bate(q.se,R)) return;
      var v=R[q.id], vazio=(v==null || String(v).trim()==='');
      if(vazio) out.push({ id:q.id, motivo:'falta' });
      else if(est[q.id]) out.push({ id:q.id, motivo:'estimado' });
    });
    return out;
  }

  var API = { ETAPAS:ETAPAS, TODAS:TODAS, POR_ID:POR_ID, IDENT:IDENT, pendentes:pendentes, bate:bate };
  if(typeof window!=='undefined') window.DIAG = API;
  if(typeof module!=='undefined') module.exports = API;
})();
