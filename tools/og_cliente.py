"""Capa de compartilhamento (thumbnail 1200x630) e tags de prévia das páginas de cliente.

Para cada página em api/_area/catalogo.js:
  1. gera assets/og/<empresa>-<pagina>.jpg no visual da Unique (preto, Montserrat, grifo verde);
  2. escreve as tags og:/twitter: no <head> da página, entre <!-- og:inicio --> e <!-- og:fim -->.

Rode depois de criar ou editar uma página de cliente:  python3 tools/og_cliente.py
Campos opcionais no catálogo: "chamada" (texto grande da capa; padrão = título) e "grifo" (trecho grifado).
A capa fica em /assets (aberta), porque o WhatsApp precisa baixá-la mesmo com a página fechada.
"""
import html, json, os, re, subprocess
from playwright.sync_api import sync_playwright

SITE = "https://sejaunique.vercel.app"
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
import base64
FONTE = "data:font/ttf;base64," + base64.b64encode(open(os.path.join(RAIZ, "tools", "fonts", "Montserrat[wght].ttf"), "rb").read()).decode()
OUT = os.path.join(RAIZ, "assets", "og")

js = "console.log(JSON.stringify(require(%r)))" % os.path.join(RAIZ, "api", "_area", "catalogo.js")
CATALOGO = json.loads(subprocess.check_output(["node", "-e", js]))
import importlib.util
spec = importlib.util.spec_from_file_location("marca", os.path.join(RAIZ, "tools", "marca.py"))
marca = importlib.util.module_from_spec(spec); spec.loader.exec_module(marca)

CAPA = """<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{{font-family:M;src:url("{fonte}");font-weight:100 900}}
*{{margin:0;box-sizing:border-box}}
body{{width:1200px;height:630px;background:#000;color:#f5f5f5;font-family:M,sans-serif;position:relative;overflow:hidden}}
.mk{{position:absolute;right:72px;top:170px;height:250px;display:flex;gap:10px}}
.mk svg{{height:100%;width:auto}}
.mk span:nth-child(1){{color:#e0055e}}.mk span:nth-child(2){{color:#2b3384}}.mk span:nth-child(3){{color:#00e676}}
.mk span{{height:100%}}
.mk svg{{height:100%;width:auto}}
.topo{{position:absolute;left:72px;right:72px;top:60px;display:flex;justify-content:space-between;align-items:center}}
.logo svg{{height:26px;width:auto;color:#f5f5f5}}
.pill{{border:1.5px solid #3a3a3f;border-radius:999px;padding:10px 20px;font-size:15px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:#a1a1a8}}
.meio{{position:absolute;left:72px;right:380px;top:170px}}
.lbl{{font-size:17px;font-weight:500;letter-spacing:.42em;text-transform:uppercase;color:#a1a1a8;margin-bottom:22px}}
h1{{font-size:{tam}px;line-height:1.02;font-weight:700;letter-spacing:-.035em}}
.g{{text-decoration:underline;text-decoration-color:#00e676;text-decoration-thickness:5px;text-underline-offset:14px;text-decoration-skip-ink:none}}
.pe{{position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;align-items:flex-end;gap:40px}}
.pe p{{font-size:21px;line-height:1.45;color:#a1a1a8;max-width:700px}}
.pe span{{font-size:16px;font-weight:600;color:#f5f5f5;white-space:nowrap}}
</style></head><body>
<div class="mk"><span>{mark}</span><span>{mark}</span><span>{mark}</span></div>
<div class="topo"><div class="logo">{logo}</div><div class="pill">{pill}</div></div>
<div class="meio"><div class="lbl">{empresa}</div><h1>{chamada}</h1></div>
<div class="pe"><p>{desc}</p><span>sejaunique.vercel.app</span></div>
</body></html>"""

EXTRAS = [
    {"arquivo": "case-clinica-brasil.jpg", "rotulo": "Case · Clínica Brasil", "pill": "Case de sucesso",
     "titulo": "Atendimento humanizado que converte", "grifo": "converte",
     "descricao": "Como a Unique centralizou o atendimento, treinou a equipe e estruturou a jornada do paciente."},
]

