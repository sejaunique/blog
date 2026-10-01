"""
Estilos de carrossel com conceito próprio (não só cor).
Use no roteiro:  "estilo": "brutal" | "minimal" | "revista" | "chat" | "postit"
Tipos de slide aceitos em todos: capa, texto, lista, frase, foto, fotofundo, cta, chat
  chat: {"tipo":"chat","titulo":"...","msgs":[["cliente","texto"],["voce","texto"],["sistema","texto"]]}
"""
import html, re

def inline(t):
    t = html.escape(t or "").replace("&lt;br&gt;", "<br>").replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"==(.+?)==", r'<span class="g">\1</span>', t)
    t = re.sub(r"\[\[(.+?)\]\]", r'<span class="hl">\1</span>', t)
    return t.replace("\n", "<br>")

BASE = """*{box-sizing:border-box;margin:0;padding:0}html,body{width:1080px;height:1350px}
body{font-family:"Montserrat","Poppins",system-ui,sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
b{font-weight:700}.s{position:relative;width:100%;height:100%;overflow:hidden}img{display:block}"""

# ---------------------------------------------------------------- BRUTAL
BRUTAL = """
.s{background:#f2f2ee;color:#0b0b0c;padding:70px}
.s.inv{background:#0b0b0c;color:#f2f2ee}
.top{display:flex;justify-content:space-between;align-items:center;border:6px solid currentColor;padding:14px 22px;font-weight:800;font-size:26px;letter-spacing:.12em;text-transform:uppercase}
.top .n{background:currentColor;padding:2px 14px}.top .n span{color:#f2f2ee}.inv .top .n span{color:#0b0b0c}
h1{font-size:92px;line-height:1;font-weight:800;text-transform:uppercase;letter-spacing:-.04em;margin-top:44px}
h2{font-size:92px;line-height:1.08;font-weight:800;text-transform:uppercase;letter-spacing:-.04em;margin:46px 0 40px}
p{font-size:40px;line-height:1.38;font-weight:500;max-width:900px}
.g{background:#00e676;color:#0b0b0c;padding:0 .1em;box-shadow:8px 8px 0 #0b0b0c}
.inv .g{box-shadow:8px 8px 0 #f2f2ee}
.box{border:6px solid currentColor;padding:34px;margin-top:30px;box-shadow:16px 16px 0 currentColor;background:inherit}
ol{list-style:none;border-top:6px solid currentColor}
ol li{display:grid;grid-template-columns:120px 1fr;border-bottom:6px solid currentColor;font-size:38px;line-height:1.3;font-weight:600;align-items:center;min-height:140px}
ol li i{font-style:normal;font-size:72px;font-weight:800;border-right:6px solid currentColor;height:100%;display:grid;place-items:center;margin-right:28px}
.foto{border:6px solid currentColor;box-shadow:18px 18px 0 #00e676;height:640px;margin-top:40px;overflow:hidden}
.foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.25)}
.big{position:absolute;right:50px;bottom:120px;font-size:300px;font-weight:800;line-height:.8;color:transparent;-webkit-text-stroke:5px currentColor;opacity:.25}
.rod{position:absolute;left:70px;right:70px;bottom:56px;display:flex;justify-content:space-between;font-weight:800;font-size:26px;letter-spacing:.1em;text-transform:uppercase}
.carimbo{display:inline-block;border:6px solid #00e676;color:#00e676;font-weight:800;font-size:34px;padding:8px 22px;transform:rotate(-6deg);letter-spacing:.12em;text-transform:uppercase;margin-top:40px}
"""

def brutal(sl, i, n, mk):
    t = sl["tipo"]; inv = t in ("capa", "frase", "cta")
    top = '<div class="top"><span>Unique · Blog</span><span class="n"><span>%02d/%02d</span></span></div>' % (i, n)
    rod = '<div class="rod"><span>@sejauniqueoficial</span><span>%s</span></div>' % ("Arrasta →" if i < n else "Fim")
    if t == "capa":
        foto = ('<div class="foto" style="height:520px">%s</div>' % img(sl, mk)) if sl.get("img") else ""
        body = top + foto + '<h1>%s</h1>%s' % (inline(sl["titulo"]), ('<div class="carimbo">%s</div>' % html.escape(sl["tag"])) if sl.get("tag") else "")
    elif t == "texto":
        body = top + '<h2>%s</h2><div class="box"><p>%s</p></div><div class="big">%02d</div>' % (inline(sl.get("titulo", "")), inline(sl["texto"]), i)
    elif t == "lista":
        body = top + '<h2 style="font-size:78px">%s</h2><ol>%s</ol>' % (inline(sl["titulo"]), "".join('<li><i>%d</i><span>%s</span></li>' % (k + 1, inline(x)) for k, x in enumerate(sl["itens"])))
    elif t == "frase":
        body = top + '<h2 style="font-size:104px;margin-top:180px">%s</h2>' % inline(sl["texto"])
    elif t in ("foto", "fotofundo"):
        body = top + '<div class="foto">%s</div><h2 style="font-size:70px;margin:50px 0 20px">%s</h2><p>%s</p>' % (img(sl, mk), inline(sl.get("titulo", "")), inline(sl.get("texto", "")))
    elif t == "chat":
        body = top + '<h2 style="font-size:70px">%s</h2>%s' % (inline(sl.get("titulo", "")), chat_html(sl))
    elif t == "cta":
        body = top + '<h2 style="margin-top:200px">%s</h2><div class="box" style="box-shadow:16px 16px 0 #00e676"><p>%s<br><b>%s</b></p></div>' % (inline(sl.get("titulo", "")), inline(sl.get("texto", "")), html.escape(sl.get("url", "sejaunique.vercel.app/blog")))
    return BRUTAL, '<div class="s%s">%s%s</div>' % (" inv" if inv else "", body, rod)

