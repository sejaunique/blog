// Configure the confirmed destination before collecting live registrations.
const CONTACT_WHATSAPP = '5562982272823';
// Início da imersão (horário de Brasília/Goiânia).
const EVENT_START = new Date('2026-11-19T08:00:00-03:00');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Formulário → WhatsApp
const form = document.getElementById('lead-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  const status = document.getElementById('form-status');
  if (!CONTACT_WHATSAPP) {
    status.textContent = 'As inscrições por este formulário ainda não estão disponíveis. Seus dados não foram enviados.';
    return;
  }
  const data = new FormData(form);
  const message = `Olá! Quero saber como participar da Imersão Confecção 360°.\nNome: ${data.get('name')}\nConfecção: ${data.get('company')}\nE-mail: ${data.get('email')}\nWhatsApp: ${data.get('phone')}`;
  window.location.href = `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(message)}`;
});

// Máscara simples de telefone
const phone = document.getElementById('phone');
phone.addEventListener('input', () => {
  const d = phone.value.replace(/\D/g, '').slice(0, 11);
  if (d.length > 10) phone.value = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  else if (d.length > 6) phone.value = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  else if (d.length > 2) phone.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
  else phone.value = d;
});

// Contagem regressiva
const units = {
  days: document.querySelector('[data-unit="days"]'),
  hours: document.querySelector('[data-unit="hours"]'),
  minutes: document.querySelector('[data-unit="minutes"]'),
  seconds: document.querySelector('[data-unit="seconds"]'),
};
const daysBadge = document.querySelector('[data-countdown-days]');
const pad = (n) => String(n).padStart(2, '0');
function tick() {
  const diff = Math.max(0, EVENT_START - Date.now());
  const days = Math.floor(diff / 864e5);
  units.days.textContent = pad(days);
  units.hours.textContent = pad(Math.floor(diff / 36e5) % 24);
  units.minutes.textContent = pad(Math.floor(diff / 6e4) % 60);
  units.seconds.textContent = pad(Math.floor(diff / 1e3) % 60);
  daysBadge.textContent = days;
  if (diff === 0) {
    document.querySelector('.countdown-label').textContent = 'A imersão está acontecendo';
    document.querySelector('.ticket-count').hidden = true;
  }
}
tick();
setInterval(tick, 1000);

