// Páginas feitas pelo Carlos (com o Claude) para cada cliente.
// Cada empresa usa o mesmo "slug" da pasta em /clientes/<slug>/ e do login da área
// (o nome da empresa sem acentos, espaços e símbolos: "Textil Club" -> "textilclub").
// Para entregar uma página nova: crie /clientes/<slug>/<pagina>/index.html e adicione aqui.
// Essas páginas aparecem na área do cliente e só abrem para quem está logado na empresa.
//
// tipos: pagina | relatorio | diagnostico | video | arquivo | link | conteudo
// "acoes" (opcional) = ações que entram uma única vez no plano de ações da empresa (o cliente atualiza o status
// e o Carlos pode editar ou apagar no admin; apagada, não volta).
// "id" = nome da pasta. "capa" = thumbnail do link compartilhado: gere com  python3 tools/og_cliente.py
// (ele também escreve as tags de prévia na página). "chamada"/"grifo" = texto da capa (opcional).

module.exports = {
  millarabello: {
    nome: 'Milla Rabello',
    paginas: [
      {
        id: 'estrategia',
        tipo: 'relatorio',
        titulo: 'Estratégia comercial de curto prazo',
        descricao: 'Diagnóstico do e-commerce, três alavancas para recuperar a queda, plano de 30 dias com metas e a preparação da Black Friday.',
        url: '/clientes/millarabello/estrategia/',
        capa: '/assets/og/millarabello-estrategia.jpg',
        chamada: 'Estratégia comercial de curto prazo',
        grifo: 'curto prazo',
        data: '2026-10-30'
      }
    ],
    acoes: [
      {
        id: 'millarabellocarrinho',
        titulo: 'Ativar recuperação de carrinho (WhatsApp em 1h e e-mail em 24h com a foto da peça)',
        detalhe: '46 carrinhos (R$21,5 mil) sem nenhum contato. Meta: recuperar 10–15%. Ganho estimado: R$2–3 mil/mês. Semana 1 (até 06/11).',
        responsavel: 'Marketing / e-commerce',
        status: 'a_fazer',
        criado: '2026-10-30T05:00:00.000Z'
      },
      {
        id: 'millarabellopix',
        titulo: 'Lembrete de PIX antes de vencer e PIX com 5% na tela de cartão negado',
        detalhe: '14% dos PIX vencem e 17% dos cartões são negados. Meta: recuperar 1/3 dos PIX vencidos. Pedir à Pagar.me o relatório dos motivos de recusa. Semana 1 (até 06/11).',
        responsavel: 'E-commerce',
        status: 'a_fazer',
        criado: '2026-10-30T05:00:00.000Z'
      },
      {
        id: 'millarabellofrete',
        titulo: 'Barra "faltam R$X para frete grátis" com sugestão de cacharrel ou blusa e "outras cores deste modelo"',
        detalhe: '1,28 peça por pedido; 221 pedidos entre R$400 e R$499 pagando frete. Meta: voltar a 1,5 peça por pedido. Ganho estimado: R$15–17 mil/mês. Semanas 2 e 3 (até 20/11).',
        responsavel: 'E-commerce',
        status: 'a_fazer',
        criado: '2026-10-30T05:00:00.000Z'
      },
      {
        id: 'millarabellograde',
        titulo: 'Repor P/PP/M das campeãs A/A e tratar tamanhos esgotados',
        detalhe: 'Nyna, Maisa, Clara, Amara: repor. Ocultar ou ativar "avise-me" nos esgotados. Conferir Vera, Flora Bege e Dalia. Meta: zerar ruptura nas 96 peças A/A.',
        responsavel: 'Compras / estoque',
        status: 'a_fazer',
        criado: '2026-10-30T05:00:00.000Z'
      },
      {
        id: 'millarabelloreativar',
        titulo: 'Reativar as clientes "em risco" (91–180 dias) com convite para a Black Friday',
        detalhe: '441 clientes com R$298 mil em histórico. Cupom pessoal ou acesso antecipado. Meta: 5% voltam a comprar (≈R$9 mil). Semanas 2 e 3.',
        responsavel: 'Marketing / CRM',
        status: 'a_fazer',
        criado: '2026-10-30T05:00:00.000Z'
      },
      {
        id: 'millarabellobf',
        titulo: 'Black Friday como evento: pré-venda VIP 26/11 e abertura geral 27/11 às 21h',
        detalhe: 'Pré-venda para as 50 maiores e as 404 recorrentes; escassez real nas peças-família; liquidar parte da Classe C. Antes: descobrir o que gerou os picos de 27–28/07 e 21–22/08.',
        responsavel: 'Gestão + marketing',
        status: 'a_fazer',
        criado: '2026-10-30T05:00:00.000Z'
      }
    ]
  },
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
  },
  citera: {
    nome: 'Citera',
    paginas: [
      {
        id: 'meta-comissao',
        tipo: 'pagina',
        titulo: 'Meta, comissão e bonificação',
        descricao: 'Tutorial com o fluxo do mês: meta da empresa e por vendedor, comissão paga conforme o faturamento, inadimplência, bonificação por faixas e contabilidade.',
        url: '/clientes/citera/meta-comissao/',
        capa: '/assets/og/citera-meta-comissao.jpg',
        chamada: 'Meta, comissão e bonificação',
        grifo: 'bonificação',
        data: '2026-10-08'
      }
    ],
    acoes: [
      {
        id: 'citerametacomissao',
        titulo: 'Estruturar meta, comissão e bonificação do time de vendas',
        detalhe: 'Siga o tutorial "Meta, comissão e bonificação" (/clientes/citera/meta-comissao/): 1) meta da empresa com método; 2) metas por vendedor (capacidade + carteira, soma = meta da empresa); 3) decidir meta de venda x faturamento; 4) comissão paga conforme o faturamento; 5) inadimplência: a empresa cobra e honra a comissão; 6) bonificação por faixas; 7) enviar tudo para a contabilidade.',
        responsavel: 'Gestor comercial',
        status: 'a_fazer',
        criado: '2026-10-08T15:00:00.000Z'
      }
    ]
  },
  tendasaluban: {
    nome: 'Tendas Aluban',
    paginas: [
      {
        id: 'funil-atendimento',
        tipo: 'pagina',
        titulo: 'Funil de atendimento: regras de movimentação',
        descricao: 'Como cada lead anda pelas 7 etapas do funil: chatbot, régua de follow-up (5 min, 1 h, 2 h), SDR, vendedor e a regra de 48 h.',
        url: '/clientes/tendasaluban/funil-atendimento/',
        capa: '/assets/og/tendasaluban-funil-atendimento.jpg',
        chamada: 'Funil de atendimento',
        grifo: 'atendimento',
        data: '2026-10-08'
      },
      {
        id: 'chatbot',
        tipo: 'pagina',
        titulo: 'Chatbot IA: roteiro e prompt',
        descricao: 'Como a assistente virtual faz a triagem (comprar, alugar, licitação ou SAC), escolhe a unidade e passa o lead para a consultora. Com o prompt pronto para copiar.',
        url: '/clientes/tendasaluban/chatbot/',
        capa: '/assets/og/tendasaluban-chatbot.jpg',
        chamada: 'Chatbot IA: roteiro e prompt',
        grifo: 'roteiro e prompt',
        data: '2026-10-08'
      }
    ],
    acoes: [
      {
        id: 'alubanfunilatend',
        titulo: 'Implantar o funil de atendimento (7 etapas)',
        detalhe: 'Siga a página "Funil de atendimento: regras de movimentação". Falta configurar: 1) escrever os textos dos Follow-ups 1 e 2 (5 min e 1 h depois da saída do bot); 2) gravar o áudio do Follow-up 3 (2 h depois); 3) definir o script de ligação/abordagem manual do SDR para quem não respondeu; 4) configurar a regra automática de 48 h (Finalizado → Perdido). Regra de ouro: nenhum lead para em uma etapa sem dono.',
        tipo: 'material',
        dono: 'unique',
        link: '/clientes/tendasaluban/funil-atendimento/',
        status: 'a_fazer',
        criado: '2026-10-14T04:00:00.000Z'
      },
      {
        id: 'alubanchatbotia',
        titulo: 'Ativar o Chatbot IA (roteiro e prompt)',
        detalhe: 'Siga a página "Chatbot IA: roteiro e prompt". Falta definir: número(s) da consultora que recebe o resumo; se Licitação vai para outro responsável; em quanto tempo o bot volta se a consultora não assumir; cidade e WhatsApp de cada unidade (MG, GO, RN) para aluguel; para qual unidade vão Compra, Licitação e SAC; horário de atendimento. Antes de ativar, rodar o checklist de testes da página (12 itens).',
        tipo: 'material',
        dono: 'unique',
        link: '/clientes/tendasaluban/chatbot/',
        status: 'a_fazer',
        criado: '2026-10-14T04:00:00.000Z'
      }
    ]
  }
};
