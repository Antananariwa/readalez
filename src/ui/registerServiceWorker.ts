// Registers the service worker that vite-plugin-pwa builds (ADR 0006), so the
// app reloads without a network after the first visit. Production builds only:
// the dev server has no worker. When a new version applies: SPEC.md feature 12.

let settle: (registration: ServiceWorkerRegistration | null) => void;
const registered = new Promise<ServiceWorkerRegistration | null>((resolve) => {
  settle = resolve;
});

/**
 * The page's service worker registration once `register()` has succeeded,
 * or null if it failed or there's no worker to register. Pending until the
 * page has loaded.
 */
export function serviceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  return registered;
}

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    settle(null);
    return;
  }
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(settle, (error: unknown) => {
        console.error("Service worker registration failed", error);
        settle(null);
      });
  });
}
