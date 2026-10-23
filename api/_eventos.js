/* Eventos da Unique — a ÚNICA coisa que você troca a cada evento.
   A página /evento/ é sempre a mesma; ela lê daqui o banner (tipo, título, data, imagem).
   O link do Meet fica só aqui, no servidor: ele nunca aparece no código da página
   e só é entregue para quem termina o cadastro.

   Para um evento novo: copie um bloco, troque o "slug" e os textos, e marque "ativo: true".
   Link para divulgar:  https://sejaunique.vercel.app/evento/?e=<slug>
   (sem ?e= a página abre o evento marcado como ativo)
*/
module.exports = [
  {
    slug: 'treinamento-vendas',
    ativo: true,                              // false = inscrições fechadas
    tag: 'Treinamento',                       // etiqueta da empresa no CRM
    // ---- banner ----
    tipo: 'Treinamento de vendas',            // a etiqueta do banner: Treinamento, Workshop, Palestra, Aula ao vivo…
    titulo: 'Vender é processo,',             // primeira linha (forte)
    tituloFino: 'não sorte.',                 // segunda linha (fina e itálica)
    subtitulo: 'Um treinamento ao vivo e gratuito para vendedores: rotina, abordagem, follow-up e fechamento, do jeito que funciona no dia a dia do comercial.',
    data: '',                                 // AAAA-MM-DD (vazio = não mostra a data)
    hora: '',                                 // ex.: '19:30' (vazio = não mostra)
    duracao: '1h30',
    formato: 'Online, pelo Google Meet',
    banner: '',                               // opcional: caminho de uma imagem (ex.: /evento/banners/treinamento.jpg). Vazio = banner tipográfico
    cor: 'marinho',                           // marinho | magenta | verde | preto
    aprende: [
      'Como montar uma rotina comercial que gera venda toda semana',
      'Abordagem e diagnóstico: perguntar antes de oferecer',
      'Follow-up que não incomoda e traz o cliente de volta',
      'Como conduzir o fechamento sem dar desconto à toa'
    ],
    // ---- acesso (só no servidor) ----
    meet: ''  // cole aqui o link do Meet. Enquanto estiver vazio, quem se inscreve fica confirmado
              // e o link aparece sozinho na página assim que você preencher
  }
];
