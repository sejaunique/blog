# Seja Unique

Site oficial da Unique Consultoria Comercial e o Blog Seja Unique.

- `index.html`: site da Unique (página inicial).
- `assets/`: fotos do site.
- `blog/index.html`: layout do blog.
- `blog/posts.js`: nome do blog, links e todos os posts.
- `blog/assets/`: fotos dos posts.

Cada envio para a branch `main` é publicado automaticamente na Vercel.

## Prévia dos links (WhatsApp, Instagram, LinkedIn)

Depois de publicar ou editar um post, rode `python3 tools/gerar_paginas.py`.
Ele cria `blog/<slug>/`, com a capa do post como imagem da prévia.
O link para compartilhar um post é `https://sejaunique.vercel.app/blog/<slug>/`.

## Instagram (carrossel ou post único)

Cada post do blog pode virar carrossel em `instagram/<slug>/`:

1. Escreva `instagram/<slug>/roteiro.json` (tipos de slide: capa, texto, lista, frase, foto, cta; veja o topo de `tools/instagram.py`).
2. `python3 tools/instagram.py <slug>` gera as imagens 1080x1350 e a `legenda.txt`.
3. `python3 tools/instagram_pagina.py` atualiza a página https://sejaunique.vercel.app/instagram/ (com .zip e botão de postar).

### Layouts de carrossel (rodízio)
Aprovados pelo Carlos (usar em rodízio, nunca dois iguais seguidos):
- `impacto` — foto P&B + tipografia condensada (Anton) + verde. Modelo aprovado: carrossel da indicação.

Em teste (aguardando aprovação):
- `duotone` — editorial verde: foto em duotom, grade fina, serifa itálica (Lora) + Montserrat.

Regras: no máximo 2 fotos por carrossel. Fontes ficam em tools/fonts (instale em ~/.fonts antes de gerar).

## Diagnóstico de Maturidade Comercial

- `diagnostico/index.html`: formulário por etapas (https://sejaunique.vercel.app/diagnostico/). As perguntas ficam no array `ETAPAS`, no topo do script.
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
Menu lateral com: Painel (controle e gestão), CRM (Kanban), Notificações (aprovações, comentários com lido/responder, leads sem acesso), Empresas (pessoas, acesso, entregas, plano de ações), Ações (tabela única), Propostas, Diagnósticos, Postagens, Videoaulas, Reuniões, Site e Alda.CRM.
- **Ações:** toda ação nasce sem cliente; na própria linha você marca um, vários ou todos. Cada cliente tem o próprio andamento e a própria data de entrega. Posts do blog aparecem como linhas prontas para compartilhar. O botão de agenda abre o Google Agenda com o evento preenchido.
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
