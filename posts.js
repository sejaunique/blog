/* =========================================================
   BLOG — CONFIGURAÇÃO E POSTS
   Este é o único arquivo que você edita para publicar.
   ========================================================= */

window.BLOG = {
  nome: "Canivete de Vendas",

  abertura: {
    selo: "Blog · Unique",
    titulo: "Opiniões curtas sobre ==vender==.",
    texto: "Técnicas e estratégias de vendas do jeito que eu vejo no dia a dia com empresários. Sem tutorial, sem fórmula. Direto ao ponto."
  },

  sobre: {
    nome: "Carlos · Unique",
    foto: "assets/carlos.jpg",
    titulo: "Consultor de vendas para quem é dono do negócio.",
    texto: "Eu trabalho com empresários que querem um time que vende de verdade. Aqui eu escrevo o que penso sobre vendas, do jeito que eu falaria numa conversa de café."
  },

  chamada: "Quer levar isso para o seu time?",

  links: {
    site: "https://www.sejaunique.com",
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
   O post mais novo (pela data) aparece primeiro.
   --------------------------------------------------------- */

window.POSTS = [
  {
    slug: "ta-caro",
    titulo: "Quando o cliente diz \"tá caro\", ele não está falando de preço",
    data: "2026-09-29",
    categoria: "Técnica",
    resumo: "Na maioria das vezes, \"tá caro\" quer dizer \"eu ainda não entendi o valor\". Baixar o preço nessa hora é responder a pergunta errada.",
    texto: `
Eu ouço vendedor comemorando que "fechou com desconto" como se fosse vitória. Quase sempre não é.

Quando o cliente diz **"tá caro"**, ele está dizendo que o valor que ele enxergou ficou menor que o número que você mostrou. O problema está no ==valor percebido==, não no preço.

> Desconto responde uma objeção que o cliente não fez.

## O que eu faço no lugar

Eu devolvo com uma pergunta: **"Caro comparado com o quê?"**. A resposta mostra se ele está comparando com um concorrente, com o orçamento dele ou com a dor que ele ainda não sentiu o suficiente.

Cada uma dessas respostas pede uma conversa diferente. Nenhuma delas começa com desconto.
`
  },
  {
    slug: "meta-que-o-time-acredita",
    titulo: "Meta que o time não acredita não é meta, é desejo do dono",
    data: "2026-09-22",
    categoria: "Estratégia",
    resumo: "Número bonito na planilha não vende nada. O time precisa enxergar o caminho até ele.",
    texto: `
Todo começo de mês é igual: o dono define o número, manda no grupo e espera o milagre.

O problema é que o vendedor faz uma conta rápida de cabeça. Se ele não enxerga como chegar lá, ele desiste no dia 5 e passa o resto do mês justificando.

## Meta boa tem caminho

Uma meta que funciona responde três perguntas para o vendedor:

- Quantos clientes eu preciso atender?
- Quantas propostas eu preciso mandar?
- Quantas eu preciso fechar por semana?

Quando o número vira ==rotina de semana==, o time para de discutir a meta e começa a trabalhar nela.

> O time bate a meta que ele entende.
`
  },
  {
    slug: "follow-up-nao-e-cobranca",
    titulo: "Follow-up não é cobrança",
    data: "2026-09-15",
    categoria: "Técnica",
    resumo: "\"E aí, conseguiu ver a proposta?\" é a pior mensagem que um vendedor pode mandar.",
    texto: `
Todo mundo sabe que precisa fazer follow-up. Pouca gente sabe o que dizer nele.

"Conseguiu ver a proposta?" coloca o cliente numa posição chata: ou ele mente, ou ele se sente cobrado. Em qualquer caso, a conversa não anda.

Follow-up bom **entrega alguma coisa**: um caso parecido, um número que ele não tinha, uma ideia para o problema que ele contou na reunião.

> Se a sua mensagem não ajuda o cliente, ela só lembra que você quer vender.

Cada contato precisa ter um ==motivo para existir== além de "estou esperando sua resposta".
`
  },
  {
    slug: "venda-a-proxima-decisao",
    titulo: "Pare de vender o produto. Venda a próxima decisão.",
    data: "2026-09-08",
    categoria: "Estratégia",
    resumo: "Ninguém compra tudo de uma vez. Cada conversa precisa terminar com um próximo passo claro.",
    texto: `
Vendedor ansioso tenta fechar na primeira conversa. Cliente que não está pronto some.

Em vendas mais longas, eu penso em **uma decisão por vez**: aceitar uma reunião, mostrar para o sócio, testar por uma semana, aprovar o orçamento.

Se você termina a conversa sem um próximo passo com ==data marcada==, você não tem uma negociação. Você tem uma esperança.
`
  }
];