def chamada_html(p):
    t = html.escape(p.get("chamada") or p["titulo"])
    g = p.get("grifo")
    if g and html.escape(g) in t:
        t = t.replace(html.escape(g), '<span class="g">%s</span>' % html.escape(g), 1)
    return t

def resumo(t, n=150):
    t = re.sub(r"\s+", " ", t or "").strip()
    return t if len(t) <= n else t[: n - 1].rsplit(" ", 1)[0] + "…"

def tags(slug, emp, p, img):
    url = SITE + p["url"]
    tit = html.escape("%s · %s" % (p["titulo"], emp))
    desc = html.escape(resumo(p.get("descricao", ""), 200))
    return "\n".join([
        "<!-- og:inicio (gerado por tools/og_cliente.py) -->",
        '<meta name="description" content="%s">' % desc,
        '<meta property="og:type" content="article">',
        '<meta property="og:site_name" content="Unique Consultoria">',
        '<meta property="og:title" content="%s">' % tit,
        '<meta property="og:description" content="%s">' % desc,
        '<meta property="og:url" content="%s">' % url,
        '<meta property="og:image" content="%s">' % img,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        '<meta property="og:locale" content="pt_BR">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="twitter:title" content="%s">' % tit,
        '<meta name="twitter:description" content="%s">' % desc,
        '<meta name="twitter:image" content="%s">' % img,
        "<!-- og:fim -->",
    ])

def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": 1200, "height": 630})
        for slug, emp in CATALOGO.items():
            for p in emp.get("paginas", []):
                m = re.match(r"^/clientes/%s/([a-z0-9-]+)/" % slug, p.get("url", ""))
                if not m:
                    continue
                pasta = m.group(1)
                nome = "%s-%s.jpg" % (slug, pasta)
                ch = p.get("chamada") or p["titulo"]
                tam = 70 if len(ch) <= 28 else 58 if len(ch) <= 44 else 50
                pg.set_content(CAPA.format(fonte=FONTE, mark=marca.MARK, logo=marca.LOGO, empresa=html.escape(emp["nome"]),
                                           chamada=chamada_html(p), desc=html.escape(resumo(p.get("descricao", ""))), tam=tam, pill="Área do cliente"))
                pg.evaluate("document.fonts.ready")
                pg.wait_for_timeout(200)
                pg.screenshot(path=os.path.join(OUT, nome), type="jpeg", quality=88)
                img = "%s/assets/og/%s" % (SITE, nome)

                arq = os.path.join(RAIZ, "clientes", slug, pasta, "index.html")
                if os.path.exists(arq):
                    h = open(arq, encoding="utf-8").read()
                    bloco = tags(slug, emp["nome"], p, img)
                    if "<!-- og:inicio" in h:
                        h = re.sub(r"<!-- og:inicio.*?<!-- og:fim -->", lambda _: bloco, h, flags=re.S)
                    else:
                        h = re.sub(r'<meta name="description"[^>]*>\n?', "", h, count=1)
                        h = h.replace("</title>", "</title>\n" + bloco, 1)
                    open(arq, "w", encoding="utf-8").write(h)
                print("ok", slug, pasta, "->", nome, "| capa no catálogo:", p.get("capa") == "/assets/og/" + nome)
        # capas de páginas públicas do site (cases etc.)
        for e in EXTRAS:
            ch = e.get("chamada") or e["titulo"]
            tam = 70 if len(ch) <= 28 else 58 if len(ch) <= 44 else 50
            pg.set_content(CAPA.format(fonte=FONTE, mark=marca.MARK, logo=marca.LOGO, empresa=html.escape(e["rotulo"]),
                                       chamada=chamada_html(e), desc=html.escape(resumo(e.get("descricao", ""))), tam=tam, pill=e["pill"]))
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(200)
            pg.screenshot(path=os.path.join(OUT, e["arquivo"]), type="jpeg", quality=88)
            print("ok extra", e["arquivo"])
        b.close()

if __name__ == "__main__":
    main()
