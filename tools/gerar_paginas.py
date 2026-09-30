"""Gera uma página por post em /blog/<slug>/ só para a prévia do link
(WhatsApp, Instagram, LinkedIn etc.). Quem abre o link é levado ao post.
Rode sempre que publicar ou editar um post:  python3 tools/gerar_paginas.py
"""
import json, os, re, shutil, subprocess, html

SITE = "https://sejaunique.vercel.app"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOG = os.path.join(RAIZ, "blog")

js = "global.window={};require(%r);console.log(JSON.stringify(window.POSTS))" % os.path.join(BLOG, "posts.js")
posts = json.loads(subprocess.check_output(["node", "-e", js]))

def limpo(t):
    return re.sub(r"==|\*\*", "", t or "")

def imagem(p):
    capa = p.get("capa")
    if capa:
        return capa if capa.startswith("http") else f"{SITE}/blog/{capa}"
    m = re.search(r"(?:youtu\.be/|v=|shorts/|embed/)([\w-]{11})", p.get("video", ""))
    if m:
        return f"https://img.youtube.com/vi/{m.group(1)}/hqdefault.jpg"
    return f"{SITE}/assets/og-blog.jpg"

MODELO = """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo} · Blog Seja Unique</title>
<meta name="description" content="{resumo}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Blog Seja Unique">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{resumo}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{img}">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{titulo}">
<meta name="twitter:description" content="{resumo}">
<meta name="twitter:image" content="{img}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<script>location.replace("/blog/#{slug}");</script>
<style>body{{margin:0;font-family:system-ui,sans-serif;background:#000;color:#fff;display:grid;place-items:center;height:100vh}}a{{color:#fff}}</style>
</head>
<body><p>Abrindo o post… <a href="/blog/#{slug}">clique aqui</a> se não abrir.</p></body>
</html>
"""

slugs = set()
for p in posts:
    slug = p["slug"]; slugs.add(slug)
    pasta = os.path.join(BLOG, slug)
    os.makedirs(pasta, exist_ok=True)
    e = lambda s: html.escape(s, quote=True)
    with open(os.path.join(pasta, "index.html"), "w") as f:
        f.write(MODELO.format(titulo=e(limpo(p["titulo"])), resumo=e(limpo(p.get("resumo", ""))),
                              url=f"{SITE}/blog/{slug}/", img=e(imagem(p)), slug=slug))
    open(os.path.join(pasta, ".gerado"), "w").close()

for nome in os.listdir(BLOG):
    pasta = os.path.join(BLOG, nome)
    if os.path.isdir(pasta) and os.path.exists(os.path.join(pasta, ".gerado")) and nome not in slugs:
        shutil.rmtree(pasta)

print("Páginas de prévia:", ", ".join(sorted(slugs)))
