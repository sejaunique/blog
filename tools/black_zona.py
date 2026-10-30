"""Gera as páginas da Black Zona (ações de Black Friday) a partir de tools/black_zona_dados.json.

  black-zona/                     página geral (indústria/atacado, varejo e uniforme), cadastro próprio
  black-zona/industria/           só indústria e atacado, cadastro próprio
  black-zona/varejo/              só varejo, cadastro próprio
  black-zona/uniforme/            só uniforme personalizado, cadastro próprio
  clientes/tendasaluban/black-zona/  só Tendas Aluban, fechada pelo login da área do cliente

Cada página leva no HTML apenas os dados do(s) seu(s) segmento(s) e não tem link para as outras:
uma não acessa a outra. O cadastro de uma não libera a outra (cada uma tem o seu material em api/material.js).

Uso: python3 tools/black_zona.py
"""
import html, json, os

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://sejaunique.com"
D = json.load(open(os.path.join(RAIZ, "tools", "black_zona_dados.json"), encoding="utf-8"))
PILAR, SEGS = D["PILAR"], {s["id"]: s for s in D["SEGS"]}

EXTRA = {  # cor (token de bz.css), faixa no calendário [etapa inicial, final, texto] e nome curto
    "industria": {"cor": "--c-ind", "faixa": [0, 2, "janela do lojista, de 02 a 19/11"]},
    "varejo": {"cor": "--c-var", "faixa": [1, 3, "lista VIP desde 09/11, vendas de 23 a 30/11"]},
    "uniforme": {"cor": "--c-uni", "faixa": [0, 3, "confraternização até 25/11, janeiro até 30/11"]},
    "aluban": {"cor": "--c-alu", "faixa": [0, 3, "funil, locadoras, condomínios e comércio"]},
}
for k, v in EXTRA.items():
    SEGS[k].update(v)

PAGINAS = [
    {"pasta": "black-zona", "mat": "black-zona", "modo": "geral", "segs": ["industria", "varejo", "uniforme"],
     "leve": "Ações prontas para novembro.",
     "sub": "Indústria e atacado, varejo e uniforme personalizado: 18 ações para vender na Black sem queimar margem. Condição, prazo e rotina.",
     "og": "Black Zona · 18 ações de Black Friday prontas para indústria, atacado, varejo e uniforme"},
    {"pasta": "black-zona/industria", "mat": "black-zona-industria", "modo": "seg", "segs": ["industria"],
     "leve": "Indústria & Atacado.", "og": "Black Zona · Indústria & Atacado"},
    {"pasta": "black-zona/varejo", "mat": "black-zona-varejo", "modo": "seg", "segs": ["varejo"],
     "leve": "Varejo.", "og": "Black Zona · Varejo"},
    {"pasta": "black-zona/uniforme", "mat": "black-zona-uniforme", "modo": "seg", "segs": ["uniforme"],
     "leve": "Uniforme personalizado.", "og": "Black Zona · Uniforme personalizado"},
    {"pasta": "clientes/tendasaluban/black-zona", "mat": None, "modo": "cliente", "segs": ["aluban"], "chave": "aluban",
     "leve": "Tendas Aluban.", "og": "Black Zona · Tendas Aluban", "kick": "Tendas Aluban · Plano de Black Friday"},
]

e = html.escape
LIC = '<i class="ic" style="--i:var(--ic-lock)"></i>'
ACEITE = ('Concordo em receber o blog, novidades, conteúdos e anúncios da Unique por e-mail e WhatsApp, e autorizo o '
          'tratamento dos meus dados conforme a LGPD (Lei 13.709/2018) e a <a href="/privacidade/" target="_blank" '
          'rel="noopener">Política de Privacidade</a>. Posso cancelar quando quiser.')


def head(p, desc, url, capa):
    titulo = p["og"] + " · Unique"
    rob = '<meta name="robots" content="noindex, nofollow">\n' if p["modo"] == "cliente" else ""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<script src="/assets/tema.js"></script>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Unique Consultoria">
