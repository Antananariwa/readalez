// Registers the service worker that vite-plugin-pwa builds (ADR 0006), so the
// app reloads without a network after the first visit. Production builds only:
// the dev server has no worker. When a new version applies: SPEC.md feature 12.
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Service worker registration failed", error);
    });
  });
}
