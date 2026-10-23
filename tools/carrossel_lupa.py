#!/usr/bin/env python3
"""
Carrossel "Lupa" — layout escuro de pôster, com uma foto panorâmica que continua de
um slide para o outro e a lupa da marca procurando alguém no meio da foto.
Criado para o post "Antes do desconto, separe quem é quem" (manual Orçamentos parados).

Uso:  python3 tools/carrossel_lupa.py <slug>
Lê:   instagram/<slug>/slides.json  com "estilo": "lupa"
Gera: instagram/<slug>/01.png ... (1080x1350) e legenda.txt

Tipos de slide:
  panorama  foto em faixa contínua ("parte": 0, 1, 2...), lupa opcional, etiquetas, título
  dupla     tela dividida em duas metades coloridas (ex.: cliente x lead)
  zona      cor cheia, um verbo gigante e uma lista numerada
  equacao   três palavras somadas e o resultado em barra verde
  numero    de um número pequeno para um número gigante
  cta       foto apagada com a lupa, chamada e botão

Marcações no texto: ==verde==, --magenta--, //fino itálico//, **negrito**
"""
import base64, html, io, json, os, re, sys
from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from marca import LOGO, MARK

W, H = 1080, 1350
ARROBA = "@sejauniqueoficial"
VERDE, MAGENTA, MARINHO, TINTA = "#00e676", "#e0055e", "#1e2357", "#0b0b0c"


def tx(t):
    t = html.escape(t or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"==(.+?)==", r'<span class="vd">\1</span>', t, flags=re.S)
    t = re.sub(r"--(.+?)--", r'<span class="mg">\1</span>', t, flags=re.S)
    t = re.sub(r"//(.+?)//", r"<i>\1</i>", t, flags=re.S)
    return t.replace("\n", "<br>")


def fonte(arq):
    return "data:font/ttf;base64," + base64.b64encode(open(os.path.join(RAIZ, "tools/fonts", arq), "rb").read()).decode()