<meta property="og:title" content="{e(p['og'])}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{e(url)}">
<meta property="og:image" content="{e(capa)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="pt_BR">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="{e(capa)}">
{rob}<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&family=Poppins:wght@400;600;700&display=swap">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/casco.css">
<link rel="stylesheet" href="/black-zona/bz.css">
</head>"""


def capa(p, segs, n_acoes):
    publico = p["modo"] != "cliente"
    kick = p.get("kick", "Black Friday 2026 · Material gratuito")
    sub = p.get("sub") or segs[0]["tese"]
    acs = ('<div class="acs"><a class="btn verde" href="#liberar">Liberar as ações <i class="ic" style="--i:var(--ic-seta)"></i></a></div>'
           if publico else '<div class="acs"><a class="btn verde" href="#regras">Ver o plano <i class="ic" style="--i:var(--ic-seta)"></i></a></div>')
    n_segs = len(segs)
    return f"""<section class="capa" id="topo" aria-label="Capa">
  <div class="wrap-m">
    <span class="kick">{e(kick)}</span>
    <h1>Black Zona<span class="leve">{e(p['leve'])}</span></h1>
    <p class="sub">{e(sub)}</p>
    {acs}
    <div class="etiqueta" aria-hidden="true"><small>Black Friday</small><b>27/11</b></div>
  </div>
  <div class="listra" aria-hidden="true"></div>
</section>
<section class="numeros" aria-label="O que tem no material">
  <div class="wrap-m">
    <div class="n4 c2"><b id="dias">28</b><small>dias até a Black Friday</small></div>
    <div class="n4 c3"><b>{n_acoes}</b><small>ações com passo a passo e meta</small></div>
    <div class="n4 c1"><b>{n_acoes}</b><small>mensagens prontas para o WhatsApp</small></div>
    <div class="n4 c4"><b>4</b><small>pilares: prospecção, nutrição, fidelização e recuperação</small></div>
  </div>
</section>"""


def porta(p, segs, n_acoes):
    itens = "".join(f'<li>{LIC}<span>{e(a["t"])}<small>{e(s["nome"])} · {e(PILAR[a["p"]])}</small></span></li>'
                    for s in segs for a in s["acoes"])
    alvo = "do seu segmento" if p["modo"] == "seg" else "dos 3 segmentos"
    return f"""<div class="wrap-m">
<section class="dentro" aria-labelledby="dentro-t">
  <h2 id="dentro-t">O que você libera <span class="leve">aqui dentro.</span></h2>
  <p>{n_acoes} ações {alvo}, cada uma com passo a passo, mensagem pronta e meta. Mais o calendário de novembro, as regras da Black Zona e o checklist para marcar o que o time já fez.</p>
  <ul class="tease">{itens}</ul>
</section>
<div class="porta">
  <div class="gate" id="liberar">
    <div>
      <span class="spaced">Exclusivo para cadastrados · gratuito</span>
      <h2>Libere as ações <span class="leve">da Black Zona.</span></h2>
      <p>Preencha e tudo abre aqui mesmo, pronto para usar com o time no celular.</p>
      <ul>
        <li>{n_acoes} ações com passo a passo</li>
        <li>Mensagens prontas para copiar no WhatsApp</li>
        <li>Calendário de novembro, semana a semana</li>
        <li>Meta de cada ação e checklist com progresso</li>
      </ul>
    </div>
    <form id="f-lib" novalidate>
      <p class="ftit">Seus dados</p>
      <div class="duas">
        <input name="nome" autocomplete="name" placeholder="Seu nome" aria-label="Seu nome" maxlength="80" required>
        <input name="empresa" autocomplete="organization" placeholder="Empresa" aria-label="Empresa" maxlength="80" required>
      </div>
      <input name="whatsapp" type="tel" inputmode="tel" autocomplete="tel" placeholder="WhatsApp com DDD" aria-label="WhatsApp com DDD" maxlength="30" required>
      <input name="email" type="email" autocomplete="email" placeholder="Seu melhor e-mail" aria-label="Seu e-mail" maxlength="120" required>
      <input class="isca" name="site" tabindex="-1" autocomplete="off" aria-hidden="true">
      <label class="aceite"><input type="checkbox" name="aceite" required><span>{ACEITE}</span></label>
      <button type="submit">Liberar as ações <i class="ic" style="--i:var(--ic-seta)"></i></button>
      <p class="msg" role="status" aria-live="polite"></p>
    </form>
    <div class="tres-i" aria-hidden="true"><div class="I"></div><div class="I"></div><div class="I"></div></div>
  </div>
  <p class="nl-banner">Quem libera o material entra automaticamente na newsletter Unique. Cancele quando quiser, com um clique.</p>
  <div class="ok" role="status" aria-live="polite">
    <div class="selo"></div>
    <div>
      <b id="ok-t">Ações liberadas!</b>
      <p id="ok-p">E você já está na newsletter Unique: cada post novo do blog chega direto no seu e-mail.</p>
      <span class="nl-tag"><i></i>Newsletter Unique · inscrição ativa</span>
    </div>
    <a class="btn" href="#regras">Começar <i class="ic" style="--i:var(--ic-seta)"></i></a>
  </div>
