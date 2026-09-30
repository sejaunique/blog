#!/usr/bin/env python3
"""Monta a página /instagram/ com os carrosséis prontos (imagens, legenda,
botões de copiar legenda, baixar e mandar para o Instagram) e o .zip de cada post.
Rode depois de tools/instagram.py:  python3 tools/instagram_pagina.py
"""
import json, os, re, subprocess, html, zipfile
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IG = os.path.join(RAIZ, "instagram")

js = "global.window={};require(%r);console.log(JSON.stringify(window.POSTS))" % os.path.join(RAIZ, "blog", "posts.js")
posts = json.loads(subprocess.check_output(["node", "-e", js]))
posts.sort(key=lambda p: p["data"], reverse=True)
limpo = lambda t: re.sub(r"==|\*\*", "", t or "")

blocos = []
for p in posts:
    pasta = os.path.join(IG, p["slug"])
    imgs = sorted(f for f in os.listdir(pasta) if re.match(r"\d\d\.png$", f)) if os.path.isdir(pasta) else []
    if not imgs:
        continue
    leg = open(os.path.join(pasta, "legenda.txt"), encoding="utf-8").read().strip()
    z = os.path.join(pasta, "carrossel.zip")
    with zipfile.ZipFile(z, "w", zipfile.ZIP_STORED) as zf:
        for f in imgs: zf.write(os.path.join(pasta, f), f)
        zf.writestr("legenda.txt", leg + "\n")
    fotos = "".join('<a href="%s/%s" target="_blank"><img src="%s/%s" alt="Imagem %d" loading="lazy"></a>' % (p["slug"], f, p["slug"], f, i + 1) for i, f in enumerate(imgs))
    blocos.append("""
<section class="post" data-slug="%(slug)s" data-imgs='%(lista)s'>
  <div class="cab"><span class="tag">%(tipo)s · %(n)d %(pal)s</span><h2>%(titulo)s</h2></div>
  <div class="tira">%(fotos)s</div>
  <div class="btns">
    <button class="btn solid js-ig">Postar no Instagram</button>
    <button class="btn js-copiar">Copiar legenda</button>
    <a class="btn" href="%(slug)s/carrossel.zip" download>Baixar tudo (.zip)</a>
  </div>
  <p class="ok" hidden></p>
  <details><summary>Ver legenda</summary><pre>%(leg)s</pre></details>
</section>""" % dict(slug=p["slug"], lista=json.dumps(imgs), tipo="Carrossel" if len(imgs) > 1 else "Post único",
                     n=len(imgs), pal="imagens" if len(imgs) > 1 else "imagem", titulo=html.escape(limpo(p["titulo"])), fotos=fotos, leg=html.escape(leg)))

PAG = """<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Instagram Unique</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
:root{--bg:#fff;--fg:#0b0b0c;--muted:#6a6a70;--line:#e6e6e8;--soft:#f4f4f5}
@media (prefers-color-scheme:dark){:root{--bg:#000;--fg:#f5f5f5;--muted:#9a9aa1;--line:#232326;--soft:#111113}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:"Montserrat",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;line-height:1.6}
.wrap{max-width:980px;margin:auto;padding:28px 16px 80px}
h1{font-size:1.8rem;font-weight:600;letter-spacing:-.02em;margin:0 0 6px}.sub{color:var(--muted);margin:0 0 32px;font-size:.92rem}
.post{border-top:1px solid var(--line);padding:28px 0}
.tag{font-size:.62rem;font-weight:600;text-transform:uppercase;letter-spacing:.14em;background:var(--soft);border:1px solid var(--line);border-radius:999px;padding:4px 12px}
h2{font-size:1.2rem;font-weight:600;margin:12px 0 16px;line-height:1.3}
.tira{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}
.tira a{flex:none;scroll-snap-align:start}.tira img{width:210px;aspect-ratio:4/5;border-radius:12px;display:block;border:1px solid var(--line)}
.btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.btn{font:inherit;font-size:.8rem;font-weight:600;border-radius:999px;padding:11px 18px;border:1px solid var(--fg);background:transparent;color:var(--fg);text-decoration:none;cursor:pointer}
.btn.solid{background:var(--fg);color:var(--bg)}
.ok{font-size:.82rem;color:var(--muted);margin:10px 0 0}
details{margin-top:12px}summary{cursor:pointer;font-size:.85rem;color:var(--muted)}
pre{white-space:pre-wrap;font:inherit;font-size:.88rem;background:var(--soft);border-radius:14px;padding:14px 16px}
</style></head><body><main class="wrap">
<h1>Instagram Unique</h1>
<p class="sub">Carrosséis prontos a partir dos posts do blog. No celular, "Postar no Instagram" copia a legenda e abre o compartilhamento com as imagens na ordem. É só escolher o Instagram e colar a legenda.</p>
%s
</main>
<script>
document.querySelectorAll('.post').forEach(function(s){
  var slug=s.dataset.slug, imgs=JSON.parse(s.dataset.imgs), leg=s.querySelector('pre').textContent, ok=s.querySelector('.ok');
  function aviso(t){ ok.hidden=false; ok.textContent=t; }
  function copiar(){ try{ return navigator.clipboard.writeText(leg); }catch(e){ return Promise.reject(e); } }
  s.querySelector('.js-copiar').onclick=function(){ copiar().then(function(){aviso('Legenda copiada.');},function(){aviso('Não deu para copiar. Abra "Ver legenda" e copie à mão.');}); };
  s.querySelector('.js-ig').onclick=function(){
    copiar().catch(function(){});
    Promise.all(imgs.map(function(f){ return fetch(slug+'/'+f).then(function(r){return r.blob();}).then(function(b){ return new File([b], slug+'-'+f, {type:'image/png'}); }); }))
      .then(function(files){
        if(navigator.canShare && navigator.canShare({files:files})){
          aviso('Legenda copiada. Escolha o Instagram e cole a legenda no post.');
          return navigator.share({files:files});
        }
        aviso('Aqui não dá para mandar direto. Use "Baixar tudo" e poste pelo celular.');
      }).catch(function(e){ if(!e||e.name!=='AbortError') aviso('Não deu para abrir o compartilhamento. Use "Baixar tudo".'); });
  };
});
</script></body></html>"""
open(os.path.join(IG, "index.html"), "w", encoding="utf-8").write(PAG % "".join(blocos))
print("página /instagram/ com", len(blocos), "posts")