_cache = {}
def panorama(p, larg):
    """Foto redimensionada para a largura da faixa inteira (todos os slides da panorâmica)."""
    k = (p, larg)
    if k not in _cache:
        im = Image.open(os.path.join(RAIZ, p)).convert("RGB")
        im = im.resize((larg, round(im.height * larg / im.width)))
        b = io.BytesIO(); im.save(b, "JPEG", quality=86)
        _cache[k] = ("data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode(), im.width, im.height)
    return _cache[k]


CSS = """
@font-face{font-family:M;src:url(%(f1)s);font-weight:100 900;font-style:normal}
@font-face{font-family:M;src:url(%(f2)s);font-weight:100 900;font-style:italic}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px}
body{font-family:M,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;overflow:hidden;background:#0b0b0c}
.s{position:relative;width:1080px;height:1350px;overflow:hidden;background:#0b0b0c}
.topo{position:absolute;left:72px;right:72px;top:60px;display:flex;justify-content:space-between;align-items:center;z-index:20}
.topo .lg svg{height:30px;width:auto;display:block}
.pg{font-size:22px;font-weight:800;letter-spacing:.14em}
.pg span{opacity:.45}
.pe{position:absolute;left:72px;right:72px;bottom:58px;display:flex;justify-content:space-between;align-items:center;z-index:20;font-size:22px;font-weight:600}
.pe .arr{font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.t{font-weight:900;letter-spacing:-.055em;line-height:.9}
.t i,i{font-style:italic;font-weight:200;letter-spacing:-.04em}
.vd{color:#00e676}.mg{color:#ff2e7e}
.k{font-size:24px;font-weight:800;letter-spacing:.26em;text-transform:uppercase}
.sub{font-size:34px;line-height:1.4;font-weight:400}
.lupa{position:absolute;border-radius:50%%;border:16px solid #fff;box-shadow:0 30px 70px rgba(0,0,0,.6);background-repeat:no-repeat;z-index:6}
.cabo{position:absolute;width:34px;height:150px;border-radius:16px;background:linear-gradient(90deg,#cfcfd6,#fff 40%%,#bdbdc4);transform-origin:top center;transform:rotate(-45deg);z-index:5;box-shadow:0 20px 40px rgba(0,0,0,.45)}
.etq{position:absolute;transform:translate(-50%%,-100%%);font-size:24px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;padding:12px 18px;border-radius:999px;white-space:nowrap;z-index:8}
.etq::after{content:"";position:absolute;left:50%%;bottom:-8px;width:16px;height:16px;transform:translateX(-50%%) rotate(45deg);background:inherit}
.etq.lead{background:#fff;color:#1e2357}
.etq.cli{background:#00e676;color:#000;font-size:28px;padding:14px 22px}
.masc{position:absolute;z-index:4}
.masc svg{height:100%%;width:auto;display:block}
"""


def moldura(i, n, cor="#fff", seta_cor=VERDE):
    seta = '<span class="arr" style="color:%s">Arraste →</span>' % seta_cor if i < n else ""
    return ('<div class="topo" style="color:%s"><span class="lg">%s</span><span class="pg">%02d<span> / %02d</span></span></div>' % (cor, LOGO, i, n)
            + '<div class="pe" style="color:%s"><span style="opacity:.75">%s</span>%s</div>' % (cor, ARROBA, seta))


def lente(d, img, iw, ih, ox, oy, raio=190, zoom=2.0):
    """Lupa centrada no ponto (x, y) da foto ampliada; ox/oy = deslocamento do slide dentro da foto."""
    x, y = d["lupa"]
    cx, cy = x - ox, y - oy
    bw, bh = iw * zoom, ih * zoom
    return ('<div class="lupa" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;background-image:url(%s);background-size:%dpx %dpx;background-position:%dpx %dpx"></div>'
            % (cx - raio, cy - raio, raio * 2, raio * 2, img, bw, bh, raio - 16 - x * zoom, raio - 16 - y * zoom)
            + '<div class="cabo" style="left:%dpx;top:%dpx"></div>' % (cx + raio * .62, cy + raio * .62))


def etiquetas(d, ox, oy):
    out = ""
    for e in d.get("etiquetas", []):
        x, y = e["xy"]
        out += '<span class="etq %s" style="left:%dpx;top:%dpx">%s</span>' % (e.get("tipo", "lead"), x - ox, y - oy, tx(e["txt"]))
    return out


def s_panorama(d, ctx):
    img, iw, ih = panorama(ctx["foto"], ctx["larg"])
    ox = ctx["x0"] + d.get("parte", 0) * W
    oy = ctx["y0"]
    fundo = '<div style="position:absolute;inset:0;background:url(%s) -%dpx -%dpx/%dpx %dpx no-repeat"></div>' % (img, ox, oy, iw, ih)
    veu = '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,12,.65) 0%,rgba(11,11,12,0) 16%,rgba(11,11,12,0) 44%,rgba(11,11,12,.9) 64%,#0b0b0c 80%)"></div>'
    lupa = lente(d, img, iw, ih, ox, oy) if d.get("lupa") else ""
    corpo = ('<div style="position:absolute;left:72px;right:72px;bottom:%dpx;z-index:10">' % d.get("base", 150)
             + ('<div class="k vd" style="margin-bottom:24px">%s</div>' % tx(d["kicker"]) if d.get("kicker") else "")
             + '<div class="t" style="font-size:%dpx">%s</div>' % (d.get("tam", 132), tx(d["titulo"]))
             + ('<div class="sub" style="margin-top:28px;color:#d4d4d8;max-width:900px">%s</div>' % tx(d["texto"]) if d.get("texto") else "")
             + "</div>")
    return fundo + veu + lupa + etiquetas(d, ox, oy) + corpo, "#fff", VERDE


def s_dupla(d, ctx):
    a, b = d["cima"], d["baixo"]
    def metade(m, top, bg, cor_k):
        return ('<div style="position:absolute;left:0;right:0;top:%dpx;height:%dpx;background:%s;padding:0 72px;display:flex;flex-direction:column;justify-content:center">'
                '<div class="k" style="color:%s;margin-bottom:14px">%s</div><div class="t" style="font-size:190px;line-height:.82">%s</div>'
                '<div class="sub" style="margin-top:22px;font-size:32px;max-width:860px">%s</div></div>'
                % (top, H // 2, bg, cor_k, tx(m["selo"]), tx(m["palavra"]), tx(m["texto"])))
    faixa = ('<div style="position:absolute;left:72px;right:72px;top:%dpx;transform:translateY(-50%%);z-index:6;background:#fff;color:#0b0b0c;border-radius:28px;padding:26px 34px;text-align:center;box-shadow:0 30px 60px rgba(0,0,0,.35)">'
             '<div class="t" style="font-size:52px;letter-spacing:-.04em;line-height:1">%s</div></div>' % (H // 2, tx(d["titulo"])))
    return metade(a, 0, MAGENTA, "#ffd0e1") + metade(b, H // 2, MARINHO, "#aab1ff") + faixa, "#fff", VERDE


def s_zona(d, ctx):
    bg = {"magenta": MAGENTA, "marinho": MARINHO, "tinta": TINTA}[d.get("cor", "magenta")]
    itens = "".join(
        '<div style="display:grid;grid-template-columns:64px 1fr;gap:24px;align-items:start;padding:22px 0;border-top:2px solid rgba(255,255,255,.22)">'
        '<span style="width:64px;height:64px;border-radius:50%%;background:#fff;color:%s;display:grid;place-items:center;font-size:30px;font-weight:900">%d</span>'
        '<span style="font-size:36px;font-weight:700;line-height:1.25;letter-spacing:-.02em;padding-top:8px">%s</span></div>' % (bg, k + 1, tx(it))
        for k, it in enumerate(d["itens"]))
    return ('<div style="position:absolute;inset:0;background:%s"></div>' % bg
            + '<div style="position:absolute;right:-60px;bottom:-40px;height:620px;opacity:.12;color:#fff" class="masc">%s</div>' % MARK
            + '<div style="position:absolute;left:72px;right:72px;top:170px;z-index:5"><div class="k" style="opacity:.85">%s</div>'
              '<div class="t" style="font-size:%dpx;margin-top:18px;line-height:.82">%s</div>'
              '<div class="sub" style="font-size:34px;margin-top:24px;opacity:.92;max-width:860px">%s</div>'
              '<div style="margin-top:40px">%s</div></div>' % (tx(d["selo"]), d.get("tam", 250), tx(d["verbo"]), tx(d["texto"]), itens)), "#fff", "#fff"


def s_equacao(d, ctx):
    linhas = ""
    for k, (pal, exp) in enumerate(d["termos"]):
        mais = '<span style="font-size:110px;font-weight:200;color:#00e676;line-height:.7;display:block;margin:-6px 0 6px">+</span>' if k else ""
        linhas += ('%s<div style="display:flex;align-items:baseline;justify-content:space-between;gap:30px">'
                   '<span class="t" style="font-size:128px">%s</span><span style="font-size:28px;color:#a1a1a8;text-align:right;max-width:330px;line-height:1.3">%s</span></div>' % (mais, tx(pal), tx(exp)))
    return ('<div style="position:absolute;left:72px;right:72px;top:160px"><div class="k vd">%s</div>'
            '<div class="t" style="font-size:60px;margin-top:16px;letter-spacing:-.04em;line-height:1">%s</div>'
            '<div style="margin-top:46px">%s</div></div>'
            '<div style="position:absolute;left:72px;right:72px;bottom:150px;background:#00e676;color:#000;border-radius:32px;padding:34px 40px;display:flex;justify-content:space-between;align-items:center">'
            '<span class="k" style="font-size:22px">= Resultado</span><span class="t" style="font-size:72px;letter-spacing:-.045em">%s</span></div>'
            % (tx(d["kicker"]), tx(d["titulo"]), linhas, tx(d["resultado"]))), "#fff", VERDE


def s_numero(d, ctx):
    return ('<div style="position:absolute;inset:0;background:#00e676"></div>'
            '<div style="position:absolute;left:72px;right:72px;top:190px;color:#000">'
            '<div class="k">%s</div>'
            '<div style="display:flex;align-items:center;gap:26px;margin-top:40px"><span class="t" style="font-size:150px;letter-spacing:-.06em">%s</span>'
            '<span style="font-size:34px;font-weight:700;line-height:1.2;max-width:320px">%s</span></div>'
            '<div style="font-size:120px;font-weight:200;line-height:1;margin:18px 0 0 6px">↓</div>'
            '<div class="t" style="font-size:%dpx;letter-spacing:-.07em;line-height:.82;margin-top:10px;white-space:nowrap">%s</div>'
            '<div style="font-size:40px;font-weight:700;margin-top:26px;letter-spacing:-.02em">%s</div></div>'
            '<div style="position:absolute;left:72px;right:72px;bottom:150px;color:#000;border-top:3px solid #000;padding-top:26px;font-size:46px;font-weight:300;font-style:italic;letter-spacing:-.03em">%s</div>'
            % (tx(d["kicker"]), tx(d["de"]), tx(d["de_tx"]), d.get("tam", 230), tx(d["para"]), tx(d["para_tx"]), tx(d["frase"]))), "#000", "#000"


def s_cta(d, ctx):
    img, iw, ih = panorama(ctx["foto"], ctx["larg"])
    ox = ctx["x0"] + d.get("parte", 0) * W
    oy = ctx["y0"]
    fundo = '<div style="position:absolute;inset:0;background:url(%s) -%dpx -%dpx/%dpx %dpx no-repeat;filter:grayscale(1) brightness(.45)"></div>' % (img, ox, oy, iw, ih)
    veu = '<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,11,12,.2) 0%,rgba(11,11,12,.3) 40%,#0b0b0c 70%)"></div>'
    lupa = lente(d, img, iw, ih, ox, oy, 170, 2.0) if d.get("lupa") else ""
    corpo = ('<div style="position:absolute;left:72px;right:72px;bottom:150px;z-index:10">'
             '<div class="t" style="font-size:%dpx">%s</div>'
             '<div class="sub" style="margin-top:26px;color:#d4d4d8;max-width:880px">%s</div>'
             '<div style="margin-top:40px;display:flex;align-items:center;gap:22px"><span style="background:#00e676;color:#000;font-weight:900;font-size:32px;border-radius:18px;padding:22px 34px">%s →</span>'
             '<span style="font-size:24px;color:#a1a1a8">%s</span></div></div>' % (d.get("tam", 120), tx(d["titulo"]), tx(d["texto"]), tx(d["botao"]), tx(d["url"])))
    return fundo + veu + lupa + etiquetas(d, ox, oy) + corpo, "#fff", VERDE


TIPOS = {"panorama": s_panorama, "dupla": s_dupla, "zona": s_zona, "equacao": s_equacao, "numero": s_numero, "cta": s_cta}


def gerar(slug):
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json")))
    slides = dados["slides"]; n = len(slides)
    pan = dados["panorama"]
    ctx = {"foto": pan["foto"], "larg": pan.get("largura", 2700), "x0": pan.get("x0", 0), "y0": pan.get("y0", 0)}
    css = CSS % {"f1": fonte("Montserrat[wght].ttf"), "f2": fonte("Montserrat-Italic[wght].ttf")}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f):
            os.remove(os.path.join(pasta, f))
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page(viewport={"width": W, "height": H})
        for i, sl in enumerate(slides, 1):
            corpo, cor, seta = TIPOS[sl["tipo"]](sl, ctx)
            pg.set_content('<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s">%s%s</div></body></html>' % (css, corpo, moldura(i, n, cor, seta)))
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(200)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        nav.close()
    if dados.get("legenda"):
        open(os.path.join(pasta, "legenda.txt"), "w").write(dados["legenda"])
    print(slug, n, "slides")


if __name__ == "__main__":
    gerar(sys.argv[1])
