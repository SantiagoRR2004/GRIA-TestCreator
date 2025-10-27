(function () {
  // Retro UI: this script is loaded when Retro.css is active
  const ASSET_BASE = "./styles/Retro";

  const audioBank = Object.create(null);
  const audioSources = {
    toggle: `${ASSET_BASE}/toggle.wav`,
    success: `${ASSET_BASE}/success.wav`,
    fail: `${ASSET_BASE}/fail.wav`,
  };

  const overlayState = {
    element: null,
    hideTimer: null,
    isFail: false,
  };

  const ambientState = {
    badge: null,
    rings: null,
  };

  function ensureAmbientElements() {
    if (!ambientState.rings) {
      const rings = document.createElement("div");
      rings.className = "retro-neon-rings";
      document.body.appendChild(rings);
      ambientState.rings = rings;
    }
    if (!ambientState.badge) {
      const badge = document.createElement("div");
      badge.className = "retro-badge";
      document.body.appendChild(badge);
      ambientState.badge = badge;
    }
  }

  function enableRetroEffects() {
    document.body.classList.remove("retro-mode", "retro-fail-anim");
    ensureAmbientElements();
    document.body.classList.add("retro-mode");
  }

  function preloadAudio() {
    Object.entries(audioSources).forEach(([key, src]) => {
      try {
        const audio = new Audio(src);
        audio.preload = "auto";
        audioBank[key] = audio;
      } catch (error) {
        console.warn(`RetroUI audio preload failed for ${key}:`, error);
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
      console.warn(`RetroUI audio playback failed for ${name}:`, error);
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
    }
    if (overlayState.isFail) {
      document.body.classList.remove("retro-fail-anim");
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
        document.body.classList.remove("retro-fail-anim");
        overlayState.isFail = false;
      }
    };
    element.addEventListener("transitionend", removeAfterTransition);
  }

  function buildOverlayContent({ passed, total, correct }) {
    const wrapper = document.createElement("div");
    wrapper.className = "retro-overlay";

    const isSuccess = Boolean(passed);
    wrapper.classList.add(isSuccess ? "retro-overlay--success" : "retro-overlay--fail");

    const panel = document.createElement("div");
    panel.className = "retro-overlay__panel";

    const title = document.createElement("div");
    title.className = "retro-overlay__title";
    title.textContent = isSuccess ? "LEVEL CLEARED!" : "GAME OVER";

    const subtitle = document.createElement("div");
    subtitle.className = "retro-overlay__subtitle";
    subtitle.textContent = isSuccess ? "NEON BONUS UNLOCKED" : "INSERT COIN TO CONTINUE";

    const details = document.createElement("div");
    details.className = "retro-overlay__details";
    if (Number.isFinite(correct) && Number.isFinite(total)) {
      details.textContent = `ACERTOS: ${correct} / ${total}`;
    } else if (Number.isFinite(total)) {
      details.textContent = `PREGUNTAS: ${total}`;
    } else {
      details.textContent = isSuccess ? "¡SIGUE CON ESA RACHA!" : "¡NO TE RINDAS, PLAYER!";
    }

    panel.appendChild(title);
    panel.appendChild(subtitle);
    panel.appendChild(details);
    wrapper.appendChild(panel);

    return { wrapper, isSuccess };
  }

  function showResultOverlay(result) {
    // Show overlay (only runs when this script is loaded = Retro.css is active)
    removeOverlay();
    const data = result || {};
    const passed = Boolean(data.passed);
    const totalValue = Number(data.total);
    const correctValue = Number(data.correct);
    const total = Number.isFinite(totalValue) ? totalValue : null;
    const correct = Number.isFinite(correctValue) ? correctValue : null;

    const { wrapper, isSuccess } = buildOverlayContent({
      passed,
      total,
      correct,
    });

    document.body.appendChild(wrapper);
    overlayState.element = wrapper;
    overlayState.isFail = !isSuccess;
    if (overlayState.isFail) {
      document.body.classList.add("retro-fail-anim");
    }

    requestAnimationFrame(() => {
      wrapper.classList.add("is-visible");
    });

    overlayState.hideTimer = setTimeout(() => {
      fadeOutOverlay();
    }, 3600);

    playAudio(isSuccess ? "success" : "fail");
  }

  function init() {
    preloadAudio();
    enableRetroEffects();
  }

  function cleanup() {
    // Remove retro-mode effects
    document.body.classList.remove("retro-mode", "retro-fail-anim");
    
    // Remove any dynamically added elements
    if (ambientState.badge) {
      ambientState.badge.remove();
      ambientState.badge = null;
    }
    if (ambientState.rings) {
      ambientState.rings.remove();
      ambientState.rings = null;
    }
    
    // Remove any active overlays
    removeOverlay();
    
    // Clear audio references
    Object.keys(audioBank).forEach(key => {
      delete audioBank[key];
    });
    
    console.log("Retro style cleaned up");
  }

  if (!window.RetroUI) {
    window.RetroUI = {};
  }
  window.RetroUI.showResultOverlay = showResultOverlay;
  
  // Expose standard cleanup function for styles.js to call
  window.styleCleanup = cleanup;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
