/* Vagas por Propósito · Unique Consultoria
   Base comum: cliente do Supabase, textos das analogias e utilidades. */
(function(){
  var URL_SB='https://ovlhfnzfqhmanzjpfdgj.supabase.co';
  var CHAVE='sb_publishable_gq2tAtUJWo1YkCv9Pp1ICQ_zG3HGYEt';
  var sb=window.supabase.createClient(URL_SB,CHAVE,{auth:{persistSession:true,storageKey:'vg_sessao'}});

  var ANALOGIAS={
    atleta:{
      nome:'Atleta', emoji:'🏃', cor:'#00e676',
      resumo:'Para quem vive de meta, treino e placar.',
      titulo:function(c){return 'Atleta de alta performance'+(c?' · '+c:'');},
      promessa:'Aqui não tem banco de reservas. Você entra em campo todo dia, com treino, meta clara e um time que joga junto. Se você gosta de placar, de evoluir a cada partida e de comemorar resultado, esta vaga foi escrita para você.',
      perfil:['Competitivo(a) consigo mesmo(a): quer bater a própria marca','Disciplina de treino: rotina, constância e preparo','Aceita feedback como o atleta aceita o técnico','Joga pelo time, não só pela própria estatística','Mantém o ritmo mesmo quando o placar está contra'],
      beneficios:['Plano de evolução com metas claras e acompanhamento','Treinamentos e mentoria dentro da empresa','Reconhecimento público de quem bate a meta','Um time que comemora junto']
    },
    lapidador:{
      nome:'Lapidador', emoji:'💎', cor:'#ff2e88',
      resumo:'Para quem transforma o bruto em valioso, com técnica e paciência.',
      titulo:function(c){return 'Lapidador(a) de diamantes'+(c?' · '+c:'');},
      promessa:'Temos pedras brutas valiosas: clientes, ideias e processos. Falta quem tenha técnica, paciência e olho para transformar cada uma delas em brilho. Não é só um cargo, é um ofício.',
      perfil:['Atenção aos detalhes que ninguém vê','Paciência para fazer bem feito, não só rápido','Gosto por aprender técnica e se aprofundar','Orgulho do resultado final','Organização para cuidar de várias pedras ao mesmo tempo'],
      beneficios:['Liberdade para aperfeiçoar o próprio método','Contato direto com quem decide','Projetos que ficam com a sua assinatura','Ambiente que valoriza qualidade']
    },
    estrategista:{
      nome:'Estrategista', emoji:'♟️', cor:'#2f6bff',
      resumo:'Para quem enxerga o tabuleiro inteiro antes de mexer a peça.',
      titulo:function(c){return 'Estrategista'+(c?' · '+c:'');},
      promessa:'Procuramos alguém que enxerga o tabuleiro inteiro antes de mexer a primeira peça. Que gosta de números, de planos e de antecipar o próximo movimento. Aqui você não vai só executar: vai pensar junto.',
      perfil:['Pensa antes de agir e planeja os próximos passos','Usa dados para decidir, não só a intuição','Comunica o plano com clareza para o time','Sabe priorizar o que move o resultado','Mantém a calma quando o jogo muda'],
      beneficios:['Participação nas decisões da empresa','Acesso aos números e ao planejamento','Desafios intelectuais de verdade','Crescimento para posições de liderança']
    },
    explorador:{
      nome:'Explorador', emoji:'🧭', cor:'#ffb020',
      resumo:'Para quem gosta de mapa em branco e território novo.',
      titulo:function(c){return 'Explorador(a) de novos territórios'+(c?' · '+c:'');},
      promessa:'Tem mapa em branco aqui. Mercados para abrir, clientes para conquistar e caminhos que ninguém trilhou ainda. Se você se anima com o desconhecido e volta sempre com uma história (e um resultado), seja bem-vindo(a).',
      perfil:['Curiosidade e iniciativa: não espera mandarem','Resiliência para ouvir "não" e seguir em frente','Facilidade para conversar com gente nova','Autonomia para se organizar sozinho(a)','Gosto por testar, errar rápido e ajustar'],
      beneficios:['Autonomia para abrir novos caminhos','Liberdade para testar ideias','Visibilidade direta do seu resultado','Crescimento junto com a expansão da empresa']
    }
  };

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

  window.VG={sb:sb,ANALOGIAS:ANALOGIAS,esc:esc,slugify:slugify,brl:brl,ytId:ytId,zap:zap,toast:toast,erroPt:erroPt};
})();
