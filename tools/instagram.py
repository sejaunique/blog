#!/usr/bin/env python3
"""
Gera as imagens do Instagram (carrossel ou post único) a partir de um roteiro.

Uso:
  python3 tools/instagram.py <slug>          # um post
  python3 tools/instagram.py --todos         # todos os roteiros

Roteiro: instagram/<slug>/roteiro.json
{
  "formato": "carrossel" | "unico",
  "legenda": "texto da legenda com hashtags",
  "slides": [
    {"tipo":"capa","img":"blog/assets/x.jpg","titulo":"Título com ==grifo==","tag":"Técnica"},
    {"tipo":"texto","titulo":"...","texto":"..."},
    {"tipo":"lista","titulo":"...","itens":["...","..."]},
    {"tipo":"frase","texto":"..."},
    {"tipo":"foto","img":"blog/assets/y.jpg","titulo":"...","texto":"..."},
    {"tipo":"fotofundo","img":"blog/assets/z.jpg","titulo":"...","texto":"..."},
    {"tipo":"cta","titulo":"...","texto":"..."}
  ]
}
Saída: instagram/<slug>/01.png, 02.png ... (1080x1350) e legenda.txt
Depois rode tools/instagram_pagina.py para atualizar a página /instagram/.
"""
import json, os, re, sys, html, base64, mimetypes
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from marca import LOGO, MARK

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H = 1080, 1350
ARROBA = "@sejauniqueoficial"

def inline(t):
    t = html.escape(t or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"==(.+?)==", r'<span class="g">\1</span>', t)
    return t.replace("\n", "<br>")

