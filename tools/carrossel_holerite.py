#!/usr/bin/env python3
"""
Carrossel "Holerite" — fundo escuro com um demonstrativo de pagamento (papel claro,
borda picotada, linhas com pontilhado até o valor, carimbos coloridos).
Criado para o post "Você paga pela venda. E pelo hábito?" (ferramenta Comissão OTE).

Uso:  python3 tools/carrossel_holerite.py <slug>
Lê:   instagram/<slug>/slides.json  com "estilo": "holerite"
Gera: instagram/<slug>/01.png ... (1080x1350), legenda.txt
      e, se houver "capa_blog", blog/assets/<arquivo> (1600x900) a partir do 1º slide.

Tipos de slide:
  capa     título grande + holerite com linhas (a destacada ganha carimbo)
  soma     linhas do holerite somando até o total (com barra do mix)
  versus   duas colunas: o que a comissão paga x o que o bônus paga
  pilares  4 linhas coloridas com o indicador de cada pilar
  regras   lista numerada em cartões
  numero   um número gigante com explicação
  cta      canhoto do holerite com a chamada e o botão

Marcações no texto: ==verde==, --magenta--, //fino itálico//, **negrito**
"""
import base64, html, json, os, re, sys
from playwright.sync_api import sync_playwright

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(__file__))
from marca import LOGO

W, H = 1080, 1350
ARROBA = "@sejauniqueoficial"
COR = {"verde": "#00c864", "magenta": "#e0055e", "marinho": "#2b3384", "roxo": "#6a2fc1", "ouro": "#e3ac12", "tinta": "#0b0b0c"}


