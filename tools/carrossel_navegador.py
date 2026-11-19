#!/usr/bin/env python3
"""
Carrossel "Navegador" — cada slide é uma janela do Google Chrome sobre um papel de parede
escuro com brilhos (magenta, verde, marinho): abas no topo, barra de endereço com a página
do carrossel e, quando faz sentido, o painel lateral da IA. Criado para o post
"ia-dentro-do-navegador" (palestra na Imersão 360 da Textil Club, isca /claude-na-empresa/).

Uso:  python3 tools/carrossel_navegador.py <slug>
Lê:   instagram/<slug>/slides.json  com "estilo": "navegador"
Gera: instagram/<slug>/01.png ... (1080x1350), legenda.txt
      e, se houver "capa_blog", blog/assets/<arquivo> (1600x900).

Tipos de slide (todos aceitam "aba" = título da aba e "url" = caminho na barra):
  capa     foto no topo da página + kicker + título + sub
  frase    frase grande + apoio
  degraus  3 degraus empilhados (cor, título, texto)
  painel   página fictícia à esquerda (CRM) + painel da IA com pedido, resposta e ações feitas
  lista    pedidos em balões, como histórico de conversa
  regra    duas colunas (no começo × com o tempo) + frase final
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
body{width:1080px;height:1350px;font-family:M,sans-serif;color:#111113;overflow:hidden;background:#0c0c10}
.s{position:absolute;inset:0;background:#0c0c10;overflow:hidden}
.s::before{content:"";position:absolute;inset:-200px;
  background:radial-gradient(520px 520px at 8%% 12%%,rgba(224,5,94,.55),transparent 70%%),
             radial-gradient(620px 620px at 100%% 40%%,rgba(43,51,132,.9),transparent 70%%),
             radial-gradient(560px 560px at 30%% 108%%,rgba(0,230,118,.38),transparent 70%%);filter:blur(10px)}
.s::after{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:54px 54px}
/* janela */
.jn{position:absolute;left:54px;right:54px;top:96px;bottom:150px;border-radius:30px;overflow:hidden;z-index:2;
    background:#f7f6f2;box-shadow:0 50px 100px rgba(0,0,0,.6),0 0 0 1.5px rgba(255,255,255,.12);display:flex;flex-direction:column}
.abas{height:68px;flex:none;background:#1c1c22;display:flex;align-items:flex-end;padding:0 18px;gap:6px}
.bol{display:flex;gap:10px;align-self:center;margin-right:16px}
.bol i{width:16px;height:16px;border-radius:50%%;background:%(m)s;display:block}.bol i:nth-child(2){background:#f5c400}.bol i:nth-child(3){background:%(v)s}
.aba{height:52px;padding:0 22px;border-radius:16px 16px 0 0;display:flex;align-items:center;gap:12px;font-size:21px;font-weight:700;color:#d9d9e0;white-space:nowrap;max-width:420px;overflow:hidden}
.aba.at{background:#f7f6f2;color:#111113}
.aba .fv{width:24px;height:24px;border-radius:7px;background:%(v)s;flex:none;display:grid;place-items:center;font-size:14px;font-weight:900;color:#0b0b0c}
.aba.f{opacity:.6}.aba.f .fv{background:#4a4a55}
.mais{color:#8a8a95;font-size:30px;align-self:center;margin-left:6px}
.barra{height:70px;flex:none;display:flex;align-items:center;gap:14px;padding:0 20px;border-bottom:1.5px solid #e4e2dc}
.nv{color:#9a9aa3;font-size:26px;font-weight:700;letter-spacing:6px}
.url{flex:1;height:46px;border-radius:999px;background:#ebe9e3;display:flex;align-items:center;padding:0 20px;font-size:21px;font-weight:600;color:#55555f;gap:10px}
.url b{color:#111113;font-weight:800}
.url .cad{width:14px;height:16px;border:3px solid #6b6b72;border-radius:3px;position:relative;top:2px}
.ext{width:46px;height:46px;border-radius:14px;background:#111113;display:grid;place-items:center;color:%(v)s;font-size:28px;font-weight:900}
.ext.on{box-shadow:0 0 0 4px %(v)s}
.pg{flex:1;position:relative;display:flex;flex-direction:column;padding:56px 60px 50px;min-height:0}
/* dock */
.dock{position:absolute;left:50%%;bottom:42px;transform:translateX(-50%%);z-index:3;display:flex;align-items:center;gap:22px;
      padding:14px 18px 14px 26px;border-radius:30px;background:rgba(255,255,255,.1);border:1.5px solid rgba(255,255,255,.16);backdrop-filter:blur(12px);color:#fff;white-space:nowrap}
.dock .lg svg{height:24px;width:auto;color:#fff;display:block}
.dock .n{font-size:20px;font-weight:800;letter-spacing:.14em;opacity:.75}
.arr{font-weight:900;color:#0b0b0c;background:%(v)s;padding:13px 24px;border-radius:999px;font-size:22px}
.ar{font-size:22px;font-weight:800}
/* texto */
.k{align-self:flex-start;font-size:20px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#fff;background:%(mar)s;padding:11px 18px;border-radius:999px;margin-bottom:26px}
h1{font-size:92px;line-height:.96;letter-spacing:-.055em;font-weight:900}
h2{font-size:70px;line-height:1.02;letter-spacing:-.045em;font-weight:900}
h1 i,h2 i{font-weight:200}
.vd{color:#00a956}.mg{color:%(m)s}
s{text-decoration-thickness:9px;text-decoration-color:%(m)s}
p.sub{font-size:33px;line-height:1.35;font-weight:600;margin-top:22px;color:#3a3a44}
/* capa */
.pg.cp{padding:0}
.cp .ph{height:560px;flex:none;position:relative;overflow:hidden}
.cp .ph img{width:100%%;height:100%%;object-fit:cover;object-position:center 42%%}
.cp .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 60%%,rgba(247,246,242,1))}
.cp .tg{position:absolute;left:34px;top:30px;z-index:2;background:#111113;color:#fff;font-size:20px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:12px 18px;border-radius:999px;display:flex;gap:10px;align-items:center}
.cp .tg i{width:12px;height:12px;border-radius:50%%;background:%(m)s;display:block;box-shadow:0 0 0 5px rgba(224,5,94,.3)}
.cp .tx{padding:6px 60px 0;display:flex;flex-direction:column}
.cp h1{font-size:84px}
/* frase */
.fr{margin:auto 0}
.fr h2{font-size:80px}
.apoio{font-size:32px;line-height:1.42;font-weight:600;color:#4a4a55;margin-top:34px;padding-top:30px;border-top:4px solid #111113}
/* degraus */
.dg{margin:auto 0;display:flex;flex-direction:column;gap:14px}
.dg div{display:grid;grid-template-columns:92px 1fr;gap:20px;align-items:center;border-radius:28px;padding:30px 32px;background:var(--c);color:var(--t)}
.dg div:nth-child(2){margin-left:50px}.dg div:nth-child(3){margin-left:100px}
.dg b{font-size:78px;font-weight:200;font-style:italic;line-height:1}
.dg span{font-size:50px;font-weight:900;letter-spacing:-.03em;line-height:1.05}
.dg small{display:block;font-size:29px;font-weight:600;letter-spacing:0;margin-top:8px;opacity:.88;line-height:1.3}
/* painel */
.pg.pn{padding:0;flex-direction:row}
.pn .site{width:390px;flex:none;background:#eeece6;padding:36px 28px;display:flex;flex-direction:column;gap:22px}
.pn .site .t{font-size:19px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;color:#6b6b72}
.pn .col{border-radius:20px;background:#fff;padding:20px;display:flex;flex-direction:column;gap:12px;border:1.5px solid #e1dfd8}
.pn .col.al{outline:4px dashed %(v)s;outline-offset:6px}
.pn .col b{font-size:25px;line-height:1.2}
.pn .col .et{align-self:flex-start;font-size:16px;font-weight:900;letter-spacing:.1em;text-transform:uppercase;padding:7px 12px;border-radius:999px;background:#eef0f8;color:%(mar)s}
.pn .col .et.n{background:%(v)s;color:#0b0b0c}
.pn .ln{height:12px;border-radius:6px;background:#e6e4de}
.pn .ia{flex:1;background:#141418;color:#ececf1;padding:30px 28px;display:flex;flex-direction:column;gap:16px}
.pn .ia .t{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:800}
.pn .ia .t span{width:34px;height:34px;border-radius:10px;background:%(v)s;color:#0b0b0c;display:grid;place-items:center;font-weight:900}
.bal{font-size:28px;line-height:1.4;font-weight:600;padding:20px 22px;border-radius:24px}
.bal.eu{background:%(mar)s;color:#fff;border-bottom-right-radius:6px;margin-left:30px}
.bal.ia2{background:#24242b;border-bottom-left-radius:6px}
.feito{margin-top:auto;display:flex;flex-direction:column;gap:14px;font-size:25px;font-weight:700;color:#cfd0d8}
.feito div{display:flex;gap:12px;align-items:center}
.feito div::before{content:"✓";width:32px;height:32px;flex:none;border-radius:50%%;background:%(v)s;color:#0b0b0c;display:grid;place-items:center;font-weight:900;font-size:18px}
/* lista (histórico) */
.hs{margin:auto 0;display:flex;flex-direction:column;gap:16px}
.hs div{font-size:36px;line-height:1.3;font-weight:700;padding:24px 30px;border-radius:30px 30px 30px 8px;background:#fff;border:2.5px solid #111113;align-self:flex-start;max-width:92%%}
.hs div:nth-child(even){align-self:flex-end;border-radius:30px 30px 8px 30px;background:#111113;color:#fff}
.hs div i{font-style:normal;color:%(m)s;font-weight:900}
.hs div:nth-child(even) i{color:%(v)s}
/* regra */
.rg{margin:auto 0 0;display:grid;grid-template-columns:1fr 1fr;gap:16px}
.rg div{border-radius:28px;padding:38px 32px;min-height:440px;display:flex;flex-direction:column;gap:12px}
.rg .a{background:#fff;border:2.5px solid #111113}
.rg .b{background:%(v)s}
.rg em{font-style:normal;font-size:19px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
.rg p{font-size:38px;line-height:1.3;font-weight:700}
.rg .tg{align-self:flex-start;font-size:21px;font-weight:800;padding:10px 16px;border-radius:14px;background:#111113;color:#fff}
.fim{font-size:46px;line-height:1.15;font-weight:900;letter-spacing:-.025em;margin:34px 0 auto}
/* cta */
.cta{margin:auto 0}
.cx{display:flex;align-items:center;gap:18px;border:3px solid #111113;border-radius:26px;padding:20px 24px;background:#fff;font-size:30px;font-weight:700;color:#6b6b72;margin:6px 0 28px}
.cx .cur{width:4px;height:44px;background:#111113;animation:none}
.pal{font-size:170px;font-weight:900;letter-spacing:-.06em;line-height:.9;color:#111113;margin:0 0 30px}
.pal span{display:inline-block;background:%(v)s;padding:4px 30px 16px;border-radius:30px}
.cta ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:12px}
.cta li{font-size:32px;font-weight:700;line-height:1.25;padding-left:44px;position:relative}
.cta li::before{content:"→";position:absolute;left:0;color:#00a956;font-weight:900}
.obs{font-size:23px;font-weight:600;color:#6b6b72;margin-top:24px}
"""


