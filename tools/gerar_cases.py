#!/usr/bin/env python3
"""Gera as páginas /cases/<slug>/ a partir de JSONs (um por case) usando o
layout da página da Infindo como molde (head + CSS + script).

Uso: python3 tools/gerar_cases.py <pasta-com-json> <videos.txt>
Também grava assets/cases.json (índice usado pela home)."""
import json, sys, re, html, unicodedata, pathlib, urllib.parse

RAIZ = pathlib.Path(__file__).resolve().parent.parent
MOLDE = (RAIZ / 'cases/infindo/index.html').read_text()
HEAD = MOLDE.split('<body')[0]
SCRIPT = MOLDE[MOLDE.rindex('<script>'):]
SITE = 'https://sejaunique.vercel.app'

LOGO = {'boldz': 'boldz', 'casa-lis': 'casa-lis', 'clara-construtora': 'clara-construtora',
        'dra-laura-scher': 'dra-laura-scher', 'cical': 'grupo-cical', 'ido': 'ido-odontologia',
        'rogerio-penna': 'instituto-rogerio-penna', 'super-bolla': 'super-bolla', 'urbs': 'urbs'}
# vídeo da playlist DEPOIMENTOS com o nome da empresa (segundo = depoimento extra)
VIDEO = {'multiodonto': ['-xczzMj-BYA'], 'super-bolla': ['nXWffvdjXuw'], 'casa-lis': ['4IWPxpIVzGc'],
         'dra-laura-scher': ['OCxVrZ1iskE'], 'ww-cerimonial': ['lPw3Fz6KPkE', 't6IMAgEQ8-s'],
         'urbs': ['j9hJAVETSvM'], 'cical': ['X63DVgO3OoA'], 'clara-construtora': ['MEki-u2ityA', 'lgKGwP3TdrU'],
         'brukki': ['utIBteE3lkI', 'soe5DONeqyA'], 'marcel-bianchi': ['tmsSCAmo5aU', 'Bs82W0gYINA'],
         'aurora-songs': ['ZJul8_10yVk'], 'boldz': ['qIF9VsOulOY'], 'rogerio-penna': ['s_N7N3tFw6o'],
         'laboratorio-alcantara': ['hPJOKWCvEQo'], 'ido': ['qfSie1d3Beo', '_2Ah63xFDAk']}


SEM_MAX = {'lPw3Fz6KPkE', 'utIBteE3lkI', 'ZJul8_10yVk', 'qIF9VsOulOY', 'qfSie1d3Beo'}


def thumb(v):
    return f'https://img.youtube.com/vi/{v}/' + ('hqdefault' if v in SEM_MAX else 'maxresdefault') + '.jpg'


def ic(n, extra=''):
    return f'<i class="ic" style="--i:var(--ic-{n}){extra}"></i>'


def a(s):
    return html.escape(s, quote=True)


def video(vid, rot, label, extra=''):
    return (f'<button class="video" type="button" data-id="{vid}" aria-label="{a(label)}"{extra}>\n'
            f'      <img src="{thumb(vid)}" alt="" width="1280" height="720" loading="lazy">\n'
            f'      <span class="play" aria-hidden="true">{ic("play")}</span>\n'
            f'      <span class="rot">{rot}</span>\n    </button>')


def secao(lado, cls_lado, h2, corpo, estilo=' style="padding-top:0"', cls=''):
    c = f' class="{cls}"' if cls else ''
    return (f'<section{c}{estilo if not cls else ""}>\n  <div class="leitura-w bloco-t">\n'
            f'    <div class="lado"><span class="spaced{cls_lado}">{lado}</span></div>\n'
            f'    <div>\n      <h2>{h2}</h2>\n{corpo}\n    </div>\n  </div>\n</section>')