# ---------------------------------------------------------------- MINIMAL
MINIMAL = """
.s{background:#fafaf8;color:#111;padding:110px 110px;display:flex;flex-direction:column;justify-content:center}
.s.inv{background:#111;color:#fafaf8}
.k{position:absolute;top:90px;left:110px;font-size:22px;letter-spacing:.35em;text-transform:uppercase;opacity:.5}
.pg{position:absolute;top:90px;right:110px;font-size:22px;letter-spacing:.2em;opacity:.5}
h1{font-size:78px;line-height:1.12;font-weight:300;letter-spacing:-.02em}
h2{font-size:58px;line-height:1.15;font-weight:300;letter-spacing:-.015em;margin-bottom:46px}
p{font-size:36px;line-height:1.6;font-weight:300;opacity:.8;max-width:760px}
b{font-weight:600}
.g{font-weight:600;border-bottom:3px solid #00e676}
.linha{width:80px;height:3px;background:#00e676;margin:0 0 50px}
ol{list-style:none;counter-reset:c}
ol li{font-size:36px;line-height:1.5;font-weight:300;padding:26px 0;border-bottom:1px solid rgba(127,127,127,.3);display:grid;grid-template-columns:90px 1fr}
ol li i{font-style:normal;font-size:22px;letter-spacing:.2em;opacity:.5;padding-top:12px}
.foto{width:520px;height:650px;margin:0 auto 60px;overflow:hidden}
.foto img{width:100%;height:100%;object-fit:cover;filter:grayscale(1)}
.rod{position:absolute;left:110px;right:110px;bottom:80px;display:flex;justify-content:space-between;font-size:20px;letter-spacing:.25em;text-transform:uppercase;opacity:.45}
"""

def minimal(sl, i, n, mk):
    t = sl["tipo"]; inv = t in ("frase",)
    head = '<div class="k">%s</div><div class="pg">%02d — %02d</div>' % (html.escape(sl.get("tag", "Unique")), i, n)
    rod = '<div class="rod"><span>@sejauniqueoficial</span><span>%s</span></div>' % ("deslize" if i < n else "")
    if t == "capa":
        foto = ('<div class="foto">%s</div>' % img(sl, mk)) if sl.get("img") else ""
        body = foto + '<div class="linha"></div><h1>%s</h1>' % inline(sl["titulo"])
    elif t == "texto":
        body = '<h2>%s</h2><p>%s</p>' % (inline(sl.get("titulo", "")), inline(sl["texto"]))
    elif t == "lista":
        body = '<h2>%s</h2><ol>%s</ol>' % (inline(sl["titulo"]), "".join('<li><i>%02d</i><span>%s</span></li>' % (k + 1, inline(x)) for k, x in enumerate(sl["itens"])))
    elif t == "frase":
        body = '<div class="linha"></div><h1 style="font-size:70px">%s</h1>' % inline(sl["texto"])
    elif t in ("foto", "fotofundo"):
        body = '<div class="foto">%s</div><h2 style="font-size:46px;margin-bottom:20px">%s</h2><p>%s</p>' % (img(sl, mk), inline(sl.get("titulo", "")), inline(sl.get("texto", "")))
    elif t == "chat":
        body = '<h2>%s</h2>%s' % (inline(sl.get("titulo", "")), chat_html(sl))
    elif t == "cta":
        body = '<div style="margin-bottom:60px;opacity:.9">%s</div><h1 style="font-size:64px">%s</h1><p style="margin-top:30px">%s<br>%s</p>' % (mk["LOGO"].replace("<svg ", '<svg style="height:30px;width:auto" ', 1), inline(sl.get("titulo", "")), inline(sl.get("texto", "")), html.escape(sl.get("url", "sejaunique.vercel.app/blog")))
    return MINIMAL, '<div class="s%s">%s%s%s</div>' % (" inv" if inv else "", head, body, rod)