</div>
</div>"""


REGRAS = """<section class="sec" id="regras">
  <div class="cab"><span class="k">As regras</span><h2>Vender na Black <span class="leve">sem queimar margem.</span></h2></div>
  <div class="regras">
    <div class="regra"><b>01</b><h3>Condição, não desconto</h3><p>Troque o % off por prazo, bônus em mercadoria, upgrade ou frete. O cliente sente o ganho e a sua tabela fica de pé.</p></div>
    <div class="regra"><b>02</b><h3>Toda oferta tem fim</h3><p>Dia e hora para acabar, escritos na mensagem. Oferta sem prazo é tabela.</p></div>
    <div class="regra"><b>03</b><h3>Comece pela carteira</h3><p>Quem já comprou é a venda mais curta. Inativos e orçamentos parados vêm antes de cliente novo.</p></div>
    <div class="regra"><b>04</b><h3>Rotina todo dia</h3><p>Meta de contatos por dia, reunião de 10 minutos às 9h e placar visível. Black é método atleta, não sorte.</p></div>
  </div>
</section>
<section class="sec" id="calendario">
  <div class="cab"><span class="k">Calendário</span><h2>Novembro, <span class="leve">semana a semana.</span></h2></div>
  <div class="cal-box" id="cal"></div>
  <div class="aviso">20/11 é feriado da Consciência Negra. A Black Friday é sexta, 27/11, e a Cyber Monday, 30/11.</div>
</section>"""

TABELA = """<section class="sec" id="todas">
  <div class="cab"><span class="k">Banco de ações</span><h2>Todas as ações <span class="leve">num lugar só.</span></h2><p>Busque por palavra, filtre por segmento ou pilar e toque na ação para abrir.</p></div>
  <input class="busca" id="busca" type="search" placeholder="Buscar (ex.: orçamento, kit, indicação)" aria-label="Buscar ação">
  <div class="filtros" id="fseg"></div><div class="filtros" id="fpil"></div>
  <p class="conta" id="conta"></p>
  <div class="tab-box"><table><thead><tr><th>Ação</th><th>Segmento</th><th>Pilar</th><th>Quando</th><th>Esforço</th></tr></thead><tbody id="tb"></tbody></table></div>
</section>"""


def alda_diag(mat_nome):
    q = mat_nome.replace(" ", "%20")
    return f"""<div class="wrap-m">
  <section class="alda" aria-labelledby="alda-t" style="margin-top:clamp(80px,11vw,150px)">
    <div class="alda-cab">
      <span class="alda-selo">Para quem vai rodar a Black</span>
      <img class="alda-logo" src="/diagnostico/relatorio/alda-logo.png" alt="Alda CRM" width="520" height="203">
      <h2 id="alda-t">Dispare a oferta certa para o cliente certo, sem perder nenhum retorno</h2>
      <p>Uma demonstração do Alda.CRM montada com o seu funil de vendas, com a implantação acompanhada pela Unique.</p>
      <p class="alda-assina">Implantado pela Unique Consultoria Comercial</p>
      <div class="alda-acts">
        <a class="btn alda-btn" href="https://wa.me/5511920781458?text=Ol%C3%A1%21%20Li%20o%20material%20{q}%20da%20Unique%20e%20quero%20conhecer%20o%20Alda.CRM." target="_blank" rel="noopener">Quero conhecer o Alda.CRM</a>
        <a class="btn alda-link" href="https://aldacrm.com" target="_blank" rel="noopener">Ver o site</a>
      </div>
    </div>
    <div class="alda-lista">
      <span class="alda-eyebrow">Na Black, o Alda ajuda em</span>
      <ul>
        <li><span class="alda-ic"><svg viewBox="0 0 24 24"><path d="M4 5h16l-6 8v6l-4 2v-8z"/></svg></span><div><strong>Lista por perfil de compra</strong><span>Inativos, curva A e orçamentos parados separados com um filtro.</span></div></li>
        <li><span class="alda-ic"><svg viewBox="0 0 24 24"><path d="M4 12l16-8-6 16-3-7z"/></svg></span><div><strong>Disparo segmentado no WhatsApp</strong><span>Cada oferta vai só para quem ela faz sentido.</span></div></li>
        <li><span class="alda-ic"><svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5.3M20 4v4h-4M20 12a8 8 0 0 1-14 5.3M4 20v-4h4"/></svg></span><div><strong>Follow-up com data</strong><span>Quem pediu para pensar recebe o retorno antes de a condição vencer.</span></div></li>
        <li><span class="alda-ic"><svg viewBox="0 0 24 24"><path d="M5 18v-6a7 7 0 0 1 14 0v6"/><rect x="3" y="13" width="4" height="6" rx="1.5"/><rect x="17" y="13" width="4" height="6" rx="1.5"/></svg></span><div><strong>Placar do time</strong><span>Contatos, respostas e vendas de cada vendedor durante a Black Week.</span></div></li>
      </ul>
    </div>
    <img class="alda-pato" src="/diagnostico/relatorio/alda-pato.png" alt="" aria-hidden="true" width="134" height="238">
    <span class="alda-caco" aria-hidden="true"></span>
  </section>
