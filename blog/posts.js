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
    foto: "assets/carlos.jpg",
    titulo: "Quem é Carlos Ribeiro?",
    texto: `Sou Carlos Ribeiro, casado com a Gabriela e pai do Theo e da Alda. Sou cristão e acredito profundamente em família, responsabilidade, trabalho, propósito e legado.

Gosto de entender como as coisas funcionam e transformar ideias em algo concreto. Minha trajetória passou por áreas criativas, tecnologia, vendas, marketing e processos. Hoje, tudo isso se encontra no meu trabalho com empresas e empresários.

Antes de qualquer profissão, eu me vejo como alguém que está **construindo**. O que faço profissionalmente é consequência daquilo em que acredito.`
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
    slug: "o-dia-que-levei-a-aida-a-serio",
    capa: "assets/anuncio-bendito-seja.jpg",
    titulo: "O dia em que eu levei a técnica ==AIDA== muito a sério",
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

O primeiro anúncio da Bendito Seja foi eu e mais dois colaboradores **vestidos de noiva**.

A linha entre a criatividade e a breguice era muito tênue. O risco do ridículo era real. A gente discutiu se ia se maquiar ou não, e como ia se apresentar para não virar chacota e ser visto como algo criativo.

> Nós pensamos como você.

Essa era a mensagem. Mesmo sendo homens, editores e videomakers, a gente pensava como noiva. Não só como mulher, nem só como casal. A gente vestiu a camisa de corpo e alma para entender o que ela pensa.

## A AIDA na prática

A técnica AIDA descreve o caminho de uma venda: **Atenção, Interesse, Desejo e Ação**. Nesse anúncio, cada etapa aconteceu assim:

- **Atenção:** numa revista cheia de noivas iguais, o nosso anúncio quebrava o estereótipo. Era impossível passar direto.
- **Interesse:** a noiva parava para entender por que aqueles três homens estavam vestidos daquele jeito.
- **Desejo:** a mensagem mostrava que a gente pensava como ela, e ela queria alguém assim filmando o dia dela.
- **Ação:** ela guardava a revista e sabia a quem procurar.

O anúncio trouxe exatamente o que eu queria.

> Quando todo mundo mostra a mesma coisa, a atenção vai para quem tem coragem de ser ==diferente==.
`
  },
  {
    slug: "sala-comercial-de-alta-performance",
    video: "https://youtu.be/JDAxoq3qD8U",
    titulo: "Sala comercial de ==alta performance==",
    data: "2026-09-30",
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
