#!/usr/bin/env python3
"""
Carrossel "Crachá" — fundo marinho com pontilhado, cada slide é um crachá de evento
pendurado num cordão verde. Criado para o post "Network não é cartão. É mesa que se abre."
(isca /mesa-aberta/). Usa a foto do Carlos com os amigos na capa e no fecho.

Uso:  python3 tools/carrossel_cracha.py <slug>
Lê:   instagram/<slug>/slides.json  com "estilo": "cracha"
Gera: instagram/<slug>/01.png ... (1080x1350), legenda.txt
      e, se houver "capa_blog", blog/assets/<arquivo> (1600x900).

Tipos de slide:
  capa     foto grande com etiquetas de nome (campo "nomes": [[nome, x%], ...]) + título
  frase    frase grande dentro do crachá
  versus   duas colunas (ruim × bom), linha a linha
  passos   passos numerados em blocos de cor
  chat     pedido genérico (riscado) × pedido específico
  lista    itens com check
  cta      palavra-chave gigante para comentar + o que a pessoa recebe

Marcações: ==verde==, --magenta--, //fino itálico//, **negrito**, ~~riscado~~
"""
import json, os, re, sys
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(__file__))
from carrossel_pressao import tx, fonte, RAIZ, W, H
from carrossel import foto
from marca import LOGO

ARROBA = "@soucarlosribeiro"
VERDE, MAG, MAR = "#00e676", "#e0055e", "#2b3384"

