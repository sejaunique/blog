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
  sticky.classList.toggle('show', pastHero && !atForm);
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
