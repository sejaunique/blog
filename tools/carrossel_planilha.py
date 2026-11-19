#!/usr/bin/env python3
"""
Carrossel "Planilha" — cada slide é uma aba de planilha: barra de fórmula, grade de
células com letras e números, célula selecionada com alça, gráfico inserido, comentário
de célula e as abas embaixo mostrando em que parte do carrossel a pessoa está.
Cores da Unique: magenta = dor/erro, marinho = estrutura, verde = resultado.

Uso:  python3 tools/carrossel_planilha.py <slug>
Lê:   instagram/<slug>/slides.json  (tipos: capa, tabela, grafico, versus, formula, checklist, cta)
Gera: instagram/<slug>/01.png ... (1080x1350) e legenda.txt
Variável CHROME opcional: caminho do Chrome, se o Chromium do Playwright não estiver instalado.
Usado em: quanto-custa-cada-venda (palavra CONTA).
"""
import html, json, os, re, sys
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from marca import LOGO
from carrossel import fonte, foto

W, H = 1080, 1350
MAR, MAG, VER = "#1e2357", "#e0055e", "#00e676"
VER_TX = "#078a46"
COLS = "ABCDEFGH"
TOPO, CAB, LIN, NUM = 132, 40, 72, 56      # início da grade, cabeçalho de colunas, altura da linha, coluna de números
COLW = (W - NUM) / 8
LINHAS = 14


