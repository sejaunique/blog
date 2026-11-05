#!/usr/bin/env python3
"""
Carrossel "Manômetro" — brutalista em papel claro, sem foto: tipografia pesada, blocos de cor
chapados, bordas pretas grossas com sombra dura e um manômetro que vai de FROUXA a PRESSÃO.
Criado para o post "Chega de venda frouxa" (isca /pressao/, 13 mecânicas).

Uso:  python3 tools/carrossel_pressao.py <slug>
Lê:   instagram/<slug>/slides.json  com "estilo": "manometro"
Gera: instagram/<slug>/01.png ... (1080x1350), legenda.txt
      e, se houver "capa_blog", blog/assets/<arquivo> (1600x900) a partir do 1º slide.

Tipos de slide:
  capa     título enorme + manômetro (campo "ponteiro" de 0 a 100)
  chat     balões de mensagem riscados (o follow-up frouxo)
  frase    uma frase grande em bloco de cor
  formula  três blocos: condição, benefício, data + exemplo
  grade    lista numerada em grade de 2 colunas (as 13 mecânicas)
  versus   frouxa × pressão, linha a linha
  cta      palavra-chave gigante para comentar + o que a pessoa recebe

Marcações no texto: ==verde==, --magenta--, //fino itálico//, **negrito**, ~~riscado~~
"""
import base64, html, json, os, re, sys
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from marca import LOGO

W, H = 1080, 1350
ARROBA = "@sejauniqueoficial"
COR = {"verde": "#00e676", "magenta": "#e0055e", "marinho": "#2b3384", "tinta": "#111113", "papel": "#efede6"}


def tx(t):
    t = html.escape(t or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"~~(.+?)~~", r"<s>\1</s>", t, flags=re.S)
    t = re.sub(r"==(.+?)==", r'<span class="vd">\1</span>', t, flags=re.S)
    t = re.sub(r"--(.+?)--", r'<span class="mg">\1</span>', t, flags=re.S)
    t = re.sub(r"//(.+?)//", r"<i>\1</i>", t, flags=re.S)
    return t.replace("\n", "<br>")


def fonte(arq):
    return "data:font/ttf;base64," + base64.b64encode(open(os.path.join(RAIZ, "tools/fonts", arq), "rb").read()).decode()


