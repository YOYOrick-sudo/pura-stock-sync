import { registerSW } from 'virtual:pwa-register';

/** Alleen bekende preview-/ontwikkelhosts; gepubliceerde domeinen blijven toegestaan. */
export function isPreviewHost(host: string): boolean {
  const naam = host.toLowerCase();
  return naam === 'localhost' || naam === '127.0.0.1'
    || naam === 'lovableproject.com' || naam.endsWith('.lovableproject.com')
    || naam === 'lovableproject-dev.com' || naam.endsWith('.lovableproject-dev.com')
    || naam === 'beta.lovable.dev' || naam.endsWith('.beta.lovable.dev')
    || (/\.(lovable\.app|gpt-eng\.com|gptengineer\.run)$/.test(naam)
      && (/^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/.test(naam.split('.')[0])
        || /^project--.+-dev$/.test(naam.split('.')[0])));
}

export async function startServiceWorker(): Promise<void> {
  try {
    const weigeren = !import.meta.env.PROD || window.self !== window.top
      || isPreviewHost(window.location.hostname)
      || new URLSearchParams(window.location.search).get('sw') === 'off';
    if (weigeren) {
      if ('serviceWorker' in navigator) {
        const registraties = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registraties.filter((r) => {
          const worker = r.active ?? r.waiting ?? r.installing;
          return worker && ['/sw.js', '/service-worker.js'].includes(new URL(worker.scriptURL).pathname);
        }).map((r) => r.unregister()));
      }
      if ('caches' in window) {
        const namen = await caches.keys();
        await Promise.all(namen.filter((naam) => naam.startsWith('app-assets') || naam.startsWith('workbox-precache')).map((naam) => caches.delete(naam)));
      }
      return;
    }
    registerSW({ immediate: true, onRegisterError: (fout) => console.warn('Service worker niet gestart', fout) });
  } catch (fout) {
    console.warn('Service worker niet gestart', fout);
  }
}