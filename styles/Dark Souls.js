(function () {
  // Dark Souls UI: this script is loaded when Dark Souls.css is active
  const ASSET_BASE = "./styles/Dark Souls";

  const audioBank = Object.create(null);
  const audioSources = {
    whoosh: `${ASSET_BASE}/whoosh.wav`,
    success: `${ASSET_BASE}/success.wav`,
    fail: `${ASSET_BASE}/fail.wav`,
  };

  const overlayState = {
    element: null,
    hideTimer: null,
    isFail: false,
  };

  const ambientState = {
    emblem: null,
    embers: null,
  };

  function ensureAmbientElements() {
    if (!ambientState.emblem) {
      const emblem = document.createElement("div");
      emblem.className = "souls-emblem-fixed";
      document.body.appendChild(emblem);
      ambientState.emblem = emblem;
    }
    if (!ambientState.embers) {
      const embers = document.createElement("div");
      embers.className = "souls-embers";
      document.body.appendChild(embers);
      ambientState.embers = embers;
    }
  }

  function enableSoulsEffects() {
    document.body.classList.remove("souls-mode", "souls-fail-anim");
    ensureAmbientElements();
    document.body.classList.add("souls-mode");
  }

  function preloadAudio() {
    Object.entries(audioSources).forEach(([key, src]) => {
      try {
        const audio = new Audio(src);
        audio.preload = "auto";
        audioBank[key] = audio;
      } catch (error) {
        console.warn(`SoulsUI audio preload failed for ${key}:`, error);
      }
    });
  }

  function playAudio(name) {
    const audio = audioBank[name];
    if (!audio) {
      return;
    }
    try {
      audio.currentTime = 0;
      audio.play().catch(() => {
        /* ignore autoplay restrictions */
      });
    } catch (error) {
      console.warn(`SoulsUI audio playback failed for ${name}:`, error);
    }
  }

  function removeOverlay() {
    if (overlayState.hideTimer) {
      clearTimeout(overlayState.hideTimer);
      overlayState.hideTimer = null;
    }

    if (overlayState.element) {
      overlayState.element.remove();
      overlayState.element = null;
      if (overlayState.isFail) {
        document.body.classList.remove("souls-fail-anim");
      }
      overlayState.isFail = false;
    }
  }

  function fadeOutOverlay() {
    if (!overlayState.element) {
      return;
    }
    overlayState.element.classList.add("is-fading");
    const element = overlayState.element;
    const removeAfterTransition = () => {
      element.removeEventListener("transitionend", removeAfterTransition);
      if (overlayState.element === element) {
        overlayState.element = null;
      }
      element.remove();
      if (overlayState.isFail) {
        document.body.classList.remove("souls-fail-anim");
        overlayState.isFail = false;
      }
    };
    element.addEventListener("transitionend", removeAfterTransition);
  }

  function buildOverlayContent({ passed, total, correct }) {
    const overlay = document.createElement("div");
    overlay.className = "souls-overlay";

    const isSuccess = Boolean(passed);
    overlay.classList.add(isSuccess ? "is-success" : "is-fail");

    const panel = document.createElement("div");
    panel.className = "souls-overlay__panel";

    const emblem = document.createElement("div");
    emblem.className = "souls-overlay__emblem";

    const title = document.createElement("div");
    title.className = "souls-overlay__title";
    title.textContent = isSuccess ? "VICTORY ACHIEVED" : "YOU DIED";

    const subtitle = document.createElement("div");
    let details = null;

    if (isSuccess) {
      subtitle.className = "souls-overlay__subtitle";
      subtitle.textContent = "SOULS RETRIEVED";

      details = document.createElement("div");
      details.className = "souls-overlay__details";
      if (Number.isFinite(correct) && Number.isFinite(total)) {
        details.textContent = `ACIERTO: ${correct} / ${total}`;
      } else if (Number.isFinite(total)) {
        details.textContent = `TOTAL DE INTENTOS: ${total}`;
      } else {
        details.textContent = "QUE LA LLAMA ILUMINE TU SIGUIENTE INTENTO.";
      }
    }

    panel.appendChild(emblem);
    panel.appendChild(title);
    if (isSuccess) {
      panel.appendChild(subtitle);
      if (details) {
        panel.appendChild(details);
      }
    }
    overlay.appendChild(panel);

    return { overlay, isSuccess };
  }

  function showResultOverlay(result) {
    // Show overlay (only runs when this script is loaded = Dark Souls.css is active)
    removeOverlay();
    const data = result || {};
    const passed = Boolean(data.passed);
    const totalValue = Number(data.total);
    const correctValue = Number(data.correct);
    const total = Number.isFinite(totalValue) ? totalValue : null;
    const correct = Number.isFinite(correctValue) ? correctValue : null;

    const { overlay, isSuccess } = buildOverlayContent({
      passed,
      total,
      correct,
    });

    document.body.appendChild(overlay);
    overlayState.element = overlay;
    overlayState.isFail = !isSuccess;
    if (overlayState.isFail) {
      document.body.classList.add("souls-fail-anim");
    }

    requestAnimationFrame(() => {
      overlay.classList.add("is-visible");
    });

    overlayState.hideTimer = setTimeout(() => {
      fadeOutOverlay();
    }, 4000);

    playAudio("whoosh");
    playAudio(isSuccess ? "success" : "fail");
  }

  function init() {
    preloadAudio();
    enableSoulsEffects();
  }

  function cleanup() {
    // Remove souls-mode effects
    document.body.classList.remove("souls-mode", "souls-fail-anim");
    
    // Remove any dynamically added elements
    if (ambientState.emblem) {
      ambientState.emblem.remove();
      ambientState.emblem = null;
    }
    if (ambientState.embers) {
      ambientState.embers.remove();
      ambientState.embers = null;
    }
    
    // Remove any active overlays
    removeOverlay();
    
    // Clear audio references
    Object.keys(audioBank).forEach(key => {
      delete audioBank[key];
    });
    
    console.log("Dark Souls style cleaned up");
  }

  if (!window.SoulsUI) {
    window.SoulsUI = {};
  }
  window.SoulsUI.showResultOverlay = showResultOverlay;
  
  // Expose standard cleanup function for styles.js to call
  window.styleCleanup = cleanup;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
