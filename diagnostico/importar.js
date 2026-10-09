/* Importa respostas do formulário antigo (Google Forms "DIAGNÓSTICO DE MATURIDADE COMERCIAL")
   para o formato do diagnóstico novo. Usado pelo painel (colar o CSV da planilha).
   - Respostas com equivalente direto viram a resposta nova.
   - Respostas aproximadas recebem obs:'estimado' (aparecem para o Carlos e para o cliente confirmar).
   - Perguntas que não existiam no formulário antigo (os 4 pilares, dor, tipo de venda…) ficam pendentes.
   - O que só existia no antigo é guardado na seção "Formulário anterior", para nada se perder. */
(function(){
  'use strict';
  var D = (typeof window!=='undefined' && window.DIAG) || (typeof require!=='undefined' ? require('./perguntas.js') : null);

  /* CSV com aspas e quebras de linha dentro do campo */
  function csv(txt){
    var linhas=[], campo='', linha=[], q=false, i=0, c;
    txt=String(txt||'').replace(/^﻿/,'');
    var sep = (txt.split('\n')[0].split('\t').length > txt.split('\n')[0].split(',').length) ? '\t' : ',';
    for(;i<txt.length;i++){ c=txt[i];
      if(q){ if(c==='"'){ if(txt[i+1]==='"'){ campo+='"'; i++; } else q=false; } else campo+=c; }
      else if(c==='"') q=true;
      else if(c===sep){ linha.push(campo); campo=''; }
      else if(c==='\n'){ linha.push(campo.replace(/\r$/,'')); linhas.push(linha); linha=[]; campo=''; }
      else campo+=c;
    }
    if(campo!==''||linha.length){ linha.push(campo); linhas.push(linha); }
    return linhas.filter(function(l){ return l.some(function(x){ return String(x).trim(); }); });
  }
  function norm(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim(); }
  function t(s){ return String(s==null?'':s).trim(); }
  function lista(s){ return t(s).split(/\s*,\s*/).filter(Boolean); }
  function uniq(a){ return a.filter(function(x,i){ return x && a.indexOf(x)===i; }); }

  /* cabeçalho antigo (normalizado) -> função que devolve [id, resposta, estimado?] (ou várias) */
  var M = {};
  function m(h,fn){ M[norm(h)]=fn; }
  var EXATO=0, EST=1;
  function de(tab,v){ var k=t(v); return Object.prototype.hasOwnProperty.call(tab,k)?tab[k]:null; }

  m('Nome Completo',function(v){ return [['nome',t(v)]]; });
  m('Nome da Empresa',function(v){ return [['empresa',t(v)]]; });
  m('Endereço de e-mail',function(v){ return [['email',t(v)]]; });
  m('WhatsApp',function(v){ return [['whatsapp',t(v)]]; });
  m('CNPJ',function(v){ return [['cnpj',t(v)]]; });
  m('Instagram ou Site',function(v){ return [['instagram',t(v)]]; });
  m('Qual o segmento da empresa?',function(v){ return [['segmento',t(v)]]; });
  m('Há quanto tempo a empresa atua?',function(v){
    var r=de({'Menos de 1 ano':['Menos de 1 ano',EXATO],'1 a 3 anos':['De 1 a 3 anos',EXATO],'4 a 10 anos':['De 5 a 10 anos',EST],'Mais de 10 anos':['Mais de 10 anos',EXATO]},v);
    return r?[['tempo',r[0],r[1]]]:[['tempo',t(v),EST]]; });
  m('Faturamento médio mensal',function(v){
    var r=de({'Até R$ 50 mil':['Até R$ 50 mil',EXATO],'R$ 50 mil a R$ 100 mil':['R$ 50 mil a R$ 100 mil',EXATO],'R$ 100 mil a R$ 300 mil':['R$ 100 mil a R$ 300 mil',EXATO],'R$ 300 mil a R$ 500 mil':['R$ 300 mil a R$ 1 milhão',EXATO],'R$ 500 mil a R$ 1 milhão':['R$ 300 mil a R$ 1 milhão',EXATO],'Acima de R$ 1 milhão':['R$ 1 milhão a R$ 5 milhões',EST]},v);
    return r?[['faturamento',r[0],r[1]]]:[['faturamento',t(v),EST]]; });
  m('Número de colaboradores',function(v){
    var r=de({'1 a 5':['1 a 5',EXATO],'6 a 10':['6 a 15',EXATO],'11 a 20':['16 a 50',EST],'21 a 50':['16 a 50',EXATO],'51 a 100':['51 a 100',EXATO],'Mais de 100':['Mais de 100',EXATO]},v);
    return r?[['colaboradores',r[0],r[1]]]:[['colaboradores',t(v),EST]]; });
  m('Qual frase melhor representa sua empresa hoje?',function(v){
    var r=de({'Precisamos gerar mais clientes':'Chegam poucos clientes novos','Crescemos, mas sem organização':'Crescemos rápido e a operação não está acompanhando','Nossa equipe vende abaixo do potencial':'Temos procura, mas convertemos pouco','Não conseguimos prever faturamento':'Vendemos bem, mas sem controle nem previsibilidade'},v);
    return [['frase',r||t(v),EST]]; });
  m('Qual sua maior prioridade hoje?',function(v){
    var tab={'Aumentar faturamento':'Vender mais','Gerar mais leads':'Vender mais','Melhorar conversão':'Vender mais','Organizar processos':'Organizar o comercial','Implantar CRM':'Organizar o comercial','Automatizar vendas':'Organizar o comercial','Melhorar gestão da equipe':'Montar ou treinar a equipe'};
    return [['prioridade',uniq(lista(v).map(function(x){ return tab[x]||x; })).join(', '),EST]]; });
  m('Quantas pessoas atuam nas vendas?',function(v){
    var r=de({'1':['1 pessoa',EXATO],'2':['2 a 3',EXATO],'3 a 5':['4 a 6',EST],'6 a 10':['7 a 10',EST],'Mais de 10':['Mais de 10',EXATO]},v);
    return r?[['pessoas',r[0],r[1]]]:[['pessoas',t(v),EST]]; });
  m('Quem participa da venda?',function(v){
    var tab={'Proprietário':'Dono','Vendedor':'Vendedor interno','SDR':'Pré-vendas / SDR','Gerente':'Gerente comercial','Representante':'Representante','Atendente':'Atendente / recepção'};
    return [['quem',uniq(lista(v).map(function(x){ return tab[x]||x; })).join(', '),EST]]; });
  m('Quem aprova a venda?',function(v){
    var k=norm(v), r=/propriet/.test(k)?'Na maioria das vezes':/gerente/.test(k)?'Na maioria das vezes':/comercial|vendedor/.test(k)?'Só em vendas grandes ou pedidos de desconto':'';
    return [['aprovacao',r,EST],['ant_aprova',t(v)]]; });
  m('Quais canais utilizam?',function(v){
    var tab={'Loja Física':'Loja física','E-mail':'E-mail','Site':'Site','Telefone':'Telefone','WhatsApp':'WhatsApp','Instagram':'Instagram'};
    return [['canais',uniq(lista(v).map(function(x){ return tab[x]||x; })).join(', ')]]; });
  m('Tempo médio para responder um novo contato',function(v){ return [['ant_tempo_resposta',t(v)]]; });
  function sp(id,tab){ return function(v){ var r=de(tab,v); return [[id, r||'', r?EXATO:EST]]; }; }
  m('Existe processo comercial definido?',sp('passo',{'Sim':'Sim, está escrito e todos seguem','Parcialmente':'Existe, mas cada um faz do seu jeito','Não':'Não existe'}));
  m('Os diferenciais da empresas são usados de forma padronizada?',sp('diferenciais',{'Sim':'Sim, foi passado para todos','Parcialmente':'Alguns sabem, outros não','Não':'Não, cada um fala o que acha'}));
  m('Os diferenciais da empresa são usados de forma padronizada?',sp('diferenciais',{'Sim':'Sim, foi passado para todos','Parcialmente':'Alguns sabem, outros não','Não':'Não, cada um fala o que acha'}));
  m('Existe proposta comercial padronizada?',sp('proposta',{'Sim':'Sim, todos usam o mesmo modelo','Parcialmente':'Existe, mas nem todos usam','Não':'Não, cada orçamento sai de um jeito'}));
  m('Existe política comercial formalizada?',sp('politica',{'Sim':'Sim, documentada e todos conhecem','Parcialmente':'Existe, mas só na cabeça do dono ou gerente','Não':'Não existe'}));
  m('Quais ferramentas utilizam?',function(v){
    var tab={'ERP':'ERP / sistema de gestão','Planilhas':'Planilhas'};
    return [['ferramentas',uniq(lista(v).map(function(x){ return tab[x]||x; })).join(', ')]]; });
  m('Utilizam CRM?',function(v){ var k=norm(v); return [['usa_crm', k==='sim'?'Sim':k==='nao'?'Não':t(v)]]; });
  m('Qual CRM utilizam?',function(v){ return t(v)?[['qual_crm',t(v)]]:[]; });
  m('O CRM é utilizado corretamente?',function(v){ var k=norm(v); if(!k) return []; return [['nota_crm', k==='sim'?'8':k==='parcialmente'?'5':'2', EST]]; });
  m('Quantos novos contatos chegam por semana?',function(v){ return [['contatos_semana',t(v)]]; });
  m('Você conhece sua taxa de conversão?',function(v){ return [['_conhece',t(v)]]; });
  m('Qual a taxa aproximada?',function(v){ return [['_taxa',t(v)]]; });
  m('Vocês registram os motivos de perda?',sp('motivo_perda',{'Sempre':'Sim, sempre registramos o motivo','Às vezes':'Às vezes sabemos','Nunca':'Não, o cliente simplesmente some'}));
  m('Quantas tentativas fazem antes de desistir de uma venda?',function(v){
    var k=t(v), n=parseInt(k,10), r = /padr/i.test(k)?'Não tem regra, depende do vendedor': isNaN(n)?'': n<=1?'1': n<=3?'2 a 3': n<=5?'4 a 5':'6 ou mais';
    return [['tentativas',r, r?EXATO:EST]]; });
  m('Seu time possui rotina diária de vendas?',sp('rotina',{'Sim':'Sim, todos os dias','Parcialmente':'Às vezes','Não':'Não, vendemos conforme o cliente chega'}));
  m('Você consegue prever o faturamento do próximo mês?',sp('prever',{'Sim':'Sim, com boa precisão','Parcialmente':'Mais ou menos','Não':'Não faço ideia'}));
  m('O time conseguiria atender mais clientes hoje?',function(v){ var r=de({'Sim':'Sim, com folga','Parcialmente':'Um pouco mais','Não':'Não, já estamos no limite'},v); return r?[['capacidade',r]]:[]; });
  m('Como chegam seus melhores clientes hoje?',function(v){
    var tab={'Indicação':'Indicação','Instagram':'Instagram','Google':'Google','Tráfego Pago':'Anúncios pagos','Prospecção Ativa':'Prospecção ativa','Loja Física':'Loja física'};
    return [['melhores_clientes',uniq(lista(v).map(function(x){ return tab[x]||x; })).join(', ')]]; });
  m('Hoje sua empresa depende excessivamente de alguma pessoa para vender?',function(v){
    var k=norm(v), r=/propriet|vendedor/.test(k)?'De uma pessoa específica (dono ou um vendedor)':/indica/.test(k)?'De indicações':k==='nao'?'De várias fontes equilibradas':'';
    return [['depende',r,EST]]; });
  m('Onde você acredita que mais perde vendas?',function(v){
    var r=de({'Follow-up':'Fechar a venda','Qualificação':'Mostrar valor e gerar confiança','Atendimento inicial':'Responder e atender bem','Negociação':'Negociar preço','Apresentação da proposta':'Mostrar valor e gerar confiança','Poucos leads':'Atrair novos contatos'},v);
    return [['dificuldade',r||'',EST],['ant_perde_vendas',t(v)]]; });
  m('Como você avalia a disciplina da equipe comercial?',function(v){ return [['disciplina',t(v)]]; });
  m('Como você avalia a organização dos processos comerciais?',function(v){ return [['organizacao',t(v)]]; });
  m('Como você avalia a previsibilidade das vendas?',function(v){ return [['previsibilidade',t(v)]]; });
  m('Se sua empresa dobrasse a quantidade de clientes amanhã, qual seria o primeiro problema que apareceria?',function(v){ return [['ant_dobrar',t(v)]]; });
  m('O que impediria sua empresa de faturar 30% a mais nos próximos 6 meses?',function(v){ return [['impede_30',t(v)]]; });
  m('Qual destes objetivos é prioridade para os próximos 12 meses?',function(v){
    var r=de({'Aumentar faturamento':['Aumentar o faturamento',EXATO],'Criar previsibilidade de vendas':['Ter previsibilidade',EXATO],'Estruturar gestão comercial':['Estruturar a equipe',EST],'Organizar processos':['Estruturar a equipe',EST],'Implantar CRM':['Ter previsibilidade',EST],'Expandir mercado':['Abrir novos canais',EXATO]},v);
    return r?[['objetivo',r[0],r[1]],['ant_objetivo',t(v)]]:[['objetivo',t(v),EST]]; });
  m('Você pretende investir em melhorias comerciais nos próximos 12 meses?',function(v){ var r=de({'Sim':['Sim, se fizer sentido',EST],'Talvez':['Talvez',EXATO],'Não':['Não no momento',EXATO]},v); return r?[['investir',r[0],r[1]]]:[]; });
  m('Em uma escala de 1 a 10, qual seu nível de urgência para resolver os problemas comerciais?',function(v){ return [['urgencia',t(v)]]; });
  m('Imagine que estamos conversando daqui a 12 meses. O que precisaria ter acontecido para você dizer que o comercial da sua empresa foi um sucesso?',function(v){ return [['pergunta_ouro',t(v)]]; });
  m('Existe alguma informação importante sobre sua empresa que não foi perguntada e você gostaria de compartilhar?',function(v){ return [['adicional',t(v)]]; });

  var EXTRA_TXT = { ant_aprova:'Quem aprova a venda?', ant_tempo_resposta:'Tempo médio para responder um novo contato', ant_perde_vendas:'Onde você acredita que mais perde vendas?', ant_dobrar:'Se a empresa dobrasse a quantidade de clientes amanhã, qual seria o primeiro problema?', ant_objetivo:'Objetivo para os próximos 12 meses (resposta original)' };

  function data(v){ var x=/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?/.exec(t(v)); if(!x) return null; return x[3]+'-'+x[2]+'-'+x[1]+'T'+x[4]+':'+x[5]+':'+(x[6]||'00')+'-03:00'; }

  /* converte uma linha (com o cabeçalho) em { data, empresa, respostas:[{secao,id,pergunta,resposta,obs}] } */
  function linha(cab, row){
    var out={}, est={}, extras={};
    cab.forEach(function(h,i){
      var f=M[norm(h)], v=row[i];
      if(!f) return;
      f(v).forEach(function(r){ if(!r) return; out[r[0]]=r[1]; if(r[2]===EST) est[r[0]]=1; });
    });
    // taxa de conversão: só vale como "acompanho" quando a resposta foi Sim
    var conhece=norm(out._conhece), taxa=t(out._taxa), temNumero=/\d/.test(taxa);
    out.conhece_taxa = conhece==='sim' ? 'Sim, acompanho esse número' : temNumero ? 'Tenho uma ideia, mas não acompanho' : 'Não sei';
    if(conhece==='sim' && taxa) out.taxa=taxa; else if(temNumero) extras.ant_taxa=taxa;
    delete out._conhece; delete out._taxa;
    var respostas=[];
    D.TODAS.forEach(function(q){
      var v=out[q.id]; if(v==null || String(v).trim()==='') return;
      var e={ secao:q.secao, id:q.id, pergunta:q.p, resposta:String(v) }; if(est[q.id]) e.obs='estimado'; respostas.push(e);
    });
    Object.keys(out).forEach(function(k){ if(/^ant_/.test(k) && t(out[k])) extras[k]=out[k]; });
    Object.keys(extras).forEach(function(k){ respostas.push({ secao:'Formulário anterior', id:k, pergunta:EXTRA_TXT[k]||'Taxa de conversão informada (sem acompanhamento)', resposta:t(extras[k]) }); });
    var ts=data(row[0]);
    return { data:ts, empresa:out.empresa||'', nome:out.nome||'', email:out.email||'', whatsapp:out.whatsapp||'', respostas:respostas, pendentes:D.pendentes(respostas) };
  }

  function planilha(txt){
    var L=csv(txt); if(L.length<2) return [];
    var cab=L[0];
    return L.slice(1).map(function(r){ return linha(cab,r); }).filter(function(x){ return x.empresa; });
  }

  var API={ csv:csv, linha:linha, planilha:planilha };
  if(typeof window!=='undefined') window.DIAG_IMPORTAR=API;
  if(typeof module!=='undefined') module.exports=API;
})();