CSS = """
@font-face{font-family:M;src:url("%(f1)s");font-weight:100 900}
@font-face{font-family:M;src:url("%(f2)s");font-weight:100 900;font-style:italic}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:M,sans-serif;color:#111113;overflow:hidden;background:#151a45}
.s{position:absolute;inset:0;background:#151a45;
   background-image:radial-gradient(rgba(255,255,255,.09) 1.6px,transparent 1.6px);background-size:34px 34px}
.cordao{position:absolute;left:50%%;top:-20px;width:64px;height:120px;margin-left:-32px;background:%(v)s;
   border-radius:0 0 10px 10px;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)}
.cordao::after{content:"UNIQUE · UNIQUE · UNIQUE";position:absolute;left:50%%;top:16px;writing-mode:vertical-rl;transform:translateX(-50%%);
   font-size:12px;font-weight:900;letter-spacing:.3em;color:#0b0b0c;opacity:.55}
.presilha{position:absolute;left:50%%;top:92px;width:46px;height:44px;margin-left:-23px;border:7px solid #c9ccd6;border-radius:12px;background:#9aa0b3;z-index:3}
.cr{position:absolute;left:70px;right:70px;top:122px;bottom:130px;background:#f7f6f2;border-radius:40px;overflow:hidden;
   box-shadow:0 40px 80px rgba(0,0,0,.45);display:flex;flex-direction:column;padding:96px 70px 64px}
.cr::before{content:"";position:absolute;left:50%%;top:30px;width:150px;height:22px;margin-left:-75px;border-radius:999px;background:#151a45;opacity:.9}
.pe{position:absolute;left:70px;right:70px;bottom:44px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:24px;font-weight:700}
.pe .lg svg{height:26px;width:auto;color:#fff}
.arr{font-weight:900;color:#0b0b0c;background:%(v)s;padding:13px 24px;border-radius:999px}
.pg{font-size:20px;font-weight:800;letter-spacing:.14em;opacity:.7}
.k{align-self:flex-start;font-size:21px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:#fff;background:#151a45;padding:11px 18px;border-radius:999px;margin-bottom:28px}
h1{font-size:104px;line-height:.95;letter-spacing:-.055em;font-weight:900}
h2{font-size:70px;line-height:1.02;letter-spacing:-.045em;font-weight:900}
h1 i,h2 i{font-weight:200}
.vd{color:#00a956}.mg{color:%(m)s}
s{text-decoration-thickness:10px;text-decoration-color:%(m)s}
p.sub{font-size:33px;line-height:1.35;font-weight:600;margin-top:24px;color:#3a3a44}
/* capa */
.cr.foto{padding:0}
.cr.foto .ph{position:relative;height:650px;flex:none}
.cr.foto .ph img{width:100%%;height:100%%;object-fit:cover;object-position:center 30%%}
.cr.foto .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(21,26,69,.35),rgba(21,26,69,0) 22%%,rgba(21,26,69,0) 70%%,rgba(21,26,69,.5))}
.nm{position:absolute;bottom:28px;transform:translateX(-50%%);z-index:2;background:#fff;color:#0b0b0c;font-size:24px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:12px 20px;border-radius:999px;box-shadow:0 8px 20px rgba(0,0,0,.3)}
.nm.eu{background:%(v)s}
.cr.foto .tx{padding:44px 60px 0;display:flex;flex-direction:column}
.cr.foto h1{font-size:96px}
.cr.foto .k{margin-bottom:22px}
/* frase */
.fr{margin-top:auto;margin-bottom:auto}
.fr h2{font-size:72px}
.apoio{font-size:31px;line-height:1.4;font-weight:600;color:#4a4a55;margin-top:34px;padding-top:30px;border-top:4px solid #151a45}
.aspas{font-size:220px;line-height:.6;font-weight:900;color:%(v)s;height:90px}
/* versus */
.vs{margin:auto 0;display:flex;flex-direction:column;gap:16px}
.vs .cab{display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:21px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
.vs .ln{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.vs .a,.vs .b{border-radius:24px;padding:24px 26px;font-size:30px;line-height:1.25;font-weight:700}
.vs .a{background:#ecebe6;color:#6b6b72;text-decoration:line-through;text-decoration-color:%(m)s;text-decoration-thickness:3px}
.vs .b{background:#151a45;color:#fff}
/* passos */
.ps{margin:auto 0;display:flex;flex-direction:column;gap:16px}
.ps div{display:grid;grid-template-columns:120px 1fr;align-items:center;border-radius:30px;padding:40px 36px;background:var(--c);color:var(--t)}
.ps b{font-size:86px;font-weight:200;font-style:italic;line-height:1}
.ps span{font-size:50px;font-weight:900;letter-spacing:-.03em;line-height:1.05}
.ps small{display:block;font-size:30px;font-weight:600;letter-spacing:0;margin-top:8px;opacity:.85;line-height:1.3}
/* chat */
.ch{margin:auto 0;display:flex;flex-direction:column;gap:22px}
.ch .rot{font-size:21px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
.bal{font-size:34px;line-height:1.3;font-weight:700;padding:28px 34px;border-radius:34px 34px 34px 10px}
.bal.no{background:#ecebe6;color:#6b6b72;position:relative}
.bal.no::after{content:"";position:absolute;left:-8px;right:-8px;top:50%%;height:8px;background:%(m)s;transform:rotate(-2deg)}
.bal.si{background:%(v)s;color:#0b0b0c;border-radius:34px 34px 10px 34px}
.nota{font-size:30px;font-weight:700;line-height:1.35;margin-top:10px}
/* lista */
.ls{margin:auto 0;display:flex;flex-direction:column;gap:14px;list-style:none;padding:0}
.ls li{display:grid;grid-template-columns:64px 1fr;gap:22px;align-items:center;font-size:39px;font-weight:700;line-height:1.2;padding:30px 28px;border-radius:24px;background:#fff;border:3px solid #151a45}
.ls li::before{content:"✓";display:grid;place-items:center;width:60px;height:60px;border-radius:50%%;background:%(v)s;font-size:34px;font-weight:900}
/* cta */
.cta{margin:auto 0}
.pal{font-size:250px;font-weight:900;letter-spacing:-.06em;line-height:.9;color:#151a45;margin:6px 0 26px}
.pal span{display:inline-block;background:%(v)s;padding:6px 34px 18px;border-radius:30px}
.cta ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.cta li{font-size:35px;font-weight:700;line-height:1.25;padding-left:44px;position:relative}
.cta li::before{content:"→";position:absolute;left:0;color:#00a956;font-weight:900}
.obs{font-size:24px;font-weight:600;color:#6b6b72;margin-top:26px}
"""


def topo(d, tag="h2"):
    k = '<span class="k">%s</span>' % tx(d["kicker"]) if d.get("kicker") else ""
    t = "<%s>%s</%s>" % (tag, tx(d["titulo"]), tag) if d.get("titulo") else ""
    return k + t


def s_capa(d):
    nomes = "".join('<span class="nm%s" style="left:%s%%">%s</span>' % (" eu" if n[0] == "Carlos" else "", n[1], tx(n[0])) for n in d.get("nomes", []))
    return ('<div class="cr foto"><div class="ph"><img src="%s">%s</div><div class="tx">%s%s</div></div>'
            % (foto(d["img"], 1100), nomes, topo(d, "h1"), '<p class="sub">%s</p>' % tx(d["sub"]) if d.get("sub") else ""))


def s_frase(d):
    return ('<div class="cr">%s<div class="fr">%s<h2>%s</h2>%s</div></div>'
            % ('<span class="k">%s</span>' % tx(d["kicker"]) if d.get("kicker") else "",
               '<div class="aspas">“</div>' if d.get("aspas") else "", tx(d["frase"]),
               '<p class="apoio">%s</p>' % tx(d["apoio"]) if d.get("apoio") else ""))


