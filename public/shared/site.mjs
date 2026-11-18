export const games = [
  { id: "ord", title: "Ord", type: ["Word puzzle", "Ordspil"], description: ["Five letters, six guesses. Find the word in English or Danish.", "Fem bogstaver, seks forsøg. Find ordet på dansk eller engelsk."] },
  { id: "2048", title: "2048", type: ["Tile puzzle", "Brikspil"], description: ["Slide and merge matching tiles to reach 2048.", "Skub og slå ens brikker sammen for at nå 2048."] },
  { id: "sudoku", title: "Mini Sudoku", type: ["Logic puzzle", "Logikspil"], description: ["Six numbers, six rows. A small grid with a satisfying solve.", "Seks tal, seks rækker. En lille sudoku med plads til fordybelse."] },
  { id: "snake", title: "Snake", type: ["Arcade", "Arkade"], description: ["Follow the food and keep your tail out of the way.", "Følg maden, og hold halen af vejen."] },
];

export const $ = id => document.getElementById(id);
export function read(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
export function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may disable storage. */ }
}

export let language = (read("krois-games-language-v1") ?? read("krois-ord-v1")?.lang) === "da" ? "da" : "en";
export const tr = (en, da) => language === "da" ? da : en;
export const localized = pair => tr(...pair);
export function setLanguage(value) {
  language = value === "da" ? "da" : "en";
  write("krois-games-language-v1", language);
  syncLanguage();
}
export function syncLanguage() {
  document.documentElement.lang = language;
  document.querySelectorAll("[data-lang]").forEach(button =>
    button.setAttribute("aria-pressed", String(button.dataset.lang === language)));
  const all = $("all-games");
  if (all) all.textContent = tr("← All games", "← Alle spil");
  const selector = document.querySelector(".language");
  if (selector) selector.setAttribute("aria-label", tr("Language", "Sprog"));
  const footer = $("local-note");
  if (footer) footer.textContent = tr("Progress stays on this device", "Dine spil gemmes på denne enhed");
}
export function bindLanguage(update) {
  syncLanguage();
  for (const button of document.querySelectorAll("[data-lang]")) {
    button.onclick = () => { setLanguage(button.dataset.lang); update(); };
  }
}

export function offline() {
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/games/sw.js", { scope: "/games/" }).catch(() => {});
}

const timers = new WeakMap();
export function celebrate(layer = $("confetti")) {
  if (!layer || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  clearTimeout(timers.get(layer));
  layer.replaceChildren();
  for (let i = 0; i < 38; i++) {
    const piece = document.createElement("i");
    piece.style.setProperty("--x", Math.random() * 100 + "%");
    piece.style.setProperty("--delay", Math.random() * 0.5 + "s");
    piece.style.setProperty("--drift", Math.random() * 180 - 90 + "px");
    piece.style.background = ["#397450", "#ffad54", "#bdabed", "#639cf0"][i % 4];
    layer.append(piece);
  }
  timers.set(layer, setTimeout(() => layer.replaceChildren(), 3400));
}

export function modal(title, content, actions = []) {
  const dialog = $("dialog");
  $("dialog-content").innerHTML = '<h2 id="dialog-title"></h2>' + content;
  $("dialog-title").textContent = title;
  $("close").setAttribute("aria-label", tr("Close dialog", "Luk dialog"));
  $("close").onclick = () => dialog.close();
  for (const [label, fn] of actions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary";
    button.textContent = label;
    button.onclick = () => { dialog.close(); fn?.(); };
    $("dialog-content").append(button);
  }
  if (!dialog.open) dialog.showModal();
}

export function swipes(element, send) {
  let start;
  element.addEventListener("pointerdown", event => {
    start = [event.clientX, event.clientY];
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener("pointercancel", () => { start = null; });
  element.addEventListener("pointerup", event => {
    if (!start) return;
    const dx = event.clientX - start[0], dy = event.clientY - start[1];
    start = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    send(Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "down" : "up");
  });
}
