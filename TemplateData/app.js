(() => {
  "use strict";
  const canvas = document.getElementById("unity-canvas");
  const loading = document.getElementById("loading");
  const progress = document.getElementById("progress");
  const label = document.getElementById("loading-label");
  const errorPanel = document.getElementById("error");
  const build = window.BubbleTappleBuild;

  function resizeViewport() {
    // visualViewport also follows Safari's expanding/collapsing browser bars.
    const height = window.visualViewport?.height || window.innerHeight;
    document.documentElement.style.setProperty("--viewport-height", `${height}px`);
  }
  resizeViewport();
  window.addEventListener("resize", resizeViewport);
  window.addEventListener("orientationchange", resizeViewport);
  window.visualViewport?.addEventListener("resize", resizeViewport);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) resizeViewport();
  });

  let failed = false;
  function showError(details) {
    failed = true;
    loading.hidden = true;
    errorPanel.hidden = false;
    document.getElementById("error-message").textContent = navigator.onLine
      ? "Обновите страницу. Если ошибка повторится, попробуйте другой браузер."
      : "Для первой загрузки нужен интернет. Подключитесь к сети и попробуйте снова.";
    console.error("BubbleTapple:", details);
  }
  document.getElementById("retry").addEventListener("click", () => location.reload());

  build.config.matchWebGLToCanvasSize = true;
  // Keep high-density phone displays sharp without rendering at excessive DPR.
  build.config.devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  build.config.showBanner = (message, type) => {
    if (type === "error") showError(message);
    else console.warn(message);
  };

  async function enableOffline() {
    if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
    const firstInstall = !navigator.serviceWorker.controller;
    try {
      await navigator.serviceWorker.register("ServiceWorker.js", { updateViaCache: "none" });
      await navigator.serviceWorker.ready;
      if (firstInstall && !failed) {
        const status = document.getElementById("offline-status");
        status.hidden = false;
        setTimeout(() => { status.hidden = true; }, 5000);
      }
    } catch (error) {
      // Online gameplay remains available if storage is full or SW is blocked.
      console.warn("Offline cache is unavailable:", error);
    }
  }

  const loader = document.createElement("script");
  loader.src = build.loaderUrl;
  loader.onerror = () => showError("Could not load Unity loader.");
  loader.onload = async () => {
    try {
      await createUnityInstance(canvas, build.config, value => {
        progress.value = value;
        label.textContent = `Загружаем игру… ${Math.round(value * 100)}%`;
      });
      if (failed) return;
      loading.hidden = true;
      resizeViewport();
      // Cache only after startup, so caching does not compete with loading.
      void enableOffline();
    } catch (error) {
      showError(error);
    }
  };
  document.body.appendChild(loader);
})();
