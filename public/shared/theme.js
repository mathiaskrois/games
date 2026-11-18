// Apply the preference before styles paint, including standalone launches.
(() => {
  const key = "krois-games-theme-v1";
  function apply(theme) {
    const light = theme === "light";
    document.documentElement.dataset.theme = light ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]').content = light ? "#f1f2ed" : "#0c1014";
    const toggle = document.getElementById("theme-toggle");
    if (toggle) toggle.setAttribute("aria-checked", String(!light));
  }
  let saved;
  try { saved = localStorage.getItem(key); } catch { /* Use the default palette. */ }
  apply(saved);
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("theme-toggle");
    apply(document.documentElement.dataset.theme);
    toggle.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(key, next); } catch { /* Keep the current page preference. */ }
    });
  });
  window.addEventListener("storage", event => {
    if (event.key === key || event.key === null) apply(event.newValue);
  });
  window.addEventListener("pageshow", event => {
    if (event.persisted) {
      try { apply(localStorage.getItem(key)); } catch { /* Keep the current palette. */ }
    }
  });
})();