def pagina(d):
    s = d['slug']; nome = d['nome']; vids = VIDEO.get(s, [])
    url = f'{SITE}/cases/{s}/'
    og = thumb(vids[0]) if vids else f'{SITE}/assets/og/home.jpg'
    titulo = f'Case {nome} · Unique Consultoria Comercial'
    head = HEAD
    rep = {
        r'<title>.*?</title>': f'<title>{a(titulo)}</title>',
        r'(<meta name="description" content=")[^"]*': r'\g<1>' + a(d['meta_desc']),
        r'(<meta property="og:title" content=")[^"]*': r'\g<1>' + a(f'Case {nome}'),
        r'(<meta property="og:description" content=")[^"]*': r'\g<1>' + a(d['meta_desc']),
        r'(<meta property="og:url" content=")[^"]*': r'\g<1>' + url,
        r'(<meta property="og:image" content=")[^"]*': r'\g<1>' + og,
        r'(<meta property="og:image:width" content=")[^"]*': r'\g<1>1280',
        r'(<meta property="og:image:height" content=")[^"]*': r'\g<1>720',
        r'(<meta name="twitter:title" content=")[^"]*': r'\g<1>' + a(f'Case {nome}'),
        r'(<meta name="twitter:description" content=")[^"]*': r'\g<1>' + a(d['meta_desc']),
        r'(<meta name="twitter:image" content=")[^"]*': r'\g<1>' + og,
        r'(<link rel="canonical" href=")[^"]*': r'\g<1>' + url,
    }
    for k, v in rep.items():
        head = re.sub(k, lambda m, v=v: m.expand(v) if '\\g<1>' in v else v, head, count=1)

    rot = ' · '.join(x for x in ['Case de sucesso', d.get('segmento', ''), d.get('cidade', '')] if x)
    h1 = f'<span class="a">{d["h1a"]}</span>' + (f'<span class="b">{d["h1b"]}</span>' if d.get('h1b') else '')
    abre = (f'<section class="abre" aria-labelledby="h1">\n  <div class="wrap">\n    <div class="txt">\n'
            f'      <a class="volta" href="/cases/">{ic("seta", ";transform:scaleX(-1)")}Todos os cases</a>\n'
            f'      <span class="spaced">{a(rot)}</span>\n      <h1 id="h1">{h1}</h1>\n'
            f'      <p class="sub">{d["sub_html"]}</p>\n    </div>\n    '
            + (video(vids[0], 'Assista ao case', f'Assistir ao case da {nome} em vídeo') if vids else '') +
            '\n  </div>\n</section>')
    ficha = ('<div class="ficha leitura-w" style="max-width:var(--wide)">\n' + '\n'.join(
        f'  <div>{ic(f["ic"])}<b>{f["b"]}</b><span>{f["s"]}</span></div>' for f in d['ficha']) + '\n</div>')

    links = [l for l in d.get('links', []) if 'youtube.com' not in l['href'] and 'youtu.be' not in l['href']]
    emp = '\n'.join(f'      <p>{p}</p>' for p in d['empresa_p'])
    if links:
        emp += '\n      <p style="margin-top:18px">' + ' · '.join(
            f'<a href="{a(l["href"])}" target="_blank" rel="noopener">{l["txt"]}</a>' for l in links) + '</p>'
    partes = [abre, ficha, secao('A empresa', '', d['empresa_h2'], emp, estilo='')]

    des = ('      <ul class="itens mag">\n' + '\n'.join(
        f'        <li>{ic(x["ic"])}<div><b>{x["b"]}</b><span>{x["s"]}</span></div></li>' for x in d['desafios'])
        + '\n      </ul>')
    partes.append(secao('O desafio', ' c-mag', d['desafio_h2'], des))
    pas = ('      <ol class="passos">\n' + '\n'.join(
        f'        <li><span class="num">{i+1:02d}</span><div><b>{x["b"]}</b><span>{x["s"]}</span></div></li>'
        for i, x in enumerate(d['passos'])) + '\n      </ol>')
    partes.append(secao('A solução Unique', '', d['solucao_h2'], pas, cls='solucao'))

    res = ''
    if d.get('antes_depois'):
        res += ('      <div class="ad" role="table" aria-label="Antes e depois">\n'
                f'        <div class="linha cab" role="row"><span class="aspecto" role="columnheader">Aspecto</span>'
                f'<span class="antes" role="columnheader">{ic("x")}Antes</span><span class="depois" role="columnheader">{ic("check")}Depois</span></div>\n'
                + '\n'.join(f'        <div class="linha" role="row"><span class="aspecto" role="cell">{x["aspecto"]}</span>'
                            f'<span class="antes" role="cell">{ic("x")}{x["antes"]}</span>'
                            f'<span class="depois" role="cell">{ic("check")}{x["depois"]}</span></div>'
                            for x in d['antes_depois']) + '\n      </div>')
    if d.get('impacto'):
        res += ('\n      <div class="impacto">\n' + '\n'.join(
            f'        <div>{ic(x["ic"])}<b>{x["b"]}</b><span>{x["s"]}</span></div>' for x in d['impacto'])
            + '\n      </div>')
    if res:
        partes.append(secao('Resultados', ' c-ver', d['resultados_h2'], res, estilo=''))

    dep = ''
    if d.get('depoimentos'):
        dep += ('      <div class="depos">\n' + '\n'.join(
            f'        <blockquote class="dq">{ic("aspas")}<p>"{x["texto"]}"</p><cite><b>{x["nome"]}</b>{x["cargo"]}</cite></blockquote>'
            for x in d['depoimentos']) + '\n      </div>')
    if len(vids) > 1:
        dep += '\n      ' + video(vids[1], 'Depoimento em vídeo', f'Assistir a mais um depoimento da {nome}',
                                  ' style="margin-top:26px;border-radius:var(--r)"')
    fg = d.get('frase_grande')
    if fg:
        dep += (f'\n      <blockquote class="grande">\n        <div><p>"{fg["texto"]}"</p>\n'
                f'        <cite><b>{fg["nome"]}</b>{fg["cargo"]}</cite></div>\n      </blockquote>')
    if dep:
        partes.append(secao('Depoimentos', '', 'Quem viveu <span class="leve">conta melhor.</span>', dep))

    msg = urllib.parse.quote(f'Olá, Carlos! Vi o case da {nome} e quero conversar.')
    partes.append(
        '<section style="padding-top:0">\n  <div class="leitura-w" style="max-width:var(--wide)">\n    <div class="cta">\n'
        '      <div><h2>Quer um case assim <span class="leve">na sua empresa?</span></h2>\n'
        '      <p>Comece pelo diagnóstico comercial: em 10 a 15 minutos você recebe o score, os gargalos e o plano de ação.</p></div>\n'
        f'      <div class="bts"><a class="btn verde" href="/diagnostico/">Faça seu diagnóstico {ic("seta")}</a>\n'
        f'      <a class="btn" href="https://wa.me/5562996007574?text={msg}" target="_blank" rel="noopener">{ic("whatsapp")}Conversar com o Carlos</a></div>\n'
        '    </div>\n  </div>\n</section>')
    corpo = '\n'.join(partes)
    return (head + '<body class="leitura" data-casco="cases">\n<script src="/assets/casco.js"></script>\n<main>\n'
            + corpo + '\n</main>\n' + SCRIPT.replace('Case Clínica Brasil', f'Case {nome}'))


def main():
    pasta = pathlib.Path(sys.argv[1])
    indice = []
    for f in sorted(p for p in pasta.glob('*.json') if not p.name.startswith('_')):
        d = json.loads(f.read_text())
        out = RAIZ / 'cases' / d['slug'] / 'index.html'
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(pagina(d))
        indice.append({'slug': d['slug'], 'nome': d['nome'], 'segmento': d.get('segmento', ''),
                       'resumo': d['resumo'], 'logo': LOGO.get(d['slug'], ''),
                       'depoimentos': [x for x in d.get('depoimentos', [])]})
        print('ok', out.relative_to(RAIZ))
    (pasta / '_indice.json').write_text(json.dumps(indice, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
