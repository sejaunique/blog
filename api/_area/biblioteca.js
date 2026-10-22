// Ações compartilhadas criadas aqui (com o Claude) que entram sozinhas na biblioteca de Ações do workspace
// (area:modelos). Entram uma única vez (area:modelos-cat lembra quais já entraram): depois disso, o Carlos
// marca os clientes, edita ou apaga pelo admin normalmente, e uma ação apagada não volta.
// destino: [] = sem cliente marcado; 'todos' = vai para todos os clientes.

module.exports = [
  {
    id: 'orcamentosparados',
    tipo: 'material',
    titulo: 'Destravar os orçamentos parados e fechar o mês',
    detalhe: 'Siga o manual "Orçamentos parados" (/orcamentos-parados/) e o plano de 7 dias: 1) supervisão: ler 30 conversas do time; 2) separar cliente de lead; 3) zona de perigo: ligar para os clientes travados e o gestor decide o desconto; 4) zona de lead: case do segmento, prova, voucher e opção de entrada; 5) bonificação para o time com placar; 6) última semana: oferta com condicional (benefício + condição + prazo) só para o lote certo; 7) calendário comercial e CRM mapeado.',
    responsavel: 'Gestor comercial',
    link: '/orcamentos-parados/',
    destino: [],
    criado: '2026-10-22T23:00:00.000Z'
  }
];
