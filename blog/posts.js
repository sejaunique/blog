/* =========================================================
   BLOG — CONFIGURAÇÃO E POSTS
   Este é o único arquivo que você edita para publicar.
   ========================================================= */

window.BLOG = {
  nome: "Blog Seja Unique",

  abertura: {
    selo: "Blog Seja Unique",
    titulo: "Opiniões curtas sobre ==vender==.",
    texto: "Técnicas e estratégias de vendas do jeito que eu vejo no dia a dia com empresários. Sem tutorial, sem fórmula. Direto ao ponto."
  },

  sobre: {
    nome: "Carlos Ribeiro",
    foto: "assets/carlos-familia.jpg",
    titulo: "Quem é Carlos Ribeiro?",
    texto: `Sou Carlos Ribeiro, casado com a Gabriela e pai do Theo e da Alda. Sou cristão e acredito profundamente em família, responsabilidade, trabalho, propósito e legado.

Gosto de entender como as coisas funcionam e transformar ideias em algo concreto. Minha trajetória passou por áreas criativas, tecnologia, vendas, marketing e processos. Hoje, tudo isso se encontra no meu trabalho com empresas e empresários.

Antes de qualquer profissão, eu me vejo como alguém que está **construindo**.

**O que faço profissionalmente é consequência daquilo em que acredito.**

- Fundador da Unique Consultoria Comercial
- Sócio Proprietário do Alda.CRM
- Mentor comercial da Têxtil Club Academy
- Criador do Método CRM: Comportamento Repetido Muda
- Especialista em processos de vendas, CRM e automações comerciais`
  },

  chamada: "Gostou? Mande para alguém que precisa ler isso.",

  links: {
    site: "/",
    instagram: "https://www.instagram.com/sejauniqueoficial",
    whatsapp: "https://wa.me/5562996007574"
  }
};

/* ---------------------------------------------------------
   COMO ESCREVER UM POST (dentro do campo texto)
   - Parágrafo: deixe uma linha em branco entre um e outro
   - Subtítulo:        ## Meu subtítulo
   - Frase em destaque: > A frase
   - Negrito:          **palavra**
   - Grifo verde:      ==palavra==
   - Lista:            - item (um por linha)
   - Foto:             ![Legenda da foto](assets/minha-foto.jpg)
   - Vídeo:            [video](https://youtu.be/XXXXXXXXXXX)
                       [video: legenda do vídeo](https://youtu.be/XXXXXXXXXXX)
   - Link:             [texto do link](https://site.com)
   Capa: use  capa: "assets/foto.jpg"  ou  video: "link do YouTube"
   (o vídeo vira a capa do post e a miniatura aparece na lista).
   O post mais novo (pela data) aparece primeiro.
   --------------------------------------------------------- */

