#!/usr/bin/env python3
"""
Carrossel Unique — gerador novo (do zero, tudo em código, sem Canva).

Pegada: a mesma do bloco do Alda.CRM no relatório do diagnóstico, nas cores da Unique.
Fundo claro com brilhos suaves de cor, cards brancos com sombra, selos em pílula,
ícones Tabler de traço fino em quadradinhos coloridos, botão com volume e o "I" da
marca como mascote (o papel que o pato faz no Alda).

Cores com significado (manual da marca):
  verde   = afirmação (o que dá certo, o que ganhar)
  magenta = negação (o problema, o que perder)
  marinho = estrutura (o que já está estabelecido)

Uso:  python3 tools/carrossel.py <slug>
Lê:   instagram/<slug>/slides.json
Gera: instagram/<slug>/01.png ... (1080x1350) e legenda.txt
Depois: python3 tools/instagram_pagina.py
"""
import base64, html, io, json, os, re, sys
from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from marca import LOGO, MARK

W, H = 1080, 1350
ARROBA = "@sejauniqueoficial"
MARINHO, MAGENTA, VERDE = "#1e2357", "#e0055e", "#00e676"
VERDE_TX, MAGENTA_TX = "#078a46", "#c8044f"


# ---------- utilidades ----------
def tx(t):
    """**negrito**, ==grifo verde==, ++verde++, --magenta--, //itálico fino//"""
    t = html.escape(t or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"==(.+?)==", r'<span class="gr">\1</span>', t, flags=re.S)
    t = re.sub(r"\+\+(.+?)\+\+", r'<span class="vd">\1</span>', t, flags=re.S)
    t = re.sub(r"--(.+?)--", r'<span class="mg">\1</span>', t, flags=re.S)
    t = re.sub(r"//(.+?)//", r'<i>\1</i>', t, flags=re.S)
    return t.replace("\n", "<br>")

def ico(nome, cor="currentColor", tam=40, traco=1.6):
    s = open(os.path.join(RAIZ, "tools/icones/%s.svg" % nome)).read()
    s = s[s.index("<svg"):]
    s = re.sub(r'width="24"\s*height="24"', 'width="%d" height="%d"' % (tam, tam), s)
    s = s.replace('stroke="currentColor"', 'stroke="%s"' % cor).replace('stroke-width="2"', 'stroke-width="%s"' % traco)
    return s

def foto(p, larg=1300):
    im = Image.open(os.path.join(RAIZ, p)).convert("RGB")
    if im.width > larg:
        im = im.resize((larg, round(im.height * larg / im.width)))
    b = io.BytesIO(); im.save(b, "JPEG", quality=88)
    return "data:image/jpeg;base64," + base64.b64encode(b.getvalue()).decode()

def fonte(arq):
    return "data:font/ttf;base64," + base64.b64encode(open(os.path.join(RAIZ, "tools/fonts", arq), "rb").read()).decode()

QUAD = {"verde": (VERDE, MARINHO), "magenta": (MAGENTA, "#fff"), "marinho": (MARINHO, "#fff"), "claro": ("#eef0f8", MARINHO)}
def quad(nome, cor="marinho", tam=84):
    bg, fg = QUAD[cor]
    return '<span class="q" style="width:%dpx;height:%dpx;background:%s">%s</span>' % (tam, tam, bg, ico(nome, fg, round(tam * .52)))

def mascote(x, y, alt=300, rot=-12, cor=MARINHO):
    """O 'I' da Unique espiando pela borda, com risquinhos verdes de movimento."""
    return ('<div class="masc" style="left:%dpx;top:%dpx;height:%dpx;transform:rotate(%ddeg);color:%s">%s'
            '<svg class="risco" viewBox="0 0 60 60"><path d="M10 40 L26 26 M20 52 L44 36 M30 18 L42 8" stroke="%s" stroke-width="7" stroke-linecap="round"/></svg></div>'
            % (x, y, alt, rot, cor, MARK, VERDE))


