// Full-page navigation helper. Isolated in its own module so components can
// navigate to a route (a fresh document load, served by the SPA fallback +
// service worker) while tests mock this instead of jsdom's read-only
// window.location.
export const navigateTo = (path) => {
  window.location.assign(path)
}
