# Seja Unique

Site oficial da Unique Consultoria Comercial e o Blog Seja Unique.

- `index.html`: site da Unique (página inicial).
- `assets/`: fotos do site.
- `blog/index.html`: layout do blog.
- `blog/posts.js`: nome do blog, links e todos os posts.
- `blog/assets/`: fotos dos posts.
- Banner de material no meio do post (isca de lead): `[material: Título | Texto | assets/foto.jpg | item 1; item 2 | Texto do botão](/pagina/)` em um parágrafo só. Vira um cartão escuro com a foto, a lupa animada, a lista e o botão verde.

Cada envio para a branch `main` é publicado automaticamente na Vercel.

## Prévia dos links (WhatsApp, Instagram, LinkedIn)

Depois de publicar ou editar um post, rode `python3 tools/gerar_paginas.py`.
Ele cria `blog/<slug>/`, com a capa do post como imagem da prévia.
O link para compartilhar um post é `https://sejaunique.com/blog/<slug>/`.

## Instagram (carrossel ou post único)

Recomeço em 11/10: todos os layouts antigos (impacto, duotone, temas de `tools/estilos.py`) foram descartados como referência. Não usar Canva nem gerador de imagem: tudo é desenhado em código.

Gerador atual: `tools/carrossel.py`, na pegada do bloco do Alda.CRM no relatório do diagnóstico, com as cores da Unique.
- Fundo claro com brilhos suaves (magenta, verde, marinho), cards brancos com sombra, selos em pílula, botão "Arraste" com volume, o "I" da marca como mascote.
- Montserrat do black ao fino itálico. Cores com significado: verde = afirmação, magenta = negação, marinho = estrutura.
- Ícones Tabler de traço fino guardados em `tools/icones/` (funciona sem internet).

1. Escreva `instagram/<slug>/slides.json` (tipos: capa, lista, piramide, frase, versus, passos, numero, cta; marcações no texto: `==grifo==`, `++verde++`, `--magenta--`, `//itálico fino//`, `**negrito**`).
2. `python3 tools/carrossel.py <slug>` gera as imagens 1080x1350 e a `legenda.txt`.
3. `python3 tools/instagram_pagina.py` atualiza a página https://sejaunique.com/instagram/.

**Variar o layout:** o Carlos pediu (23/10) para não repetir sempre o mesmo layout. Alterne os geradores e crie novos quando fizer sentido:
- `tools/carrossel.py`: claro, cards brancos (modelo Dra. Laura).
- `tools/editorial.py`: escuro, foto sangrada e tipografia condensada (palestra Textil Club).
- `tools/carrossel_lupa.py`: pôster escuro com foto panorâmica que continua entre os slides, lupa e etiquetas; cores cheias (cliente x lead, zona, equação, número). Usado em `antes-do-desconto`.

Modelo APROVADO pelo Carlos em 11/10: carrossel da Dra. Laura Scher (maslow-e-o-poder-da-imagem). Todos os próximos carrosséis seguem este gerador. Máximo de 2 fotos por carrossel.

## Diagnóstico de Maturidade Comercial

