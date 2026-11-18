import { language, setLanguage, syncLanguage, offline, celebrate } from "../shared/site.mjs";
import { answers, scoreGuess, chooseAnswer } from "./engine.mjs";

const $ = id => document.getElementById(id);
const storageKey = "krois-ord-v1";
const copy = {
  en: { subtitle: "Five letters. Six chances. A fresh start anytime.", eyebrow: "A LITTLE WORD RITUAL", edition: "THE WORD EDITION", mode: "UNLIMITED PLAY", guess: n => `GUESS ${n} OF 6`, correct: "Right spot", present: "Wrong spot", absent: "Not in word", footer: "A small pause. A good word.", short: "A little longer — five letters, please.", invalid: "That word isn’t in the dictionary.", repeat: "You’ve already tried that word.", loading: "Getting your words ready…", error: "Couldn’t load the words. Tap to retry.", help: "How to play", instructions: "Find the five-letter word in six guesses. Type on your keyboard or tap the letters below. Every guess must be a real word.", explanations: "<p><strong>Green</strong> — the right letter in the right spot.<br><strong>Gold</strong> — the right letter in another spot.<br><strong>Grey</strong> — that letter isn’t in the word.</p><p>Repeated letters are counted individually. Play as often as you like. Each language keeps its own game and statistics.</p>", ready: "Let’s play", win: "Beautifully done.", lose: "A word for next time.", finished: n => `You found it in ${n} ${n === 1 ? "guess" : "guesses"}.`, lost: "Six chances, one tricky word. The answer was:", again: "Play another?", play: "Yes, a new word →", back: "Back to my board", stats: "Your word story", statsNote: "Saved on this device · English", played: "Played", wins: "Win %", streak: "Streak", best: "Best", distribution: "GUESS DISTRIBUTION", noStats: "Your next word is the start of a good story.", result: "View result →", shared: "Result copied!", share: "Copy result", shareFail: "Copy isn’t available in this browser.", closed: "Your game is complete. View your result to play again.", privacy: "A personal game by Krois. Inspired by Wordle; independent of The New York Times." },
  da: { subtitle: "Fem bogstaver. Seks forsøg. En ny start, når du vil.", eyebrow: "ET LILLE ORDRITUAL", edition: "DAGENS LILLE ORDPAUSE", mode: "SPIL SÅ TIT DU VIL", guess: n => `FORSØG ${n} AF 6`, correct: "Rigtig plads", present: "Forkert plads", absent: "Ikke i ordet", footer: "En lille pause. Et godt ord.", short: "Lidt længere — fem bogstaver, tak.", invalid: "Ordet findes ikke i ordbogen.", repeat: "Det ord har du allerede prøvet.", loading: "Vi finder ordene frem…", error: "Ordene kunne ikke hentes. Tryk for at prøve igen.", help: "Sådan spiller du", instructions: "Find ordet på fem bogstaver på seks forsøg. Brug dit tastatur, eller tryk på bogstaverne nedenfor. Hvert gæt skal være et rigtigt ord.", explanations: "<p><strong>Grøn</strong> — rigtigt bogstav på den rigtige plads.<br><strong>Guld</strong> — rigtigt bogstav på en anden plads.<br><strong>Grå</strong> — bogstavet er ikke med i ordet.</p><p>Gentagne bogstaver tælles hver for sig. Spil så ofte du vil. Hvert sprog har sit eget spil og sin egen statistik.</p>", ready: "Lad os spille", win: "Smukt klaret.", lose: "Et ord til næste gang.", finished: n => `Du fandt ordet på ${n} forsøg.`, lost: "Seks forsøg og et drilsk ord. Svaret var:", again: "Vil du spille igen?", play: "Ja, et nyt ord →", back: "Tilbage til mit spil", stats: "Din ordhistorie", statsNote: "Gemt på denne enhed · Dansk", played: "Spillet", wins: "Vundet %", streak: "Stime", best: "Bedste", distribution: "FORDELING AF FORSØG", noStats: "Dit næste ord er starten på en god historie.", result: "Se resultat →", shared: "Resultatet er kopieret!", share: "Kopiér resultat", shareFail: "Denne browser kan ikke kopiere resultatet.", closed: "Spillet er slut. Se resultatet for at spille igen.", privacy: "Et personligt spil fra Krois. Inspireret af Wordle; uafhængigt af The New York Times." },
};
let saved;
try { saved = JSON.parse(localStorage.getItem(storageKey) || "null"); } catch { /* Storage is optional. */ }
let lang = language;
let data = { en: {}, da: {} };
// Restore only structurally valid records; corrupt browser storage starts fresh.
for (const language of ["en", "da"]) {
  const record = saved?.[language];
  if (!record || typeof record !== "object") continue;
  const pattern = language === "en" ? /^[A-Z]{5}$/ : /^[A-ZÆØÅ]{5}$/;
  if (pattern.test(record.answer) && Array.isArray(record.guesses) && record.guesses.length <= 6 && record.guesses.every(w => typeof w === "string" && pattern.test(w))) {
    data[language] = { answer: record.answer, guesses: record.guesses, entry: typeof record.entry === "string" && /^[A-ZÆØÅ]{0,5}$/.test(record.entry) ? record.entry : "" };
  }
  const stats = record.stats;
  if (Array.isArray(stats?.distribution) && [stats.played, stats.won, stats.streak, stats.best, ...(stats.distribution || [])].every(n => Number.isSafeInteger(n) && n >= 0) && stats.distribution?.length === 6) data[language].stats = stats;
}
let dictionaries = {}, pools = {}, busy = false, loading = false, generation = 0;
const t = () => copy[lang];
const state = () => data[lang];
const isWon = () => state().guesses?.includes(state().answer);
const isOver = () => isWon() || state().guesses?.length === 6;
function persist() { try { localStorage.setItem(storageKey, JSON.stringify({ ...data, lang })); } catch { /* Play still works with storage disabled. */ } }
function stats() { return state().stats ||= { played: 0, won: 0, streak: 0, best: 0, distribution: [0, 0, 0, 0, 0, 0] }; }
function message(text) { $("message").textContent = text; }
function newGame() {
  const previous = state().answer;
  Object.assign(state(), { answer: chooseAnswer(pools[lang], previous), guesses: [], entry: "" });
  persist(); render();
}
function localize() {
  syncLanguage();
  document.title = `Ord · ${lang === "da" ? "Et lille ordritual" : "A little word ritual"}`;
  for (const [id, key] of Object.entries({ subtitle: "subtitle", eyebrow: "eyebrow", "mode-label": "mode", "legend-correct": "correct", "legend-present": "present", "legend-absent": "absent", result: "result" })) $(id).textContent = t()[key];
  $("close").setAttribute("aria-label", lang === "da" ? "Luk dialog" : "Close dialog");
  $("help").setAttribute("aria-label", t().help); $("stats").setAttribute("aria-label", t().stats);
  document.querySelectorAll("[data-lang]").forEach(button => { button.setAttribute("aria-pressed", String(button.dataset.lang === lang)); button.disabled = busy; });
}
function render() {
  localize();
  const s = state();
  $("board").replaceChildren();
  const statuses = {};
  const ranks = { absent: 1, present: 2, correct: 3 };
  for (let row = 0; row < 6; row++) {
    const word = s.guesses?.[row] || (row === s.guesses?.length ? s.entry : "") || "";
    const scored = s.guesses?.[row] ? scoreGuess(word, s.answer) : null;
    for (let col = 0; col < 5; col++) {
      const tile = document.createElement("div");
      tile.className = `tile ${scored ? scored[col] : word[col] ? "filled" : ""}`;
      tile.textContent = word[col] || "";
      tile.style.setProperty("--i", col);
      const meaning = scored ? t()[scored[col]] : "";
      tile.setAttribute("aria-label", `${row + 1}, ${col + 1}: ${word[col] || "—"} ${meaning}`);
      $("board").append(tile);
      if (scored && (!statuses[word[col]] || ranks[scored[col]] > ranks[statuses[word[col]]])) statuses[word[col]] = scored[col];
    }
  }
  $("attempt-label").textContent = t().guess(Math.min((s.guesses?.length || 0) + 1, 6));
  $("keyboard").replaceChildren();
  const rows = lang === "da" ? ["QWERTYUIOPÅ", "ASDFGHJKLÆØ", "ZXCVBNM"] : ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
  rows.forEach((letters, index) => {
    const row = document.createElement("div"); row.className = "key-row";
    const keys = index === 2 ? ["Enter", ...letters, "Backspace"] : [...letters];
    for (const key of keys) {
      const button = document.createElement("button");
      button.className = `key ${key.length > 1 ? "wide" : ""} ${statuses[key] || ""}`;
      button.textContent = key === "Backspace" ? "⌫" : key === "Enter" ? lang === "da" ? "GÆT" : "ENTER" : key;
      button.setAttribute("aria-label", key === "Backspace" ? lang === "da" ? "Slet" : "Delete" : key);
      button.disabled = busy || loading || !!isOver();
      button.addEventListener("click", () => input(key)); row.append(button);
    }
    $("keyboard").append(row);
  });
  $("result").hidden = !isOver();
  message(isOver() ? t().closed : loading ? t().loading : "");
}
async function loadLanguage(language) {
  if (busy) return;
  setLanguage(language);
  lang = language; const token = ++generation;
  loading = true; render(); persist();
  try {
    if (!dictionaries[lang]) {
      const response = await fetch(lang === "en" ? "./english.txt" : "./danish.txt");
      if (!response.ok) throw new Error("Dictionary unavailable");
      const words = (await response.text()).normalize("NFC").toUpperCase().split(/\s+/).filter(w => /^[A-ZÆØÅ]{5}$/.test(w));
      dictionaries[language] = new Set(words);
      pools[language] = [...new Set(answers[language])].filter(w => dictionaries[language].has(w));
      if (pools[language].length < 20) throw new Error("Dictionary incomplete");
    }
    if (token !== generation) return;
    loading = false;
    if (!state().answer || !dictionaries[lang].has(state().answer)) newGame(); else render();
  } catch {
    if (token !== generation) return;
    loading = true; render(); message(t().error);
  }
}
function reject(text) {
  message(text); $("board").classList.remove("shake");
  void $("board").offsetWidth; $("board").classList.add("shake");
}
async function input(key) {
  if (busy || loading || isOver() || $("dialog").open) return;
  const s = state();
  if (key === "Backspace") s.entry = s.entry.slice(0, -1);
  else if (key === "Enter") {
    if (s.entry.length !== 5) return reject(t().short);
    if (!dictionaries[lang].has(s.entry)) return reject(t().invalid);
    if (s.guesses.includes(s.entry)) return reject(t().repeat);
    s.guesses.push(s.entry); s.entry = "";
    busy = true;
    if (isOver()) {
      const record = stats(); record.played++;
      if (isWon()) { record.won++; record.streak++; record.best = Math.max(record.best, record.streak); record.distribution[s.guesses.length - 1]++; }
      else record.streak = 0;
    }
    persist(); render();
    const tiles = [...$("board").children].slice((s.guesses.length - 1) * 5, s.guesses.length * 5);
    tiles.forEach(tile => tile.classList.add("reveal"));
    await new Promise(resolve => setTimeout(resolve, 1100));
    if (isWon()) {
      tiles.forEach(tile => { tile.classList.remove("reveal"); tile.classList.add("dance"); }); celebrate();
      await new Promise(resolve => setTimeout(resolve, 900));
    }
    busy = false; render();
    if (isOver()) showResult();
    return;
  } else {
    key = key.normalize("NFC").toUpperCase();
    if (!(lang === "da" ? /^[A-ZÆØÅ]$/ : /^[A-Z]$/).test(key) || s.entry.length >= 5) return;
    s.entry += key;
  }
  persist(); render();
}
function showDialog(html) {
  $("dialog-content").innerHTML = html;
  if (!$("dialog").open) $("dialog").showModal();
}
function showResult() {
  const won = isWon();
  showDialog(`<p class="eyebrow">${won ? "✦ ORD ✦" : "ORD"}</p><h2 id="dialog-title">${won ? t().win : t().lose}</h2><p>${won ? t().finished(state().guesses.length) : t().lost}</p><div class="answer">${state().answer}</div><p>${t().again}</p><button class="primary" id="again">${t().play}</button><button class="secondary" id="share">${t().share}</button>`);
  $("again").onclick = () => { $("dialog").close(); newGame(); };
  $("share").onclick = async () => {
    const symbols = { correct: "🟩", present: "🟨", absent: "⬛" };
    const grid = state().guesses.map(word => scoreGuess(word, state().answer).map(c => symbols[c]).join("")).join("\n");
    try { await navigator.clipboard.writeText(`Ord · ${lang === "da" ? "Dansk" : "English"} · ${won ? state().guesses.length : "X"}/6\n\n${grid}`); $("share").textContent = t().shared; }
    catch { $("share").textContent = t().shareFail; }
  };
}
$("help").onclick = () => {
  showDialog(`<p class="eyebrow">FIVE LETTERS. / FEM BOGSTAVER.</p><h2 id="dialog-title">${t().help}</h2><p>${t().instructions}</p><div class="example" aria-hidden="true"><div class="tile correct">O</div><div class="tile present">R</div><div class="tile absent">D</div><div class="tile">E</div><div class="tile">T</div></div><div class="help-copy">${t().explanations}</div><button class="primary" id="ready">${t().ready}</button><p style="font-size:10px">${t().privacy}</p>`);
  $("ready").onclick = () => $("dialog").close();
};
$("stats").onclick = () => {
  const s = stats();
  const values = [[s.played, t().played], [s.played ? Math.round(s.won / s.played * 100) : 0, t().wins], [s.streak, t().streak], [s.best, t().best]];
  const max = Math.max(...s.distribution, 1);
  showDialog(`<p class="eyebrow">${t().statsNote}</p><h2 id="dialog-title">${t().stats}</h2><div class="stats-grid">${values.map(([value, label]) => `<div><strong>${value}</strong><span>${label}</span></div>`).join("")}</div><p class="eyebrow">${t().distribution}</p>${s.distribution.map((count, i) => `<div class="distribution"><span>${i + 1}</span><div class="bar" style="width:${Math.max(8, count / max * 90)}%">${count}</div></div>`).join("")}${s.played ? "" : `<p>${t().noStats}</p>`}<button class="primary" id="back">${t().back}</button>`);
  $("back").onclick = () => $("dialog").close();
};
$("close").onclick = () => $("dialog").close();
$("dialog").addEventListener("click", event => { if (event.target === $("dialog")) { const r = $("dialog").getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) $("dialog").close(); } });
$("result").onclick = showResult;
$("message").onclick = () => { if (loading) loadLanguage(lang); };
document.querySelectorAll("[data-lang]").forEach(button => button.onclick = () => loadLanguage(button.dataset.lang));
document.addEventListener("keydown", event => {
  if (event.ctrlKey || event.metaKey || event.altKey || $("dialog").open || event.target instanceof HTMLButtonElement && (event.key === "Enter" || event.key === " ")) return;
  if (event.key === "Enter" || event.key === "Backspace" || /^[a-zæøå]$/i.test(event.key)) {
    event.preventDefault();
    $("board").focus({ preventScroll: true });
    input(event.key);
  }
});
offline();
loadLanguage(lang);