</div>
<div class="wrap-m" id="proximo">
  <div class="diag">
    <div class="txt">
      <span class="spaced">Próximo passo</span>
      <h2>A Black passa. <span class="leve">Qual é o score do seu comercial?</span></h2>
      <p>Faça o diagnóstico. Em 10 a 15 minutos você responde sobre os 4 pilares do seu comercial e recebe um relatório com o score, os gargalos e um plano de ação.</p>
      <div class="ctas"><a class="btn verde" href="/diagnostico/">Faça seu diagnóstico comercial <i class="ic" style="--i:var(--ic-seta)"></i></a>
      <a class="btn" href="https://wa.me/5562996007574?text=Ol%C3%A1%2C%20Carlos%21%20Li%20o%20material%20{q}%20e%20quero%20conversar%20sobre%20o%20comercial%20da%20minha%20empresa." target="_blank" rel="noopener"><i class="ic" style="--i:var(--ic-whatsapp)"></i>Falar com o Carlos</a></div>
    </div>
    <figure><img src="/assets/fotos/palco.jpg" alt="Carlos Ribeiro em palestra, com microfone" width="1280" height="853" loading="lazy"></figure>
  </div>
</div>"""


def pagina(p):
    segs = [SEGS[i] for i in p["segs"]]
    n = sum(len(s["acoes"]) for s in segs)
    url = SITE + "/" + p["pasta"] + "/"
    capa_img = SITE + "/assets/og/" + ("tendasaluban-black-zona" if p["modo"] == "cliente" else p["mat"]) + ".jpg"
    desc = (p.get("sub") or segs[0]["tese"]) + " " + str(n) + " ações com passo a passo, mensagens prontas e meta."
    dados = {"mat": p["mat"], "modo": p["modo"], "chave": p.get("chave"), "pilar": PILAR,
             "segs": [{k: s[k] for k in ("id", "nome", "curto", "tese", "janela", "naofaca", "acoes", "cor", "faixa")} for s in segs]}
    js = json.dumps(dados, ensure_ascii=False).replace("</", "<\\/")
    publico = p["modo"] != "cliente"
    corpo = [head(p, desc, url, capa_img), '<body class="leitura">', '<script src="/assets/casco.js"></script>', "<main>",
             capa(p, segs, n)]
    if publico:
        corpo.append(porta(p, segs, n))
    corpo.append('<div class="fechado"><div class="wrap-m">')
    corpo.append(REGRAS)
    corpo.append('<section class="sec" id="acoes" style="padding-top:0"><div id="segmentos"></div></section>')
    if p["modo"] == "geral":
        corpo.append(TABELA)
    corpo.append("</div>")
    if publico:
        corpo.append(alda_diag("Black Zona"))
    corpo.append('<div style="height:clamp(64px,8vw,110px)"></div></div>')
    corpo += ["</main>", "<script>window.BZ=" + js + ";</script>", '<script src="/black-zona/bz.js"></script>', "</body>", "</html>", ""]
    destino = os.path.join(RAIZ, p["pasta"], "index.html")
    os.makedirs(os.path.dirname(destino), exist_ok=True)
    open(destino, "w", encoding="utf-8").write("\n".join(corpo))
    print("ok", p["pasta"], n, "ações")


if __name__ == "__main__":
    for p in PAGINAS:
        pagina(p)
