/* Vagas por Propósito · Unique Consultoria
   Base comum: cliente do Supabase, textos das analogias e utilidades. */
(function(){
  var URL_SB='https://ovlhfnzfqhmanzjpfdgj.supabase.co';
  var CHAVE='sb_publishable_gq2tAtUJWo1YkCv9Pp1ICQ_zG3HGYEt';
  var sb=window.supabase.createClient(URL_SB,CHAVE,{auth:{persistSession:true,storageKey:'vg_sessao'}});

  var SUB='A **{empresa}** está contratando um(a) **{cargo}** para o nosso time.';
  var P1='Por que essa vaga deve ser sua?', P2='O que mais te impactou no descritivo dessa vaga?';
  var ANALOGIAS={
    atleta:{
      nome:'Atleta', emoji:'🏃', cor:'#ff5b1f',
      fotos:['atleta-1','atleta-2','atleta-3'],
      frase:'Não é sobre a largada. É sobre quem ainda está correndo no quilômetro 30.',
      pergunta3:'Qual foi a venda (ou conquista) mais desafiadora da sua vida — e como você venceu?',
      resumo:'Para quem vive de meta, treino e placar.',
      pergunta:'Você tem mente de atleta?',
      titulo:function(c){return 'Atleta de alta performance'+(c?' · '+c:'');},
      promessa:'Aquele que transforma meta em missão. Que não desiste no meio do caminho. Que tem orgulho do suor da jornada — e não só da linha de chegada.\n\nAqui na **{empresa}**, vender é mais do que bater meta. É se preparar, se adaptar e se conectar. Estamos buscando alguém com esse espírito: um(a) **vendedor(a) maratonista**.',
      tarefas:['Prospectar novos clientes todos os dias por WhatsApp, ligação e, quando necessário, presencialmente','Reativar clientes antigos e manter a carteira viva, pulsando','Conduzir negociações do primeiro contato ao fechamento, com foco em recorrência','Gravar vídeos com o celular mostrando lançamentos, promoções e novidades','Usar CRM, WhatsApp, Canva e ChatGPT como aliados da rotina','Fazer follow-up com inteligência para nenhum cliente esfriar'],
      perfilTexto:'Aqui na {empresa}, a gente não quer apenas mais um vendedor. Queremos **alguém que entre pra história do time.**\n\nA rotina é intensa e cheia de movimento. Você vai precisar ter jogo de cintura, clareza na fala e disposição pra encantar nos primeiros segundos de conversa.\n\nA prospecção é constante. Tem que correr atrás, insistir com classe e saber a hora certa de fechar — com foco total na **recorrência**, não em vitórias de um dia só.\n\nVocê não pode ter vergonha de aparecer. Quem vende de verdade **tem presença, atitude e cara de pau elegante**.\n\nGostamos de quem tem fome — de meta, de crescimento, de resultado. Mas também de quem cuida da carteira como se fosse um jardim.',
      perfil:['Sente um incômodo real quando um cliente fica sem resposta','Comemora a meta batida e já pergunta qual é a próxima','Prefere ouvir um “não” a ficar na dúvida','Aprende uma ferramenta nova sem esperar alguém ensinar','Tem inteligência emocional para ouvir, adaptar e entregar'],
      beneficios:['Reconhecimento de verdade por quem entrega resultado','Liberdade pra criar e testar novas abordagens','Ambiente leve, com gente que joga junto','Crescimento junto com uma marca em expansão'],
      encerramento:'Está pronto(a) para essa maratona? Então comece agora mesmo.',
      desafio:'Grave um vídeo de até 2 minutos contando a maior meta que você já bateu (no trabalho, no esporte ou na vida) e o que fez para chegar lá.'
    },
    lapidador:{
      nome:'Lapidário de diamantes', emoji:'💎', cor:'#ff2e88',
      fotos:['lapidario-1','lapidario-2','lapidario-3'],
      frase:'Todo diamante já foi uma pedra bruta. A diferença está em quem teve paciência para lapidar.',
      pergunta3:'Conte uma conversa que parecia perdida e que você transformou em venda. O que você fez?',
      resumo:'Closer, SDR e social selling: primeiro atendimento e primeira venda.',
      pergunta:'Você transforma conversa em venda?',
      titulo:function(c){return 'Lapidário(a) de diamantes'+(c?' · '+c:'');},
      promessa:'Todo lead chega bruto. Uma mensagem solta, uma curiosidade, um “quanto custa?”. A maioria deixa passar. O lapidário enxerga o diamante ali dentro — e sabe exatamente onde cortar.\n\nAqui na **{empresa}**, o primeiro atendimento é onde a venda nasce. Estamos buscando alguém que transforme interesse em conversa e conversa em fechamento: um(a) **lapidário(a) de oportunidades**.',
      tarefas:['Responder os leads em minutos, com um atendimento que encanta desde a primeira mensagem','Qualificar cada contato: entender a dor, o momento e o potencial de compra','Conduzir a conversa até a primeira venda ou até a reunião com o especialista','Gerar conversas pelo Instagram, LinkedIn e WhatsApp (social selling)','Registrar cada lead e cada etapa no CRM, sem deixar nenhum para trás','Fazer follow-up com elegância até ter uma resposta clara'],
      perfilTexto:'Aqui na {empresa}, a gente não quer quem só responde mensagem. Queremos **alguém que transforma um “oi” em cliente.**\n\nO ritmo é rápido. Os leads chegam de todo lado e cada minuto conta: quem responde primeiro, com clareza e simpatia, sai na frente.\n\nVocê vai precisar de escuta afiada — entender o que o cliente quer de verdade, mesmo quando ele não sabe explicar — e de **técnica pra conduzir sem empurrar**.\n\nSocial selling aqui não é postar por postar. É **gerar conversa, construir confiança e abrir portas**.\n\nGostamos de quem tem paciência de joalheiro e pressa de vendedor — que cuida de cada detalhe, mas não deixa a oportunidade esfriar.',
      perfil:['Fica inquieto(a) com um lead sem resposta há mais de 5 minutos','Faz perguntas antes de oferecer qualquer coisa','Sabe a hora exata de pedir o fechamento','Escreve mensagens que dá vontade de responder','Comemora a primeira compra de um cliente como se fosse sua'],
      beneficios:['Aprender técnicas de venda e atendimento na prática','Ver o resultado do seu trabalho na hora, em cada fechamento','Um time que valoriza quem abre a porta da venda','Caminho claro para crescer na carreira comercial'],
      encerramento:'Tem um diamante esperando por você. Comece a lapidar agora.',
      desafio:'Grave um vídeo de até 2 minutos respondendo um cliente que mandou: “Oi, quanto custa?”. Mostre como você conduziria essa conversa até a venda.'
    },
    explorador:{
      nome:'Desbravador', emoji:'🧭', cor:'#ffb020',
      fotos:['desbravador-1','desbravador-2','desbravador-3'],
      frase:'O caminho não existe. Ele aparece quando alguém tem coragem de andar.',
      pergunta3:'Conte a vez em que você abriu uma porta que todo mundo dizia que estava fechada.',
      resumo:'Hunter de prospecção pesada: abre caminho onde ninguém passou.',
      pergunta:'Você abre caminho onde ninguém passou?',
      titulo:function(c){return 'Desbravador(a) de mercado'+(c?' · '+c:'');},
      promessa:'Tem gente que espera o cliente bater na porta. E tem gente que pega a mochila, escolhe a direção e vai buscar — mesmo onde ninguém nunca foi.\n\nAqui na **{empresa}**, tem muito território para conquistar. Estamos buscando alguém com coragem, fôlego e método para abrir mercado: um(a) **hunter de verdade**.',
      tarefas:['Prospectar empresas e clientes novos todos os dias, por ligação, WhatsApp, LinkedIn e visita','Montar e trabalhar listas de prospecção por região e segmento','Fazer abordagens frias com confiança e transformar desconhecidos em reuniões','Mapear concorrentes, oportunidades e regiões que ninguém explorou','Bater a meta semanal de contatos e reuniões agendadas','Registrar cada tentativa no CRM e aprender com os números'],
      perfilTexto:'Aqui na {empresa}, a gente não quer quem espera o lead cair do céu. Queremos **alguém que vá buscar.**\n\nA prospecção é pesada e diária. São muitos contatos, muitas portas fechadas e algumas que se abrem — e são essas que mudam o jogo.\n\nVocê vai ouvir muitos “nãos”. Quem desbrava de verdade **não leva para o pessoal**: ajusta a abordagem, liga para o próximo e segue em frente.\n\nA autonomia é grande — e por isso pede **disciplina de ferro**: rota organizada, meta de atividade e constância, mesmo nos dias difíceis.\n\nGostamos de quem tem sangue de caçador e cabeça fria — que vai com tudo, mas sabe exatamente onde está pisando.',
      perfil:['Liga para um desconhecido sem pensar duas vezes','Encara o “não” como parte do caminho até o “sim”','Se anima com uma lista de prospecção nova','Conta os contatos do dia e quer bater o próprio recorde','Volta da rua sempre com uma oportunidade nova'],
      beneficios:['Autonomia para montar a própria rota e abordagem','Comissão e reconhecimento para quem abre mercado','Liberdade para testar novos canais e estratégias','Crescimento junto com a expansão da empresa'],
      encerramento:'O mapa está em branco. Seja o primeiro a chegar.',
      desafio:'Grave um vídeo de até 2 minutos fazendo uma abordagem fria: você ligou para um dono de empresa que nunca ouviu falar da gente. Como você abre essa conversa?'
    },
    estrategista:{
      nome:'Estrategista', emoji:'♟️', cor:'#3b82f6',
      fotos:['estrategista-1','estrategista-2','estrategista-3'],
      frase:'Quem pensa uma jogada à frente vence a partida. Quem pensa três, vence o campeonato.',
      pergunta3:'Qual foi a negociação mais complexa que você conduziu — e qual foi a jogada decisiva?',
      resumo:'Xadrez de alto ticket: conduz negócios grandes e vendas complexas.',
      pergunta:'Você pensa três jogadas à frente?',
      titulo:function(c){return 'Estrategista de negócios'+(c?' · '+c:'');},
      promessa:'Em venda grande, ninguém ganha no impulso. Ganha quem lê o tabuleiro, entende cada peça e faz o movimento certo na hora certa.\n\nAqui na **{empresa}**, cada negócio tem peso, prazo longo e muita gente envolvida. Estamos buscando alguém que conduza vendas complexas com calma e precisão: um(a) **estrategista de alto ticket**.',
      tarefas:['Conduzir negociações de alto valor, do diagnóstico ao contrato assinado','Mapear decisores, influenciadores e o processo de compra de cada cliente','Montar propostas sob medida, com números que fazem sentido para o cliente','Apresentar e negociar com donos e diretores de empresa','Acompanhar o funil das grandes contas e prever o fechamento com precisão','Cuidar do relacionamento depois da venda para gerar renovação e indicação'],
      perfilTexto:'Aqui na {empresa}, a gente não quer quem só tira pedido. Queremos **alguém que construa negócios.**\n\nVenda de alto ticket é jogo longo. São várias reuniões, várias pessoas para convencer e decisões que levam semanas — às vezes meses.\n\nVocê vai precisar de **paciência estratégica**: saber quando avançar, quando esperar e quando mudar a jogada.\n\nVai sentar à mesa com donos e diretores. Por isso precisa de postura, preparo e **segurança para falar de valor, não de desconto**.\n\nGostamos de quem pensa como dono do negócio do cliente — que entende o problema dele melhor do que ele mesmo e mostra o caminho.',
      perfil:['Estuda o cliente antes de qualquer reunião','Fala de retorno e valor antes de falar de preço','Não se apavora quando a negociação demora','Sabe exatamente quem decide em cada conta','Prefere um contrato grande bem feito a dez pequenos sem futuro'],
      beneficios:['Negócios relevantes, com impacto real na empresa','Contato direto com donos e diretores do mercado','Comissões à altura de vendas de alto valor','Autonomia para conduzir as suas contas'],
      encerramento:'O tabuleiro está montado. A sua jogada é agora.',
      desafio:'Grave um vídeo de até 2 minutos contando a maior venda (ou negociação) que você já conduziu: quem estava envolvido, o que estava em jogo e como você fechou.'
    },
    tecnico:{
      nome:'Técnico', emoji:'📋', cor:'#8b5cf6',
      fotos:['atleta-2','atleta-1','atleta-3'],
      frase:'Nenhum time é campeão por acaso. Por trás dele, sempre tem um técnico.',
      pergunta3:'Conte a vez em que você fez uma pessoa do seu time sair do pior momento para o melhor resultado.',
      resumo:'Treinador do time: supervisor ou diretor de vendas.',
      pergunta:'Você faz o time jogar melhor?',
      titulo:function(c){return 'Técnico(a) do time comercial'+(c?' · '+c:'');},
      promessa:'Craque sozinho ganha jogo. Time bem treinado ganha campeonato. E por trás de todo time campeão tem um técnico que enxerga cada jogador, monta a estratégia e cobra resultado com respeito.\n\nAqui na **{empresa}**, o comercial é o coração da empresa. Estamos buscando alguém que forme, lidere e leve o time ao próximo nível: um(a) **técnico(a) de vendas**.',
      tarefas:['Liderar o time comercial no dia a dia, com metas claras e acompanhamento próximo','Treinar os vendedores em abordagem, negociação e fechamento','Conduzir reuniões de resultado, feedbacks individuais e planos de desenvolvimento','Acompanhar os indicadores do funil e agir rápido quando algo sai do ritmo','Recrutar e integrar novos vendedores no padrão da empresa','Construir processos e rotinas que fazem o time vender sem depender de heróis'],
      perfilTexto:'Aqui na {empresa}, a gente não quer um chefe que só cobra planilha. Queremos **alguém que faça cada vendedor jogar melhor.**\n\nVocê vai estar à beira do campo todos os dias: observando, corrigindo, motivando e, quando precisar, entrando em campo para mostrar como se faz.\n\nVai precisar ler números e pessoas ao mesmo tempo. **O indicador mostra onde está o problema; a conversa mostra o porquê.**\n\nLiderar aqui é ter coragem para dar o feedback difícil e generosidade para comemorar cada vitória do time.\n\nGostamos de quem forma gente — de quem mede o próprio sucesso pelo crescimento de quem está ao lado.',
      perfil:['Sente orgulho quando um vendedor do time bate a meta','Dá feedback direto, sem rodeios e sem humilhar','Sabe de cabeça os números do funil da semana','Ensina pelo exemplo antes de cobrar','Transforma o pior dia do time em aprendizado'],
      beneficios:['Autonomia para montar o time e o método de trabalho','Participação nas decisões estratégicas da empresa','Ver pessoas crescendo por causa da sua liderança','Remuneração ligada ao resultado do time'],
      encerramento:'O time está pronto para treinar. Só falta o técnico.',
      desafio:'Grave um vídeo de até 2 minutos contando como você recuperaria um vendedor que está há dois meses abaixo da meta.'
    }

  };
  // {empresa}, {cargo} e **negrito** nos textos da vaga
  function texto(s,v){
    var e=function(x){return String(x==null?'':x).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});};
    var t=e(s).replace(/\{empresa\}/gi,e(v&&v.empresa_nome||'nossa empresa')).replace(/\{cargo\}/gi,e(v&&v.cargo_real||'profissional'));
    return t.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
  }


  var PALAVRAS=['GIRASSOL','FAROL','BÚSSOLA','DIAMANTE','HORIZONTE','ÂNCORA','TROFÉU','SEMENTE','COMETA','MONTANHA'];
  function palavra(){ return PALAVRAS[Math.floor(Math.random()*PALAVRAS.length)]; }
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function slugify(s){return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60);}
  function brl(v){var n=Number(v); if(!isFinite(n)||!v) return ''; return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});}
  function ytId(u){if(!u) return ''; var m=String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([A-Za-z0-9_-]{11})/); return m?m[1]:'';}
  function zap(n){var d=String(n||'').replace(/\D/g,''); if(!d) return ''; if(d.length<=11) d='55'+d; return 'https://wa.me/'+d;}
  function toast(msg,tipo){
    var t=document.createElement('div'); t.className='vg-toast'+(tipo?' '+tipo:''); t.textContent=msg;
    document.body.appendChild(t); requestAnimationFrame(function(){t.classList.add('on');});
    setTimeout(function(){t.classList.remove('on'); setTimeout(function(){t.remove();},300);},3200);
  }
  function erroPt(e){
    var m=(e&&(e.message||e.error_description))||String(e||'');
    if(/Invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
    if(/Email not confirmed/i.test(m)) return 'Confirme seu e-mail antes de entrar (veja a sua caixa de entrada).';
    if(/already registered|already exists/i.test(m)) return 'Este e-mail já tem cadastro. Use a aba Entrar.';
    if(/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
    if(/rate limit/i.test(m)) return 'Muitas tentativas. Espere um minuto e tente de novo.';
    if(/duplicate key.*slug/i.test(m)) return 'Esse endereço de vaga já existe. Escolha outro.';
    if(/Resposta muito curta/i.test(m)) return 'Sua resposta está curta demais. Conte um pouco mais.';
    if(/row-level security/i.test(m)) return 'Sem permissão para isso. Sua empresa já foi aprovada?';
    return m||'Algo deu errado. Tente de novo.';
  }

  window.VG={P1:P1,P2:P2,SUB:SUB,texto:texto,palavra:palavra,URL:URL_SB,CHAVE:CHAVE,sb:sb,ANALOGIAS:ANALOGIAS,esc:esc,slugify:slugify,brl:brl,ytId:ytId,zap:zap,toast:toast,erroPt:erroPt};
})();