# ---------------------------------------------------------------- REVISTA
REVISTA = """
.s{background:#f6f3ee;color:#161513}
.pagina{position:absolute;inset:0;padding:80px 84px}
.cab{display:flex;justify-content:space-between;border-bottom:2px solid #161513;padding-bottom:16px;font-family:"Lora",serif;font-size:24px;font-style:italic}
.cab b{font-family:"Montserrat","Poppins",sans-serif;font-style:normal;font-size:20px;letter-spacing:.3em;text-transform:uppercase}
h1{font-family:"Lora",serif;font-size:104px;line-height:1;font-weight:700;letter-spacing:-.02em}
h2{font-family:"Lora",serif;font-size:76px;line-height:1.05;font-weight:700;margin:60px 0 36px}
.chapeu{font-size:22px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#0a7d42;margin-bottom:24px}
p{font-family:"Lora",serif;font-size:38px;line-height:1.55}
p.cap:first-letter{float:left;font-size:150px;line-height:.82;font-weight:700;margin:10px 18px 0 0}
.g{background:linear-gradient(transparent 62%,#7cf0b0 62%)}
.foto{overflow:hidden;background:#222}.foto img{width:100%;height:100%;object-fit:cover}
.capa .foto{position:absolute;left:0;right:0;top:0;height:820px}
.capa .tx{position:absolute;left:84px;right:84px;top:860px}
.legenda{font-family:"Lora",serif;font-style:italic;font-size:24px;opacity:.7;margin-top:14px}
ol{list-style:none}ol li{font-family:"Lora",serif;font-size:38px;line-height:1.4;padding:22px 0;border-top:1px solid #161513;display:grid;grid-template-columns:80px 1fr}
ol li i{font-style:italic;font-weight:700;font-size:44px}
.aspas{font-family:"Lora",serif;font-size:260px;line-height:.7;color:#0a7d42;margin-top:120px}
.rod{position:absolute;left:84px;right:84px;bottom:60px;display:flex;justify-content:space-between;font-size:20px;letter-spacing:.2em;text-transform:uppercase;border-top:2px solid #161513;padding-top:16px}
.s.inv{background:#161513;color:#f6f3ee}.inv .cab,.inv .rod{border-color:#f6f3ee}.inv ol li{border-color:#f6f3ee}
"""

def revista(sl, i, n, mk):
    t = sl["tipo"]; inv = t in ("frase", "cta")
    cab = '<div class="cab"><b>Seja Unique</b><span>Blog · edição de vendas</span></div>'
    rod = '<div class="rod"><span>@sejauniqueoficial</span><span>p. %02d</span></div>' % i
    if t == "capa":
        return REVISTA, ('<div class="s capa"><div class="foto">%s</div><div class="tx"><div class="chapeu">%s</div><h1>%s</h1></div>%s</div>'
                         % (img(sl, mk), html.escape(sl.get("tag", "")), inline(sl["titulo"]), rod))
    if t == "texto":
        body = cab + '<h2>%s</h2><p class="cap">%s</p>' % (inline(sl.get("titulo", "")), inline(sl["texto"]))
    elif t == "lista":
        body = cab + '<h2>%s</h2><ol>%s</ol>' % (inline(sl["titulo"]), "".join('<li><i>%d.</i><span>%s</span></li>' % (k + 1, inline(x)) for k, x in enumerate(sl["itens"])))
    elif t == "frase":
        body = cab + '<div class="aspas">“</div><h2 style="font-size:80px;font-style:italic;margin-top:0">%s</h2>' % inline(sl["texto"])
    elif t in ("foto", "fotofundo"):
        body = cab + '<div class="foto" style="height:640px;margin-top:40px">%s</div><div class="legenda">%s</div><h2 style="font-size:58px;margin-top:34px">%s</h2>' % (img(sl, mk), inline(sl.get("texto", "")), inline(sl.get("titulo", "")))
    elif t == "chat":
        body = cab + '<h2>%s</h2>%s' % (inline(sl.get("titulo", "")), chat_html(sl))
    elif t == "cta":
        body = cab + '<h2 style="margin-top:300px">%s</h2><p>%s<br><i>%s</i></p>' % (inline(sl.get("titulo", "")), inline(sl.get("texto", "")), html.escape(sl.get("url", "sejaunique.vercel.app/blog")))
    return REVISTA, '<div class="s%s"><div class="pagina">%s</div>%s</div>' % (" inv" if inv else "", body, rod)