def s_versus(d):
    cab = '<div class="cab"><span class="mg">%s</span><span class="vd">%s</span></div>' % tuple(map(tx, d["colunas"]))
    lns = "".join('<div class="ln"><div class="a">%s</div><div class="b">%s</div></div>' % (tx(a), tx(b)) for a, b in d["linhas"])
    return '<div class="cr">%s<div class="vs">%s%s</div></div>' % (topo(d), cab, lns)


def s_passos(d):
    cores = {"verde": (VERDE, "#0b0b0c"), "marinho": (MAR, "#fff"), "magenta": (MAG, "#fff")}
    it = "".join('<div style="--c:%s;--t:%s"><b>%d</b><span>%s<small>%s</small></span></div>' % (cores[p["cor"]][0], cores[p["cor"]][1], i, tx(p["t"]), tx(p["sub"]))
                 for i, p in enumerate(d["passos"], 1))
    return '<div class="cr">%s<div class="ps">%s</div></div>' % (topo(d), it)


def s_chat(d):
    return ('<div class="cr">%s<div class="ch"><span class="rot mg">%s</span><div class="bal no">%s</div><span class="rot vd">%s</span><div class="bal si">%s</div><p class="nota">%s</p></div></div>'
            % (topo(d), tx(d["rot_no"]), tx(d["no"]), tx(d["rot_si"]), tx(d["si"]), tx(d.get("nota", ""))))


def s_lista(d):
    return '<div class="cr">%s<ul class="ls">%s</ul></div>' % (topo(d), "".join("<li>%s</li>" % tx(x) for x in d["itens"]))


def s_cta(d):
    return ('<div class="cr">%s<div class="cta"><div class="pal"><span>%s</span></div><ul>%s</ul>%s</div></div>'
            % (topo(d), tx(d["palavra"]), "".join("<li>%s</li>" % tx(x) for x in d["itens"]), '<p class="obs">%s</p>' % tx(d["obs"]) if d.get("obs") else ""))


TIPOS = {"capa": s_capa, "frase": s_frase, "versus": s_versus, "passos": s_passos, "chat": s_chat, "lista": s_lista, "cta": s_cta}


def moldura(i, n):
    seta = '<span class="arr">Arraste →</span>' if i < n else '<span class="pg">%s</span>' % ARROBA
    return ('<div class="cordao"></div><div class="presilha"></div>'
            '<div class="pe"><span class="lg">%s</span><span class="pg">%02d / %02d</span>%s</div>' % (LOGO, i, n, seta))


def gerar(slug):
    global ARROBA
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json"), encoding="utf-8"))
    ARROBA = dados.get("arroba", ARROBA)
    slides = dados["slides"]; n = len(slides)
    css = CSS % {"f1": fonte("Montserrat[wght].ttf"), "f2": fonte("Montserrat-Italic[wght].ttf"), "v": VERDE, "m": MAG}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f):
            os.remove(os.path.join(pasta, f))
    doc = '<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s">%s%s</div></body></html>'
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page(viewport={"width": W, "height": H})
        for i, sl in enumerate(slides, 1):
            pg.set_content(doc % (css, moldura(i, n), TIPOS[sl["tipo"]](sl)))
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(250)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        cb = dados.get("capa_blog")
        if cb:
            sl = slides[0]
            css2 = css.replace("body{width:1080px;height:1350px", "body{width:1600px;height:900px")
            css2 += (".cr.foto{left:90px;right:90px;top:110px;bottom:80px;flex-direction:row}.cr.foto .ph{height:auto;width:560px}"
                     ".cr.foto .tx{padding:70px 60px;display:flex;flex-direction:column;justify-content:center}.cr.foto h1{font-size:96px}"
                     ".cordao{height:100px}.presilha{top:74px}.cr::before{display:none}.nm{font-size:18px;padding:9px 14px;bottom:22px}")
            pg2 = nav.new_page(viewport={"width": 1600, "height": 900})
            pg2.set_content(doc % (css2, '<div class="cordao"></div><div class="presilha"></div>', s_capa(dict(sl, sub=None))))
            pg2.evaluate("document.fonts.ready"); pg2.wait_for_timeout(250)
            pg2.screenshot(path=os.path.join(RAIZ, "blog", "assets", cb), type="jpeg", quality=88)
        nav.close()
    if dados.get("legenda"):
        open(os.path.join(pasta, "legenda.txt"), "w", encoding="utf-8").write(dados["legenda"])
    print(slug, n, "slides")


if __name__ == "__main__":
    gerar(sys.argv[1])
