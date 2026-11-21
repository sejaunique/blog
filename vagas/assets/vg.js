/* Vagas por Propósito · Unique Consultoria
   Base comum: cliente do Supabase, textos das analogias e utilidades. */
(function(){
  var URL_SB='https://ovlhfnzfqhmanzjpfdgj.supabase.co';
  var CHAVE='sb_publishable_gq2tAtUJWo1YkCv9Pp1ICQ_zG3HGYEt';
  var sb=window.supabase.createClient(URL_SB,CHAVE,{auth:{persistSession:true,storageKey:'vg_sessao'}});

  var SUB='A **{empresa}** está contratando um(a) **{cargo}** para o nosso time.';
  var ANALOGIAS={
    atleta:{
      nome:'Atleta', emoji:'🏃', cor:'#00e676',
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
      nome:'Lapidador', emoji:'💎', cor:'#ff2e88',
      resumo:'Para quem transforma o bruto em valioso, com técnica e paciência.',
      pergunta:'Você enxerga o brilho antes de todo mundo?',
      titulo:function(c){return 'Lapidador(a) de diamantes'+(c?' · '+c:'');},
      promessa:'Tem gente que olha uma pedra bruta e vê só pedra. E tem gente que já enxerga o diamante lá dentro, e sabe exatamente onde cortar.\n\nAqui na **{empresa}**, temos muitas pedras brutas valiosas: clientes, ideias, processos. Falta quem tenha **técnica, paciência e olho de joalheiro** para fazer cada uma brilhar. Procuramos um(a) **{cargo}** que trate o trabalho como ofício.',
      tarefas:['Cuidar de cada detalhe do trabalho até ele ficar do jeito certo','Organizar processos, informações e entregas para que nada se perca','Melhorar continuamente o jeito de fazer, com técnica e capricho','Acompanhar cada demanda do começo ao fim, sem deixar pontas soltas','Registrar o que foi feito para que o time aprenda junto'],
      perfilTexto:'Aqui na {empresa}, a gente não quer quem faz "mais ou menos". Queremos **alguém que tenha orgulho do acabamento.**\n\nO trabalho pede atenção: cada detalhe conta, e o cliente percebe quando algo foi feito com cuidado. Você vai precisar de calma para fazer bem feito e firmeza para não aceitar o "tá bom".\n\nTambém vai precisar de organização. São várias pedras sendo lapidadas ao mesmo tempo, e **nenhuma pode ficar esquecida na bancada**.',
      perfil:['Repara no detalhe torto que ninguém mais viu','Prefere refazer a entregar pela metade','Organiza a própria rotina sem precisar de cobrança','Gosta de aprender técnica e se aprofundar no assunto','Sente orgulho quando o resultado final fica bonito'],
      beneficios:['Liberdade para aperfeiçoar o próprio método','Contato direto com quem decide','Projetos que ficam com a sua assinatura','Ambiente que valoriza qualidade e capricho'],
      encerramento:'Se você enxergou o brilho, essa vaga é sua. Comece agora.',
      desafio:'Grave um vídeo de até 2 minutos mostrando algo que você melhorou ou organizou (um processo, um projeto, um espaço) e como ficou antes e depois.'
    },
    estrategista:{
      nome:'Estrategista', emoji:'♟️', cor:'#2f6bff',
      resumo:'Para quem enxerga o tabuleiro inteiro antes de mexer a peça.',
      pergunta:'Você pensa três jogadas à frente?',
      titulo:function(c){return 'Estrategista'+(c?' · '+c:'');},
      promessa:'Tem gente que joga no impulso. E tem gente que olha o tabuleiro inteiro, calcula o próximo movimento e só então mexe a peça.\n\nAqui na **{empresa}**, cada decisão tem peso. Estamos buscando um(a) **{cargo}** que goste de **números, planos e de antecipar o jogo**, alguém que não vai só executar, mas pensar junto.',
      tarefas:['Analisar números e indicadores para entender o que está funcionando','Planejar as próximas ações e organizar as prioridades da semana','Acompanhar a execução do plano junto com o time','Propor melhorias com base em dados, não só em opinião','Apresentar resultados de forma clara para a liderança'],
      perfilTexto:'Aqui na {empresa}, a gente não quer quem só apaga incêndio. Queremos **alguém que evite o incêndio antes dele começar.**\n\nVocê vai lidar com números, prazos e pessoas ao mesmo tempo. Vai precisar priorizar o que move o resultado e ter clareza para explicar o plano de um jeito que todo mundo entenda.\n\nQuando o jogo mudar (e ele muda), você mantém a calma, **recalcula a rota e segue em frente**.',
      perfil:['Antes de agir, já pensou em dois ou três cenários','Abre a planilha antes de dar opinião','Explica uma ideia complexa em poucas palavras','Fica tranquilo(a) quando o plano precisa mudar','Gosta de ver o resultado aparecer no número'],
      beneficios:['Participação nas decisões da empresa','Acesso aos números e ao planejamento','Desafios intelectuais de verdade','Crescimento para posições de liderança'],
      encerramento:'O tabuleiro está montado. Faça a sua jogada agora.',
      desafio:'Grave um vídeo de até 2 minutos explicando como você planejaria os seus primeiros 30 dias nesta vaga.'
    },
    explorador:{
      nome:'Explorador', emoji:'🧭', cor:'#ffb020',
      resumo:'Para quem gosta de mapa em branco e território novo.',
      pergunta:'Você se anima com um mapa em branco?',
      titulo:function(c){return 'Explorador(a) de novos territórios'+(c?' · '+c:'');},
      promessa:'Tem gente que precisa de trilha pronta. E tem gente que pega a bússola, escolhe a direção e abre o próprio caminho.\n\nAqui na **{empresa}**, tem muito território para conquistar: mercados, clientes e oportunidades que ninguém explorou ainda. Procuramos um(a) **{cargo}** com **coragem, curiosidade e fôlego** para ir aonde o time ainda não chegou.',
      tarefas:['Prospectar e abrir novos clientes, mercados ou oportunidades','Conversar com pessoas novas todos os dias e criar relacionamento','Testar abordagens diferentes e trazer o que funcionou','Mapear a região, os concorrentes e as oportunidades que ninguém viu','Registrar cada contato e cada descoberta para o time'],
      perfilTexto:'Aqui na {empresa}, a gente não quer quem espera o cliente aparecer. Queremos **alguém que vá até ele.**\n\nVocê vai ter autonomia, e autonomia pede disciplina: organizar a própria rota, cumprir o combinado e voltar sempre com uma história (e um resultado).\n\nVai ouvir muitos "nãos" pelo caminho. Quem explora de verdade **não desanima com o primeiro obstáculo**: aprende, ajusta a rota e segue.',
      perfil:['Puxa conversa com desconhecidos sem esforço','Não espera mandarem para começar','Trata o "não" como parte do caminho','Gosta de testar o novo e contar o que aprendeu','Se organiza sozinho(a) quando está na rua'],
      beneficios:['Autonomia para abrir novos caminhos','Liberdade para testar ideias','Visibilidade direta do seu resultado','Crescimento junto com a expansão da empresa'],
      encerramento:'O mapa está aberto. Comece a sua expedição agora.',
      desafio:'Grave um vídeo de até 2 minutos contando uma vez em que você abriu um caminho novo sozinho(a): um cliente, um projeto ou uma oportunidade.'
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

  window.VG={SUB:SUB,texto:texto,palavra:palavra,URL:URL_SB,CHAVE:CHAVE,sb:sb,ANALOGIAS:ANALOGIAS,esc:esc,slugify:slugify,brl:brl,ytId:ytId,zap:zap,toast:toast,erroPt:erroPt};
})();
