window.addEventListener("beforeinstallprompt", function (e) {
  e.preventDefault();
  window.__pwaPrompt = e;
});
