// Tiny "browser in a browser" with history + basic controls

(() => {
  const HOME_URL = "https://www.google.com";
  const MAX_HISTORY = 20;

  const elements = {
    form: document.getElementById("browserForm"),
    urlInput: document.getElementById("urlInput"),
    frame: document.getElementById("browserFrame"),
    backBtn: document.getElementById("backBtn"),
    forwardBtn: document.getElementById("forwardBtn"),
    homeBtn: document.getElementById("homeBtn"),
    reloadBtn: document.getElementById("reloadBtn"),
    statusText: document.getElementById("statusText"),
    historyList: document.getElementById("historyList"),
    clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  };

  const state = {
    history: [],
    currentIndex: -1,
  };

  function normalizeUrl(raw) {
    if (!raw) return null;
    const trimmed = raw.trim();

    if (!trimmed) return null;

    // If it already looks like a URL with protocol, keep it
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // Simple heuristic: if it has spaces, it's probably not a valid URL
    if (/\s/.test(trimmed)) {
      return null;
    }

    return "https://" + trimmed;
  }

  function setStatus(message) {
    if (elements.statusText) {
      elements.statusText.textContent = message;
    }
  }

  function updateNavButtons() {
    const { currentIndex, history } = state;
    elements.backBtn.disabled = currentIndex <= 0;
    elements.forwardBtn.disabled =
      currentIndex < 0 || currentIndex >= history.length - 1;
  }

  function updateHistoryUI() {
    const { history } = state;
    const list = elements.historyList;
    if (!list) return;

    list.innerHTML = "";

    // Show newest first
    const items = [...history].map((url, index) => ({
      url,
      index,
    })).reverse();

    for (const item of items) {
      const li = document.createElement("li");
      li.className = "history-item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "history-link";
      btn.dataset.url = item.url;

      const urlSpan = document.createElement("span");
      urlSpan.className = "history-url";
      urlSpan.textContent = item.url;

      const domainSpan = document.createElement("span");
      domainSpan.className = "history-domain";

      try {
        const u = new URL(item.url);
        domainSpan.textContent = u.hostname;
      } catch {
        domainSpan.textContent = "";
      }

      btn.appendChild(urlSpan);
      if (domainSpan.textContent) {
        btn.appendChild(domainSpan);
      }

      btn.addEventListener("click", () => {
        navigateTo(item.url, { pushHistory: true });
      });

      li.appendChild(btn);
      list.appendChild(li);
    }
  }

  function pushToHistory(url) {
    const { history, currentIndex } = state;

    // If we navigated after going back, drop forward entries
    if (currentIndex < history.length - 1 && currentIndex >= 0) {
      history.splice(currentIndex + 1);
    }

    // Don't duplicate if it's the same as the current one
    if (history[history.length - 1] === url) {
      state.currentIndex = history.length - 1;
      updateNavButtons();
      updateHistoryUI();
      return;
    }

    history.push(url);

    // Cap history length
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    state.currentIndex = history.length - 1;
    updateNavButtons();
    updateHistoryUI();
  }

  function navigateTo(rawUrlOrNull, options = {}) {
    const { pushHistory = true } = options;
    const raw = rawUrlOrNull ?? elements.urlInput.value;
    const url = normalizeUrl(raw);

    if (!url) {
      setStatus("Please enter a valid URL (e.g. example.com).");
      return;
    }

    elements.urlInput.value = url;
    setStatus("Loading…");

    try {
      elements.frame.src = url;
    } catch {
      setStatus("Could not load that URL.");
    }

    if (pushHistory) {
      pushToHistory(url);
    }
  }

  function goBack() {
    if (state.currentIndex <= 0) return;
    state.currentIndex -= 1;
    const url = state.history[state.currentIndex];
    if (!url) return;

    elements.urlInput.value = url;
    setStatus("Loading…");
    elements.frame.src = url;
    updateNavButtons();
  }

  function goForward() {
    if (state.currentIndex >= state.history.length - 1) return;
    state.currentIndex += 1;
    const url = state.history[state.currentIndex];
    if (!url) return;

    elements.urlInput.value = url;
    setStatus("Loading…");
    elements.frame.src = url;
    updateNavButtons();
  }

  function reload() {
    const currentUrl =
      state.history[state.currentIndex] || normalizeUrl(elements.urlInput.value);
    if (!currentUrl) return;

    setStatus("Reloading…");
    elements.frame.src = currentUrl;
  }

  function clearHistory() {
    state.history = [];
    state.currentIndex = -1;
    updateNavButtons();
    updateHistoryUI();
    setStatus("History cleared.");
  }

  function setupEvents() {
    elements.form.addEventListener("submit", (event) => {
      event.preventDefault();
      navigateTo(null, { pushHistory: true });
    });

    elements.backBtn.addEventListener("click", goBack);
    elements.forwardBtn.addEventListener("click", goForward);
    elements.homeBtn.addEventListener("click", () => {
      navigateTo(HOME_URL, { pushHistory: true });
    });
    elements.reloadBtn.addEventListener("click", reload);

    elements.clearHistoryBtn.addEventListener("click", clearHistory);

    // Update status when iframe loads (for sites that allow embedding)
    elements.frame.addEventListener("load", () => {
      setStatus("Loaded.");
    });
  }

  function init() {
    setupEvents();
    // Initial home page
    navigateTo(HOME_URL, { pushHistory: true });
  }

  // DOM is already parsed by the time this file runs (script at end of body),
  // but just to be safe:
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