CSS = """
@font-face{font-family:M;src:url(%(f1)s);font-weight:100 900;font-style:normal}
@font-face{font-family:M;src:url(%(f2)s);font-weight:100 900;font-style:italic}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px}
body{font-family:M,sans-serif;color:#1e2357;-webkit-font-smoothing:antialiased;overflow:hidden}
.s{position:relative;width:1080px;height:1350px;overflow:hidden;background:#fff}
.s.escuro{background:#141842;color:#fff}
.brilho{position:absolute;border-radius:50%%;pointer-events:none}
.topo{position:absolute;left:72px;right:72px;top:62px;display:flex;justify-content:space-between;align-items:center;z-index:5}
.topo .lg svg{height:30px;width:auto;display:block}
.pg{font-size:21px;font-weight:600;letter-spacing:.06em;background:#fff;border:1.5px solid #e6e7ef;border-radius:999px;padding:9px 20px;color:#1e2357}
.escuro .pg{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.18);color:#fff}
.pe{position:absolute;left:72px;right:72px;bottom:62px;display:flex;justify-content:space-between;align-items:center;z-index:5}
.arroba{font-size:22px;font-weight:500;color:#6b6e85;letter-spacing:.01em}
.escuro .arroba{color:#a9acc8}
.bt{display:inline-flex;align-items:center;gap:14px;background:#00e676;color:#1e2357;font-weight:700;font-size:26px;border-radius:999px;padding:16px 30px 16px 34px;box-shadow:0 8px 0 #00b85c}
.bt.mar{background:#1e2357;color:#fff;box-shadow:0 8px 0 #0c1038}
.selo{display:inline-block;font-size:21px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;background:#1e2357;color:#fff;border-radius:10px;padding:10px 18px}
.selo.vd{background:#00e676;color:#1e2357}.selo.mg{background:#e0055e;color:#fff}
.t{font-weight:900;letter-spacing:-.04em;line-height:.98}
.t i,.fr i{font-style:italic;font-weight:300;letter-spacing:-.03em}
.vd{color:#078a46}.escuro .vd{color:#00e676}
.mg{color:#e0055e}
.gr{text-decoration:underline;text-decoration-color:#00e676;text-decoration-thickness:6px;text-underline-offset:10px}
.sub{font-size:31px;line-height:1.45;font-weight:400;color:#4b4f6b}
.escuro .sub{color:#c9cbe0}
.card{background:#fff;border:1.5px solid #ececf2;border-radius:32px;box-shadow:0 22px 60px rgba(30,35,87,.10)}
.q{display:grid;place-items:center;border-radius:22px;flex:none}
.masc{position:absolute;z-index:3;transform-origin:50%% 100%%}
.masc svg:first-child{height:100%%;width:auto;display:block}
.masc .risco{position:absolute;left:-58px;top:-18px;width:70px;height:70px}
.foto{position:absolute;overflow:hidden;border-radius:40px;border:12px solid #fff;box-shadow:0 30px 70px rgba(30,35,87,.18)}
.foto img{width:100%%;height:100%%;object-fit:cover;display:block}
"""

def brilhos(conj):
    pos = {
        "a": [(MAGENTA, .16, 780, -260, 760), (VERDE, .26, -340, 820, 820), (MARINHO, .07, 520, 900, 700)],
        "b": [(VERDE, .24, 700, -300, 820), (MAGENTA, .12, -360, 700, 760)],
        "c": [(VERDE, .22, -320, -260, 780), (MARINHO, .08, 640, 760, 820), (MAGENTA, .10, 760, 120, 520)],
        "d": [(MAGENTA, .34, 620, -300, 900), (VERDE, .30, -420, 820, 900)],
    }[conj]
    out = ""
    for cor, a, x, y, d in pos:
        r, g, b = int(cor[1:3], 16), int(cor[3:5], 16), int(cor[5:7], 16)
        out += '<div class="brilho" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;background:radial-gradient(closest-side,rgba(%d,%d,%d,%s),rgba(%d,%d,%d,0))"></div>' % (x, y, d, d, r, g, b, a, r, g, b)
    return out

def moldura(i, n, escuro=False):
    cor = "#fff" if escuro else MARINHO
    topo = '<div class="topo"><span class="lg" style="color:%s">%s</span><span class="pg">%02d / %02d</span></div>' % (cor, LOGO, i, n)
    dir_ = ('<span class="bt">Arraste %s</span>' % ico("arrow-right", MARINHO, 30, 2.2)) if i < n else ""
    return topo + '<div class="pe"><span class="arroba">%s</span>%s</div>' % (ARROBA, dir_)