CSS = """
@font-face{font-family:M;src:url("%(f1)s");font-weight:100 900}
@font-face{font-family:M;src:url("%(f2)s");font-weight:100 900;font-style:italic}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;background:#efede6;font-family:M,sans-serif;color:#111113;overflow:hidden}
.s{position:absolute;inset:0;padding:140px 80px 140px;display:flex;flex-direction:column;
   background-image:radial-gradient(rgba(17,17,19,.13) 1.6px,transparent 1.6px);background-size:30px 30px;background-color:#efede6}
.topo{position:absolute;left:80px;right:80px;top:62px;display:flex;justify-content:space-between;align-items:center;z-index:3}
.topo .lg svg{height:30px;width:auto;color:#111113}
.topo .pg{font-size:22px;font-weight:900;letter-spacing:.08em;border:4px solid #111113;padding:8px 16px;border-radius:999px;background:#fff}
.pe{position:absolute;left:80px;right:80px;bottom:58px;display:flex;justify-content:space-between;align-items:center;font-size:24px;font-weight:700;z-index:3}
.arr{font-weight:900;color:#111113;background:#00e676;padding:14px 26px;border:4px solid #111113;border-radius:999px;box-shadow:6px 6px 0 #111113}
.k{display:inline-block;align-self:flex-start;font-size:22px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;background:#111113;color:#efede6;padding:12px 20px;margin-bottom:26px}
h1{font-size:140px;line-height:.94;letter-spacing:-.06em;font-weight:900}
h2{font-size:76px;line-height:1.02;letter-spacing:-.05em;font-weight:900}
h1 i,h2 i{font-weight:200}
.vd{color:#00a956}.mg{color:#e0055e}
s{text-decoration-thickness:12px;text-decoration-color:#e0055e}
p.sub{font-size:36px;line-height:1.35;font-weight:600;margin-top:28px;max-width:860px}
.cx{border:5px solid #111113;border-radius:30px;box-shadow:12px 12px 0 #111113;background:#fff}
/* manômetro */
.gauge{margin-top:auto;align-self:center;width:760px}
/* chat */
.chat{margin-top:auto;display:flex;flex-direction:column;gap:18px}
.bal{align-self:flex-start;max-width:820px;font-size:36px;font-weight:700;line-height:1.2;padding:22px 32px;border:5px solid #111113;border-radius:34px 34px 34px 8px;background:#fff;box-shadow:10px 10px 0 #111113;position:relative}
.bal:nth-child(even){align-self:flex-end;border-radius:34px 34px 8px 34px}
.bal::after{content:"";position:absolute;left:-10px;right:-10px;top:50%%;height:10px;background:#e0055e;transform:rotate(-3deg)}
.bal .h{display:block;font-size:20px;font-weight:800;color:#6b6b72;margin-top:10px;text-align:right}
.nota{margin-top:30px;font-size:31px;font-weight:700;line-height:1.3}
/* frase */
.fr{margin-top:auto;background:var(--c);color:var(--t);padding:64px 58px}
.fr h2{font-size:96px}
.fr p{font-size:36px;line-height:1.35;font-weight:600;margin-top:28px;opacity:.92}
/* fórmula */
.fm{margin-top:auto;display:flex;flex-direction:column;gap:20px}
.bl{display:grid;grid-template-columns:100px 1fr;align-items:center;gap:22px;padding:24px 36px;background:var(--c);color:var(--t)}
.bl .n{font-size:96px;font-weight:200;font-style:italic;line-height:.8}
.bl b{display:block;font-size:22px;letter-spacing:.2em;text-transform:uppercase;opacity:.85;margin-bottom:6px}
.bl span{font-size:56px;font-weight:900;letter-spacing:-.04em;line-height:1}
.exf{font-size:28px;line-height:1.38;font-weight:600;padding:24px 30px;margin-top:6px}
.exf b{font-weight:900}
/* grade */
.gd{margin-top:auto;display:grid;grid-template-columns:1fr 1fr;gap:10px}
.it{display:flex;align-items:center;gap:18px;padding:14px 22px;border:4px solid #111113;border-radius:18px;background:#fff;font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1.05;min-height:86px}
.it .n{font-size:44px;font-weight:200;font-style:italic;color:var(--c);min-width:58px}
.it.fim{background:#111113;color:#00e676;justify-content:center;text-align:center}
/* versus */
.vs{margin-top:auto;display:flex;flex-direction:column;gap:18px}
.ln{display:grid;grid-template-columns:1fr 1.25fr;border:5px solid #111113;border-radius:26px;overflow:hidden;box-shadow:10px 10px 0 #111113}
.ln div{padding:26px 28px;font-size:30px;font-weight:700;line-height:1.25}
.ln .a{background:#fff;color:#e0055e;text-decoration:line-through;text-decoration-thickness:4px}
.ln .b{background:#00e676}
.cab{display:grid;grid-template-columns:1fr 1.25fr;font-size:22px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;padding:0 33px}
/* cta */
.ct{margin-top:auto}
.pal{display:inline-block;font-size:170px;font-weight:900;letter-spacing:-.06em;line-height:.9;background:#00e676;padding:20px 40px 30px;border:6px solid #111113;box-shadow:16px 16px 0 #111113;transform:rotate(-2deg)}
.ct ul{list-style:none;padding:0;margin-top:56px;display:flex;flex-direction:column;gap:16px;font-size:36px;font-weight:700}
.ct li::before{content:"→ ";color:#e0055e;font-weight:900}
.ct .obs{margin-top:30px;font-size:28px;font-weight:600;color:#4a4a50}
"""


def manometro(p, w=760):
    """Manômetro em SVG; p = 0 (frouxa) a 100 (pressão)."""
    ang = -90 + 180 * max(0, min(100, p)) / 100
    return ('<svg class="gauge" style="width:%dpx" viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg">'
            '<path d="M40 200 A160 160 0 0 1 110 68" fill="none" stroke="#e0055e" stroke-width="44"/>'
            '<path d="M124 58 A160 160 0 0 1 276 58" fill="none" stroke="#2b3384" stroke-width="44"/>'
            '<path d="M290 68 A160 160 0 0 1 360 200" fill="none" stroke="#00e676" stroke-width="44"/>'
            '<path d="M18 200 A182 182 0 0 1 382 200" fill="none" stroke="#111113" stroke-width="5"/>'
            '<path d="M62 200 A138 138 0 0 1 338 200" fill="none" stroke="#111113" stroke-width="5"/>'
            '<g transform="rotate(%.1f 200 200)"><path d="M192 200 L200 52 L208 200 Z" fill="#111113"/></g>'
            '<circle cx="200" cy="200" r="24" fill="#111113"/><circle cx="200" cy="200" r="9" fill="#efede6"/>'
            '<text x="56" y="242" font-family="M" font-weight="900" font-size="22" fill="#e0055e" text-anchor="middle">FROUXA</text>'
            '<text x="344" y="242" font-family="M" font-weight="900" font-size="22" fill="#00a956" text-anchor="middle">PRESSÃO</text>'
            '</svg>') % (w, ang)


def moldura(i, n):
    seta = '<span class="arr">Arraste →</span>' if i < n else ""
    return ('<div class="topo"><span class="lg">%s</span><span class="pg">%02d / %02d</span></div>' % (LOGO, i, n)
            + '<div class="pe"><span>%s</span>%s</div>' % (ARROBA, seta))