def topo(d, tag="h2"):
    k = '<span class="k">%s</span>' % tx(d["kicker"]) if d.get("kicker") else ""
    t = "<%s>%s</%s>" % (tag, tx(d["titulo"]), tag) if d.get("titulo") else ""
    return k + t


def s_capa(d):
    return ('<div class="pg cp"><div class="ph"><img src="%s"><span class="tg"><i></i>%s</span></div><div class="tx">%s%s</div></div>'
            % (foto(d["img"], 1300), tx(d.get("tag", "Ao vivo")), topo(d, "h1"),
               '<p class="sub">%s</p>' % tx(d["sub"]) if d.get("sub") else ""))


def s_frase(d):
    return ('<div class="pg">%s<div class="fr"><h2>%s</h2>%s</div></div>'
            % ('<span class="k">%s</span>' % tx(d["kicker"]) if d.get("kicker") else "", tx(d["frase"]),
               '<p class="apoio">%s</p>' % tx(d["apoio"]) if d.get("apoio") else ""))


def s_degraus(d):
    cores = {"verde": (VERDE, "#0b0b0c"), "marinho": (MAR, "#fff"), "magenta": (MAG, "#fff")}
    it = "".join('<div style="--c:%s;--t:%s"><b>%d</b><span>%s<small>%s</small></span></div>'
                 % (cores[p["cor"]][0], cores[p["cor"]][1], i, tx(p["t"]), tx(p["sub"])) for i, p in enumerate(d["degraus"], 1))
    return '<div class="pg">%s<div class="dg">%s</div></div>' % (topo(d), it)