# ---------- tipos de slide ----------
def s_capa(d):
    return brilhos("a") + (
        '<div class="foto" style="left:452px;top:150px;width:560px;height:660px;transform:rotate(2deg)"><img src="%s" style="object-position:%s"></div>' % (foto(d["img"]), d.get("pos", "center"))
        + '<div style="position:absolute;left:72px;top:190px;width:380px;display:flex;flex-direction:column;gap:22px"><span class="selo" style="align-self:flex-start">%s</span>'
          '<div style="font-size:34px;font-weight:800;letter-spacing:-.02em;line-height:1.15">%s</div>'
          '<div style="display:flex;align-items:center;gap:10px;font-size:24px;color:#4b4f6b">%s%s</div></div>' % (tx(d["selo"]), tx(d["nome"]), ico("map-pin", MARINHO, 28), tx(d["local"]))
        + '<div class="card" style="position:absolute;left:150px;top:580px;width:430px;padding:26px 30px;display:flex;align-items:center;gap:22px;transform:rotate(-3deg)">%s'
          '<div><div style="font-size:64px;font-weight:900;letter-spacing:-.04em;line-height:1">%s</div><div style="font-size:21px;color:#4b4f6b;line-height:1.3;margin-top:4px">%s</div></div></div>' % (quad("trending-up", "verde", 80), tx(d["destaque"]), tx(d["destaque_tx"]))
        + '<div style="position:absolute;left:72px;right:72px;top:860px"><div class="t" style="font-size:%dpx">%s</div><div class="sub" style="margin-top:22px;max-width:860px;font-size:28px">%s</div></div>' % (d.get("tam", 104), tx(d["titulo"]), tx(d["texto"]))
    )

def s_lista(d):
    linhas = "".join(
        '<div style="display:flex;align-items:center;gap:26px;padding:26px 0;%s">%s<div><div style="font-size:34px;font-weight:800;letter-spacing:-.02em">%s</div><div style="font-size:25px;color:#5b5f78;margin-top:4px">%s</div></div></div>'
        % ("border-top:1.5px solid #efeff4" if k else "", quad(it["icone"], it.get("cor", "marinho")), tx(it["titulo"]), tx(it["texto"]))
        for k, it in enumerate(d["itens"]))
    return brilhos(d.get("brilho", "b")) + (
        '<div style="position:absolute;left:72px;right:72px;top:190px"><span class="selo">%s</span><div class="t" style="font-size:%dpx;margin-top:34px">%s</div></div>' % (tx(d["selo"]), d.get("tam", 112), tx(d["titulo"]))
        + '<div class="card" style="position:absolute;left:72px;right:72px;top:%dpx;padding:18px 40px">%s</div>' % (d.get("top", 560), linhas)
        + ('<div style="position:absolute;left:72px;right:72px;top:%dpx;font-size:40px;font-weight:700;letter-spacing:-.02em;line-height:1.25">%s</div>' % (d.get("nota_top", 1090), tx(d["nota"])) if d.get("nota") else "")
    )

def s_piramide(d):
    niveis = d["niveis"]; n = len(niveis); alt = 96; gap = 12; base = 800; topo_w = 360
    blocos = ""
    for k, nv in enumerate(niveis):
        w = topo_w + (base - topo_w) * k / (n - 1)
        x = (W - w) / 2 + 30; y = 540 + k * (alt + gap)
        cor = nv.get("cor", "claro")
        bg, fg = {"verde": (VERDE, MARINHO), "magenta": (MAGENTA, "#fff"), "claro": ("#f1f2f8", MARINHO)}[cor]
        chip = ('<span style="font-size:19px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;background:%s;color:%s;border-radius:8px;padding:6px 12px">%s</span>'
                % ("#fff" if cor != "claro" else MARINHO, MARINHO if cor != "claro" else "#fff", tx(nv["chip"]))) if nv.get("chip") else ""
        blocos += ('<div style="position:absolute;left:%dpx;top:%dpx;width:%dpx;height:%dpx;background:%s;color:%s;border-radius:22px;display:flex;align-items:center;justify-content:center;gap:18px;font-size:%dpx;font-weight:%d;letter-spacing:-.01em;%s">%s%s</div>'
                   % (x, y, w, alt, bg, fg, 31 if cor != "claro" else 28, 800 if cor != "claro" else 600, "box-shadow:0 14px 34px rgba(30,35,87,.16)" if cor != "claro" else "", tx(nv["nome"]), chip))
    seta = ('<div style="position:absolute;left:72px;top:540px;height:%dpx;display:flex;flex-direction:column;justify-content:space-between;align-items:center;width:40px">%s<div style="flex:1;width:3px;margin:10px 0;background:linear-gradient(%s,%s);border-radius:3px"></div></div>'
            % (n * (alt + gap) - gap, ico("arrow-up-right", VERDE_TX, 36, 2), VERDE, MAGENTA))
    return brilhos("c") + (
        '<div style="position:absolute;left:72px;right:72px;top:190px"><span class="selo">%s</span><div class="t" style="font-size:%dpx;margin-top:34px">%s</div></div>' % (tx(d["selo"]), d.get("tam", 100), tx(d["titulo"]))
        + blocos + seta
        + '<div style="position:absolute;left:72px;right:72px;top:1120px;display:flex;justify-content:space-between;font-size:22px;font-weight:700;letter-spacing:.08em;text-transform:uppercase"><span class="vd">%s</span><span class="mg">%s</span></div>' % (tx(d["legenda_cima"]), tx(d["legenda_baixo"]))
    )