# ---------------------------------------------------------------- CHAT (WhatsApp)
CHAT = """
.s{background:#0b141a;color:#e9edef}
.bar{height:150px;background:#1f2c34;display:flex;align-items:center;gap:26px;padding:0 50px;font-size:34px;font-weight:600}
.bar .av{width:84px;height:84px;border-radius:50%;background:#00e676;display:grid;place-items:center;color:#0b0b0c;font-weight:800;font-size:36px;overflow:hidden}
.bar .av img{width:100%;height:100%;object-fit:cover}
.bar small{display:block;font-size:22px;font-weight:400;color:#8696a0;margin-top:4px}
.area{padding:50px 60px;display:flex;flex-direction:column;gap:30px}
.m{max-width:860px;font-size:42px;line-height:1.4;padding:22px 30px 34px;border-radius:26px;position:relative}
.m:after{content:attr(data-h) " ✓✓";position:absolute;right:22px;bottom:8px;font-size:18px;color:#8fa3ad}
.cliente{background:#202c33;align-self:flex-start;border-top-left-radius:6px}
.voce{background:#005c4b;align-self:flex-end;border-top-right-radius:6px}
.sistema{align-self:center;background:#182229;color:#8696a0;font-size:24px;padding:12px 24px;border-radius:14px}.sistema:after{content:""}
.g{color:#00e676;font-weight:700}
.titulo{margin:40px 60px 10px;font-size:72px;line-height:1.1;font-weight:800;letter-spacing:-.02em}
.nota{margin:40px 60px 0;font-size:40px;line-height:1.5;color:#c7d0d4}
.capa h1{position:absolute;left:60px;right:60px;bottom:200px;font-size:96px;line-height:1.02;font-weight:800;letter-spacing:-.03em}
.capa .tag{position:absolute;left:60px;bottom:470px;background:#00e676;color:#0b0b0c;font-weight:800;font-size:24px;letter-spacing:.2em;padding:10px 20px;text-transform:uppercase}
.notif{margin:0 60px;background:rgba(255,255,255,.08);border-radius:28px;padding:24px 30px;font-size:30px;display:flex;gap:20px;align-items:center;margin-top:18px}
.notif i{width:56px;height:56px;border-radius:14px;background:#25d366;flex:none}
.rod{position:absolute;left:60px;right:60px;bottom:54px;display:flex;justify-content:space-between;font-size:24px;color:#8696a0}
ol{list-style:none;margin:30px 60px 0}ol li{font-size:42px;line-height:1.4;padding:20px 0;border-bottom:1px solid #22313a;display:grid;grid-template-columns:70px 1fr}
ol li i{font-style:normal;color:#00e676;font-weight:800}
"""

def chat_html(sl):
    out = []
    for quem, txt in sl.get("msgs", []):
        h = "09:%02d" % (12 + len(out) * 3)
        out.append('<div class="m %s" data-h="%s">%s</div>' % (html.escape(quem), h, inline(txt)))
    return '<div class="area">%s</div>' % "".join(out)

def chatstyle(sl, i, n, mk):
    t = sl["tipo"]
    av = ('<div class="av">%s</div>' % img(sl, mk)) if sl.get("avatar") else '<div class="av">CR</div>'
    bar = '<div class="bar">%s<div>%s<small>%s</small></div></div>' % (av, html.escape(sl.get("contato", "Carlos Ribeiro")), html.escape(sl.get("status", "online")))
    rod = '<div class="rod"><span>@sejauniqueoficial</span><span>%02d/%02d%s</span></div>' % (i, n, "  →" if i < n else "")
    if t == "capa":
        notifs = "".join('<div class="notif"><i></i><span>%s</span></div>' % inline(x) for x in sl.get("notificacoes", []))
        body = '<div style="padding-top:80px">%s</div>%s<h1>%s</h1>' % (notifs, ('<div class="tag">%s</div>' % html.escape(sl["tag"])) if sl.get("tag") else "", inline(sl["titulo"]))
        return CHAT, '<div class="s capa">%s%s</div>' % (body, rod)
    if t == "chat":
        body = bar + ('<div class="titulo">%s</div>' % inline(sl["titulo"]) if sl.get("titulo") else "") + chat_html(sl) + ('<div class="nota">%s</div>' % inline(sl["texto"]) if sl.get("texto") else "")
    elif t == "texto":
        body = bar + '<div class="titulo" style="margin-top:80px">%s</div><div class="nota">%s</div>' % (inline(sl.get("titulo", "")), inline(sl["texto"]))
    elif t == "lista":
        body = bar + '<div class="titulo" style="margin-top:60px">%s</div><ol>%s</ol>' % (inline(sl["titulo"]), "".join('<li><i>%d</i><span>%s</span></li>' % (k + 1, inline(x)) for k, x in enumerate(sl["itens"])))
    elif t == "frase":
        body = bar + '<div class="area" style="margin-top:200px"><div class="m voce" data-h="09:41" style="font-size:54px;font-weight:700;max-width:960px">%s</div></div>' % inline(sl["texto"])
    elif t == "cta":
        body = bar + '<div class="area" style="margin-top:120px"><div class="m cliente" data-h="09:50">%s</div><div class="m voce" data-h="09:51">%s<br><span class="g">%s</span></div></div>' % (inline(sl.get("titulo", "")), inline(sl.get("texto", "")), html.escape(sl.get("url", "sejaunique.vercel.app/blog")))
    else:
        body = bar + '<div style="margin:60px;height:700px;border-radius:30px;overflow:hidden">%s</div><div class="titulo">%s</div>' % (img(sl, mk), inline(sl.get("titulo", "")))
    return CHAT, '<div class="s">%s%s</div>' % (body, rod)

