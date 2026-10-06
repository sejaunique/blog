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
- Se o envio falhar, o cliente manda as respostas preenchidas pelo WhatsApp, então nada se perde.