def img_uri(p):
    f = os.path.join(RAIZ, p)
    mt = mimetypes.guess_type(f)[0] or "image/jpeg"
    return "data:%s;base64,%s" % (mt, base64.b64encode(open(f, "rb").read()).decode())

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:%dpx;height:%dpx}
body{font-family:"Montserrat","Poppins",system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
.s{position:relative;width:100%%;height:100%%;display:flex;flex-direction:column;padding:96px 88px 150px}
.claro{background:#fff;color:#0b0b0c}
.escuro{background:#0b0b0c;color:#f5f5f5}
.g{background:linear-gradient(transparent 60%%,#00e676 60%%,#00e676 80%%,transparent 80%%);padding:0 .06em}
.escuro .g{background:linear-gradient(transparent 60%%,#00e676 60%%,#00e676 80%%,transparent 80%%)}
b{font-weight:700}
.tag{align-self:flex-start;font-size:22px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;border:2px solid currentColor;border-radius:999px;padding:10px 24px;opacity:.85}
h1{font-size:92px;line-height:1.05;font-weight:600;letter-spacing:-.03em}
h2{font-size:68px;line-height:1.1;font-weight:600;letter-spacing:-.025em;margin-bottom:44px}
p{font-size:42px;line-height:1.45;font-weight:400}
.claro p{color:#2a2a2e}
.meio{flex:1;display:flex;flex-direction:column;justify-content:center}
ol{list-style:none;display:flex;flex-direction:column;gap:30px}
ol li{display:grid;grid-template-columns:64px 1fr;gap:18px;font-size:40px;line-height:1.35;align-items:baseline}
ol li i{font-style:normal;font-weight:700;font-size:30px;width:56px;height:56px;border-radius:50%%;background:#0b0b0c;color:#fff;display:grid;place-items:center;transform:translateY(-6px)}
.frase{font-size:78px;line-height:1.18;font-weight:600;letter-spacing:-.025em}
.aspas{font-size:200px;line-height:.6;font-weight:700;color:#00e676;margin-bottom:10px}
.rod{position:absolute;left:88px;right:88px;bottom:64px;display:flex;align-items:center;justify-content:space-between;font-size:24px;font-weight:500}
.rod .mk{display:flex;align-items:center;gap:14px}
.rod .mk svg{height:40px;width:auto}
.rod .pg{display:flex;align-items:center;gap:16px;opacity:.7}
.seta{width:54px;height:54px;border-radius:50%%;border:2px solid currentColor;display:grid;place-items:center;font-size:28px;opacity:1}
/* capa */
.capa{padding:0}
.capa .foto{position:absolute;inset:0}
.capa .foto img{width:100%%;height:100%%;object-fit:cover}
.capa .foto:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 0%%,rgba(0,0,0,.15) 35%%,rgba(0,0,0,.88) 68%%,#000 100%%)}
.capa .txt{position:absolute;left:88px;right:88px;bottom:170px;color:#fff;display:flex;flex-direction:column;gap:34px}
.capa .tag{color:#fff}
.capa .logo{position:absolute;top:80px;left:88px;color:#fff}
.capa .logo svg{height:34px;width:auto}
/* foto */
.fotobox{border-radius:36px;overflow:hidden;margin-bottom:48px;height:560px;background:#111}
.fotobox img{width:100%%;height:100%%;object-fit:cover}
/* cta */
.cta h2{font-size:84px}
.cta .url{margin-top:48px;font-size:36px;font-weight:600;border:2px solid #f5f5f5;border-radius:999px;padding:18px 34px;align-self:flex-start}
.cta .logo{margin-bottom:60px}
.cta .logo svg{height:40px;width:auto;color:#f5f5f5}
""" % (W, H)

def rodape(i, n, escuro):
    seta = '<span class="seta">&rarr;</span>' if i < n else ''
    num = ('%02d/%02d' % (i, n)) if n > 1 else ''
    return '<div class="rod"><div class="mk">%s<span>%s</span></div><div class="pg"><span>%s</span>%s</div></div>' % (MARK, ARROBA, num, seta)

def slide_html(sl, i, n):
    t = sl["tipo"]
    if t == "capa":
        corpo = ('<div class="s capa escuro"><div class="foto"><img src="%s"></div><div class="logo">%s</div>'
                 '<div class="txt">%s<h1>%s</h1></div>%s</div>') % (
            img_uri(sl["img"]), LOGO, ('<span class="tag">%s</span>' % html.escape(sl["tag"])) if sl.get("tag") else "",
            inline(sl["titulo"]), rodape(i, n, True))
    elif t == "capatexto":
        corpo = ('<div class="s escuro"><div class="logo" style="color:#f5f5f5">%s</div><div class="meio">%s<h1 style="margin-top:34px">%s</h1>%s</div>%s</div>') % (
            LOGO.replace('<svg ', '<svg style="height:34px;width:auto" ', 1),
            ('<span class="tag">%s</span>' % html.escape(sl["tag"])) if sl.get("tag") else "", inline(sl["titulo"]),
            ('<p style="margin-top:34px;color:#b9b9bf">%s</p>' % inline(sl["texto"])) if sl.get("texto") else "", rodape(i, n, True))
    elif t == "fotofundo":
        corpo = ('<div class="s capa escuro"><div class="foto"><img src="%s"></div>'
                 '<div class="txt"><h2 style="margin:0">%s</h2>%s</div>%s</div>') % (
            img_uri(sl["img"]), inline(sl["titulo"]),
            ('<p style="color:#e6e6e8">%s</p>' % inline(sl["texto"])) if sl.get("texto") else "", rodape(i, n, True))
    elif t == "texto":
        corpo = '<div class="s %s"><div class="meio">%s<p>%s</p></div>%s</div>' % (
            "escuro" if sl.get("escuro") else "claro",
            ('<h2>%s</h2>' % inline(sl["titulo"])) if sl.get("titulo") else "", inline(sl["texto"]), rodape(i, n, False))
    elif t == "lista":
        itens = "".join('<li><i>%d</i><span>%s</span></li>' % (k + 1, inline(x)) for k, x in enumerate(sl["itens"]))
        corpo = '<div class="s claro"><div class="meio"><h2>%s</h2><ol>%s</ol></div>%s</div>' % (inline(sl["titulo"]), itens, rodape(i, n, False))
    elif t == "frase":
        corpo = '<div class="s escuro"><div class="meio"><div class="aspas">&ldquo;</div><div class="frase">%s</div></div>%s</div>' % (inline(sl["texto"]), rodape(i, n, True))
    elif t == "foto":
        corpo = '<div class="s claro"><div class="fotobox"><img src="%s"></div>%s%s%s</div>' % (
            img_uri(sl["img"]), ('<h2 style="font-size:56px;margin-bottom:24px">%s</h2>' % inline(sl["titulo"])) if sl.get("titulo") else "",
            ('<p style="font-size:38px">%s</p>' % inline(sl["texto"])) if sl.get("texto") else "", rodape(i, n, False))
    elif t == "cta":
        corpo = ('<div class="s escuro cta"><div class="meio"><div class="logo">%s</div><h2>%s</h2><p>%s</p>'
                 '<span class="url">%s</span></div>%s</div>') % (
            LOGO, inline(sl.get("titulo", "Leia o post completo")), inline(sl.get("texto", "")),
            html.escape(sl.get("url", "sejaunique.vercel.app/blog")), rodape(i, n, True))
    else:
        raise ValueError("tipo desconhecido: " + t)
    return '<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body>%s</body></html>' % (CSS, corpo)

def gerar(slug, pg):
    pasta = os.path.join(RAIZ, "instagram", slug)
    r = json.load(open(os.path.join(pasta, "roteiro.json"), encoding="utf-8"))
    for f in os.listdir(pasta):
        if re.match(r"\d\d\.png$", f): os.remove(os.path.join(pasta, f))
    n = len(r["slides"])
    for i, sl in enumerate(r["slides"], 1):
        pg.set_content(slide_html(sl, i, n), wait_until="load")
        pg.wait_for_timeout(150)
        pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
    open(os.path.join(pasta, "legenda.txt"), "w", encoding="utf-8").write(r.get("legenda", "").strip() + "\n")
    print(slug, n, "imagens")

if __name__ == "__main__":
    args = sys.argv[1:]
    if not args: sys.exit(__doc__)
    slugs = sorted(d for d in os.listdir(os.path.join(RAIZ, "instagram"))
                   if os.path.isfile(os.path.join(RAIZ, "instagram", d, "roteiro.json"))) if args == ["--todos"] else args
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": W, "height": H})
        for s in slugs: gerar(s, pg)
        b.close()
