/* Motor do Diagnóstico de Maturidade Comercial (Unique).
   Recebe as respostas do formulário e devolve notas, retrato, gargalos e plano de ação.
   Usado pelo relatório (/diagnostico/relatorio/) e pelo painel (e-mail).
   Regras: Sim = 20, Em parte = 10, Não = 0 (até 100 por pilar). */
(function(){
  'use strict';

  var PILARES = [
    { id:'prospeccao', nome:'Prospecção', curto:'Buscar clientes novos',
      def:'Ir atrás de quem nunca comprou de você, de forma ativa.',
      itens:['pr_rotina','pr_lista','pr_canais','pr_meta','pr_roteiro'] },
    { id:'recuperacao', nome:'Recuperação', curto:'Reativar quem parou',
      def:'Trazer de volta clientes inativos e orçamentos que ficaram parados.',
      itens:['re_sabe','re_contato','re_oferta','re_motivo','re_orcamentos'] },
    { id:'fidelizacao', nome:'Fidelização', curto:'Fazer o cliente comprar mais',
      def:'Fazer quem já compra comprar mais vezes, mais itens e com mais valor.',
      itens:['fi_posvenda','fi_satisfacao','fi_mix','fi_beneficio','fi_recompra'] },
    { id:'nutricao', nome:'Nutrição', curto:'Converter quem chega',
      def:'Cuidar de quem chega sozinho (indicação, Instagram, Google, anúncios) até virar cliente.',
      itens:['nu_origem','nu_atracao','nu_indicacao','nu_conteudo','nu_acompanha'] }
  ];

  /* Texto curto de cada item e o que acontece quando ele falta (retrato do problema). */
  var ITENS = {
    pr_rotina:{ t:'Busca ativa de clientes toda semana', c:'Sem busca ativa, o faturamento depende de quem aparece. Mês fraco de procura vira mês fraco de vendas.' },
    pr_lista:{ t:'Lista de clientes que querem conquistar', c:'Sem uma lista de alvos, o time aborda quem lembra, e não quem tem mais potencial.' },
    pr_canais:{ t:'Abordagem em mais de um canal', c:'Um canal só esgota rápido. Quem não atende o telefone muitas vezes responde no WhatsApp ou numa visita.' },
    pr_meta:{ t:'Meta de abordagens por vendedor', c:'Sem meta de abordagens, a prospecção é a primeira tarefa a sair da agenda quando aperta o dia.' },
    pr_roteiro:{ t:'Roteiro padrão de primeira abordagem', c:'Cada vendedor se apresenta de um jeito, e fica impossível saber o que funciona e repetir.' },
    re_sabe:{ t:'Saber quais clientes pararam de comprar', c:'Cliente que some sem ninguém perceber é receita que vai para o concorrente em silêncio.' },
    re_contato:{ t:'Contato programado com inativos', c:'Sem um contato programado, o cliente inativo só volta se ele mesmo lembrar de você.' },
    re_oferta:{ t:'Oferta específica para quem volta', c:'Sem um motivo concreto para voltar, o convite vira só "estamos à disposição".' },
    re_motivo:{ t:'Entender por que o cliente parou', c:'Sem saber o motivo da saída, o mesmo problema continua expulsando outros clientes.' },
    re_orcamentos:{ t:'Retomar orçamentos não fechados', c:'Orçamento parado é a venda mais barata que existe, e está sendo deixada na mesa.' },
    fi_posvenda:{ t:'Contato depois da venda', c:'Sem pós-venda, o próximo contato é do concorrente. O cliente esquece quem atendeu bem.' },
    fi_satisfacao:{ t:'Medir a satisfação dos clientes', c:'Sem medir satisfação, você descobre o problema quando o cliente já foi embora.' },
    fi_mix:{ t:'Oferecer outros produtos a quem já compra', c:'O cliente compra de você uma parte do que precisa e o resto em outro lugar.' },
    fi_beneficio:{ t:'Benefício para quem compra sempre', c:'Quem compra sempre é tratado igual a quem comprou uma vez, e não tem motivo para ficar.' },
    fi_recompra:{ t:'Acompanhar o tempo de recompra', c:'Sem saber o ciclo de recompra, a empresa não percebe quando o cliente está atrasado ou indo embora.' },
    nu_origem:{ t:'Saber de onde vem cada contato', c:'Sem saber a origem, não dá para saber onde investir mais nem o que cortar.' },
    nu_atracao:{ t:'Investimento constante para atrair contatos', c:'Sem atração constante, a procura sobe e desce e o caixa acompanha.' },
    nu_indicacao:{ t:'Pedido organizado de indicações', c:'Indicação acontece por sorte, quando poderia ser a fonte mais barata e confiável de clientes.' },
    nu_conteudo:{ t:'Material para quem ainda não vai comprar', c:'Quem não está pronto para comprar hoje não tem o que receber, e esfria.' },
    nu_acompanha:{ t:'Contato com quem chegou e não comprou', c:'Contato que não comprou na hora é descartado, e o esforço para atraí-lo vai embora junto.' }
  };

  /* Estrutura comercial: cada item vale 0, 1 ou 2. */
  var ESTRUTURA = [
    { id:'aprovacao', t:'Autonomia do time para fechar', nota:function(v){ return /^Nunca|^Só em vendas grandes/.test(v)?2:/maioria/.test(v)?1:0; },
      c:'Vendas que esperam o dono travam o fechamento e prendem o dono na operação.' },
    { id:'passo', t:'Passo a passo de vendas', nota:function(v){ return /^Sim/.test(v)?2:/^Existe/.test(v)?1:0; },
      c:'Sem um processo definido, cada vendedor vende do seu jeito e o resultado depende de quem atende.' },
    { id:'crm', t:'CRM em uso e trazendo resultado', nota:function(v,R){ if(R.usa_crm!=='Sim') return 0; var n=+R.nota_crm; return n>=7?2:1; },
      c:'Sem CRM bem usado, o histórico do cliente mora na cabeça (ou no celular) do vendedor.' },
    { id:'tentativas', t:'Insistência antes de desistir', nota:function(v){ return /4 a 5|6 ou mais/.test(v)?2:/2 a 3/.test(v)?1:0; },
      c:'A maioria das vendas fecha depois da 4ª tentativa. Desistir antes disso é entregar o cliente ao concorrente.' },
    { id:'rotina', t:'Rotina diária de vendas', nota:function(v){ return /^Sim/.test(v)?2:/^Às vezes/.test(v)?1:0; },
      c:'Sem rotina diária, o time só reage ao que chega e o dia acaba sem prospecção nem retorno.' },
    { id:'prever', t:'Previsão do faturamento', nota:function(v){ return /^Sim/.test(v)?2:/Mais ou menos/.test(v)?1:0; },
      c:'Sem previsão, as decisões de compra, contratação e investimento são tomadas no escuro.' },
    { id:'motivo_perda', t:'Registro do motivo de perda', nota:function(v){ return /^Sim/.test(v)?2:/^Às vezes/.test(v)?1:0; },
      c:'Sem saber por que perde, a empresa repete os mesmos erros de preço, prazo ou abordagem.' },
    { id:'politica', t:'Política comercial escrita', nota:function(v){ return /^Sim/.test(v)?2:/^Existe/.test(v)?1:0; },
      c:'Sem regra de desconto e prazo, cada negociação vira exceção e a margem escorre.' },
    { id:'proposta', t:'Proposta padronizada', nota:function(v){ return /^Sim/.test(v)?2:/^Existe/.test(v)?1:0; },
      c:'Proposta improvisada passa insegurança e dificulta comparar e acompanhar orçamentos.' },
    { id:'diferenciais', t:'Diferenciais explicados do mesmo jeito', nota:function(v){ return /^Sim/.test(v)?2:/^Alguns/.test(v)?1:0; },
      c:'Se o time não sabe explicar o diferencial, o cliente compara só o preço.' }
  ];

  /* Biblioteca de ações. Cada uma é prática, com passos, prazo e como medir. */
  var ACOES = {
    pr_quem:{ titulo:'Defina quem é o dono da prospecção', passos:['Escolha uma pessoa responsável por buscar clientes novos (não precisa ser exclusiva).','Reserve na agenda dela 2 blocos fixos de 1 hora por semana só para isso.','Revise o resultado toda segunda-feira com ela.'], prazo:'Esta semana', medir:'Horas de prospecção feitas por semana' },
    pr_rotina:{ titulo:'Crie um bloco fixo de prospecção', passos:['Bloqueie 2 janelas de 1 hora por semana na agenda do time, sempre no mesmo dia e horário.','Comece com uma meta mínima de 20 abordagens por semana.','Nessas janelas não entra atendimento, só abordagem de clientes novos.'], prazo:'7 dias', medir:'Abordagens feitas por semana' },
    pr_lista:{ titulo:'Monte a lista dos 50 clientes ideais', passos:['Olhe seus 10 melhores clientes e anote o que têm em comum (segmento, porte, região).','Liste 50 empresas com esse mesmo perfil que ainda não compram de você.','Trabalhe 10 dessa lista por semana.'], prazo:'15 dias', medir:'Empresas da lista abordadas' },
    pr_canais:{ titulo:'Use uma cadência em 3 canais', passos:['Para cada cliente novo, faça 5 contatos em 10 dias.','Alterne os canais: ligação, WhatsApp e LinkedIn ou visita.','Só considere sem resposta depois da sequência completa.'], prazo:'15 dias', medir:'Taxa de resposta das abordagens' },
    pr_meta:{ titulo:'Dê meta de abordagem a cada vendedor', passos:['Defina quantas abordagens e quantas reuniões novas cada vendedor faz por semana.','Mostre o placar na reunião semanal do time.','Ajuste a meta depois de 30 dias com base no que aconteceu.'], prazo:'7 dias', medir:'Abordagens e reuniões por vendedor' },
    pr_roteiro:{ titulo:'Escreva o roteiro da primeira abordagem', passos:['Escreva uma abertura de 30 segundos: quem você é, por que está ligando e um cliente parecido que você atende.','Termine com uma pergunta sobre o problema do cliente, e não com uma oferta.','Treine o time e grave as melhores versões.'], prazo:'7 dias', medir:'Abordagens que viram conversa' },
    re_sabe:{ titulo:'Faça o mapa dos clientes inativos', passos:['Tire do sistema todos os clientes que não compram há mais de 90 dias.','Separe por quanto cada um já comprou de você.','Comece pelos 20 de maior valor.'], prazo:'7 dias', medir:'Clientes inativos mapeados' },
    re_contato:{ titulo:'Implante a régua de reativação', passos:['Programe um contato quando o cliente completar 60, 90 e 120 dias sem comprar.','Deixe as mensagens prontas para cada momento.','Coloque um responsável e um dia fixo da semana para isso.'], prazo:'15 dias', medir:'Clientes reativados por mês' },
    re_oferta:{ titulo:'Crie uma oferta de retorno', passos:['Escolha uma condição para quem volta: frete, brinde, prazo ou um item com desconto.','Dê validade curta, de 15 dias.','Envie para a lista de inativos com uma mensagem pessoal.'], prazo:'15 dias', medir:'Pedidos vindos de clientes inativos' },
    re_motivo:{ titulo:'Pergunte por que o cliente parou', passos:['Ligue para 10 clientes inativos esta semana.','Pergunte de forma direta o que fez ele deixar de comprar.','Anote os motivos e trate o que mais se repete.'], prazo:'7 dias', medir:'Motivos de saída levantados' },
    re_orcamentos:{ titulo:'Resgate os orçamentos parados a cada 15 dias', passos:['Separe os orçamentos não fechados dos últimos 90 dias.','Retome cada um com uma novidade: nova condição, prazo ou produto.','Repita o ciclo a cada 15 dias.'], prazo:'Esta semana', medir:'Orçamentos recuperados' },
    fi_posvenda:{ titulo:'Faça o pós-venda em 3 toques', passos:['2 dias depois da entrega: chegou tudo certo?','15 dias depois: está usando bem? Precisa de algo?','45 dias depois: é hora de repor ou complementar?'], prazo:'15 dias', medir:'Clientes com pós-venda feito' },
    fi_satisfacao:{ titulo:'Peça uma nota de 0 a 10 após cada venda', passos:['Envie pelo WhatsApp uma pergunta só: de 0 a 10, quanto indicaria a empresa?','Ligue para quem der nota até 6 em até 48 horas.','Acompanhe a média todo mês.'], prazo:'7 dias', medir:'Nota média e número de respostas' },
    fi_mix:{ titulo:'Ofereça o segundo item em toda venda', passos:['Liste os produtos que combinam com os mais vendidos.','Treine o time para oferecer um complemento em todo pedido e no pós-venda.','Acompanhe quantos pedidos saem com mais de um item.'], prazo:'15 dias', medir:'Itens por pedido e ticket médio' },
    fi_beneficio:{ titulo:'Crie um benefício para o cliente recorrente', passos:['Defina uma vantagem a partir da 3ª compra (prioridade, condição ou brinde).','Comunique aos clientes ativos.','Avise o cliente quando ele ganhar o benefício.'], prazo:'30 dias', medir:'Clientes com 3 ou mais compras' },
    fi_recompra:{ titulo:'Monte o calendário de recompra', passos:['Calcule de quanto em quanto tempo seus clientes costumam voltar a comprar.','Programe um lembrete alguns dias antes desse prazo para cada cliente.','Entre em contato antes do cliente procurar outro fornecedor.'], prazo:'30 dias', medir:'Recompras dentro do prazo' },
    nu_origem:{ titulo:'Registre a origem de todo contato', passos:['Pergunte em todo primeiro atendimento: como você nos conheceu?','Anote no CRM ou na planilha, sempre no mesmo campo.','Veja no fim do mês quais origens mais viram venda.'], prazo:'7 dias', medir:'Contatos com origem registrada' },
    nu_atracao:{ titulo:'Mantenha a atração todas as semanas', passos:['Publique 3 conteúdos por semana sobre os problemas que você resolve.','Mantenha uma campanha de anúncio pequena e contínua.','Revise todo mês o custo por contato.'], prazo:'30 dias', medir:'Contatos novos por semana' },
    nu_indicacao:{ titulo:'Peça indicação no momento certo', passos:['Peça indicação logo depois que o cliente elogiar ou receber o pedido.','Peça 2 nomes de quem tem o mesmo tipo de necessidade.','Ofereça um agradecimento para quem indicar.'], prazo:'15 dias', medir:'Indicações recebidas por mês' },
    nu_conteudo:{ titulo:'Tenha um material para quem ainda não vai comprar', passos:['Crie um material simples: catálogo, guia de escolha ou um caso de cliente.','Envie para todo contato que disser "agora não".','Use esse material como motivo para o próximo contato.'], prazo:'30 dias', medir:'Contatos que voltam a conversar' },
    nu_acompanha:{ titulo:'Acompanhe quem chegou e não comprou', passos:['Faça 4 contatos em 30 dias com quem pediu orçamento e não fechou.','Em cada contato, leve algo útil: uma dica, um caso ou uma condição.','Feche o ciclo marcando o motivo, se não comprar.'], prazo:'15 dias', medir:'Contatos convertidos depois do primeiro "não"' },
    aprovacao:{ titulo:'Crie alçadas para o time fechar sozinho', passos:['Defina até quanto de desconto e prazo cada vendedor pode dar sem consultar ninguém.','Só leve ao dono o que passar desse limite.','Revise os limites depois de 30 dias.'], prazo:'7 dias', medir:'Vendas fechadas sem precisar do dono' },
    passo:{ titulo:'Coloque o processo comercial numa página', passos:['Escreva as etapas da venda, do primeiro contato ao pós-venda.','Para cada etapa, defina o que fazer e quando o cliente passa para a próxima.','Apresente ao time e use como base do treinamento.'], prazo:'15 dias', medir:'Vendas que seguem o processo' },
    crm:{ titulo:'Faça o CRM ser usado todos os dias', passos:['Defina os campos mínimos obrigatórios: origem, etapa, valor e próximo passo.','Nenhum orçamento sai sem estar no CRM.','Faça a reunião semanal olhando a tela do CRM.'], prazo:'30 dias', medir:'Oportunidades com próximo passo agendado' },
    tentativas:{ titulo:'Implante a régua de follow-up', passos:['Defina 5 tentativas antes de considerar uma venda perdida.','Espace os contatos: 1, 3, 7, 14 e 21 dias depois do orçamento.','Varie o canal e leve um motivo novo em cada contato.'], prazo:'7 dias', medir:'Orçamentos com follow-up completo' },
    rotina:{ titulo:'Dê ao vendedor uma rotina diária', passos:['Monte um checklist do dia: retornos, follow-ups, prospecção e atualização do CRM.','Comece o dia com 10 minutos de alinhamento com o time.','Cobre o checklist, e não só o resultado.'], prazo:'7 dias', medir:'Checklists cumpridos por semana' },
    prever:{ titulo:'Faça uma reunião semanal de previsão', passos:['Toda segunda, revise as oportunidades abertas e a chance de cada uma fechar.','Some o que deve fechar no mês e compare com a meta.','Defina a ação da semana para cada oportunidade grande.'], prazo:'7 dias', medir:'Diferença entre o previsto e o realizado' },
    motivo_perda:{ titulo:'Torne o motivo de perda obrigatório', passos:['Crie uma lista fechada de motivos: preço, prazo, concorrente, sumiu, sem verba.','Nenhuma venda é encerrada sem motivo marcado.','Analise os motivos todo mês e ataque o principal.'], prazo:'7 dias', medir:'Perdas com motivo registrado' },
    politica:{ titulo:'Escreva a política comercial', passos:['Coloque no papel as regras de desconto, prazo, frete e pagamento.','Deixe claro o que precisa de aprovação.','Entregue a todos os vendedores e revise a cada 6 meses.'], prazo:'15 dias', medir:'Negociações fora da política' },
    proposta:{ titulo:'Padronize a proposta em PDF', passos:['Crie um modelo único com a apresentação da empresa, a solução, os diferenciais e as condições.','Inclua validade e o próximo passo.','Todo orçamento sai nesse modelo.'], prazo:'15 dias', medir:'Propostas enviadas no modelo' },
    diferenciais:{ titulo:'Monte o argumentário de diferenciais', passos:['Liste os 5 motivos reais para o cliente comprar de você e não do concorrente.','Para cada um, escreva uma prova: número, caso ou depoimento.','Treine o time até todos explicarem do mesmo jeito.'], prazo:'15 dias', medir:'Vendas perdidas por preço' }
  };

  /* Quando o pilar está forte, as ações sugeridas são de próximo nível. */
  var PROXIMO_NIVEL = {
    prospeccao:[
      { titulo:'Teste um canal novo de prospecção', passos:['Escolha um canal que o time ainda não usa (LinkedIn, parceiros, eventos).','Rode por 30 dias com meta própria.','Compare o custo e o retorno com os canais atuais.'], prazo:'30 dias', medir:'Clientes novos vindos do canal' },
      { titulo:'Aumente a meta de abordagens em 20%', passos:['Use o resultado dos últimos 3 meses como base.','Suba a meta em 20% e acompanhe semanalmente.','Mantenha o que funcionou e corte o que não trouxe reunião.'], prazo:'30 dias', medir:'Reuniões novas por mês' } ],
    recuperacao:[
      { titulo:'Crie campanhas de reativação por perfil', passos:['Separe os inativos por motivo de saída.','Faça uma mensagem e uma oferta para cada grupo.','Compare qual grupo volta mais.'], prazo:'30 dias', medir:'Taxa de reativação por grupo' },
      { titulo:'Coloque meta de reativação no time', passos:['Defina quantos clientes inativos cada vendedor deve reativar por mês.','Mostre o resultado na reunião semanal.','Premie quem bater a meta.'], prazo:'30 dias', medir:'Clientes reativados por vendedor' } ],
    fidelizacao:[
      { titulo:'Separe os clientes por potencial', passos:['Classifique a carteira em A, B e C pelo quanto compram e podem comprar.','Dê atendimento e frequência de contato diferentes para cada grupo.','Revise a classificação a cada trimestre.'], prazo:'30 dias', medir:'Faturamento dos clientes A' },
      { titulo:'Crie um programa de indicação para clientes fiéis', passos:['Convide os clientes mais antigos a indicar.','Dê um benefício claro para quem indicar e para quem for indicado.','Acompanhe quantas indicações viram venda.'], prazo:'30 dias', medir:'Vendas vindas de indicação' } ],
    nutricao:[
      { titulo:'Meça o custo de cada contato por origem', passos:['Some o que gasta em cada canal de atração.','Divida pelo número de contatos e de vendas que cada um trouxe.','Coloque mais verba onde o custo por venda é menor.'], prazo:'30 dias', medir:'Custo por venda por canal' },
      { titulo:'Responda todo contato em até 5 minutos', passos:['Defina quem atende os contatos novos em cada horário.','Use uma mensagem automática só para avisar que alguém vai responder.','Meça o tempo de primeira resposta toda semana.'], prazo:'15 dias', medir:'Tempo da primeira resposta' } ],
    estrutura:[
      { titulo:'Acompanhe a conversão por etapa', passos:['Meça quantos contatos passam de cada etapa para a próxima.','Encontre a etapa onde mais se perde.','Ataque essa etapa com treino e roteiro.'], prazo:'30 dias', medir:'Conversão em cada etapa' },
      { titulo:'Documente o jeito de vender do melhor vendedor', passos:['Acompanhe as vendas do seu melhor vendedor por uma semana.','Transforme o que ele faz em roteiro e checklist.','Treine o restante do time com esse material.'], prazo:'30 dias', medir:'Diferença de resultado entre vendedores' } ]
  };

  var ORDEM_PRIORIDADE_PILAR = {
    prospeccao:['pr_rotina','pr_meta','pr_lista','pr_roteiro','pr_canais'],
    recuperacao:['re_orcamentos','re_sabe','re_contato','re_oferta','re_motivo'],
    fidelizacao:['fi_posvenda','fi_mix','fi_recompra','fi_satisfacao','fi_beneficio'],
    nutricao:['nu_acompanha','nu_origem','nu_indicacao','nu_conteudo','nu_atracao']
  };

  function nivel(n){ return n>=70?{id:'alto',nome:'Alto'}:n>=40?{id:'medio',nome:'Médio'}:{id:'baixo',nome:'Baixo'}; }
  function estagio(n){
    if(n>=70) return { nome:'Comercial previsível', frase:'A base está montada. O jogo agora é escala: medir melhor, delegar e acelerar o que já funciona.' };
    if(n>=40) return { nome:'Comercial em estruturação', frase:'A empresa já vende e tem partes do processo funcionando, mas ainda depende de esforço e de pessoas, e não de método.' };
    return { nome:'Comercial reativo', frase:'As vendas acontecem mais pela procura e pelo esforço individual do que por um processo. Há muito espaço para crescer organizando o básico.' };
  }
  function pts(v){ return v==='Sim'?20:v==='Em parte'?10:0; }

  function analisar(lista){
    var R={}; (lista||[]).forEach(function(x){ if(x && x.id) R[x.id]=x.resposta; });

    var pilares=PILARES.map(function(p){
      var itens=p.itens.map(function(id){ return { id:id, t:ITENS[id].t, c:ITENS[id].c, resp:R[id]||'—', pts:pts(R[id]) }; });
      var nota=itens.reduce(function(s,i){return s+i.pts;},0);
      // ações: itens mais fracos primeiro (Não antes de Em parte), seguindo a ordem de impacto do pilar
      var cand=[];
      if(p.id==='prospeccao' && /^Só o dono|^Ninguém/.test(R.pr_quem||'')) cand.push('pr_quem');
      ORDEM_PRIORIDADE_PILAR[p.id].filter(function(id){return pts(R[id])===0;}).forEach(function(id){cand.push(id);});
      ORDEM_PRIORIDADE_PILAR[p.id].filter(function(id){return pts(R[id])===10;}).forEach(function(id){cand.push(id);});
      var acoes=cand.slice(0,2).map(function(id){ var a=Object.assign({},ACOES[id]); a.origem=id; a.motivo=motivo(id,R); return a; });
      PROXIMO_NIVEL[p.id].forEach(function(a){ if(acoes.length<2) acoes.push(Object.assign({motivo:'Este pilar já está bem resolvido. Esta ação leva ao próximo nível.'},a)); });
      return Object.assign({}, p, { nota:nota, nivel:nivel(nota), itens:itens, acoes:acoes, quem:R.pr_quem });
    });

    var est=ESTRUTURA.map(function(e){ var v=e.id==='crm'?R.usa_crm:R[e.id]; var n=e.nota(v||'',R); return { id:e.id, t:e.t, c:e.c, resp:e.id==='crm'?(R.usa_crm==='Sim'?((R.qual_crm||'Sim')+' · nota '+(R.nota_crm||'—')+'/10'):(R.usa_crm||'—')):(v||'—'), pts:n }; });
    var notaEst=Math.round(est.reduce(function(s,i){return s+i.pts;},0)/(est.length*2)*100);
    var candEst=est.filter(function(i){return i.pts===0;}).concat(est.filter(function(i){return i.pts===1;}));
    var acoesEst=candEst.slice(0,2).map(function(i){ var a=Object.assign({},ACOES[i.id]); a.origem=i.id; a.motivo='Hoje: '+i.resp+'.'; return a; });
    PROXIMO_NIVEL.estrutura.forEach(function(a){ if(acoesEst.length<2) acoesEst.push(Object.assign({motivo:'A estrutura já está sólida. Esta ação leva ao próximo nível.'},a)); });
    var estrutura={ id:'estrutura', nome:'Estrutura comercial', curto:'Processo, gestão e ferramentas', def:'O que sustenta o comercial: processo, regras, ferramentas, rotina e previsão.', nota:notaEst, nivel:nivel(notaEst), itens:est, acoes:acoesEst };

    var geral=Math.round(pilares.reduce(function(s,p){return s+p.nota;},0)/pilares.length);
    var ord=pilares.slice().sort(function(a,b){return b.nota-a.nota;});
    var pico=ord[0], fundo=ord[ord.length-1];
    var gap=pico.nota-fundo.nota;

    // gargalos: itens com Não nos pilares + itens zerados na estrutura, priorizando o pilar mais fraco
    var gargalos=[];
    pilares.slice().sort(function(a,b){return a.nota-b.nota;}).forEach(function(p){ p.itens.forEach(function(i){ if(i.pts===0) gargalos.push({ area:p.nome, t:i.t, c:i.c }); }); });
    est.forEach(function(i){ if(i.pts===0) gargalos.push({ area:'Estrutura', t:i.t, c:i.c }); });
    var fortes=[];
    pilares.forEach(function(p){ p.itens.forEach(function(i){ if(i.pts===20) fortes.push({ area:p.nome, t:i.t }); }); });
    est.forEach(function(i){ if(i.pts===2) fortes.push({ area:'Estrutura', t:i.t }); });

    var deseq;
    if(gap>=40) deseq='Os pilares estão desequilibrados: '+pico.nome+' ('+pico.nota+') está muito à frente de '+fundo.nome+' ('+fundo.nota+'). O esforço de um lado está vazando pelo outro.';
    else if(gap>=20) deseq='Existe um desnível entre '+pico.nome+' ('+pico.nota+') e '+fundo.nome+' ('+fundo.nota+'). Vale nivelar antes de investir para crescer.';
    else deseq='Os quatro pilares estão em níveis parecidos. O ganho vem de subir todos juntos com um processo único.';

    var leitura=[];
    if(fundo.id==='prospeccao') leitura.push('A empresa depende de quem chega sozinho. Sem busca ativa, o crescimento fica limitado ao tamanho da procura.');
    if(fundo.id==='recuperacao') leitura.push('Clientes que já compraram estão indo embora sem que ninguém os chame de volta. É a receita mais rápida de recuperar.');
    if(fundo.id==='fidelizacao') leitura.push('O cliente compra e é esquecido. Cada venda nova custa mais do que precisaria, porque a carteira atual não é aproveitada.');
    if(fundo.id==='nutricao') leitura.push('Quem chega interessado não é acompanhado até comprar. O investimento em atração está vazando antes de virar venda.');
    if(notaEst<40) leitura.push('A estrutura comercial ainda é frágil: o resultado depende mais de pessoas do que de processo, regras e ferramentas.');
    if(/^Sempre|maioria/.test(R.aprovacao||'') || /dono/.test(R.depende||'')) leitura.push('Há forte dependência do dono ou de uma pessoa para vender e fechar. Isso limita o crescimento ao tempo dessa pessoa.');

    return {
      R:R, empresa:R.empresa||'Sua empresa', nome:R.nome||'', geral:geral, nivelGeral:nivel(geral), estagio:estagio(geral),
      pilares:pilares, estrutura:estrutura, pico:pico, fundo:fundo, gap:gap, desequilibrio:deseq, leitura:leitura,
      gargalos:gargalos, fortes:fortes,
      autoavaliacao:[ {t:'Disciplina do time', v:+R.disciplina||0}, {t:'Organização dos processos', v:+R.organizacao||0}, {t:'Previsibilidade das vendas', v:+R.previsibilidade||0} ],
      urgencia:+R.urgencia||0
    };
  }

  function motivo(id,R){
    if(id==='pr_quem') return 'Hoje: '+(R.pr_quem||'').toLowerCase()+'.';
    var v=R[id]; return 'Você respondeu "'+(v||'—')+'" para: '+ITENS[id].t.toLowerCase()+'.';
  }

  /* E-mail marketing (HTML com tabelas e estilos inline, compatível com Gmail/Outlook). */
  function email(A, link){
    function e(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
    var cor={alto:'#12a65a',medio:'#c98a00',baixo:'#c2185b'};
    var barras=A.pilares.concat([A.estrutura]).map(function(p){
      var w=Math.max(4,p.nota);
      return '<tr><td style="padding:8px 0;font:500 14px Arial,sans-serif;color:#18181b;width:150px">'+e(p.nome)+'</td>'+
        '<td style="padding:8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#ececf0;border-radius:6px;height:10px"><table role="presentation" width="'+w+'%" cellpadding="0" cellspacing="0"><tr><td style="background:'+cor[p.nivel.id]+';height:10px;border-radius:6px;font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr></table></td>'+
        '<td style="padding:8px 0 8px 12px;font:700 14px Arial,sans-serif;color:#18181b;text-align:right;width:70px;white-space:nowrap">'+p.nota+'<span style="font-weight:400;color:#8e8e96">/100</span></td></tr>';
    }).join('');
    var garg=A.gargalos.slice(0,3).map(function(g){ return '<tr><td style="padding:10px 0;border-top:1px solid #ececf0;font:400 14px/1.5 Arial,sans-serif;color:#46464d"><strong style="color:#18181b">'+e(g.t)+'</strong> <span style="color:#8e8e96">· '+e(g.area)+'</span><br>'+e(g.c)+'</td></tr>'; }).join('');
    var nome=(A.nome||'').split(' ')[0];
    return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seu Diagnóstico Comercial</title></head>'+
    '<body style="margin:0;padding:0;background:#f3f3f5">'+
    '<div style="display:none;max-height:0;overflow:hidden">'+e(A.empresa)+': score '+A.geral+'/100 · '+e(A.estagio.nome)+'. Veja o retrato completo e o plano de ação.</div>'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f5"><tr><td align="center" style="padding:28px 12px">'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;border:1px solid #e6e6ea">'+
    '<tr><td style="background:#000;border-radius:18px 18px 0 0;padding:22px 32px;font:700 18px Arial,sans-serif;letter-spacing:4px;color:#f5f5f5">UNIQUE</td></tr>'+
    '<tr><td style="padding:32px 32px 8px">'+
      '<p style="margin:0 0 6px;font:500 11px Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;color:#8e8e96">Diagnóstico de Maturidade Comercial</p>'+
      '<h1 style="margin:0 0 14px;font:700 26px/1.2 Arial,sans-serif;color:#18181b">'+(nome?e(nome)+', o':'O')+' retrato comercial da '+e(A.empresa)+' está pronto</h1>'+
      '<p style="margin:0;font:400 15px/1.6 Arial,sans-serif;color:#46464d">Analisamos suas respostas nos 4 pilares comerciais e na estrutura do time. Aqui está o resumo. O relatório completo mostra o que está travando as vendas e um plano de ação prático.</p>'+
    '</td></tr>'+
    '<tr><td style="padding:22px 32px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f9;border-radius:14px"><tr>'+
      '<td style="padding:20px 22px;width:120px"><div style="font:800 44px/1 Arial,sans-serif;color:#18181b">'+A.geral+'</div><div style="font:400 12px Arial,sans-serif;color:#8e8e96">de 100</div></td>'+
      '<td style="padding:20px 22px 20px 0"><div style="font:700 16px Arial,sans-serif;color:#18181b">'+e(A.estagio.nome)+'</div><div style="font:400 13px/1.5 Arial,sans-serif;color:#5b5b63;margin-top:4px">'+e(A.estagio.frase)+'</div></td>'+
    '</tr></table></td></tr>'+
    '<tr><td style="padding:4px 32px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+barras+'</table></td></tr>'+
    (garg?'<tr><td style="padding:18px 32px 6px"><p style="margin:0 0 4px;font:700 15px Arial,sans-serif;color:#18181b">O que mais está travando as vendas</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+garg+'</table></td></tr>':'')+
    '<tr><td align="center" style="padding:24px 32px 34px"><a href="'+e(link)+'" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font:700 15px Arial,sans-serif;padding:16px 30px;border-radius:999px">Ver meu diagnóstico completo</a>'+
      '<p style="margin:14px 0 0;font:400 12px Arial,sans-serif;color:#8e8e96">Inclui o plano de ação com 10 ações práticas para os próximos 30 dias.</p></td></tr>'+
    '<tr><td style="border-top:1px solid #ececf0;padding:20px 32px;font:400 12px/1.6 Arial,sans-serif;color:#8e8e96">Carlos Ribeiro · Unique Consultoria Comercial<br>Responda este e-mail ou chame no WhatsApp (62) 99600-7574 para conversar sobre o plano.</td></tr>'+
    '</table></td></tr></table></body></html>';
  }

  function emailTexto(A, link){
    var nome=(A.nome||'').split(' ')[0];
    var l=[(nome?nome+', ':'')+'o retrato comercial da '+A.empresa+' está pronto.','',
      'Score geral: '+A.geral+'/100 · '+A.estagio.nome];
    A.pilares.concat([A.estrutura]).forEach(function(p){ l.push('• '+p.nome+': '+p.nota+'/100 ('+p.nivel.nome+')'); });
    l.push('','Veja o relatório completo e o plano de ação:',link,'','Carlos Ribeiro · Unique Consultoria Comercial');
    return l.join('\n');
  }

  window.UniqueDiag = { analisar:analisar, email:email, emailTexto:emailTexto, PILARES:PILARES };
})();
