/* Vagas por Propósito · Unique Consultoria
   Base comum: cliente do Supabase, textos das analogias e utilidades. */
(function(){
  var URL_SB='https://ovlhfnzfqhmanzjpfdgj.supabase.co';
  var CHAVE='sb_publishable_gq2tAtUJWo1YkCv9Pp1ICQ_zG3HGYEt';
  var sb=window.supabase.createClient(URL_SB,CHAVE,{auth:{persistSession:true,storageKey:'vg_sessao'}});

  var ANALOGIAS={
    atleta:{
      tarefas:['Cumprir a rotina diária de contatos e atendimentos com disciplina','Acompanhar as próprias metas e o placar do dia, da semana e do mês','Participar dos treinamentos e reuniões de alinhamento do time','Registrar cada atendimento e cada resultado no sistema da empresa','Buscar evolução constante: aprender com cada "não" e com cada venda'],
      perfilTexto:'Procuramos alguém que não espera mandarem. Que trata meta como placar e treino como rotina. Que gosta de evoluir, aceita feedback como o atleta aceita o técnico e comemora o resultado do time tanto quanto o próprio.',
      desafio:'Grave um vídeo de até 2 minutos contando a maior meta que você já bateu (no trabalho, no esporte ou na vida) e o que fez para chegar lá.',
      nome:'Atleta', emoji:'🏃', cor:'#00e676',
      resumo:'Para quem vive de meta, treino e placar.',
      titulo:function(c){return 'Atleta de alta performance'+(c?' · '+c:'');},
      promessa:'Aqui não tem banco de reservas. Você entra em campo todo dia, com treino, meta clara e um time que joga junto. Se você gosta de placar, de evoluir a cada partida e de comemorar resultado, esta vaga foi escrita para você.',
      perfil:['Competitivo(a) consigo mesmo(a): quer bater a própria marca','Disciplina de treino: rotina, constância e preparo','Aceita feedback como o atleta aceita o técnico','Joga pelo time, não só pela própria estatística','Mantém o ritmo mesmo quando o placar está contra'],
      beneficios:['Plano de evolução com metas claras e acompanhamento','Treinamentos e mentoria dentro da empresa','Reconhecimento público de quem bate a meta','Um time que comemora junto']
    },
    lapidador:{
      tarefas:['Cuidar de cada detalhe do trabalho até ele ficar do jeito certo','Organizar processos, informações e entregas para que nada se perca','Melhorar continuamente o jeito de fazer, com técnica e capricho','Acompanhar cada demanda do começo ao fim, sem deixar pontas soltas','Registrar o que foi feito para que o time aprenda junto'],
      perfilTexto:'Procuramos alguém que enxerga valor onde os outros veem só a pedra bruta. Que tem paciência para fazer bem feito, olho para o detalhe e orgulho do resultado final. Gente que não se contenta com o "tá bom".',
      desafio:'Grave um vídeo de até 2 minutos mostrando algo que você melhorou ou organizou (um processo, um projeto, um espaço) e como ficou antes e depois.',
      nome:'Lapidador', emoji:'💎', cor:'#ff2e88',
      resumo:'Para quem transforma o bruto em valioso, com técnica e paciência.',
      titulo:function(c){return 'Lapidador(a) de diamantes'+(c?' · '+c:'');},
      promessa:'Temos pedras brutas valiosas: clientes, ideias e processos. Falta quem tenha técnica, paciência e olho para transformar cada uma delas em brilho. Não é só um cargo, é um ofício.',
      perfil:['Atenção aos detalhes que ninguém vê','Paciência para fazer bem feito, não só rápido','Gosto por aprender técnica e se aprofundar','Orgulho do resultado final','Organização para cuidar de várias pedras ao mesmo tempo'],
      beneficios:['Liberdade para aperfeiçoar o próprio método','Contato direto com quem decide','Projetos que ficam com a sua assinatura','Ambiente que valoriza qualidade']
    },
    estrategista:{
      tarefas:['Analisar números e indicadores para entender o que está funcionando','Planejar as próximas ações e organizar prioridades da semana','Acompanhar a execução do plano junto com o time','Propor melhorias com base em dados, não só em opinião','Apresentar resultados de forma clara para a liderança'],
      perfilTexto:'Procuramos alguém que enxerga o tabuleiro inteiro antes de mexer a peça. Que gosta de números, pensa antes de agir e sabe explicar o plano para todo mundo entender. Gente calma quando o jogo muda.',
      desafio:'Grave um vídeo de até 2 minutos explicando como você planejaria os seus primeiros 30 dias nesta vaga.',
      nome:'Estrategista', emoji:'♟️', cor:'#2f6bff',
      resumo:'Para quem enxerga o tabuleiro inteiro antes de mexer a peça.',
      titulo:function(c){return 'Estrategista'+(c?' · '+c:'');},
      promessa:'Procuramos alguém que enxerga o tabuleiro inteiro antes de mexer a primeira peça. Que gosta de números, de planos e de antecipar o próximo movimento. Aqui você não vai só executar: vai pensar junto.',
      perfil:['Pensa antes de agir e planeja os próximos passos','Usa dados para decidir, não só a intuição','Comunica o plano com clareza para o time','Sabe priorizar o que move o resultado','Mantém a calma quando o jogo muda'],
      beneficios:['Participação nas decisões da empresa','Acesso aos números e ao planejamento','Desafios intelectuais de verdade','Crescimento para posições de liderança']
    },
    explorador:{
      tarefas:['Prospectar e abrir novos clientes, mercados ou oportunidades','Conversar com pessoas novas todos os dias e criar relacionamento','Testar abordagens diferentes e trazer o que funcionou','Mapear a região, os concorrentes e as oportunidades que ninguém viu','Registrar cada contato e cada descoberta para o time'],
      perfilTexto:'Procuramos alguém que se anima com o mapa em branco. Que tem iniciativa, conversa fácil com gente nova e não desanima com o primeiro "não". Gente com autonomia para se organizar e coragem para testar o novo.',
      desafio:'Grave um vídeo de até 2 minutos contando uma vez em que você abriu um caminho novo sozinho(a): um cliente, um projeto ou uma oportunidade.',
      nome:'Explorador', emoji:'🧭', cor:'#ffb020',
      resumo:'Para quem gosta de mapa em branco e território novo.',
      titulo:function(c){return 'Explorador(a) de novos territórios'+(c?' · '+c:'');},
      promessa:'Tem mapa em branco aqui. Mercados para abrir, clientes para conquistar e caminhos que ninguém trilhou ainda. Se você se anima com o desconhecido e volta sempre com uma história (e um resultado), seja bem-vindo(a).',
      perfil:['Curiosidade e iniciativa: não espera mandarem','Resiliência para ouvir "não" e seguir em frente','Facilidade para conversar com gente nova','Autonomia para se organizar sozinho(a)','Gosto por testar, errar rápido e ajustar'],
      beneficios:['Autonomia para abrir novos caminhos','Liberdade para testar ideias','Visibilidade direta do seu resultado','Crescimento junto com a expansão da empresa']
    }
  };

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

  window.VG={palavra:palavra,URL:URL_SB,CHAVE:CHAVE,sb:sb,ANALOGIAS:ANALOGIAS,esc:esc,slugify:slugify,brl:brl,ytId:ytId,zap:zap,toast:toast,erroPt:erroPt};
})();
