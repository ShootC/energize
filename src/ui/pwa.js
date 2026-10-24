// Progressive-web-app wiring. Over http(s) the page registers sw.js (built next
// to index.html) so it opens offline and installs to the home screen; over
// file:// there is no service worker and none is needed — the single file is
// already self-contained. Nothing here reaches any other origin.

export function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  } catch {
    return false;
  }
}

// Returns a live info object: { served, standalone, installPrompt }.
//   onUpdateReady — a newer build has taken over the page's cache; a reload shows it
//   onInstallable — Android's install prompt became available (or the app was installed)
export function setupPwa({ onUpdateReady = () => {}, onInstallable = () => {} } = {}) {
  const info = { served: /^https?:$/.test(location.protocol), standalone: isStandalone(), installPrompt: null, registered: false };
  if (info.served && 'serviceWorker' in navigator) {
    let hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (hadController) onUpdateReady();
      hadController = true;
    });
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        info.registered = true;
        // Browsers check for a new sw.js on navigation; a phone that comes back online
        // or back to the app should check too, so a new build is offered the same day.
        const check = () => reg.update().catch(() => {});
        window.addEventListener('online', check);
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check();
        });
      })
      .catch((e) => console.warn('service worker not registered', e));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    info.installPrompt = e;
    onInstallable();
  });
  window.addEventListener('appinstalled', () => {
    info.installPrompt = null;
    info.standalone = true;
    onInstallable();
  });
  return info;
}

export async function promptInstall(info) {
  const p = info && info.installPrompt;
  if (!p) return null;
  info.installPrompt = null;
  p.prompt();
  const choice = await p.userChoice;
  return choice ? choice.outcome : null;
}