def s_frase(d):
    esc = d.get("escuro")
    return brilhos("d" if esc else "c") + (
        '<div style="position:absolute;left:72px;right:72px;top:%dpx">%s<div class="t fr" style="font-size:%dpx;line-height:1.05;margin-top:46px">%s</div>%s</div>'
        % (d.get("top", 330), quad(d.get("icone", "quote"), "verde", 96), d.get("tam", 92), tx(d["texto"]),
           ('<div style="margin-top:44px;font-size:24px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:%s">— %s</div>' % ("#a9acc8" if esc else "#6b6e85", tx(d["assina"]))) if d.get("assina") else "")
        + (mascote(850, 840, 300, -14, "#fff" if esc else MARINHO) if d.get("mascote") else "")
    )

def s_versus(d):
    a, b = d["antes"], d["depois"]
    def card(c, top, h, cor, comfoto):
        largura_txt = 520 if comfoto else 860
        ft = ('<div style="position:absolute;right:28px;top:28px;bottom:28px;width:330px;border-radius:24px;overflow:hidden"><img src="%s" style="width:100%%;height:100%%;object-fit:cover;object-position:%s"></div>' % (foto(c["img"]), c.get("pos", "center"))) if comfoto else ""
        return ('<div class="card" style="position:absolute;left:72px;right:72px;top:%dpx;height:%dpx;padding:40px 44px;overflow:hidden">%s'
                '<div style="width:%dpx;display:flex;flex-direction:column;gap:18px"><span class="selo %s" style="align-self:flex-start">%s</span>'
                '<div style="font-size:50px;font-weight:900;letter-spacing:-.035em;line-height:1.02">%s</div><div style="font-size:26px;line-height:1.45;color:#4b4f6b">%s</div></div></div>'
                % (top, h, ft, largura_txt, cor, tx(c["selo"]), tx(c["titulo"]), tx(c["texto"])))
    return brilhos("b") + (
        '<div style="position:absolute;left:72px;right:72px;top:180px"><div class="t" style="font-size:%dpx">%s</div></div>' % (d.get("tam", 84), tx(d["titulo"]))
        + card(a, 400, 330, "mg", False)
        + '<div style="position:absolute;left:504px;top:704px;width:72px;height:72px;border-radius:50%%;background:%s;display:grid;place-items:center;z-index:4;box-shadow:0 10px 24px rgba(30,35,87,.25)">%s</div>' % (MARINHO, ico("arrow-right", "#fff", 34, 2.2).replace("<svg", '<svg style="transform:rotate(90deg)"'))
        + card(b, 750, 420, "vd", True)
    )

def s_passos(d):
    cards = "".join(
        '<div class="card" style="display:flex;align-items:center;gap:30px;padding:34px 40px">%s<div style="flex:1"><div style="display:flex;align-items:baseline;gap:14px"><span style="font-size:24px;font-weight:700;color:#9a9db5">%02d</span><span style="font-size:40px;font-weight:900;letter-spacing:-.03em">%s</span></div><div style="font-size:26px;line-height:1.4;color:#4b4f6b;margin-top:6px">%s</div></div></div>'
        % (quad(it["icone"], it.get("cor", "marinho"), 96), k + 1, tx(it["titulo"]), tx(it["texto"]))
        for k, it in enumerate(d["itens"]))
    return brilhos("a") + (
        '<div style="position:absolute;left:72px;right:72px;top:190px"><span class="selo">%s</span><div class="t" style="font-size:%dpx;margin-top:34px">%s</div></div>' % (tx(d["selo"]), d.get("tam", 104), tx(d["titulo"]))
        + '<div style="position:absolute;left:72px;right:72px;top:%dpx;display:flex;flex-direction:column;gap:26px">%s</div>' % (d.get("top", 520), cards)
    )