// Entrada ao rolar
const revealItems = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const siblings = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 4) * 90}ms`;
      el.classList.add('is-in');
      io.unobserve(el);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach((el) => io.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-in'));
}

// Header com fundo ao rolar + CTA fixo no mobile
const header = document.querySelector('.site-header');
const sticky = document.querySelector('.sticky-cta');
const hero = document.querySelector('.hero');
const registration = document.getElementById('inscricao');
function onScroll() {
  header.classList.toggle('scrolled', window.scrollY > 40);
  const pastHero = hero.getBoundingClientRect().bottom < 0;
  const r = registration.getBoundingClientRect();
  const atForm = r.top < window.innerHeight && r.bottom > 0;
  const f = document.querySelector('.final').getBoundingClientRect();
  const atFinal = f.top < window.innerHeight && f.bottom > 0;
  sticky.classList.toggle('show', pastHero && !atForm && !atFinal);
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Roda dos 6 pilares
const nodes = [...document.querySelectorAll('.node')];
const panel = document.querySelector('.pillar-panel');
const progress = document.querySelector('.wheel-orbit .progress');
let current = 0;
let autoplay;
function selectPillar(i) {
  current = i;
  nodes.forEach((n, j) => n.classList.toggle('active', j === i));
  const n = nodes[i];
  panel.querySelector('[data-pillar-day]').textContent = n.dataset.day;
  panel.querySelector('[data-pillar-title]').textContent = n.dataset.title;
  panel.querySelector('[data-pillar-text]').textContent = n.dataset.text;
  panel.classList.remove('swap');
  void panel.offsetWidth;
  panel.classList.add('swap');
  progress.style.strokeDashoffset = 8.33 - i * 16.666;
}
function startAutoplay() {
  if (reduceMotion) return;
  clearInterval(autoplay);
  autoplay = setInterval(() => selectPillar((current + 1) % nodes.length), 3200);
}
nodes.forEach((n, i) => {
  n.addEventListener('click', () => { selectPillar(i); clearInterval(autoplay); });
  n.addEventListener('mouseenter', () => { selectPillar(i); clearInterval(autoplay); });
});
document.querySelector('.wheel').addEventListener('mouseleave', startAutoplay);
selectPillar(0);
startAutoplay();

// Checklist do plano se completa ao entrar na tela
const docItems = document.querySelectorAll('.doc-list li');
if ('IntersectionObserver' in window && !reduceMotion) {
  const docIo = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    docItems.forEach((li, i) => setTimeout(() => li.classList.add('done'), 400 + i * 280));
    docIo.disconnect();
  }, { threshold: 0.35 });
  docIo.observe(document.querySelector('.plan-doc'));
} else {
  docItems.forEach((li) => li.classList.add('done'));
}

// Cursor de agulha: a agulha costura um ponto corrido por onde o mouse passa.
// A linha fica presa à página (acompanha a rolagem) e some aos poucos. Só em mouse; nunca no toque.
(function () {
  if (reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const VIDA = 1400;      // ms até a linha sumir
  const PONTO = 7, VAO = 5; // tamanho do ponto e do vão, em px
  const GOLD = '#F2B705', NAVY = '#0D1B2A';
  const SEM_AGULHA = 'input, textarea, select, [contenteditable]';
  const FUNDO_OURO = '.tone-gold, .marquee, .topbar, .button, .header-cta:hover, .sticky-cta, .ticket-count, .pillar-day';

  const canvas = document.createElement('canvas');
  canvas.className = 'stitch-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const agulha = document.createElement('div');
  agulha.className = 'needle';
  agulha.setAttribute('aria-hidden', 'true');
  agulha.innerHTML = '<svg viewBox="0 0 44 10" width="62" height="14"><defs><linearGradient id="aco" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#D9DEE5"/><stop offset="1" stop-color="#7D8896"/></linearGradient></defs><path d="M44 5 L30 3.1 L5 3.3 Q0 3.4 0 5 Q0 6.6 5 6.7 L30 6.9 Z" fill="url(#aco)" stroke="#0D1B2A" stroke-width=".7"/><ellipse cx="6.5" cy="5" rx="3" ry=".95" fill="#0D1B2A"/></svg>';
  document.body.append(canvas, agulha);
  document.documentElement.classList.add('needle-on');

  const ctx = canvas.getContext('2d');
  let dpr = 1;
  function tamanho() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
  }
  tamanho();
  window.addEventListener('resize', tamanho);

  const pts = [];   // {x, y (coordenadas da página), d (distância acumulada), t, cor}
  const xis = [];   // pontos em X deixados pelo clique
  let ang = -135, alvo = -135, mx = -100, my = -100, visivel = false, rodando = false, dist = 0;

  function corEm(el) {
    if (!el || !el.closest) return GOLD;
    if (el.closest(FUNDO_OURO)) return NAVY;
    return el.closest('.tone-light') && !el.closest('form, .ticket, .plan-doc, .tile') ? '#B8860B' : GOLD;
  }

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    const livre = !(e.target.closest && e.target.closest(SEM_AGULHA));
    if (livre !== visivel) { visivel = livre; agulha.style.opacity = livre ? 1 : 0; }
    const px = mx + scrollX, py = my + scrollY;
    const ult = pts[pts.length - 1];
    const dx = ult ? px - ult.x : 0, dy = ult ? py - ult.y : 0, passo = Math.hypot(dx, dy);
    if (!ult || passo > 3) {
      if (ult && passo > 1.5) alvo = Math.atan2(dy, dx) * 180 / Math.PI;
      dist += passo;
      if (visivel) pts.push({ x: px, y: py, d: dist, t: performance.now(), cor: corEm(e.target) });
      if (pts.length > 500) pts.shift();
    }
    acorda();
  }, { passive: true });
  document.addEventListener('mouseleave', () => { agulha.style.opacity = 0; visivel = false; });
  document.addEventListener('mousedown', (e) => {
    agulha.classList.add('fura');
    if (!(e.target.closest && e.target.closest(SEM_AGULHA))) xis.push({ x: e.clientX + scrollX, y: e.clientY + scrollY, t: performance.now(), cor: corEm(e.target) });
    acorda();
  });
  document.addEventListener('mouseup', () => agulha.classList.remove('fura'));
  window.addEventListener('scroll', acorda, { passive: true });

  function acorda() { if (!rodando) { rodando = true; requestAnimationFrame(quadro); } }

  function quadro(agora) {
    // a agulha gira suave até apontar para onde o mouse vai
    let diff = ((alvo - ang + 540) % 360) - 180;
    ang += diff * 0.35;
    agulha.style.transform = `translate(${mx - 62}px, ${my - 7}px) rotate(${ang}deg)`;

    while (pts.length && agora - pts[0].t > VIDA) pts.shift();
    while (xis.length && agora - xis[0].t > VIDA * 1.6) xis.shift();

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.2;
    ctx.setLineDash([PONTO, VAO]);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const vida = 1 - (agora - a.t) / VIDA;
      if (vida <= 0) continue;
      ctx.globalAlpha = Math.min(1, vida * 1.4);
      ctx.strokeStyle = b.cor;
      ctx.lineDashOffset = -(a.d % (PONTO + VAO)); // pontos ficam parados no "tecido"
      ctx.beginPath();
      ctx.moveTo(a.x - scrollX, a.y - scrollY);
      ctx.lineTo(b.x - scrollX, b.y - scrollY);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    for (const k of xis) {
      const vida = 1 - (agora - k.t) / (VIDA * 1.6);
      ctx.globalAlpha = Math.max(0, vida);
      ctx.strokeStyle = k.cor;
      const x = k.x - scrollX, y = k.y - scrollY, r = 4.5;
      ctx.beginPath();
      ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r);
      ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (pts.length || xis.length || Math.abs(diff) > 0.5) requestAnimationFrame(quadro);
    else rodando = false;
  }
})();

// Depoimentos: setas do carrossel e vídeo aberto na própria página
const EMBED_YT = true;
(function () {
  const track = document.querySelector('.dep-track');
  if (!track) return;
  document.querySelectorAll('.dep-btn').forEach((b) => b.addEventListener('click', () => {
    const card = track.querySelector('.dep');
    const passo = card ? card.getBoundingClientRect().width + 20 : 300;
    track.scrollBy({ left: Number(b.dataset.dir) * passo * 2, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));
  if (!EMBED_YT) return; // sem player embutido: o card abre o YouTube em nova aba
  const modal = document.createElement('div');
  modal.className = 'yt-modal';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Depoimento em vídeo');
  modal.innerHTML = '<div class="yt-box"><button type="button" class="yt-close" aria-label="Fechar vídeo">×</button><iframe title="Depoimento em vídeo" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>';
  document.body.append(modal);
  const frame = modal.querySelector('iframe');
  let voltaFoco = null;
  function fecha() {
    modal.hidden = true;
    frame.src = 'about:blank';
    document.documentElement.style.overflow = '';
    if (voltaFoco) voltaFoco.focus();
  }
  document.querySelectorAll('.dep[data-yt]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    voltaFoco = a;
    frame.src = `https://www.youtube.com/embed/${a.dataset.yt}?autoplay=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    modal.querySelector('.yt-close').focus();
  }));
  modal.addEventListener('click', (e) => { if (e.target === modal || e.target.closest('.yt-close')) fecha(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) fecha(); });
})();