def s_painel(d):
    cards = "".join('<div class="col%s"><span class="et%s">%s</span><b>%s</b><div class="ln" style="width:80%%"></div><div class="ln" style="width:55%%"></div></div>'
                    % (" al" if c.get("alvo") else "", " n" if c.get("alvo") else "", tx(c["etapa"]), tx(c["nome"])) for c in d["cards"])
    feito = "".join("<div>%s</div>" % tx(x) for x in d["feito"])
    return ('<div class="pg pn"><div class="site"><span class="t">%s</span>%s</div>'
            '<div class="ia"><div class="t"><span>✳</span>Assistente</div><div class="bal eu">%s</div><div class="bal ia2">%s</div><div class="feito">%s</div></div></div>'
            % (tx(d.get("site", "CRM · Negócios")), cards, tx(d["pedido"]), tx(d["resposta"]), feito))


def s_lista(d):
    return '<div class="pg">%s<div class="hs">%s</div></div>' % (topo(d), "".join("<div>%s</div>" % tx(x) for x in d["itens"]))


def s_regra(d):
    a, b = d["colunas"]
    col = lambda c, cl: '<div class="%s"><em>%s</em><p>%s</p><span class="tg">%s</span></div>' % (cl, tx(c["rot"]), tx(c["t"]), tx(c["tag"]))
    return ('<div class="pg">%s<div class="rg">%s%s</div><p class="fim">%s</p></div>'
            % (topo(d), col(a, "a"), col(b, "b"), tx(d.get("fim", ""))))


