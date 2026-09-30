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
