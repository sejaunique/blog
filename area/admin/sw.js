// App Unique Workspace: recebe os avisos e abre a tela certa ao tocar.
// O push chega sem conteúdo; o app busca o aviso mais recente na API (com o login do admin).
const ICONE = '/area/admin/icone-192.png', BADGE = '/area/admin/badge.png';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  e.waitUntil((async () => {
    let n = null;
    try {
      const r = await fetch('/api/area?a=admin-notif', { credentials: 'include', cache: 'no-store' });
      const j = await r.json();
      n = j.ok && j.notif && j.notif[0];
    } catch (x) { /* sem rede ou sem login */ }
    const titulo = n ? n.titulo : 'Unique Workspace';
    const texto = n ? n.texto : 'Tem novidade no seu workspace.';
    return self.registration.showNotification(titulo, {
      body: texto, icon: ICONE, badge: BADGE, tag: n ? n.id : 'unique',
      data: { url: (n && n.url) || '/area/admin/#notificacoes' }
    });
  })());
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/area/admin/', self.location.origin).href;
  e.waitUntil((async () => {
    const abas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abas) { if (c.url.indexOf('/area/admin/') >= 0) { await c.focus(); return c.navigate ? c.navigate(url) : null; } }
    return self.clients.openWindow(url);
  })());
});
