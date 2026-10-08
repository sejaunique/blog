#!/usr/bin/env python3
"""Insere (ou atualiza) o bloco "Mais cases" no fim de cada página de case,
com os 3 cases seguintes da lista de /cases/. Rodar depois de gerar_cases.py."""
import re, pathlib
RAIZ = pathlib.Path(__file__).resolve().parent.parent
lista = (RAIZ / 'cases/index.html').read_text()
cards = re.findall(r'<a class="caso" href="/cases/([^/]+)/">.*?</a>', lista)
html_cards = dict(zip(cards, re.findall(r'<a class="caso" href=.*?</a>', lista)))
css = re.search(r'(\.caso\{.*?\.caso \.ir \.ic\{[^}]*\}\n)', lista, re.S).group(1)
INI, FIM = '<!--mais-cases-->', '<!--/mais-cases-->'
for i, slug in enumerate(cards):
    f = RAIZ / 'cases' / slug / 'index.html'
    s = f.read_text()
    s = re.sub(re.escape(INI) + '.*?' + re.escape(FIM) + '\n', '', s, flags=re.S)
    prox = [cards[(i + k) % len(cards)] for k in (1, 2, 3)]
    bloco = (INI + '\n<style>\n.mais{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}\n' + css +
             '@media (max-width:860px){.mais{grid-template-columns:1fr}}\n.mais-topo{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:18px}\n'
             '.mais-topo h2{margin:0}.mais-topo a{font-weight:700;font-size:.9rem;display:inline-flex;gap:8px;align-items:center}\n</style>\n'
             '<section style="padding-top:0">\n  <div class="leitura-w" style="max-width:var(--wide)">\n'
             '    <div class="mais-topo"><h2>Mais cases <span class="leve">para você ver.</span></h2>'
             '<a href="/cases/">Ver todos <i class="ic" style="--i:var(--ic-seta)"></i></a></div>\n    <div class="mais">\n'
             + '\n'.join('      ' + html_cards[p].strip() for p in prox) + '\n    </div>\n  </div>\n</section>\n' + FIM + '\n')
    # antes do CTA final (última <section> do main)
    k = s.rindex('<section style="padding-top:0">\n  <div class="leitura-w" style="max-width:var(--wide)">\n    <div class="cta">')
    s = s[:k] + bloco + s[k:]
    f.write_text(s)
    print('ok', slug, prox)