def s_numero(d):
    p = d["pct"]; r = 230; c = 2 * 3.14159 * r
    anel = ('<svg width="560" height="560" viewBox="0 0 560 560" style="position:absolute;left:260px;top:300px">'
            '<circle cx="280" cy="280" r="%d" fill="none" stroke="#eef0f8" stroke-width="44"/>'
            '<circle cx="280" cy="280" r="%d" fill="none" stroke="%s" stroke-width="44" stroke-linecap="round" stroke-dasharray="%.1f %.1f" transform="rotate(-90 280 280)"/>'
            '<circle cx="280" cy="280" r="%d" fill="none" stroke="%s" stroke-width="44" stroke-linecap="round" stroke-dasharray="%.1f %.1f" transform="rotate(%.1f 280 280)"/></svg>'
            % (r, r, VERDE, c * p / 100 - 30, c, r, MAGENTA, c * (100 - p) / 100 - 30, c, -90 + 360 * p / 100 + 4))
    return brilhos("b") + (
        '<div style="position:absolute;left:72px;top:190px"><span class="selo vd">%s</span></div>' % tx(d["selo"])
        + anel
        + '<div style="position:absolute;left:260px;top:300px;width:560px;height:560px;display:flex;flex-direction:column;align-items:center;justify-content:center"><div style="font-size:170px;font-weight:900;letter-spacing:-.06em;line-height:1">%d%%</div><div style="font-size:26px;font-weight:600;color:#4b4f6b;margin-top:6px">%s</div></div>' % (p, tx(d["rotulo"]))
        + '<div style="position:absolute;left:72px;right:72px;top:930px;text-align:center"><div class="t" style="font-size:%dpx">%s</div><div class="sub" style="margin:22px auto 0;max-width:820px">%s</div></div>' % (d.get("tam", 72), tx(d["titulo"]), tx(d["texto"]))
    )

def s_cta(d):
    return brilhos("a") + (
        '<div style="position:absolute;left:72px;right:72px;top:220px"><span class="selo">%s</span><div class="t" style="font-size:%dpx;margin-top:36px">%s</div><div class="sub" style="margin-top:26px;max-width:760px">%s</div></div>' % (tx(d["selo"]), d.get("tam", 108), tx(d["titulo"]), tx(d["texto"]))
        + '<div class="card" style="position:absolute;left:72px;width:700px;top:860px;padding:40px 44px;display:flex;flex-direction:column;gap:26px">'
          '<span class="bt" style="align-self:flex-start;font-size:30px">%s %s</span>'
          '<div style="display:flex;align-items:center;gap:12px;font-size:24px;color:#4b4f6b">%s%s</div></div>' % (tx(d["botao"]), ico("arrow-right", MARINHO, 32, 2.2), ico("hand-finger-right", MARINHO, 30), tx(d["url"]))
        + mascote(870, 860, 420, -12)
    )

TIPOS = {"capa": s_capa, "lista": s_lista, "piramide": s_piramide, "frase": s_frase, "versus": s_versus, "passos": s_passos, "numero": s_numero, "cta": s_cta}


def gerar(slug):
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json")))
    slides = dados["slides"]; n = len(slides)
    css = CSS % {"f1": fonte("Montserrat[wght].ttf"), "f2": fonte("Montserrat-Italic[wght].ttf")}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f):
            os.remove(os.path.join(pasta, f))
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page(viewport={"width": W, "height": H})
        for i, sl in enumerate(slides, 1):
            esc = bool(sl.get("escuro"))
            corpo = TIPOS[sl["tipo"]](sl) + moldura(i, n, esc)
            pg.set_content('<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s%s">%s</div></body></html>' % (css, " escuro" if esc else "", corpo))
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(150)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        nav.close()
    if dados.get("legenda"):
        open(os.path.join(pasta, "legenda.txt"), "w").write(dados["legenda"])
    print(slug, n, "slides")


if __name__ == "__main__":
    gerar(sys.argv[1])