- `diagnostico/index.html`: formulário por etapas (https://sejaunique.com/diagnostico/). As perguntas ficam no array `ETAPAS`, no topo do script.
- `api/diagnostico.js`: guarda cada diagnóstico no mesmo Redis do blog (lista `diag:lista`).
- `diagnostico/painel/`: painel interno com a lista de respostas e botão de copiar. Precisa da variável `DIAG_SENHA` na Vercel (é a senha do painel).
- Etapas 9 a 12 avaliam os 4 pilares comerciais (prospecção, recuperação, fidelização e nutrição) com Sim / Em parte / Não. O envio já inclui o score de cada pilar (Sim = 20, Em parte = 10, Não = 0; até 100) e o score geral, que aparecem no painel.
- O visual (opção C, cartões) é gerado a partir de um modelo; para mudar perguntas, edite o array `ETAPAS` no próprio `index.html`.
- Se o envio falhar, o cliente manda as respostas preenchidas pelo WhatsApp, então nada se perde.

### Relatório e e-mail
- `diagnostico/motor.js`: a lógica de consultor. Calcula as notas (4 pilares + estrutura), o estágio, o retrato (pico, afundamento, desequilíbrio), os gargalos e escolhe 2 ações por pilar + 2 de estrutura a partir das respostas mais fracas. Os textos das ações ficam aqui.
- `diagnostico/relatorio/?r=TOKEN`: relatório interativo de cada empresa. Cada diagnóstico ganha um token secreto no envio; quem tem o link vê o relatório (sem e-mail, WhatsApp e CNPJ).
- `diagnostico/relatorio/?demo`: o mesmo relatório com respostas de exemplo.
- No painel: Ver relatório, Copiar link e E-mail pronto (HTML para colar na ferramenta de e-mail marketing, texto, assunto ou abrir no e-mail).

## Workspace Unique (`/area/admin/`)
Menu lateral com: Painel (controle e gestão), CRM (Kanban), Notificações (aprovações, comentários com lido/responder, leads sem acesso), Empresas (lista com filtros e exportação; ao abrir: pessoas, negócios, acesso, entregas, plano de ações), Contatos (Galeria com fotos ou Lista, com filtros e exportação; ao clicar abre a página inteira do contato em #contatos/<slug>|<email>, com linha do tempo, anotações `area:notas:<slug>`, cartões de negócio, blocos de ações delegadas (A fazer/Em andamento/Concluído/Cancelado) e a "Lista de Leitura · Adquirir Consciência" e o bloco Arquivos (posts do blog delegados à pessoa, `area:leit:<slug>`, que ela marca como lidos na área do cliente), voltar e anterior/próximo), Ações (tabela única), Propostas, Diagnósticos, Postagens, Videoaulas, Reuniões, Site e Alda.CRM.
- **Ações:** toda ação nasce sem cliente; na própria linha você marca um, vários ou todos. Cada cliente tem o próprio andamento e a própria data de entrega. Posts do blog aparecem como linhas prontas para compartilhar. O botão de agenda abre o Google Agenda com o evento preenchido.
- **Campos do CRM (modelo CRM B2B do Notion):** fonte única em `api/_area/campos.js`. *Empresa*: responsável, razão social, CNPJ, segmento, porte, tipo de cliente, grupo estratégico (G1–G5), frequência, status do cliente, site, e-mail, telefone, Instagram, LinkedIn, endereço, cidade, UF (+ dados do diagnóstico), com ID automático. *Pessoa* (ficha de cada contato): tipo de contato, cargo, grau de influência, Instagram, CPF, nascimento, sexo, endereço, cidade, UF, avaliou no Google, pedimos indicação, indicações. *Negócio* (vários por empresa, `area:neg:<slug>`): nome, responsável, valor, etapa (Lead → SAC), probabilidade, contatos, origem, campanha ofertada, fechou pela, datas (último contato, orçamento, fechamento esperado, próxima atividade, vendido, perda, entrega) e histórico automático. Preenchimento padronizado (`area/admin/crm-form.js`, usado no computador e no app): ao digitar o CNPJ, a Receita (BrasilAPI, reserva publica.cnpj.ws) preenche razão social, situação, abertura, CNAE, porte, endereço completo e sugere segmento (só da lista oficial de 31) e tempo de mercado; o CEP (ViaCEP, reserva BrasilAPI) preenche rua, bairro, estado e cidade; a cidade é uma lista do IBGE conforme o estado. Máscaras e validação de CNPJ/CPF (dígito verificador), CEP, telefone, e-mail, Instagram (@perfil) e site, conferidas também na API. Consultas em cache no Redis (`area:cache:*`). Foto de empresa e contato: o Instagram bloqueia consultas vindas do servidor (429/login/403, testado em produção), então a busca automática usa a conexão oficial da Meta (`api/_area/meta.js`, business_discovery, só perfis comerciais), configurada em Site → Instagram; com ela a foto entra sozinha ao preencher o @, ao abrir a ficha e no diagnóstico. Sem ela: "Abrir Instagram" + "Colar imagem" (computador) ou print + "Enviar foto" (celular, zoom até 8×). "Enviar foto" e "Ajustar" abrem o editor de enquadramento (arrastar, zoom, pinça) e salvam 320×320 JPEG e a foto fica em `area:foto:emp:<slug>` / `area:foto:p:<slug>:<email>`, servida por `?a=foto&k=…`. O CRM tem o modo "Negócios" (Kanban por etapa) no computador e no app.
- **Propostas:** feitas para empresas cadastradas ou novas; empresa nova entra como lead qualificado (pessoa sem acesso). Link público `/proposta/?p=TOKEN` (rascunho não abre). Proposta aceita move a empresa para Cliente. A proposta também aparece na área do cliente.

## Área do cliente

### Funil (Kanban), leads do diagnóstico e ações compartilhadas
- Quem responde o diagnóstico (`/diagnostico/`) entra sozinho no admin como **lead**: empresa, pessoa (sem senha, status "convite") e o relatório publicado como entrega. Ninguém recebe nada.
- No `/area/admin/`, o Kanban tem as colunas Lead, Lead qualificado, Cliente e Finalizado, com etiquetas (Textil Club, Textil Club Elite, Textil Club Advisor, Consultoria, Mentoria, Projeto, Aula CRM, Palestra, Treinamento). Arraste os cards ou use o seletor.
- "Liberar acesso" gera um link de uso único (30 dias) em que a pessoa cria a senha e já entra. O link é copiado e pode abrir o WhatsApp com a mensagem pronta.
- Ações compartilhadas (biblioteca): uma ação vai para todos os clientes ou para os marcados; cada cliente tem o próprio andamento. No plano de um cliente, "Vai para" transforma a ação em compartilhada.

- `/area/`: login (empresa + e-mail + senha) e pedido de acesso. Quem pede fica pendente até o Carlos aprovar.
- `/area/painel/`: o que o cliente vê: entregas (relatórios, diagnósticos, guias, vídeos, arquivos, links, conteúdos) e o plano de ações, em que o cliente atualiza o status.
- `/area/admin/`: painel do Carlos. Senha: `AREA_ADMIN_SENHA` ou, se não existir, a mesma `DIAG_SENHA` do painel do diagnóstico. Aprova pedidos, cria empresas, publica entregas, monta o plano de ações, troca senhas e mostra "Ver como o cliente".
- `api/area.js`: a API (mesmo Redis do blog). `api/_area/catalogo.js`: as páginas feitas aqui para cada cliente.
- `middleware.js`: tudo em `/clientes/<empresa>/` só abre para quem está logado nessa empresa (ou para o admin).
- O "slug" da empresa é o nome sem acento, espaço ou símbolo: "Textil Club" -> `textilclub`, e é o nome da pasta em `/clientes/`.
- Upload de arquivos usa o Vercel Blob (`BLOB_READ_WRITE_TOKEN`). Sem ele, a entrega de arquivo aceita um link do Google Drive.

### Página nova para um cliente
1. Crie `clientes/<slug>/<pagina>/index.html` usando `/assets/casco.css` e `/assets/casco.js` (cabeçalho e rodapé do site). Modelo: `clientes/textilclub/temperatura/`.
2. Adicione a página em `api/_area/catalogo.js` (o `id` é o nome da pasta). Ela aparece nas entregas do cliente.
3. Rode `python3 tools/og_cliente.py`: gera a capa de compartilhamento em `assets/og/` e escreve as tags de prévia na página.

### Curtidas, comentários, página pública e compartilhar
- Toda página em `/clientes/<slug>/<pagina>/` ganha sozinha (via `casco.js` -> `assets/interacao.js`) o bloco "Conversa sobre esta entrega": curtir, comentar, compartilhar e a chave "Página pública".
- No painel do cliente, cada entrega mostra ♥, 💬 e o selo "Pública", e abre o mesmo bloco.
- Página pública: o cliente da empresa ou o Carlos ligam a chave; aí o link abre sem senha. Comentários continuam só para a empresa.
- Página fechada compartilhada: o WhatsApp/Instagram/LinkedIn recebem só título, descrição e capa (o `middleware.js` reconhece os robôs de prévia); quem clica cai no login, que mostra a página que vai abrir, já preenche a empresa e volta para ela depois de entrar.
- Comentários novos dos clientes aparecem no admin em "Comentários recentes".

## Identidade visual (padrão de todas as páginas)

- `assets/tema.js` (no `<head>` de **toda** página): botão claro/escuro no cabeçalho, escolha salva e válida no site inteiro.
- `assets/casco.css` + `assets/casco.js`: tokens, tipografia, ícones, cabeçalho e rodapé padrão. Páginas novas usam os dois.
- Cores pelo significado: **magenta** = negação/dor/alerta, **marinho** = construção/método/base, **verde** = afirmação/conquista/ação.
- Tipografia: Montserrat do 100 ao 900, normal e itálico (`.leve` = 200 itálico em contraste com 800). "UN1QUE" é recurso da marca.
- Grifo (`.grifo`): linha fina abaixo da palavra, nunca faixa grossa sobre o texto.
- Ícones: Tabler (traço fino), por máscara: `<i class="ic" style="--i:var(--ic-whatsapp)"></i>` (lista em `casco.css`).
- O "I" da marca: `.I` (recorte), `.I.mag/.mar/.ver` (cores), `.tres-i` (os três lado a lado). Foto dentro do I: `<div class="I"><img …></div>`.
- Páginas de leitura e foco: `<body class="leitura">`, fundo `#111113` no escuro.
- Imagens de apoio: fotos do Carlos em `assets/fotos/`, logos de clientes em `assets/clientes/` (brancos; no claro viram pretos via CSS) e Unsplash por link (`images.unsplash.com/photo-…?w=…&fit=crop&q=…&auto=format`).
- Cases: `cases/<nome>/index.html` (modelo: `cases/clinica-brasil/`). Capa de compartilhamento: `EXTRAS` em `tools/og_cliente.py`.

### Pendências, edição e formulário antigo
- `diagnostico/perguntas.js`: lista única de perguntas (formulário, painel e relatório usam a mesma).
- `diagnostico/importar.js`: converte as respostas do Google Forms antigo para o diagnóstico novo. O que é aproximado fica marcado como "estimado"; o que não existia (os 4 pilares, dor, tipo de venda…) fica "a completar".
- Painel: "Importar do formulário antigo" (colar a planilha), "Editar respostas" e "Copiar link para completar" / "Pedir no WhatsApp".
- `/diagnostico/?completar=TOKEN`: o cliente responde só o que falta e confirma o que veio estimado. O relatório se atualiza na hora.
- O relatório mostra os pilares sem resposta como "a responder" e a nota geral como provisória até completar.

### Arquivos no Google Drive
Mesma conexão do Google Agenda, com a permissão do Drive (app Interno da sejaunique.com). Cada empresa ganha a pasta "Unique · <Empresa>" dentro de "Clientes Unique" no Drive do Carlos (`api/_area/drive.js`), compartilhada como editor com os e-mails dos contatos, sem e-mail de aviso. O bloco Arquivos aparece no contato, na empresa e na área do cliente (lista, abrir pasta, enviar até ~4 MB pelo site; maiores direto no Drive). Se a conexão for anterior ao Drive, o bloco mostra "Ligar pasta no Google Drive" (reconecta e pede a permissão).

## Materiais ricos (isca de lead)
- `comercial-atleta/`: material de apoio da palestra Comercial Atleta (https://sejaunique.com/comercial-atleta/). Mostra o Método CRM e os 4 pilares abertos; o resto (checklist diário, semana e mês, placar, conta do reativo, mensagens-base, tracker de 30 dias) libera depois do cadastro (nome, empresa, WhatsApp, e-mail). As marcações do visitante ficam salvas no aparelho dele. Tem os banners do diagnóstico e do Alda.CRM.
- `comercial-atleta/comercial-atleta.docx`: versão Word para impressão (botão na página). A página também imprime ou salva em PDF.
- `api/material.js`: recebe o cadastro. Guarda em `mat:leads`, cria a empresa como **lead** no CRM com a etiqueta **Palestra** (sem mexer em quem já existe), publica o material como entrega, inscreve na newsletter (origem `comercial-atleta`) e avisa no app. Novo material: acrescente em `MATERIAIS` no topo do arquivo (com `segmentos` quando o material tiver trilhas).
- Visualização ADM: logado no workspace (`/area/admin/`), a página abre o material completo sem cadastro, com uma barra no topo (total de cadastros, cadastros de hoje, lista dos últimos com link para a empresa no CRM e para o WhatsApp, e o botão "Ver como visitante"). Vem de `GET /api/material?a=adm&material=<id>`, que só responde para a sessão de admin.
- Capa de compartilhamento: `assets/og/comercial-atleta.jpg` (entrada em `EXTRAS` de `tools/og_cliente.py`).
- `orcamentos-parados/`: manual "Orçamentos parados · fechamento do mês" (https://sejaunique.com/orcamentos-parados/). Exclusivo para cadastrados: antes do cadastro só aparecem a capa, o sumário e o formulário. O cadastro (nome, empresa, WhatsApp, e-mail) exige o aceite de receber blog e anúncios e da LGPD; o aceite fica gravado (`consentimento`: texto, data, IP) no lead em `mat:leads` e no assinante da newsletter. Depois abrem os 3 casos (prints borrados e áudios em `orcamentos-parados/midia/`), o conteúdo, a oferta do Alda.CRM e o kit (plano de 7 dias, auditoria de 30 conversas, calculadora, gerador de oferta, mensagens).
- Capa: foto da multidão (CHUTTERSNAP / Unsplash, `orcamentos-parados/midia/multidao.jpg`) com lupa interativa que procura o cliente; layout grande, com faixas de cor por seção.
- `privacidade/`: Política de Privacidade (LGPD) linkada no aceite. Lead entra no CRM com a etiqueta **Aula CRM**.
- `estoque-parado/`: material "Estoque parado é dinheiro dormindo" (https://sejaunique.com/estoque-parado/), com 3 trilhas: Indústria, Atacado e Confecção. A pessoa escolhe o segmento nos cartões (ou pelo link `?s=industria|atacado|confeccao`) e o cadastro exige segmento + aceite LGPD. Liberado: raio-x (semáforo por idade, motivos, checklist), frentes de ação com o botão "Incluir no meu plano", 3 calculadoras (custo de deixar parado, desconto agora x segurar, meta de giro), plano de 30 dias com progresso, "Seu planejamento" (responsável e data, copiar para WhatsApp, imprimir), mensagens prontas e prevenção. Todo o conteúdo das trilhas fica no objeto `TRILHAS`, no primeiro `<script>` da página. Marcações e contas ficam salvas no aparelho, por trilha. O segmento vai junto no cadastro (`segmento` em `mat:leads`, no aviso do app e na barra ADM). Lead entra no CRM com a etiqueta **Estoque Parado**. Capa: `assets/og/estoque-parado.jpg`.
- `api/_area/biblioteca.js`: ações compartilhadas que entram sozinhas (uma única vez) na biblioteca de Ações do workspace. Já tem a ação do manual Orçamentos parados, sem cliente marcado.

## Newsletter do blog
- Formulário: `assets/newsletter.js` (`<div data-newsletter="origem" data-variante="faixa|cartao">`). Entra sozinho no rodapé de todas as páginas com `casco.js` (fora da área do cliente), no blog e na página `/links/`.
- API: `api/newsletter.js`. Assinantes no Redis (`news:assinantes`). Sem e-mail de boas-vindas: o assinante só recebe quando sai post novo.
- Envio: pelo Gmail da conta Google conectada no workspace (escopo `gmail.send`; ative a Gmail API no Google Cloud e reconecte o Google). Cada post novo em `blog/posts.js` (data dos últimos 10 dias) vira um e-mail dedicado, com link de cancelar inscrição.
- Gatilhos: toda visita ao blog chama `?a=verificar`; cron diário na Vercel (`vercel.json`); botão "Verificar e enviar agora" no admin. Na primeira verificação, os posts que já existem são só marcados (ninguém recebe post antigo).
- Admin: menu **Newsletter** em `/area/admin/` (assinantes, fila, envios, teste, CSV).

## Eventos ao vivo (treinamentos, workshops, palestras)

- `evento/index.html`: página única de inscrição (https://sejaunique.com/evento/?e=<slug>). Sem `?e=` abre o evento marcado como ativo.
- `api/_eventos.js`: **é aqui que se troca o evento**: tipo (etiqueta do banner), título, subtítulo, data, hora, cor, imagem opcional do banner, lista "o que você vai levar", `ativo` (false fecha as inscrições) e o link do Meet.
- `api/evento.js`: grava a inscrição (`ev:insc:<slug>`), cria o lead no CRM com a etiqueta do evento, inscreve na newsletter, avisa no app e devolve o link do Meet. O link nunca aparece no código da página: só sai do servidor depois do cadastro. Se o link ainda estiver vazio, a pessoa fica confirmada e o link aparece sozinho quando ela volta à página.
- Logado no workspace, o Carlos vê na página uma barra com o total de inscritos e o botão "Baixar planilha" (`/api/evento?a=csv&e=<slug>`).


## Notion como base do CRM (Fase 1: Empresa, Contato e Lead)

- Integração interna do Notion com o token em `NOTION_TOKEN` (Vercel). Bases ligadas: (EMP) Empresa, (EMP) Contato e (EMP) Leads — cada uma precisa estar conectada à integração (••• → Conexões).
- Código: `api/_area/notion.js`. Empresa ↔ `area:emp:<slug>`, Contato ↔ `area:user:<slug>:<email>`, Lead ↔ negócio em `area:neg:<slug>`. Índice `area:nmap` (id da página → registro).
- Carga inicial pelo workspace (Site → Notion): "Ver o que vai acontecer" mostra o plano sem gravar; "Aplicar" junta por CNPJ/nome (empresa), e-mail/nome (contato) e nome (negócio). Vale o Notion; o que só o painel tem completa o Notion.
- Depois da carga: toda gravação no painel vai na hora para o Notion (falhas ficam em `area:notion:fila` e são repetidas); o workspace puxa o que mudou no Notion ao abrir (no máximo 1x/min) e o cron diário (`/api/area?a=notion-cron`) faz a conferência completa (arquivados no Notion somem do painel).
- Contatos sem e-mail no Notion entram com um e-mail interno `n<id>@contato.notion` (nunca exibido, sem acesso à área). Ao preencher o e-mail no Notion, o contato passa a usar o e-mail real.
- Etapas de negócio = Etapa Funil do Notion. O Kanban de empresas acompanha o lead editado por último; mover a empresa no Kanban atualiza a Etapa Funil.
- Campos só do Carlos (CPF, bebida, comida, presente, hobbie, "da onde") ficam no admin e no Notion; nunca vão para a área do cliente.

### Página da tarefa com IA
Na (EMP) Tarefas, a coluna **Página com IA** = `Gerar` faz o painel ler o conteúdo da página, pedir à IA (Claude, via API da Anthropic) um HTML no visual da Unique e mostrar essa página para o cliente. O status volta para o Notion: `Gerando` → `Pronta` (ou `Erro`, com o motivo no cartão Notion do admin). Para refazer, marque `Gerar` de novo.
- Precisa da variável `ANTHROPIC_API_KEY` na Vercel (opcional: `ANTHROPIC_MODEL`, padrão `claude-sonnet-5-5`).
- A geração roda quando o workspace está aberto (em até 1 min) ou quando o cliente abre a área dele. Uma página por vez.
- O HTML da IA passa por uma lista de permissões (`api/_area/ia.js` → `limpa`): sem scripts, estilos ou eventos. Imagens e vídeos do Notion entram pelos marcadores `data-midia`.
- Se a IA falhar, a página anterior continua no ar.

## Papéis na empresa e "Quem vê"

Cada pessoa de uma empresa tem um papel (Empresas → Pessoas, ou na ficha do contato):

- **ADM**: vê tudo, inclusive reuniões (gravação, Drive, transcrição) e o que estiver marcado "Só ADMs".
- **Gestor**: vê o plano, as reuniões e o que estiver marcado "Gestores e ADMs".
- **Usuário**: vê o plano de ações e as entregas abertas a todos. Não vê reuniões.

Quem já tinha acesso antes dos papéis ficou como ADM. Pessoas novas entram como Usuário (dá para escolher na hora de vincular).
Cada ação e cada entrega tem o campo **Quem vê** (Todos da empresa / Gestores e ADMs / Só ADMs). A trava vale no painel, nos links diretos e nas páginas /clientes/.

## Links

Tudo tem link próprio e o voltar do navegador funciona: `#acoes/<ação>`, `#reunioes/<id>`, `#empresas/<slug>`, `#contatos/<pessoa>` no admin e `#tarefa-<id>` no painel do cliente.
O domínio oficial é **sejaunique.com**: os endereços *.vercel.app redirecionam para ele (menos /api/).

## Assistente com IA (admin)

Botão ✦ no canto de qualquer tela do admin (atalho Ctrl+J) e a página **Hoje → Assistente** em tela cheia.
- Consulta empresas, pessoas e papéis, ações, reuniões (com o conteúdo da página no Notion), negócios, vitórias e leituras (`api/_area/chat.js`).
- Para criar ou mudar algo (ação, papel, reunião, leitura, vitória), mostra um cartão; só executa quando o Carlos clica em Confirmar, reaproveitando as rotas do admin (mesmas validações e ida para o Notion).
- Anexos: imagens (também colar/arrastar), PDF e CSV/TXT. Microfone: ditado em português no navegador.
- Usa a mesma ANTHROPIC_API_KEY das páginas com IA. Conversas ficam 30 dias.

## Contratos (Vendas › Contratos)
- Modelo de contrato editável no admin, com campos `{{variavel}}` preenchidos pela proposta, pela empresa (CNPJ, razão social, endereço), pelo contato e pelos dados da Unique.
- “Contrato” no card da proposta gera o contrato; ele fica em `/contrato/?c=<token>` (página para imprimir ou salvar em PDF) e aparece nas entregas do cliente quando sai do rascunho.
- Assinatura pelo Gov.br (assinador.iti.br). Não existe API para empresa privada, então cada parte assina o PDF e sobe o arquivo na página. O cliente assina primeiro e a Unique assina por último, no mesmo PDF. O arquivo vai para a pasta da empresa no Drive (ou para o Vercel Blob).
- Quando o cliente assina, a proposta vira “aceita” e a empresa vira cliente. As notificações saem nos dois passos. As assinaturas podem ser conferidas em validar.iti.gov.br.
- Redis: `area:contratos` (hash), `area:ctr:<token>`, `area:contrato:modelo`, `area:contrato:unique`.