def s_cta(d):
    return ('<div class="pg">%s<div class="cta"><div class="cx">%s<span class="cur"></span></div><div class="pal"><span>%s</span></div><ul>%s</ul>%s</div></div>'
            % (topo(d), tx(d.get("caixa", "Adicione um comentário…")), tx(d["palavra"]),
               "".join("<li>%s</li>" % tx(x) for x in d["itens"]), '<p class="obs">%s</p>' % tx(d["obs"]) if d.get("obs") else ""))


TIPOS = {"capa": s_capa, "frase": s_frase, "degraus": s_degraus, "painel": s_painel, "lista": s_lista, "regra": s_regra, "cta": s_cta}


def janela(sl, i, n, base, corpo):
    aba = tx(sl.get("aba", "Unique"))
    url = tx(sl.get("url", "%s/%02d" % (base, i)))
    painel = sl["tipo"] == "painel"
    return ('<div class="jn"><div class="abas"><span class="bol"><i></i><i></i><i></i></span>'
            '<span class="aba at"><span class="fv">U</span>%s</span><span class="aba f"><span class="fv"></span>WhatsApp</span><span class="mais">+</span></div>'
            '<div class="barra"><span class="nv">‹ ›</span><span class="url"><span class="cad"></span>%s</span><span class="ext%s">✳</span></div>%s</div>'
            % (aba, url, " on" if painel else "", corpo))


def dock(i, n):
    seta = '<span class="arr">Arraste →</span>' if i < n else '<span class="ar">%s</span>' % ARROBA
    return '<div class="dock"><span class="lg">%s</span><span class="n">%02d / %02d</span>%s</div>' % (LOGO, i, n, seta)


def gerar(slug):
    global ARROBA
    pasta = os.path.join(RAIZ, "instagram", slug)
    dados = json.load(open(os.path.join(pasta, "slides.json"), encoding="utf-8"))
    ARROBA = dados.get("arroba", ARROBA)
    base = dados.get("url_base", "sejaunique.com/" + slug)
    slides = dados["slides"]; n = len(slides)
    css = CSS % {"f1": fonte("Montserrat[wght].ttf"), "f2": fonte("Montserrat-Italic[wght].ttf"), "v": VERDE, "m": MAG, "mar": MAR}
    for f in os.listdir(pasta):
        if re.fullmatch(r"\d\d\.png", f):
            os.remove(os.path.join(pasta, f))
    doc = '<!doctype html><html><head><meta charset="utf-8"><style>%s</style></head><body><div class="s"></div>%s</body></html>'
    with sync_playwright() as p:
        nav = p.chromium.launch()
        pg = nav.new_page(viewport={"width": W, "height": H})
        for i, sl in enumerate(slides, 1):
            pg.set_content(doc % (css, janela(sl, i, n, base, TIPOS[sl["tipo"]](sl)) + dock(i, n)))
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
            pg.screenshot(path=os.path.join(pasta, "%02d.png" % i))
        cb = dados.get("capa_blog")
        if cb:
            sl = slides[0]
            css2 = css.replace("body{width:1080px;height:1350px", "body{width:1600px;height:900px")
            css2 += (".jn{left:90px;right:90px;top:60px;bottom:60px}.pg.cp{flex-direction:row}.cp .ph{height:auto;width:760px}"
                     ".cp .ph::after{background:linear-gradient(90deg,rgba(0,0,0,0) 70%,rgba(247,246,242,1))}"
                     ".cp .tx{padding:40px 50px 40px 10px;justify-content:center}.cp h1{font-size:68px}")
            pg2 = nav.new_page(viewport={"width": 1600, "height": 900})
            pg2.set_content(doc % (css2, janela(dict(sl, url=sl.get("url", base)), 1, n, base, s_capa(dict(sl, sub=None)))))
            pg2.evaluate("document.fonts.ready"); pg2.wait_for_timeout(300)
            pg2.screenshot(path=os.path.join(RAIZ, "blog", "assets", cb), type="jpeg", quality=88)
        nav.close()
    if dados.get("legenda"):
        open(os.path.join(pasta, "legenda.txt"), "w", encoding="utf-8").write(dados["legenda"])
    print(slug, n, "slides")


if __name__ == "__main__":
    gerar(sys.argv[1])
