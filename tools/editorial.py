#!/usr/bin/env python3
"""
Carrossel "Editorial" — layout alternativo (escuro, foto sangrada, tipografia condensada).
Usado no post da palestra na Imersão Confecção Lucrativa (Textil Club).

Uso: python3 tools/editorial.py <slug>   (lê instagram/<slug>/slides.json com "estilo": "editorial")
Tipos: abertura (foto cheia + título), grade (4 blocos numerados), fecho (foto + agradecimento + CTA)
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from carrossel import foto, fonte, tx, RAIZ, W, H, LOGO

VERDE, MARINHO, MAGENTA = "#00e676", "#1e2357", "#e0055e"

CSS = """
@font-face{font-family:M;src:url(%(m)s)}@font-face{font-family:A;src:url(%(a)s)}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;background:#0b0b0c;color:#f4f4f2;font-family:M,sans-serif}
.s{position:relative;width:1080px;height:1350px;overflow:hidden}
.A{font-family:A,sans-serif;text-transform:uppercase;letter-spacing:.005em;line-height:.92}
.gr{color:%(v)s}.vd{color:%(v)s}.mg{color:%(mg)s}
.k{font-size:22px;font-weight:700;letter-spacing:.24em;text-transform:uppercase}
.top{position:absolute;left:64px;right:64px;top:56px;display:flex;justify-content:space-between;align-items:center;z-index:5}
.top svg{height:26px;width:auto;color:#fff}
.pg{font-size:22px;font-weight:700;letter-spacing:.2em}
.bar{position:absolute;left:64px;right:64px;bottom:56px;display:flex;justify-content:space-between;align-items:center;font-size:22px;font-weight:600;letter-spacing:.06em;z-index:5}
.rule{height:6px;background:%(v)s;width:120px}
"""

def topo(i, n):
    return '<div class="top">%s<span class="pg">%02d<span style="opacity:.4"> / %02d</span></span></div>' % (LOGO, i, n)

def barra(txt="@sejauniqueoficial", seta=True):
    return '<div class="bar"><span style="opacity:.7">%s</span>%s</div>' % (txt, '<span style="color:%s;font-weight:800">ARRASTE →</span>' % VERDE if seta else "")

def abertura(d, i, n):
    return ('<img src="%s" style="position:absolute;left:0;top:0;width:100%%;height:66%%;object-fit:cover;object-position:%s;filter:grayscale(1) contrast(1.1)">' % (foto(d["img"]), d.get("pos", "center"))
            + '<div style="position:absolute;left:0;right:0;top:0;height:66%;background:linear-gradient(180deg,rgba(11,11,12,.45) 0%,rgba(11,11,12,0) 20%,rgba(11,11,12,.35) 65%,rgba(11,11,12,1) 100%)"></div>'
            + topo(i, n)
            + '<div style="position:absolute;left:64px;right:64px;bottom:150px"><div class="k" style="color:%s">%s</div><div class="rule" style="margin:26px 0 30px"></div>'
              '<div class="A" style="font-size:%dpx">%s</div><div style="font-size:30px;line-height:1.4;margin-top:28px;max-width:860px;opacity:.88">%s</div></div>' % (VERDE, tx(d["kicker"]), d.get("tam", 150), tx(d["titulo"]), tx(d["texto"]))
            + barra())

def grade(d, i, n):
    cores = [(VERDE, "#0b0b0c"), ("#f4f4f2", "#0b0b0c"), ("#f4f4f2", "#0b0b0c"), (MAGENTA, "#fff")]
    cel = ""
    for k, it in enumerate(d["itens"]):
        bg, fg = cores[k] if k != 3 else cores[3]
        if d.get("escuros") and k in (1, 2): bg, fg = "#18181b", "#f4f4f2"
        cel += ('<div style="background:%s;color:%s;border-radius:28px;padding:34px 34px 30px;display:flex;flex-direction:column;justify-content:space-between">'
                '<div class="A" style="font-size:120px;opacity:.9">%02d</div><div><div class="A" style="font-size:58px">%s</div><div style="font-size:24px;line-height:1.35;margin-top:12px;font-weight:500">%s</div></div></div>'
                % (bg, fg, k + 1, tx(it["titulo"]), tx(it["texto"])))
    return (topo(i, n)
            + '<div style="position:absolute;left:64px;right:64px;top:150px"><div class="k" style="color:%s">%s</div><div class="A" style="font-size:%dpx;margin-top:20px">%s</div></div>' % (VERDE, tx(d["kicker"]), d.get("tam", 104), tx(d["titulo"]))
            + '<div style="position:absolute;left:64px;right:64px;top:%dpx;height:%dpx;display:grid;grid-template-columns:1fr 1fr;gap:20px">%s</div>' % (d.get("top", 400), d.get("alt", 700), cel)
            + '<div style="position:absolute;left:64px;right:64px;bottom:130px;font-size:34px;font-weight:700;font-style:italic">%s</div>' % tx(d["nota"])
            + barra())

def fecho(d, i, n):
    return (topo(i, n)
            + '<div style="position:absolute;left:64px;right:64px;top:150px;height:640px;border-radius:30px;overflow:hidden"><img src="%s" style="width:100%%;height:100%%;object-fit:cover;object-position:%s"></div>' % (foto(d["img"]), d.get("pos", "center"))
            + '<div style="position:absolute;left:64px;right:64px;top:830px"><div class="k" style="color:%s">%s</div><div class="A" style="font-size:%dpx;margin-top:18px">%s</div>'
              '<div style="font-size:28px;line-height:1.4;margin-top:20px;opacity:.85;max-width:900px">%s</div>'
              '<div style="margin-top:34px;display:inline-flex;align-items:center;gap:14px;background:%s;color:#0b0b0c;font-weight:800;font-size:28px;padding:18px 32px;border-radius:999px">%s →</div></div>'
              % (VERDE, tx(d["kicker"]), d.get("tam", 96), tx(d["titulo"]), tx(d["texto"]), VERDE, tx(d["botao"]))
            + barra(d.get("rodape", "sejaunique.vercel.app/blog · link na bio"), False))

TIPOS = {"abertura": abertura, "grade": grade, "fecho": fecho}

def gerar(slug):
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json")))
    sl = dados["slides"]; n = len(sl)
    css = CSS % {"m": fonte("Montserrat[wght].ttf"), "a": fonte("Anton-Regular.ttf"), "v": VERDE, "mg": MAGENTA}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f): os.remove(os.path.join(pasta, f))
    with sync_playwright() as p:
        nav = p.chromium.launch(); pg = nav.new_page(viewport={"width": W, "height": H})
        for i, d in enumerate(sl, 1):
            pg.set_content('<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s">%s</div></body></html>' % (css, TIPOS[d["tipo"]](d, i, n)))
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(150)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        nav.close()
    if dados.get("legenda"): open(os.path.join(pasta, "legenda.txt"), "w").write(dados["legenda"])
    print(slug, n, "slides")

if __name__ == "__main__":
    gerar(sys.argv[1])