# ---------------------------------------------------------------- POST-IT (mural)
POSTIT = """
.s{background:#2a2622;color:#111;background-image:radial-gradient(rgba(255,255,255,.05) 2px,transparent 2px);background-size:26px 26px}
.p{position:absolute;background:#ffe768;box-shadow:0 18px 30px rgba(0,0,0,.45);padding:44px 46px;font-size:38px;line-height:1.35;font-weight:600}
.p.v{background:#00e676}.p.b{background:#f7f7f2}.p.r{background:#ff8fa3}
.p:before{content:"";position:absolute;top:-18px;left:50%;width:140px;height:38px;margin-left:-70px;background:rgba(255,255,255,.55);transform:rotate(-3deg)}
.p h2{font-size:58px;line-height:1.05;font-weight:800;margin-bottom:22px;letter-spacing:-.02em}
.p h1{font-size:78px;line-height:1.12;font-weight:800;letter-spacing:-.03em}
.g{background:#111;color:#ffe768;padding:0 .1em}
.v .g{color:#00e676}
.foto{position:absolute;background:#fff;padding:22px 22px 80px;box-shadow:0 18px 30px rgba(0,0,0,.5)}
.foto img{width:100%;height:100%;object-fit:cover}
.rod{position:absolute;left:60px;right:60px;bottom:46px;display:flex;justify-content:space-between;font-size:24px;color:#cfc6bb;font-weight:600}
.tag{display:inline-block;font-size:22px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;border:3px solid #111;padding:6px 16px;margin-bottom:26px}
"""

def postit(sl, i, n, mk):
    t = sl["tipo"]
    rod = '<div class="rod"><span>@sejauniqueoficial</span><span>%02d/%02d%s</span></div>' % (i, n, "  →" if i < n else "")
    rot = [-3, 2.5, -1.5, 3, -2][i % 5]
    if t == "capa":
        foto = ('<div class="foto" style="left:430px;top:110px;width:560px;height:700px;transform:rotate(5deg)">%s</div>' % img(sl, mk)) if sl.get("img") else ""
        extra = "".join('<div class="p %s" style="left:%dpx;top:%dpx;width:300px;transform:rotate(%ddeg);font-size:28px">%s</div>' % (c, x, y, r, inline(tx))
                        for (c, x, y, r), tx in zip([("b", 70, 140, -6), ("r", 120, 470, 4)], sl.get("notas", [])))
        body = foto + extra + '<div class="p" style="left:70px;right:90px;bottom:150px;transform:rotate(-2deg)">%s<h1>%s</h1></div>' % (('<div class="tag">%s</div>' % html.escape(sl["tag"])) if sl.get("tag") else "", inline(sl["titulo"]))
    elif t == "texto":
        body = '<div class="p" style="left:90px;right:110px;top:260px;transform:rotate(%sdeg)"><h2>%s</h2>%s</div>' % (rot, inline(sl.get("titulo", "")), inline(sl["texto"]))
    elif t == "lista":
        cores = ["", "v", "b", "r"]
        pos = [(70, 230, -4), (560, 260, 3), (90, 690, 2), (570, 720, -3)]
        notas = "".join('<div class="p %s" style="left:%dpx;top:%dpx;width:420px;min-height:330px;transform:rotate(%ddeg)">%s</div>' % (cores[k % 4], pos[k][0], pos[k][1], pos[k][2], inline(x)) for k, x in enumerate(sl["itens"][:4]))
        body = '<div style="position:absolute;left:70px;top:70px;color:#f7f2ea;font-size:56px;font-weight:800;letter-spacing:-.02em">%s</div>' % inline(sl["titulo"]) + notas
    elif t == "frase":
        body = '<div class="p v" style="left:120px;right:120px;top:330px;transform:rotate(%sdeg)"><h1 style="font-size:76px">%s</h1></div>' % (rot, inline(sl["texto"]))
    elif t in ("foto", "fotofundo"):
        body = '<div class="foto" style="left:140px;top:110px;width:800px;height:760px;transform:rotate(-3deg)">%s</div><div class="p" style="left:110px;right:130px;top:820px;transform:rotate(2deg)"><h2>%s</h2>%s</div>' % (img(sl, mk), inline(sl.get("titulo", "")), inline(sl.get("texto", "")))
    elif t == "cta":
        body = '<div class="p b" style="left:120px;right:120px;top:360px;transform:rotate(-2deg)"><h2>%s</h2>%s<br><b>%s</b></div>' % (inline(sl.get("titulo", "")), inline(sl.get("texto", "")), html.escape(sl.get("url", "sejaunique.vercel.app/blog")))
    else:
        body = '<div class="p b" style="left:90px;right:90px;top:200px"><h2>%s</h2></div>' % inline(sl.get("titulo", ""))
    return POSTIT, '<div class="s">%s%s</div>' % (body, rod)