def topo(d, tag="h2"):
    h = '<div class="k">%s</div>' % tx(d["kicker"]) if d.get("kicker") else ""
    h += "<%s>%s</%s>" % (tag, tx(d["titulo"]), tag) if d.get("titulo") else ""
    h += '<p class="sub">%s</p>' % tx(d["sub"]) if d.get("sub") else ""
    return h


def s_capa(d):
    return topo(d, "h1") + manometro(d.get("ponteiro", 8))


def s_chat(d):
    b = "".join('<div class="bal">%s<span class="h">%s</span></div>' % (tx(m["t"]), html.escape(m.get("h", ""))) for m in d["msgs"])
    return topo(d) + '<div class="chat">%s</div>' % b + ('<p class="nota">%s</p>' % tx(d["nota"]) if d.get("nota") else "")


def s_frase(d):
    c = COR.get(d.get("cor", "tinta"))
    t = "#111113" if d.get("cor") == "verde" else "#fff"
    return topo({k: d[k] for k in ("kicker",) if k in d}) + '<div class="fr cx" style="--c:%s;--t:%s"><h2>%s</h2>%s</div>' % (
        c, t, tx(d["frase"]), '<p>%s</p>' % tx(d["apoio"]) if d.get("apoio") else "")


def s_formula(d):
    bl = ""
    for i, b in enumerate(d["blocos"], 1):
        c = COR.get(b["cor"])
        t = "#111113" if b["cor"] == "verde" else "#fff"
        bl += '<div class="bl cx" style="--c:%s;--t:%s"><span class="n">%d</span><div><b>%s</b><span>%s</span></div></div>' % (c, t, i, html.escape(b["rot"]), tx(b["t"]))
    return topo(d) + '<div class="fm">%s<div class="exf cx">%s</div></div>' % (bl, tx(d["exemplo"]))


def s_grade(d):
    cores = [COR["marinho"], COR["magenta"], "#00a956"]
    it = "".join('<div class="it" style="--c:%s"><span class="n">%02d</span>%s</div>' % (cores[i % 3], i + 1, tx(x)) for i, x in enumerate(d["itens"]))
    if d.get("fim"):
        it += '<div class="it fim">%s</div>' % tx(d["fim"])
    return topo(d) + '<div class="gd">%s</div>' % it


def s_versus(d):
    ls = "".join('<div class="ln"><div class="a">%s</div><div class="b">%s</div></div>' % (tx(a), tx(b)) for a, b in d["linhas"])
    return topo(d) + '<div class="vs"><div class="cab"><span style="color:#e0055e">Frouxa</span><span style="color:#00a956">Com pressão</span></div>%s</div>' % ls


def s_cta(d):
    return topo(d) + '<div class="ct"><span class="pal">%s</span><ul>%s</ul>%s</div>' % (
        html.escape(d["palavra"]), "".join("<li>%s</li>" % tx(x) for x in d["itens"]),
        '<p class="obs">%s</p>' % tx(d["obs"]) if d.get("obs") else "")


TIPOS = {"capa": s_capa, "chat": s_chat, "frase": s_frase, "formula": s_formula, "grade": s_grade, "versus": s_versus, "cta": s_cta}


def gerar(slug):
    global ARROBA
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json"), encoding="utf-8"))
    ARROBA = dados.get("arroba", ARROBA)
    slides = dados["slides"]; n = len(slides)
    css = CSS % {"f1": fonte("Montserrat[wght].ttf"), "f2": fonte("Montserrat-Italic[wght].ttf")}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f):
            os.remove(os.path.join(pasta, f))
    doc = '<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s">%s%s</div></body></html>'
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page(viewport={"width": W, "height": H})
        for i, sl in enumerate(slides, 1):
            pg.set_content(doc % (css, TIPOS[sl["tipo"]](sl), moldura(i, n)))
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(200)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        cb = dados.get("capa_blog")
        if cb:
            sl = slides[0]
            css2 = css.replace("body{width:1080px;height:1350px", "body{width:1600px;height:900px")
            css2 += ".s{padding:120px 90px 80px;display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center}h1{font-size:132px}p.sub{font-size:32px}.gauge{margin:0}"
            corpo = '<div>%s</div>%s' % (topo(sl, "h1"), manometro(sl.get("ponteiro", 8), 640))
            pg2 = nav.new_page(viewport={"width": 1600, "height": 900})
            pg2.set_content(doc % (css2, corpo, '<div class="topo"><span class="lg">%s</span></div>' % LOGO))
            pg2.evaluate("document.fonts.ready"); pg2.wait_for_timeout(200)
            pg2.screenshot(path=os.path.join(RAIZ, "blog", "assets", cb), type="jpeg", quality=88)
        nav.close()
    if dados.get("legenda"):
        open(os.path.join(pasta, "legenda.txt"), "w", encoding="utf-8").write(dados["legenda"])
    print(slug, n, "slides")


if __name__ == "__main__":
    gerar(sys.argv[1])
