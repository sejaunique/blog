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

  chamada: "Gostou? Mande para alguém que precisa ler isso.",

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