def img(sl, mk):
    return '<img src="%s" style="object-position:%s">' % (mk["img_uri"](sl.get("img") or sl.get("avatar")), sl.get("pos", "center"))

ESTILOS = {"brutal": brutal, "minimal": minimal, "revista": revista, "chat": chatstyle, "postit": postit}

def render(estilo, sl, i, n, mk):
    css, corpo = ESTILOS[estilo](sl, i, n, mk)
    return '<!doctype html><html><head><meta charset="utf-8"><style>%s%s</style></head><body>%s</body></html>' % (BASE, css, corpo)

# ================================================================ IMPACTO (foto + tipografia condensada)
IMPACTO = """
.s{background:#0a0a0a;color:#fff;font-family:"Montserrat",sans-serif}
.ft{position:absolute;inset:0}.ft img{width:100%;height:100%;object-fit:cover;filter:grayscale(1) contrast(1.15) brightness(.92)}
.ft.cor img{filter:none}
.sh{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35) 0%,rgba(0,0,0,0) 30%,rgba(0,0,0,.25) 50%,rgba(0,0,0,.92) 78%,#000 100%)}
.A{font-family:"Anton",sans-serif;text-transform:uppercase;line-height:.92;letter-spacing:.005em;font-weight:400}
.hl{background:#00e676;color:#0a0a0a;padding:.02em .14em;display:inline-block;line-height:1}
.g{color:#00e676}
.hd{position:absolute;top:56px;left:0;right:0;display:flex;justify-content:center}
.pill{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.25);border-radius:999px;padding:8px 20px 8px 8px;font-size:22px;font-weight:600;backdrop-filter:blur(6px)}
.pill i{width:40px;height:40px;border-radius:50%;background:#fff center/cover;display:block}
.pill b{width:14px;height:14px;border-radius:50%;background:#00e676;display:block}
.arr{position:absolute;right:70px;bottom:64px;display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:9px 18px;font-size:18px;font-weight:700;letter-spacing:.2em}
.arr:after{content:"";width:18px;height:18px;border-radius:50%;background:currentColor}
.frame{position:absolute;left:70px;right:70px;bottom:120px;height:1px;background:rgba(255,255,255,.45)}
.frame:before{content:"";position:absolute;left:0;bottom:0;width:1px;height:60px;background:rgba(255,255,255,.45)}
.meta{position:absolute;font-size:19px;letter-spacing:.18em;text-transform:uppercase;font-weight:600;opacity:.75}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);background-size:180px 225px}
.sub{font-size:34px;line-height:1.35;font-weight:500}
.sub b{font-weight:800}
.vert{position:absolute;writing-mode:vertical-rl;transform:rotate(180deg);font-size:20px;letter-spacing:.3em;font-weight:700;text-transform:uppercase}
.verde{background:#00e676;color:#0a0a0a}.papel{background:#ecebe6;color:#0a0a0a}
.lst .it{display:grid;grid-template-columns:130px 1fr;align-items:baseline;margin-bottom:34px}
.lst .it .nb{font-family:"Montserrat";font-weight:200;font-size:76px;line-height:1;opacity:.75}
.lst .it .A{font-size:64px}
.lst .it p{font-size:28px;line-height:1.4;opacity:.85;margin-top:8px;font-weight:500;grid-column:2}
.aspa{position:absolute;background:#00e676;color:#0a0a0a}
.it2{font-family:"Montserrat";font-style:italic;font-weight:900;text-transform:none;letter-spacing:-.02em}
"""

def _ph(mk, src, pos="center", cor=False):
    return '<div class="ft%s"><img src="%s" style="object-position:%s"></div>' % (" cor" if cor else "", mk["img_uri"](src), pos)

def _hd(mk):
    return '<div class="hd"><div class="pill"><i style="background-image:url(%s)"></i>@sejauniqueoficial<b></b></div></div>' % mk["img_uri"]("blog/assets/carlos.jpg")