// Depoimentos: com o mouse perto da borda, o carrossel anda para aquele lado (mais rápido quanto mais perto)
(function () {
  const track = document.querySelector('.dep-track');
  if (!track || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const ZONA = 0.32;      // fração da largura em cada borda que faz andar
  const VEL_MAX = reduceMotion ? 6 : 14; // px por quadro
  let vel = 0, rodando = false;
  function anda() {
    const max = track.scrollWidth - track.clientWidth;
    if (vel && !((vel < 0 && track.scrollLeft <= 0) || (vel > 0 && track.scrollLeft >= max - 1))) {
      track.scrollLeft += vel;
      requestAnimationFrame(anda);
    } else {
      rodando = false;
    }
  }
  track.addEventListener('mousemove', (e) => {
    const r = track.getBoundingClientRect();
    const p = (e.clientX - r.left) / r.width;
    if (p > 1 - ZONA) vel = VEL_MAX * ((p - (1 - ZONA)) / ZONA) ** 1.5;
    else if (p < ZONA) vel = -VEL_MAX * ((ZONA - p) / ZONA) ** 1.5;
    else vel = 0;
    track.classList.toggle('andando', vel !== 0);
    if (vel && !rodando) { rodando = true; requestAnimationFrame(anda); }
  });
  track.addEventListener('mouseleave', () => { vel = 0; track.classList.remove('andando'); });
})();
