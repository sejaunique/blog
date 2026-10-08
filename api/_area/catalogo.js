// Páginas feitas pelo Carlos (com o Claude) para cada cliente.
// Cada empresa usa o mesmo "slug" da pasta em /clientes/<slug>/ e do login da área
// (o nome da empresa sem acentos, espaços e símbolos: "Textil Club" -> "textilclub").
// Para entregar uma página nova: crie /clientes/<slug>/<pagina>/index.html e adicione aqui.
// Essas páginas aparecem na área do cliente e só abrem para quem está logado na empresa.
//
// tipos: pagina | relatorio | diagnostico | video | arquivo | link | conteudo
// "id" = nome da pasta. "capa" = thumbnail do link compartilhado: gere com  python3 tools/og_cliente.py
// (ele também escreve as tags de prévia na página). "chamada"/"grifo" = texto da capa (opcional).

module.exports = {
  textilclub: {
    nome: 'Textil Club',
    paginas: [
      {
        id: 'temperatura',
        tipo: 'pagina',
        titulo: 'Temperatura e etapa do funil',
        descricao: 'Guia do consultor para classificar cada contato: quente, morno ou frio, e em que degrau da esteira ele está até a Mentoria.',
        url: '/clientes/textilclub/temperatura/',
        capa: '/assets/og/textilclub-temperatura.jpg',
        chamada: 'Temperatura e etapa do funil',
        grifo: 'etapa do funil',
        data: '2026-10-07'
      }
    ]
  }
};