window.POSTS = [
  {
    slug: "seu-cliente-nao-conhece-seu-mix",
    capa: "assets/capa-colete.jpg",
    titulo: "Ele comprou a polo com você. E o colete, com o ==concorrente==.",
    data: "2026-10-02",
    categoria: "Estratégia",
    resumo: "O cliente compra o que ele sabe que você vende. Se ele não conhece o seu mix, ele vai comprar do vizinho e você nem fica sabendo.",
    texto: `
Quem tem empresa sabe que boa parte dos clientes que voltam chegou por indicação. Alguém confiou em você e mandou outra pessoa.

O problema é o que acontece depois.

## A história da camisa polo

Uma alfaiataria de uniformes, cliente da Unique, recebe uma indicação: "Fala com eles, a camisa polo deles é muito boa."

O cliente chega, compra as polos, gosta e volta para comprar de novo.

Meses depois, ele precisa de coletes de treinamento para a equipe nova. E vai procurar **outra empresa**.

Não porque ficou insatisfeito. Porque ==ele não sabia que a alfaiataria também fazia colete==. Na cabeça dele, ela era "a empresa da polo".

> O cliente compra o que ele sabe que você vende. Não tudo o que você vende.

## A indicação chega com um rótulo

Quem indica fala do produto que comprou. E o cliente novo guarda a sua empresa com esse rótulo.

Se ninguém mostra o resto, o rótulo fica. E aí acontece o pior: você perde a venda e ainda abre a porta para o concorrente entrar no seu cliente. A disputa deixa de ser por cliente novo e vira uma ==guerra de preço entre fornecedores pelo mesmo cliente==.

## Primeiro: mostre o mix inteiro

O cliente precisa ver tudo o que você faz, e não só ouvir falar.

- Tenha um catálogo atualizado, com fotos reais dos produtos em uso
- Apresente o mix na primeira compra, na entrega e no pós-venda
- Mostre os produtos no Instagram e no status do WhatsApp, com gente usando

![O colete de treinamento nas costas: o tipo de foto que mostra o produto em uso.](assets/colete-costas.jpg)

Foi isso que a alfaiataria fez: produziu fotos do colete de treinamento em uso. Isso não é só conteúdo. É ==material de venda==.

## Depois: ative a base que você já tem

Aqui é onde muda o jogo.

Com o material pronto, a alfaiataria não precisa esperar o cliente lembrar dela. Ela olha para a própria base: quem já é cliente e quem tem a necessidade mapeada. Por exemplo, empresas que contratam com frequência e precisam identificar quem está em treinamento.

Se a qualificação foi bem feita, a empresa **sabe** quem precisa daquele colete. Aí é só montar uma mala direta (WhatsApp, e-mail ou ligação) e oferecer exatamente aquilo para exatamente aquele cliente.

![Material de apoio pronto vira oferta para a base de clientes.](assets/colete-lado.jpg)

## Venda passiva x venda ativa

- **Passiva:** você espera o cliente lembrar de você e pedir
- **Ativa:** você sabe do que o cliente precisa e chega primeiro com a oferta certa

> A partir de agora, a gente ativa vendas. Não fica mais esperando o cliente lembrar.

## Faça o teste hoje

Pergunte para os seus 5 últimos clientes: "Você sabe tudo o que a gente faz?"

Se a maioria não souber, você não tem um problema de demanda. Você tem dinheiro parado dentro da própria carteira.
`
  },
  {
    slug: "contratei-de-madrugada",
    capa: "assets/silvia-capa.jpg",
    titulo: "O dia em que eu contratei alguém ==às 2h da manhã==",
    data: "2026-09-30",
    categoria: "Gestão",
    resumo: "86 candidatos, 12 que seguiram a instrução e uma ligação de madrugada. Não contrate currículo. Contrate comportamento.",
    texto: `
Na Bendito Seja Filmes, eu precisava de uma gestora de marketing. Alguém que pegasse as minhas ideias e transformasse em realidade.

Se eu publicasse "vaga para gestor de marketing", eu ia receber o que todo mundo recebe: uma pilha de currículos iguais, de gente interessada no salário.

## Primeiro, eu vendi a vaga

A mente humana trabalha com rótulos. Quando você muda o rótulo, muda o valor que a pessoa enxerga.

Então eu não anunciei um cargo. Eu anunciei uma missão: ==precisa-se de pessoas capazes de transformar uma pedra bruta em diamante==.

Em vez de um anúncio comum, fiz uma página que contava uma história. Começava pelo propósito e só depois mostrava os detalhes da vaga.

## Depois, eu filtrei comportamento

Não pedi currículo. Pedi que a pessoa respondesse **por que aquela vaga deveria ser dela**, e deixei uma instrução no final do vídeo para saber quem tinha assistido até o fim.

- **86 candidatos** se inscreveram.
- Só **12** mandaram a resposta que eu pedi.

Currículo mostra histórico. O que eu queria ver era execução.

## A ligação das 2h da manhã

Liguei para os 12 às duas horas da manhã.

![](assets/carlos-ligacao.jpg)

Eu não queria alguém que trabalhasse de madrugada. Eu queria alguém que **não se importasse com horário, e sim com o resultado**. A reação de cada um àquela ligação me disse mais do que qualquer entrevista.

## O teste do restaurante japonês

Quem passou recebeu um desafio: criar o conceito de um restaurante japonês.

A candidata comum entregou uma fachada simples, foco em desconto e um diferencial genérico: vender comida.

A **Silvia** criou o **Dip**. Um nome que vinha de onomatopeia, ingredientes de pequenos produtores, horta própria, cuidado com a experiência do cliente e uma identidade visual coerente em todas as peças.

O teste não mediu técnica. Mediu ==o tamanho da mente== de cada um.

## O resultado

A Silvia entrou com uma pretensão salarial de **R$ 1.200**. Virou peça fundamental no negócio e passou a ganhar **25% do faturamento**.

> Não contrate currículo. Contrate comportamento.

Contratação é venda. Se você trata a vaga como um anúncio qualquer, atrai gente qualquer. Se você vende a vaga e filtra comportamento, quem chega ao final é alguém que já provou que quer estar ali.

[video: Como eu vendi a vaga](https://www.youtube.com/watch?v=FRX0H1b-OG8)

[video: O resultado do teste do restaurante japonês](https://youtu.be/NsnpfEYWloc)
`
  },
  {
    slug: "crm-nao-e-software",
    capa: "assets/capa-crm.jpg",
    titulo: "CRM não é software. É ==Comportamento Repetido Muda==",
    data: "2026-09-30",
    categoria: "Cultura",
    resumo: "Empresas trocam de sistema, de vendedor e de preço. Raramente trocam a rotina. E é a rotina que trava o crescimento.",
    texto: `
Empresas não quebram por falta de produto. Não travam por falta de mercado. E raramente deixam de vender por falta de esforço.

Elas travam porque repetem **comportamentos errados todos os dias**, e chamam isso de rotina.

## O cansaço do improviso

Se você é dono ou gestor, talvez reconheça isso:

- cada mês começa com esperança e termina com ansiedade;
- algumas vendas grandes salvam o resultado, mas você não sabe exatamente por quê;
- quando um vendedor sai, o faturamento treme;
- quando você entra na venda, as coisas andam. Quando se afasta, o comercial desacelera.

Isso não é azar. É ==improviso estruturado==. E o perigo do improviso é que ele funciona no curto prazo. Por isso ele se perpetua.

## A solução errada

Quando o resultado não vem, a empresa troca o vendedor, o gerente, o sistema, o discurso, o preço. Raramente troca **o comportamento diário**.

É mais fácil mudar a ferramenta do que a rotina. É mais rápido dar desconto do que qualificar melhor.

## CRM nasce no comportamento

O mercado ensinou que CRM é um sistema para organizar clientes e controlar vendedor. Essa visão é rasa.

Um CRM só funciona quando existe disciplina de etapas, rotina de acompanhamento e intenção em cada conversa. Sem isso, qualquer ferramenta vira um ==lugar bonito para esconder bagunça==.

> CRM não é software. CRM é Comportamento Repetido Muda.

## O problema não é gente. É rotina.

O vendedor não acorda querendo bagunçar o CRM. Ele aprende que pode preencher depois. O dono não acorda querendo entrar na venda. Ele aprende que, sem ele, o número não sai.

Comportamento repetido vira cultura. Para o bem ou para o mal.

Em 90 dias de rotina bem aplicada, uma empresa descobre onde perde dinheiro, quem realmente performa e se o preço é problema ou desculpa. Isso não vem de feeling. Vem de **consistência**.

> Você não precisa de um sistema novo. Precisa repetir o comportamento certo até ele vender por você.
`
  },
  {
    slug: "indicacao-preco-camarada",
    capa: "assets/capa-indicacao.jpg",
    titulo: "“Ele disse que você faria um ==preço camarada==”",
    data: "2026-09-30",
    categoria: "Técnica",
    resumo: "Quem te indica é um vendedor que você não contratou. E quase sempre a recompensa dele é um obrigado. Ou nada.",
    texto: `
Todo dono de empresa já ouviu essa frase: "Estou aqui porque o Fulano me indicou. Ele disse que você faria um ==preço camarada==."

A indicação chega, a venda acontece e o Fulano recebe, no máximo, um obrigado.

Só que, se ele convenceu uma pessoa a comprar de você, ele pode convencer outras. Ele não é só um cliente satisfeito. É um **vendedor que você não contratou**.

## O que eu fiz numa ligação

Um cliente meu indicou outro. Em vez de mandar uma mensagem de agradecimento, eu liguei para ele e perguntei:

> Por que você está me indicando?

Essa pergunta faz o cliente dizer em voz alta por que gosta do seu trabalho. Ele reforça o valor para ele mesmo, e você ganha um depoimento espontâneo. No meu caso, ele lembrou que eu tinha entregado "em 5 minutos nome, telefone e decisor" de um cliente que ele precisava.

Depois veio a segunda pergunta:

> O que você quer ganhar com essa indicação?

Ele tentou fugir: "não precisa". Eu insisti. E combinei: ==se o Danilo fechar, o presente já está garantido==.

## Por que isso funciona

- **Ligar, e não mandar mensagem:** a voz gera atenção e conexão que o texto não gera.
- **Deixar o cliente escolher o prêmio:** cria expectativa e dá autonomia.
- **Condicionar ao fechamento:** o cliente passa a torcer pela venda, e às vezes até ajuda a fechar.
- **Ensinar o cliente a fazer igual:** ele leva a técnica para a empresa dele, e a indicação vira rede.

## Os erros mais comuns

- só agradecer;
- mandar mensagem em vez de ligar;
- dar o prêmio sem condição;
- premiar sem estratégia, e aí vira custo, não investimento.

> Relacionamento só vira ativo quando você trata a indicação como canal de venda.
`
  },
  {
    slug: "o-dinheiro-esta-nos-orcamentos",
    capa: "assets/capa-fecha-tudo.jpg",
    titulo: "O dinheiro do mês está nos ==orçamentos que você já mandou==",
    data: "2026-09-30",
    categoria: "Estratégia",
    resumo: "Antes de caçar cliente novo, olhe para o que ficou parado. A Missão Fecha Tudo é o sprint que eu uso na última semana do mês.",
    texto: `
Chega a última semana do mês, a meta está longe e o time corre atrás de cliente novo.

Enquanto isso, o dinheiro está parado no próprio funil.

## Onde está o dinheiro

Antes de prospectar, procure:

- clientes que disseram "me chama depois";
- orçamentos enviados sem resposta;
- negociações que esfriaram;
- clientes recorrentes que ainda não repuseram estoque;
- objeções que nunca receberam uma nova tentativa;
- clientes que visualizaram e não responderam.

Tudo isso já passou pela parte mais cara da venda: o cliente já te conhece e já recebeu proposta. Falta ==uma última tentativa==.

## A Missão Fecha Tudo

Na última semana do mês, eu transformo isso num sprint com pontuação:

- **cliente novo:** 10 pontos;
- **cliente recorrente:** 7 pontos;
- **recuperou uma objeção:** +3;
- **destravou uma negociação parada:** +2.

O bônus só vale para objeções e negociações que já existiam antes do sprint. A ideia é ir atrás do que ficou para trás, e não criar problema novo para resolver depois.

Tem prêmio individual para quem mais pontua e uma meta coletiva em que todo mundo ganha junto. Competição saudável, mas time que compartilha oportunidade.

## A pergunta antes de fechar o dia

> Existe alguém que ainda não recebeu uma última tentativa minha?

Se a resposta for sim, ainda tem trabalho a fazer.

Não vence quem começou melhor. Não vence quem recebeu os clientes mais fáceis. **Vence quem executou.**
`
  },
  {
    slug: "o-atendente-reage-o-vendedor-conduz",
    capa: "assets/capa-atendente.jpg",
    titulo: "O atendente reage. O vendedor ==conduz==",
    data: "2026-09-30",
    categoria: "Técnica",
    resumo: "Responder WhatsApp rápido não é vender. Tem time inteiro trabalhando como atendente e achando que está vendendo.",
    texto: `
Existe uma confusão grave no mercado: achar que atendimento rápido é venda eficiente.

Responder WhatsApp rápido não é vender. Responder todas as notificações não é estratégia. Estar sempre disponível não é controle.

## Os dois modos

O **atendente** trabalha no modo vertical:

> notificação → resposta → próxima notificação

O **vendedor** trabalha no modo horizontal:

> etapa → intenção → próximo passo

O atendente responde perguntas. O vendedor ==cria caminho==.

## Como saber em qual modo seu time está

- a conversa termina quando o cliente para de perguntar;
- ninguém sabe dizer em que etapa cada negociação está;
- o vendedor não termina a mensagem com uma pergunta ou um próximo passo;
- o CRM parece burocracia.

Se isso soa familiar, seu time está atendendo, não vendendo.

## Por que o CRM parece chato

Enquanto o time atua como atendente, o CRM sempre vai parecer burocrático. Porque ele foi feito para **organizar estratégia**, não reação.

Quando o vendedor sabe qual é a intenção de cada conversa e qual é o próximo passo, preencher o CRM deixa de ser tarefa e vira mapa.

> Toda conversa precisa terminar com o cliente um passo mais perto da decisão.
`
  },
  {
    slug: "o-dia-que-me-vesti-de-noiva",
    capa: "assets/anuncio-bendito-seja.jpg",
    titulo: "O dia em que eu me vesti de ==noiva==",
    data: "2026-09-30",
    categoria: "Técnica",
    resumo: "Numa revista cheia de noivas bonitas e iguais, o anúncio da Bendito Seja trazia três homens vestidos de noiva.",
    texto: `
Uma das empresas que eu tive se chama **Bendito Seja Filmes**. Entrei no mercado de casamentos e sempre explorei a criatividade. Eu queria fugir do óbvio no filme que os noivos recebiam.

Esse era o nosso diferencial: ==criatividade, inovação e, principalmente, ousadia==.

## A revista que todo mundo precisava estar

Naquela época, anunciar em revista de casamento era normal e muito valioso. Estar ali dava um ar de **autoridade**: se você estava na revista, era uma empresa séria, que tinha condição até de pagar aquele anúncio.

A revista também estava onde a noiva estava. Ela folheava na sala de espera e ganhava um exemplar para levar para casa, como um guia de fornecedores de casamento. Anunciar ali era praticamente obrigatório.

O problema é que todos os anúncios eram iguais: noiva bonita, chique, elegante, dentro do padrão. Você virava a página e encontrava a mesma coisa.

## Três homens vestidos de noiva

Então o primeiro anúncio da Bendito Seja foi eu e mais dois colaboradores **vestidos de noiva**.

A linha entre a criatividade e a breguice era muito tênue. O risco do ridículo era real. A gente discutiu se ia se maquiar ou não, e como ia se apresentar para não virar chacota e ser visto como algo criativo.

> Nós pensamos como você.

Essa era a mensagem. Mesmo sendo homens, editores e videomakers, a gente pensava como noiva. Não só como mulher, nem só como casal. A gente vestiu a camisa de corpo e alma para entender o que ela pensa.

No meio de tantas noivas iguais, o nosso anúncio quebrava o estereótipo. Era impossível virar a página sem parar nele. O anúncio trouxe exatamente o que eu queria.

## No fundo, foi só AIDA

Nada mais é do que a técnica **AIDA** aplicada na prática:

- **Atenção:** três homens vestidos de noiva numa revista em que todo anúncio era igual.
- **Interesse:** a noiva parava para entender o porquê daquilo.
- **Desejo:** a mensagem mostrava que a gente pensava como ela, e ela queria alguém assim filmando o dia dela.
- **Ação:** ela guardava a revista e sabia a quem procurar.

> AIDA não é teoria de livro. É o caminho que qualquer pessoa percorre antes de comprar.

## Dá para aplicar em qualquer lugar

Você não precisa se vestir de noiva. Mas pode usar a mesma lógica em tudo o que coloca na frente do cliente:

- **Abordagem:** comece com uma pergunta ou uma frase que o cliente não espera ouvir, não com "tudo bem? posso te apresentar nossa empresa?".
- **Site:** a primeira tela precisa prender em três segundos. Fale da dor do cliente antes de falar de você.
- **Postagem:** a primeira linha e a imagem decidem se a pessoa para de rolar o feed. Se parecer com todo o resto, ela passa direto.
- **Outdoor:** a pessoa tem poucos segundos. Uma imagem que quebra o padrão e uma frase curta valem mais que uma lista de serviços.
- **WhatsApp e proposta:** abra com o problema dele, mostre o que muda na vida dele e termine com um próximo passo claro.
- **Vitrine ou ponto de venda:** o que está na frente precisa fazer a pessoa entrar. Dentro, o atendimento cuida do interesse e do desejo.

Antes de publicar qualquer coisa, faça quatro perguntas: isso chama a atenção? Desperta interesse? Faz a pessoa querer? Deixa claro o que ela faz agora?

> Quando todo mundo mostra a mesma coisa, a atenção vai para quem tem coragem de ser ==diferente==.
`
  },
  {
    slug: "sala-comercial-de-alta-performance",
    capa: "assets/sala-comercial-capa.jpg",
    video: "https://youtu.be/JDAxoq3qD8U",
    titulo: "Sala comercial de ==alta performance==",
    data: "2026-09-28",
    categoria: "Cultura",
    resumo: "Transforme o ambiente, eleve a performance: vendas que nascem do espaço certo.",
    texto: `
## O ambiente que transforma comportamento em resultado

A maioria das empresas tenta melhorar vendas investindo em CRM, treinamento e marketing. Mas ignora um fator silencioso e extremamente poderoso: **o ambiente onde o time trabalha todos os dias.**

![O ambiente comum: cada vendedor isolado na sua mesa](assets/sala-comum.jpg)

> Você não constrói performance só com estratégia. Você constrói com ambiente.

## O objetivo dessa estrutura

Não é deixar o escritório bonito. É criar um espaço que **estimule foco, ritmo e aprendizado constante**, a ponto de o resultado virar consequência natural.

Quando o ambiente é certo, o vendedor:

- procrastina menos;
- aprende mais rápido;
- entra em ação com mais frequência.

## O layout que muda o jogo

O modelo mais eficiente para times comerciais B2B é o **layout central**:

- uma mesa central;
- três vendedores de cada lado, todos frente a frente;
- o supervisor na ponta;
- uma TV visível para todo mundo.

![Layout central: mesa única, time frente a frente e placar do dia na TV](assets/sala-mesa-central.jpg)

Simples, mas extremamente estratégico. Ele ativa três coisas que fazem qualquer time vender mais:

- **Competição natural:** ninguém quer ser o mais lento da mesa.
- **Aprendizado por observação:** você aprende vendo o outro vender.
- **Ritmo coletivo:** quando um acelera, puxa os outros.

E o mais importante: ele ==elimina o isolamento==.

## Equipamentos que parecem detalhe (mas não são)

![Fone com isolamento: concentração e menos ruído entre ligações](assets/sala-fones.jpg)

**Fones com isolamento.** Sem eles, o ambiente vira ruído. Com eles, você tem concentração, clareza na comunicação e menos interferência entre ligações. O resultado direto é mais qualidade na venda.

**Webcam boa.** Em venda B2B, muita coisa acontece por videochamada. Boa imagem e boa luz aumentam a percepção de profissionalismo e deixam a reunião mais fluida. Isso mexe com a credibilidade, a atenção e o rapport, porque a expressão facial fica clara. Parece detalhe, mas é um multiplicador de conversão.

![Duas telas](assets/sala-duas-telas.jpg)
![Superwide](assets/sala-superwide.jpg)

**Duas telas por vendedor (ou uma superwide).** Uma tela só obriga o cérebro a ficar alternando tarefas, e isso gera perda de foco, lentidão e mais erro. Com duas telas, uma fica no CRM e a outra na conversa ou na proposta. O ganho aqui é **produtividade pura**.

## O supervisor define o jogo

Não adianta layout bom com liderança fraca. O supervisor não pode ser um "chefe de cadeira". Ele precisa ser um **líder de campo**:

- circular o tempo todo;
- ouvir ligações;
- entrar em negociações quando necessário;
- corrigir na hora.

Porque feedback tardio é aprendizado lento.

## A TV não é decoração

![A TV como cérebro visual da operação: metas, ranking e funil](assets/sala-tv.jpg)

Ela é o cérebro visual da operação. Ali devem aparecer:

- o ranking do time;
- as metas do dia;
- alertas de performance;
- mensagens curtas de ativação.

Isso gera algo poderoso: ==urgência visível==. E urgência gera ação.

## O que mantém o ambiente funcionando

Ambiente bom sem rotina vira bagunça. A operação precisa de ritmo:

- **Power hours:** blocos de foco total, por exemplo das 9h às 11h. Execução pura.
- **Aquecimento diário:** antes de começar, treinar abordagem, revisar objeções e alinhar metas. O vendedor entra preparado, e não improvisando.
- **Pós-bloco:** pequenos ajustes sobre o que funcionou, o que travou e o que precisa mudar. Melhoria contínua em tempo real.

## A sala também é uma escola

Um erro clássico é separar "treinamento" de "operação". Os melhores times fazem o contrário e usam o próprio ambiente para ouvir ligações reais, simular negociações, corrigir na hora e ensinar na prática.

Aprendizado aplicado vale muito mais que teoria.

## As paredes também vendem

Pode parecer detalhe, mas o ambiente visual influencia comportamento.

![Vision board, frases estratégicas e técnicas de venda nas paredes](assets/sala-paredes.jpg)

- **Metas emocionais:** casa, carro, família, viagem. Conecta o esforço com o propósito.
- **Frases estratégicas:** nada de frase bonita e vazia. Use coisas como "sem atividade não há resultado" e "disciplina vence motivação".
- **Técnicas visuais:** quebra de objeção, estrutura de fechamento e perguntas-chave, para consulta rápida no meio da venda.
- **Painel de metas:** evolução diária e progresso do mês. O cérebro responde melhor ao que ele vê.

## As regras que sustentam tudo

Sem isso, o sistema quebra:

- clareza de comportamento (hora de foco e hora de interação);
- controle de ruído;
- ritmo constante;
- liderança ativa.

## No final, o que isso realmente é?

Não é sobre mesa. Não é sobre cadeira. Não é sobre estética. É sobre **comportamento, pressão positiva, estímulo constante e execução em alta intensidade**.

> Se o ambiente não empurra o vendedor para vender, ele puxa o vendedor para baixo.

É isso que separa empresas comuns de times de alta performance: elas não deixam o ambiente ao acaso. Elas constroem o ambiente de forma estratégica.

[video](https://youtu.be/JDAxoq3qD8U)

[video](https://www.youtube.com/watch?v=ELd5QDM54NM)
`
  },
  {
    slug: "mercado-livre-netflix",
    capa: "assets/mercado-livre-netflix.jpg",
    titulo: "Mercado Livre e Netflix se uniram. Com quem a sua empresa pode ==somar==?",
    data: "2026-09-29",
    categoria: "Estratégia",
    resumo: "Um tem a tela, o outro sabe quem compra. Eu já fiz uma collab parecida com uma caixa de chocolates, e agora estou pensando em uniformes.",
    texto: `
O Mercado Livre e a Netflix anunciaram uma parceria de publicidade no Brasil e no México. Um tem a tela. O outro sabe quem compra. Separados, cada um tem metade. Juntos, eles fecham a conta.

## Como funciona

- **Dados de compra:** quem anuncia pode segmentar campanhas pelo comportamento de compra de mais de 131 milhões de compradores do Mercado Livre por ano.
- **Onde aparece:** os anúncios rodam no plano da Netflix com publicidade, nos dois países.
- **Resultado medido:** a marca consegue ver se quem assistiu ao anúncio comprou de verdade dentro do Mercado Livre.
- **Ecossistema:** a Netflix entra numa rede que já tem Disney+, HBO Max e Roku.

## Eu já fiz isso, em pequena escala

Antes da consultoria, eu tinha a **Bendito Seja Filmes**, uma empresa de filmes de casamento. Eu queria que a minha proposta fosse diferente de todas as outras que os noivos recebiam.

Então eu fiz uma collab com a **Brigadeiria das Meninas**. A minha proposta chegava dentro de uma caixa com chocolates extraordinários. Ela queria mostrar que vendia chocolate, e o meu público era exatamente o público ideal dela.

![A proposta da Bendito Seja Filmes dentro da caixa de chocolates da collab com a Brigadeiria das Meninas](assets/collab-bendito-seja.jpg)

Eu tive uma proposta diferenciada ==sem gastar nenhum real==. Ela colocou os chocolates dela nas mãos de quem ia casar.

## A ideia que eu estou pensando agora

Hoje eu atendo muitas empresas do setor têxtil. E eu fiquei pensando: por que não **vestir as empresas de RH**?

Funciona assim: o uniforme vai de graça para a empresa de RH. Em troca, ela compartilha a base dela para uma prospecção inteligente. Uma empresa de RH sabe coisas que nenhuma lista comprada sabe:

- quais empresas têm **turnover** alto;
- qual é a taxa de **admissão e readmissão** de cada uma;
- quem está contratando agora e vai precisar de uniforme.

E dá para ir além: quem contratar a empresa de RH ganha um **voucher de desconto no uniforme**. A collab passa a vender para os dois lados.

![Profissionais uniformizados de vários setores](assets/uniformes.jpg)

## A pergunta que fica

Da mesma forma que a Netflix e o Mercado Livre se uniram, com um somando no objetivo do outro: quem pode somar com a sua empresa a partir de agora?

A soma pode ser várias coisas. Pode ser você servir de ==escada== para outra empresa ser vista. Pode ser troca de favores. Pode ser troca de clientes.

> O importante é que a conta nunca divida nem subtraia. Ela precisa sempre somar e multiplicar.

Fonte da notícia: [Meio & Mensagem](https://www.meioemensagem.com.br/midia/como-funciona-a-parceria-entre-netflix-ads-e-mercado-ads)
`
  }
];