def tx(t):
    t = html.escape(t or "")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t, flags=re.S)
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
body{width:1080px;height:1350px;background:#0b0b0c;font-family:M,sans-serif;color:#f5f5f5;overflow:hidden}
.s{position:absolute;inset:0;padding:150px 80px 140px;display:flex;flex-direction:column;
   background:radial-gradient(circle at 85%% 8%%,rgba(0,230,118,.10),transparent 40%%),radial-gradient(circle at 5%% 95%%,rgba(224,5,94,.10),transparent 40%%),#0b0b0c}
.s::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:54px 54px;pointer-events:none}
.topo{position:absolute;left:80px;right:80px;top:64px;display:flex;justify-content:space-between;align-items:center;z-index:3}
.topo .lg svg{height:30px;width:auto;color:#f5f5f5}
.topo .pg{font-size:22px;font-weight:700;letter-spacing:.1em;color:#a1a1a8}.topo .pg span{opacity:.5}
.pe{position:absolute;left:80px;right:80px;bottom:60px;display:flex;justify-content:space-between;align-items:center;font-size:24px;font-weight:600;color:#a1a1a8;z-index:3}
.arr{font-weight:800;color:#0b0b0c;background:#00e676;padding:14px 26px;border-radius:999px;box-shadow:0 8px 0 #00a956}
.k{font-size:24px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#00e676;margin-bottom:24px;position:relative}
h1{font-size:104px;line-height:.98;letter-spacing:-.045em;font-weight:800;position:relative}
h2{font-size:74px;line-height:1;letter-spacing:-.04em;font-weight:800;position:relative}
h1 i,h2 i{font-weight:200}
.vd{color:#00e676}.mg{color:#ff3d8b}
p.sub{font-size:32px;line-height:1.4;color:#c9c9cf;margin-top:26px;position:relative}
p.sub b{color:#fff}
.papel{position:relative;margin-top:auto;background:#f6f4ee;color:#141416;border-radius:18px 18px 0 0;padding:40px 46px 54px;
  -webkit-mask:radial-gradient(14px at 50%% 100%%,#0000 98%%,#000) 0 0/36px 100%%;mask:radial-gradient(14px at 50%% 100%%,#0000 98%%,#000) 0 0/36px 100%%;
  box-shadow:0 30px 60px rgba(0,0,0,.5)}
.papel .cab{display:flex;justify-content:space-between;align-items:baseline;font-size:20px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6b72;border-bottom:3px solid #141416;padding-bottom:16px;margin-bottom:10px}
.ln{display:flex;align-items:baseline;gap:14px;font-size:38px;font-weight:600;padding:20px 0;border-bottom:2px dashed #d6d3cb;position:relative}
.ln:last-child{border-bottom:0}
.ln .d{flex:1;border-bottom:3px dotted #b9b6ad;transform:translateY(-8px)}
.ln b{font-variant-numeric:tabular-nums;font-weight:800;white-space:nowrap}
.ln .bola{width:18px;height:18px;border-radius:50%%;flex:none;align-self:center}
.ln.tot{font-size:50px;border-top:3px solid #141416;border-bottom:0;margin-top:6px;padding-top:20px}
.ln.tot b{color:#00a956}
.ln.dest{background:linear-gradient(90deg,rgba(227,172,18,.22),rgba(227,172,18,0));margin:0 -20px;padding-inline:20px;border-radius:10px}
.carimbo{position:absolute;right:210px;top:14px;transform:rotate(-8deg);border:6px solid var(--c);color:var(--c);font-size:30px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:10px 20px;border-radius:12px;background:rgba(246,244,238,.85);z-index:2}
.mix{display:flex;height:22px;border-radius:11px;overflow:hidden;margin:20px 0 6px}
.mix i{display:block;height:100%%}
.vs{display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:auto;position:relative}
.col{border-radius:26px;padding:44px 38px;min-height:640px}
.col .t{font-size:22px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:22px;opacity:.75}
.col .g{font-size:64px;font-weight:800;letter-spacing:-.03em;line-height:1;margin-bottom:26px}
.col ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:20px;font-size:34px;line-height:1.3;font-weight:600}
.col li::before{content:"— ";opacity:.5}
.pil{margin-top:auto;display:flex;flex-direction:column;gap:16px;position:relative}
.pl{display:grid;grid-template-columns:16px 1fr auto;gap:24px;align-items:center;background:#f6f4ee;color:#141416;border-radius:22px;padding:26px 30px}
.pl .bar{width:16px;height:100%%;border-radius:8px;background:var(--c);min-height:80px}
.pl .n{font-size:22px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--c)}
.pl .x{font-size:34px;font-weight:700;line-height:1.25;margin-top:6px}
.pl .p{font-size:26px;font-weight:800;color:#6b6b72;text-align:right;white-space:nowrap}
.rg{margin-top:auto;display:flex;flex-direction:column;gap:16px;position:relative}
.r{display:grid;grid-template-columns:96px 1fr;gap:20px;align-items:center;border:2px solid #2a2a2e;background:#141416;border-radius:22px;padding:30px 32px}
.r .nn{font-size:70px;font-weight:200;font-style:italic;color:#00e676;line-height:1}
.r .x{font-size:35px;font-weight:600;line-height:1.3}.r .x b{color:#fff;font-weight:800}
.big{font-size:330px;font-weight:800;letter-spacing:-.06em;line-height:.85;color:#00e676;margin-top:auto;position:relative;font-variant-numeric:tabular-nums}
.big small{font-size:110px;font-weight:200;font-style:italic;letter-spacing:-.03em;margin-right:12px}
.ctab{margin-top:auto;position:relative;background:#f6f4ee;color:#141416;border-radius:28px;padding:50px 50px 56px;border-top:6px dashed #0b0b0c}
.ctab .t{font-size:22px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;color:#6b6b72}
.ctab h3{font-size:76px;line-height:1.02;letter-spacing:-.04em;font-weight:800;margin:14px 0 22px}
.ctab h3 i{font-weight:200}
.ctab ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:14px;font-size:32px;font-weight:600;margin-bottom:34px}
.ctab li::before{content:"✓ ";color:#00a956;font-weight:900}
.bt{display:inline-block;background:#00e676;color:#0b0b0c;font-size:34px;font-weight:900;padding:24px 40px;border-radius:999px;box-shadow:0 10px 0 #00a956}
"""


def moldura(i, n):
    seta = '<span class="arr">Arraste →</span>' if i < n else ""
    return ('<div class="topo"><span class="lg">%s</span><span class="pg">%02d<span> / %02d</span></span></div>' % (LOGO, i, n)
            + '<div class="pe"><span>%s</span>%s</div>' % (ARROBA, seta))


def linhas(ls):
    out = ""
    for l in ls:
        cls = "ln" + (" dest" if l.get("destaque") else "") + (" tot" if l.get("total") else "")
        bola = '<span class="bola" style="background:%s"></span>' % COR.get(l["cor"], l["cor"]) if l.get("cor") else ""
        car = ""
        out += '<div class="%s">%s%s<span>%s</span><span class="d"></span><b>%s</b></div>' % (cls, car, bola, tx(l["t"]), html.escape(l["v"]))
    return out


def carimbo(ls):
    for l in ls:
        if l.get("carimbo"):
            return '<span class="carimbo" style="--c:%s">%s</span>' % (COR.get(l.get("carimbo_cor", "magenta")), html.escape(l["carimbo"]))
    return ""


def topo(d):
    h = '<div class="k">%s</div>' % tx(d["kicker"]) if d.get("kicker") else ""
    tag = "h1" if d["tipo"] == "capa" else "h2"
    h += "<%s>%s</%s>" % (tag, tx(d["titulo"]), tag) if d.get("titulo") else ""
    h += '<p class="sub">%s</p>' % tx(d["sub"]) if d.get("sub") else ""
    return h


def s_capa(d):
    return topo(d) + '<div class="papel">%s<div class="cab"><span>%s</span><span>%s</span></div>%s</div>' % (
        carimbo(d["linhas"]), html.escape(d.get("cab", "Demonstrativo de pagamento")), html.escape(d.get("ref", "")), linhas(d["linhas"]))


def s_soma(d):
    mix = ""
    if d.get("mix"):
        mix = '<div class="mix">%s</div>' % "".join('<i style="width:%s%%;background:%s"></i>' % (m[1], COR.get(m[0], m[0])) for m in d["mix"])
    return topo(d) + '<div class="papel"><div class="cab"><span>%s</span><span>%s</span></div>%s%s</div>' % (
        html.escape(d.get("cab", "")), html.escape(d.get("ref", "")), mix, linhas(d["linhas"]))


def s_versus(d):
    cols = ""
    for c in d["colunas"]:
        cols += '<div class="col" style="background:%s;color:%s"><div class="t">%s</div><div class="g">%s</div><ul>%s</ul></div>' % (
            COR.get(c["cor"], c["cor"]), c.get("texto", "#fff"), html.escape(c["t"]), tx(c["g"]), "".join("<li>%s</li>" % tx(x) for x in c["itens"]))
    return topo(d) + '<div class="vs">%s</div>' % cols


def s_pilares(d):
    return topo(d) + '<div class="pil">%s</div>' % "".join(
        '<div class="pl" style="--c:%s"><span class="bar"></span><div><div class="n">%s</div><div class="x">%s</div></div><div class="p">%s</div></div>' % (
            COR.get(p["cor"], p["cor"]), html.escape(p["n"]), tx(p["x"]), html.escape(p.get("p", ""))) for p in d["pilares"])


def s_regras(d):
    return topo(d) + '<div class="rg">%s</div>' % "".join(
        '<div class="r"><span class="nn">%d</span><span class="x">%s</span></div>' % (i + 1, tx(x)) for i, x in enumerate(d["itens"]))


def s_numero(d):
    return topo(d) + '<div class="big"><small>%s</small>%s</div><p class="sub">%s</p>' % (html.escape(d.get("pre", "")), html.escape(d["numero"]), tx(d.get("nota", "")))


def s_cta(d):
    return topo(d) + '<div class="ctab"><div class="t">%s</div><h3>%s</h3><ul>%s</ul><span class="bt">%s</span></div>' % (
        html.escape(d.get("selo", "")), tx(d["chamada"]), "".join("<li>%s</li>" % tx(x) for x in d["itens"]), html.escape(d["botao"]))


TIPOS = {"capa": s_capa, "soma": s_soma, "versus": s_versus, "pilares": s_pilares, "regras": s_regras, "numero": s_numero, "cta": s_cta}


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
            # capa do blog 16:9: título à esquerda, holerite à direita
            css2 = css.replace("body{width:1080px;height:1350px", "body{width:1600px;height:900px")
            css2 += ".s{padding:110px 90px 90px;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.s>.esq{position:relative}.papel{margin-top:0}h1{font-size:84px}.ln{font-size:30px;padding:14px 0}.ln.tot{font-size:38px}.carimbo{right:215px;font-size:22px}"
            sl = slides[0]
            corpo = '<div class="esq">%s</div><div class="papel">%s<div class="cab"><span>%s</span><span>%s</span></div>%s</div>' % (
                topo(sl), carimbo(sl["linhas"]), html.escape(sl.get("cab", "")), html.escape(sl.get("ref", "")), linhas(sl["linhas"]))
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