def impacto(sl, i, n, mk):
    t = sl["tipo"]; lay = sl.get("layout") or {"capa": "central", "texto": "grade", "lista": "lateral", "frase": "aspas", "cta": "fim", "foto": "central", "fotofundo": "central"}.get(t, "grade")
    foto = sl.get("img"); pos = sl.get("pos", "center 30%")
    arr = '<div class="arr">ARRASTE</div>' if i < n else ""
    sub = ('<div class="sub" style="margin-top:26px">%s</div>' % inline(sl["texto"])) if sl.get("texto") else ""
    tit = inline(sl.get("titulo", sl.get("texto", "")))
    if lay == "central":   # foto cheia, título enorme embaixo (ref. Henrique)
        pre = ('<div style="font-size:30px;font-weight:600;letter-spacing:.06em;margin-bottom:14px;text-transform:uppercase">%s</div>' % html.escape(sl["pre"])) if sl.get("pre") else ""
        body = _ph(mk, foto, pos) + '<div class="sh"></div>' + _hd(mk) + ('<div style="position:absolute;left:70px;right:70px;bottom:170px;text-align:%s">%s<div class="A" style="font-size:%dpx">%s</div>%s</div>' % (sl.get("align", "center"), pre, sl.get("tam", 150), tit, sub if t != "capa" or sl.get("texto") else "")) + '<div class="frame"></div>' + arr
        return '<div class="s">%s</div>' % body
    if lay == "grade":     # grade fina + metadados nos cantos (ref. laranja)
        bg = (_ph(mk, foto, pos) + '<div class="sh" style="background:linear-gradient(180deg,rgba(0,0,0,.2),rgba(0,0,0,.75) 70%,#000)"></div>') if foto else ""
        body = bg + '<div class="grid"></div><div class="meta" style="top:50px;left:60px">Seja Unique · Série Vendas</div><div class="meta" style="top:50px;right:60px">2026</div><div class="meta" style="top:320px;left:60px">Parte %02d</div><div class="meta" style="top:320px;right:60px">%s</div>' % (i, html.escape(sl.get("tag", "Blog")))
        body += '<div style="position:absolute;left:60px;right:60px;bottom:200px"><div class="A" style="font-size:%dpx">%s</div>%s</div><div class="meta" style="bottom:60px;left:60px">@sejauniqueoficial</div>' % (sl.get("tam", 104), tit, sub) + arr
        return '<div class="s">%s</div>' % body
    if lay == "lateral":   # lista numerada sobre foto escurecida à direita (ref. GROW)
        bg = ('<div class="ft" style="left:380px"><img src="%s" style="object-position:%s;filter:grayscale(1) contrast(1.1) brightness(.6)"></div><div class="sh" style="background:linear-gradient(90deg,#0a0a0a 32%%,rgba(10,10,10,.6) 60%%,rgba(10,10,10,.2))"></div>' % (mk["img_uri"](foto), pos)) if foto else ""
        itens = "".join('<div class="it"><span class="nb">%02d.</span><span class="A">%s</span>%s</div>' % (k + 1, inline(x[0] if isinstance(x, list) else x), ('<p>%s</p>' % inline(x[1])) if isinstance(x, list) and len(x) > 1 else "") for k, x in enumerate(sl["itens"]))
        body = bg + '<div style="position:absolute;left:60px;top:70px;width:96px;height:420px;background:#00e676"></div><div class="vert A" style="left:72px;top:90px;font-size:62px;color:#0a0a0a;letter-spacing:.02em;writing-mode:vertical-rl;transform:rotate(180deg);height:380px;display:flex;align-items:center">%s</div>' % html.escape(sl.get("rotulo", "Unique"))
        body += '<div style="position:absolute;left:200px;top:70px;right:60px"><div class="A" style="font-size:72px;margin-bottom:40px">%s</div></div><div class="lst" style="position:absolute;left:100px;right:70px;top:560px">%s</div><div class="vert" style="right:40px;bottom:60px;opacity:.7">Seja Unique · Consultoria</div>' % (inline(sl["titulo"]), itens) + arr
        return '<div class="s">%s</div>' % body
    if lay == "aspas":     # foto P&B + bloco verde em forma de vírgula (ref. Hiscox)
        bg = _ph(mk, foto, pos) + '<div class="sh" style="background:rgba(0,0,0,.25)"></div>' if foto else ""
        body = bg + '<div class="aspa" style="right:70px;top:360px;width:470px;padding:44px 40px 120px"><div style="font-weight:800;font-style:italic;font-size:38px;margin-bottom:18px">%s</div><div style="font-size:31px;line-height:1.4;font-weight:500">%s</div></div><div class="aspa" style="right:70px;top:%dpx;width:150px;height:300px;border-bottom-right-radius:150px 300px;border-top-left-radius:0"></div>' % (html.escape(sl.get("rotulo", "Frase do Carlos:")), inline(sl.get("texto", "")), 360 + 0)
        body = bg + '<div class="aspa" style="right:70px;top:300px;width:480px;padding:46px 42px 60px"><div style="font-weight:800;font-style:italic;font-size:38px;margin-bottom:18px">%s</div><div style="font-size:32px;line-height:1.42;font-weight:500">%s</div></div><div class="aspa" style="right:70px;top:300px;margin-top:0;width:170px;height:330px;transform:translateY(100%%) ;border-radius:0 0 170px 0;clip-path:polygon(0 0,100%% 0,100%% 100%%,0 30%%)"></div>' % (html.escape(sl.get("rotulo", "Na prática:")), inline(sl.get("texto", "")))
        body += '<div class="A" style="position:absolute;left:70px;bottom:250px;font-size:%dpx;text-transform:none;font-family:Montserrat;font-weight:800;letter-spacing:-.03em">%s</div><div class="meta" style="left:70px;bottom:70px;text-transform:none;letter-spacing:.02em;font-size:22px">%s</div>' % (sl.get("tam", 120), inline(sl.get("titulo", "")), html.escape(sl.get("rodape", "Seja Unique · Consultoria em Vendas"))) + arr
        return '<div class="s">%s</div>' % body
    if lay == "bloco":     # fundo verde, título condensado, foto em bloco preto com cantos (ref. vermelho/preto)
        body = '<div class="s verde"><div class="meta" style="top:60px;right:60px;opacity:.8">%s</div>' % html.escape(sl.get("tag", ""))
        body += '<div class="A" style="position:absolute;left:60px;top:90px;right:240px;font-size:%dpx;color:#0a0a0a">%s</div>' % (sl.get("tam", 120), tit)
        if foto:
            body += '<div style="position:absolute;right:0;bottom:0;width:640px;height:760px;background:#0a0a0a;clip-path:polygon(22%% 0,100%% 0,100%% 100%%,0 100%%,0 14%%)"></div><div style="position:absolute;right:60px;bottom:110px;width:520px;height:600px;overflow:hidden;border-radius:0 0 0 110px"><img src="%s" style="width:100%%;height:100%%;object-fit:cover;object-position:%s;filter:grayscale(1) contrast(1.15)"></div>' % (mk["img_uri"](foto), pos)
        body += '<div style="position:absolute;left:60px;width:350px;bottom:150px;font-size:28px;line-height:1.45;font-weight:600">%s</div><div class="meta" style="left:60px;bottom:60px;opacity:.8">@sejauniqueoficial</div>%s</div>' % (inline(sl.get("texto", "")), arr.replace('class="arr"', 'class="arr" style="color:#fff;border-color:#fff"'))
        return body
    if lay == "gigante":   # tipografia enorme, palavra em itálico verde (ref. LA)
        cls = sl.get("fundo", "papel")
        cor = "#0a0a0a" if cls == "papel" else "#fff"
        body = '<div class="s %s" style="color:%s">' % (cls if cls != "preto" else "", cor)
        if foto and sl.get("fotofundo"):
            body = '<div class="s">' + _ph(mk, foto, pos) + '<div class="sh" style="background:rgba(0,0,0,.55)"></div>'
            cor = "#fff"
        body += '<div class="meta" style="top:60px;left:60px;color:#0a7d42;opacity:1;font-weight:800">%s</div>' % html.escape(sl.get("tag", "Seja Unique"))
        body += '<div class="A" style="position:absolute;left:60px;right:60px;top:160px;font-size:%dpx;line-height:.95">%s</div>' % (sl.get("tam", 150), tit)
        if foto and not sl.get("fotofundo"):
            body += '<div style="position:absolute;right:60px;bottom:170px;width:420px;height:470px;overflow:hidden;border-radius:0 0 0 120px"><img src="%s" style="width:100%%;height:100%%;object-fit:cover;object-position:%s;filter:grayscale(1) contrast(1.15)"></div>' % (mk["img_uri"](foto), pos)
        body += '<div style="position:absolute;left:60px;bottom:110px;font-size:24px;line-height:1.5;font-weight:700;letter-spacing:.08em;text-transform:uppercase;white-space:pre-line">%s</div>' % html.escape(sl.get("rodape", "Vendas\nprocesso\nresultado"))
        body += '<div class="meta" style="right:60px;bottom:60px;opacity:.7">@sejauniqueoficial</div>%s</div>' % arr.replace('class="arr"', 'class="arr" style="right:60px;bottom:110px;border-color:currentColor"')
        return body.replace('<span class="g">', '<span class="g it2">')
    if lay == "fim":
        body = _ph(mk, foto or "blog/assets/carlos-vermelho.jpg", pos) + '<div class="sh"></div>' + _hd(mk)
        body += '<div style="position:absolute;left:70px;right:70px;bottom:190px;text-align:center"><div class="A" style="font-size:110px">%s</div><div class="sub" style="margin-top:22px">%s</div><div style="margin:34px auto 0;display:inline-block;background:#00e676;color:#0a0a0a;font-weight:800;font-size:30px;padding:16px 34px;border-radius:999px">%s</div></div><div class="frame"></div>' % (tit, inline(sl.get("texto", "")), html.escape(sl.get("url", "sejaunique.vercel.app/blog")))
        return '<div class="s">%s</div>' % body
    return '<div class="s"></div>'

def _impacto(sl, i, n, mk):
    return IMPACTO, impacto(sl, i, n, mk)

ESTILOS["impacto"] = _impacto