def tx(t):
    """**negrito**, ==grifo verde==, ++verde++, --magenta--, //itálico fino//"""
    t = html.escape(t or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
    t = re.sub(r"==(.+?)==", r'<span class="gr">\1</span>', t, flags=re.S)
    t = re.sub(r"\+\+(.+?)\+\+", r'<span class="vd">\1</span>', t, flags=re.S)
    t = re.sub(r"--(.+?)--", r'<span class="mg">\1</span>', t, flags=re.S)
    t = re.sub(r"//(.+?)//", r'<i class="fino">\1</i>', t, flags=re.S)
    return t.replace("\n", "<br>")


def y(linha):  # topo da linha (1 = primeira)
    return TOPO + CAB + (linha - 1) * LIN


def x(col):  # esquerda da coluna (0 = A)
    return NUM + col * COLW


CSS = """
@font-face{font-family:M;src:url(%(f1)s);font-weight:100 900}
@font-face{font-family:M;src:url(%(f2)s);font-weight:100 900;font-style:italic}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1350px;overflow:hidden;font-family:M;color:#16183a;background:#fbfbfd}
.s{position:relative;width:1080px;height:1350px;overflow:hidden}
b{font-weight:900}.fino{font-weight:200;font-style:italic}
.mg{color:#e0055e}.vd{color:#078a46}
.gr{background:linear-gradient(transparent 82%%,#00e676 82%%,#00e676 94%%,transparent 94%%)}
/* barra do arquivo */
.app{position:absolute;left:0;right:0;top:0;height:64px;background:#1e2357;color:#fff;display:flex;align-items:center;gap:18px;padding:0 28px}
.app .lg{width:118px;color:#fff;display:flex}.app .lg svg{width:100%%;height:auto}
.app .arq{font-size:21px;font-weight:600;opacity:.85;letter-spacing:.01em}
.app .dots{margin-left:auto;display:flex;gap:9px}.app .dots i{width:14px;height:14px;border-radius:50%%;background:rgba(255,255,255,.28)}
.app .dots i:last-child{background:#00e676}
/* barra de fórmula */
.fx{position:absolute;left:0;right:0;top:64px;height:68px;background:#fff;border-bottom:2px solid #dcdde8;display:flex;align-items:center}
.fx .ref{width:124px;height:100%%;display:flex;align-items:center;justify-content:center;border-right:2px solid #dcdde8;font-size:22px;font-weight:700;color:#5a5d7a}
.fx .f{width:62px;text-align:center;font-size:24px;font-weight:300;font-style:italic;color:#e0055e;border-right:2px solid #dcdde8;height:100%%;display:flex;align-items:center;justify-content:center}
.fx .form{padding:0 22px;font-size:25px;font-weight:600;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:#1e2357}
/* grade */
.grade{position:absolute;left:0;right:0;top:%(topo)dpx;height:%(gh)dpx;
 background:
  repeating-linear-gradient(90deg,transparent 0 %(cw1).2fpx,#e6e7f0 %(cw1).2fpx %(cw).2fpx),
  repeating-linear-gradient(180deg,transparent 0 %(l1)dpx,#e6e7f0 %(l1)dpx %(l)dpx);
 background-position:%(num)dpx %(cab)dpx,0 %(cab)dpx;background-repeat:repeat,repeat}
.colh{position:absolute;left:0;right:0;top:%(topo)dpx;height:%(cab)dpx;background:#f0f1f7;border-bottom:2px solid #d4d6e4;display:flex;padding-left:%(num)dpx}
.colh span{width:%(cw).2fpx;text-align:center;font-size:19px;font-weight:600;color:#8a8da6;line-height:%(cab)dpx;border-left:1px solid #dcdde8}
.colh span.on{background:#dfe1f0;color:#1e2357}
.rowh{position:absolute;left:0;top:%(rt)dpx;width:%(num)dpx;bottom:%(rb)dpx;background:#f0f1f7;border-right:2px solid #d4d6e4}
.rowh span{display:block;height:%(l)dpx;line-height:%(l)dpx;text-align:center;font-size:18px;font-weight:600;color:#8a8da6;border-bottom:1px solid #dcdde8}
.rowh span.on{background:#dfe1f0;color:#1e2357}
.canto{position:absolute;left:0;top:%(topo)dpx;width:%(num)dpx;height:%(cab)dpx;background:#e6e7f0;border-right:2px solid #d4d6e4;border-bottom:2px solid #d4d6e4}
/* abas e status */
.abas{position:absolute;left:0;right:0;bottom:62px;height:58px;background:#eceef6;border-top:2px solid #d4d6e4;display:flex;align-items:flex-end;padding-left:20px;gap:4px}
.abas span{font-size:19px;font-weight:600;color:#6d7090;padding:0 18px;height:46px;line-height:46px;border-radius:10px 10px 0 0;background:#e1e3ee}
.abas span.on{background:#fff;color:#1e2357;font-weight:800;box-shadow:inset 0 -5px 0 var(--c)}
.status{position:absolute;left:0;right:0;bottom:0;height:62px;background:#1e2357;color:#fff;display:flex;align-items:center;padding:0 28px;gap:18px;font-size:20px}
.status .pg{opacity:.7}
.status .ar{margin-left:auto;background:#00e676;color:#1e2357;font-weight:800;border-radius:999px;padding:9px 20px;font-size:20px}
/* peças */
.cel{position:absolute;display:flex;align-items:center;padding:0 16px;font-size:28px;font-weight:600;background:#fff}
.sel{outline:5px solid #1e2357;outline-offset:-2px;z-index:3}
.sel:after{content:"";position:absolute;right:-9px;bottom:-9px;width:16px;height:16px;background:#1e2357;border:3px solid #fff}
.sel.mgs{outline-color:#e0055e}.sel.mgs:after{background:#e0055e}
.sel.vds{outline-color:#00c864}.sel.vds:after{background:#00c864}
.tit{position:absolute;font-weight:900;letter-spacing:-.045em;line-height:.98;z-index:2}
.nota{position:absolute;z-index:5;background:#fff8d6;border:2px solid #e8d77a;border-radius:6px;padding:18px 22px;font-size:25px;line-height:1.35;box-shadow:0 14px 30px rgba(30,35,87,.18);color:#3b3a22}
.nota small{display:block;font-size:17px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#a0461e;margin-bottom:6px}
.tri{position:absolute;width:0;height:0;border-left:16px solid transparent;border-top:16px solid #e0055e;z-index:4}
.obj{position:absolute;background:#fff;border:2px solid #b9bcd3;box-shadow:0 18px 40px rgba(30,35,87,.16);z-index:3}
.obj .h{position:absolute;width:16px;height:16px;background:#fff;border:3px solid #1e2357;border-radius:50%%}
.err{color:#e0055e;font-weight:900}
.chk{width:34px;height:34px;border:3px solid #1e2357;border-radius:7px;display:inline-grid;place-items:center;margin-right:16px;flex:none}
.chk.on{background:#00e676;border-color:#00c864}
.chk.off{border-color:#e0055e}
"""


def moldura(i, n, d, abas):
    ativa = d.get("aba", abas[i - 1] if i - 1 < len(abas) else "")
    cor = {"magenta": MAG, "verde": VER, "marinho": MAR}.get(d.get("cor_aba", "marinho"), MAR)
    sel = d.get("ref", "A1")
    col_on = COLS.index(sel[0]) if sel[0] in COLS else -1
    lin_on = int(re.sub(r"\D", "", sel) or 0)
    colh = "".join('<span class="%s">%s</span>' % ("on" if k == col_on else "", c) for k, c in enumerate(COLS))
    rowh = "".join('<span class="%s">%d</span>' % ("on" if k + 1 == lin_on else "", k + 1) for k in range(LINHAS))
    tabs = "".join('<span class="%s"%s>%s</span>' % ("on" if t == ativa else "", ' style="--c:%s"' % cor if t == ativa else "", html.escape(t)) for t in abas)
    return (
        '<div class="grade"></div><div class="colh">%s</div><div class="canto"></div><div class="rowh">%s</div>' % (colh, rowh)
        + '<div class="app"><span class="lg">%s</span><span class="arq">quanto-custa-cada-venda.xlsx</span><span class="dots"><i></i><i></i><i></i></span></div>' % LOGO
        + '<div class="fx"><span class="ref">%s</span><span class="f">fx</span><span class="form">%s</span></div>' % (html.escape(sel), html.escape(d.get("formula", "")))
        + '<div class="abas">%s</div>' % tabs
        + '<div class="status"><span>@sejauniqueoficial</span><span class="pg">Planilha %d de %d</span>%s</div>' % (i, n, '<span class="ar">Arraste →</span>' if i < n else '<span class="ar">Comente CONTA</span>')
    )


def cel(col, lin, txt, ncols=1, nlin=1, cls="", estilo=""):
    return '<div class="cel %s" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx;%s">%s</div>' % (
        cls, x(col), y(lin), COLW * ncols, LIN * nlin, estilo, txt)


def titulo(d, lin, tam=None, col=0, larg=8):
    return '<div class="tit" style="left:%dpx;top:%dpx;width:%dpx;font-size:%dpx">%s</div>' % (
        x(col) + 18, y(lin) + 6, COLW * larg - 36, tam or d.get("tam", 108), tx(d["titulo"]))


def nota(left, top, w, d):
    if not d.get("nota"):
        return ""
    return ('<div class="nota" style="left:%dpx;top:%dpx;width:%dpx"><small>%s</small>%s</div>'
            % (left, top, w, tx(d.get("nota_autor", "Comentário · Carlos")), tx(d["nota"])))


def alcas(l, t, w, h):
    pts = [(l, t), (l + w / 2, t), (l + w, t), (l, t + h / 2), (l + w, t + h / 2), (l, t + h), (l + w / 2, t + h), (l + w, t + h)]
    return "".join('<span class="h" style="left:%dpx;top:%dpx"></span>' % (px - l - 9, py - t - 9) for px, py in pts)


# ---------- tipos ----------
def s_capa(d):
    l, t, w, h = 560, y(7) + 10, 470, 560
    img = ('<div class="obj" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx"><img src="%s" style="width:100%%;height:100%%;object-fit:cover;object-position:%s;display:block">%s</div>'
           % (l, t, w, h, foto(d["img"]), d.get("pos", "center"), alcas(l, t, w, h)))
    return (
        cel(0, 1, '<span style="font-size:22px;color:#6d7090;font-weight:700;letter-spacing:.14em;text-transform:uppercase">%s</span>' % tx(d["selo"]), 4)
        + cel(1, 2, '<span class="err" style="font-size:40px">%s</span>' % tx(d["erro"]), 2, 1, "sel mgs")
        + '<div class="tri" style="left:%dpx;top:%dpx"></div>' % (x(3) - 16, y(2))
        + titulo(d, 3, d.get("tam", 132))
        + cel(0, 8, '<div><div style="font-size:64px;font-weight:900;letter-spacing:-.04em;color:#e0055e;line-height:1">%s</div><div style="font-size:22px;color:#5a5d7a;margin-top:8px;line-height:1.3">%s</div></div>' % (tx(d["destaque"]), tx(d["destaque_tx"])), 4, 2, "sel mgs", "padding:0 22px")
        + nota(x(0) + 20, y(11), 470, d)
        + img
    )


def s_tabela(d):
    out = titulo(d, 1)
    lin = d.get("inicio", 4)
    for r in d["linhas"]:
        forte = r.get("forte"); cor = r.get("cor")
        val_cls = "sel " + {"magenta": "mgs", "verde": "vds"}.get(cor, "") if r.get("sel") else ""
        cor_tx = {"magenta": "#c8044f", "verde": VER_TX}.get(cor, "#16183a")
        peso = 900 if forte else 600
        tam = 34 if forte else 27
        out += cel(0, lin, '<span style="font-weight:%d;font-size:%dpx">%s</span>' % (peso, tam - 2, tx(r["rotulo"])), 5, 1, "", "background:%s" % ("#f6f7fb" if forte else "#fff"))
        out += cel(5, lin, '<span style="margin-left:auto;font-weight:%d;font-size:%dpx;color:%s">%s</span>' % (peso, tam, cor_tx, tx(r["valor"])), 3, 1, val_cls, "background:%s" % ("#f6f7fb" if forte else "#fff"))
        lin += 1
    return out + nota(d.get("nota_x", 470), y(d.get("nota_linha", lin + 1)), d.get("nota_w", 540), d)


def s_grafico(d):
    l, t, w, h = 90, y(4) + 10, 900, 560
    mx = max(b["valor"] for b in d["barras"])
    bw = 170; gap = (w - 120 - bw * len(d["barras"])) / (len(d["barras"]) + 1)
    barras = ""
    for k, b in enumerate(d["barras"]):
        bh = (h - 250) * b["valor"] / mx
        cor = {"magenta": MAG, "verde": VER, "marinho": MAR}[b.get("cor", "marinho")]
        bx = 80 + gap + k * (bw + gap)
        barras += ('<div style="position:absolute;left:%dpx;bottom:90px;width:%dpx;height:%dpx;background:%s;border-radius:10px 10px 0 0"></div>'
                   '<div style="position:absolute;left:%dpx;bottom:%dpx;width:%dpx;text-align:center;font-size:40px;font-weight:900;letter-spacing:-.03em">%s</div>'
                   '<div style="position:absolute;left:%dpx;bottom:40px;width:%dpx;text-align:center;font-size:22px;font-weight:700;color:#5a5d7a">%s</div>'
                   % (bx, bw, bh, cor, bx - 20, 100 + bh, bw + 40, tx(b.get("rotulo_valor", str(b["valor"]))), bx - 20, bw + 40, tx(b["nome"])))
    graf = ('<div class="obj" style="left:%dpx;top:%dpx;width:%dpx;height:%dpx">'
            '<div style="position:absolute;left:30px;top:22px;font-size:22px;font-weight:800;color:#5a5d7a;letter-spacing:.08em;text-transform:uppercase">%s</div>'
            '<div style="position:absolute;left:80px;right:40px;bottom:89px;height:2px;background:#c9cbdc"></div>%s%s</div>'
            % (l, t, w, h, tx(d.get("grafico", "")), barras, alcas(l, t, w, h)))
    return titulo(d, 1) + graf + nota(d.get("nota_x", 470), y(d.get("nota_linha", 12)) - 20, d.get("nota_w", 540), d)


def s_versus(d):
    out = titulo(d, 1)
    a, b = d["colunas"]
    out += cel(0, 4, "", 2, 1, "", "background:#f0f1f7")
    out += cel(2, 4, '<span class="mg" style="font-weight:900;font-size:28px">%s</span>' % tx(a), 3, 1, "", "background:#fdeef4")
    out += cel(5, 4, '<span class="vd" style="font-weight:900;font-size:28px">%s</span>' % tx(b), 3, 1, "", "background:#e6fbf0")
    lin = 5
    for r in d["linhas"]:
        alto = r.get("alto", 1)
        sel = r.get("sel")
        out += cel(0, lin, '<span style="font-size:23px;font-weight:700;color:#5a5d7a">%s</span>' % tx(r["rotulo"]), 2, alto)
        out += cel(2, lin, '<span style="font-size:%dpx;font-weight:%d;line-height:1.2">%s</span>' % (r.get("tam", 26), r.get("peso", 600), tx(r["a"])), 3, alto)
        out += cel(5, lin, '<span style="font-size:%dpx;font-weight:%d;line-height:1.2">%s</span>' % (r.get("tam", 26), r.get("peso", 600), tx(r["b"])), 3, alto, "sel vds" if sel else "")
        lin += alto
    return out + nota(d.get("nota_x", 90), y(d.get("nota_linha", lin + 1)), d.get("nota_w", 900), d)


def s_formula(d):
    out = titulo(d, 1)
    lin = 4
    for k, p in enumerate(d["parcelas"]):
        out += cel(0, lin, '<span style="font-size:34px;font-weight:900;color:#8a8da6;width:40px">%s</span><span style="font-size:25px;font-weight:600">%s</span>' % (html.escape(p.get("op", "+")), tx(p["rotulo"])), 5)
        out += cel(5, lin, '<span style="margin-left:auto;font-size:30px;font-weight:800">%s</span>' % tx(p["valor"]), 3)
        lin += 1
    out += cel(0, lin, '<span style="font-size:34px;font-weight:900">= %s</span>' % tx(d["resultado_rotulo"]), 5, 1, "", "background:#f6f7fb")
    out += cel(5, lin, '<span style="margin-left:auto;font-size:44px;font-weight:900;letter-spacing:-.03em">%s</span>' % tx(d["resultado"]), 3, 1, "sel vds", "background:#f6f7fb")
    lin += 2
    for e in d.get("extras", []):
        cor = {"magenta": "#c8044f", "verde": VER_TX}.get(e.get("cor"), "#1e2357")
        out += cel(0, lin, '<span style="font-size:26px;font-weight:900;color:%s">%s</span>' % (cor, tx(e["rotulo"])), 3)
        out += cel(3, lin, '<span style="font-size:23px;color:#4b4f6b;line-height:1.25">%s</span>' % tx(e["texto"]), 5)
        lin += 1
    return out + nota(d.get("nota_x", 470), y(d.get("nota_linha", lin)), d.get("nota_w", 540), d)


def s_checklist(d):
    out = titulo(d, 1)
    lin = 4
    for r in d["itens"]:
        ok = r.get("ok")
        box = '<span class="chk %s">%s</span>' % ("on" if ok else "off", "✓" if ok else "")
        out += cel(0, lin, box + '<span style="font-size:26px;font-weight:700;line-height:1.2">%s</span>' % tx(r["titulo"]), 5, 1)
        out += cel(5, lin, '<span style="margin-left:auto;font-size:24px;font-weight:900;letter-spacing:.04em;color:%s">%s</span>' % (VER_TX if ok else "#c8044f", "VERDADEIRO" if ok else "FALSO"), 3, 1, "sel mgs" if r.get("sel") else "")
        if r.get("texto"):
            lin += 1
            out += cel(0, lin, '<span style="font-size:21px;color:#5a5d7a;padding-left:50px">%s</span>' % tx(r["texto"]), 8, 1, "", "background:#fbfbfd")
        lin += 1
    return out + nota(d.get("nota_x", 90), y(d.get("nota_linha", lin + 1)) - 20, d.get("nota_w", 900), d)


def s_cta(d):
    out = titulo(d, 1)
    lin = 5
    for k, it in enumerate(d["itens"]):
        out += cel(0, lin, '<span style="font-size:22px;font-weight:800;color:#8a8da6;width:56px">%02d</span><span style="font-size:27px;font-weight:700">%s</span>' % (k + 1, tx(it)), 8)
        lin += 1
    lin += 1
    out += cel(1, lin, '<span style="font-size:36px;font-weight:900">%s</span>' % tx(d["botao"]), 4, 1, "sel vds", "background:#00e676;color:#1e2357;justify-content:center")
    out += cel(1, lin + 1, '<span style="font-size:23px;color:#4b4f6b">%s</span>' % tx(d["url"]), 6, 1, "", "background:transparent")
    return out + nota(d.get("nota_x", 590), y(d.get("nota_linha", lin)) - 10, d.get("nota_w", 420), d)


TIPOS = {"capa": s_capa, "tabela": s_tabela, "grafico": s_grafico, "versus": s_versus,
         "formula": s_formula, "checklist": s_checklist, "cta": s_cta}


def gerar(slug):
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json")))
    slides = dados["slides"]; n = len(slides)
    abas = dados.get("abas") or [s.get("aba", "Aba %d" % (k + 1)) for k, s in enumerate(slides)]
    gh = H - TOPO - 120
    css = CSS % {"f1": fonte("Montserrat[wght].ttf"), "f2": fonte("Montserrat-Italic[wght].ttf"), "topo": TOPO, "gh": gh,
                 "cw": COLW, "cw1": COLW - 1, "l": LIN, "l1": LIN - 1, "num": NUM, "cab": CAB,
                 "rt": TOPO + CAB, "rb": 120}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f):
            os.remove(os.path.join(pasta, f))
    with sync_playwright() as p:
        nav = p.chromium.launch(executable_path=os.environ.get("CHROME") or None)
        pg = nav.new_page(viewport={"width": W, "height": H})
        for i, sl in enumerate(slides, 1):
            corpo = TIPOS[sl["tipo"]](sl) + moldura(i, n, sl, abas)
            pg.set_content('<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s">%s</div></body></html>' % (css, corpo))
            pg.evaluate("document.fonts.ready")
            pg.wait_for_timeout(150)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        nav.close()
    if dados.get("legenda"):
        open(os.path.join(pasta, "legenda.txt"), "w").write(dados["legenda"])
    print(slug, n, "slides")


if __name__ == "__main__":
    gerar(sys.argv[1])
