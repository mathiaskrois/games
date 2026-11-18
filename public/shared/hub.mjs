import { $, games, tr, localized, read, bindLanguage, offline } from "./site.mjs";

const art = {
  ord: '<div class="art-ord"><b>O</b><b>R</b><b>D</b></div><span class="card-spark">✦</span>',
  "2048": '<div class="art-merge"><b>2</b><b>4</b><b>8</b><b>16</b></div><span class="card-spark">✦</span>',
  sudoku: '<div class="art-sudoku"><b>2</b><b></b><b>6</b><b></b><b>5</b><b></b><b>4</b><b></b><b>1</b></div><span class="card-spark">✦</span>',
  snake: '<div class="art-snake"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><span class="card-spark">✦</span>',
};
function resume(id) {
  if (id === "ord") {
    const ord = read("krois-ord-v1");
    return ["en", "da"].some(lang => {
      const state = ord?.[lang];
      return state?.guesses?.length < 6 && !state.guesses.includes(state.answer) && Boolean(state.entry || state.guesses.length);
    });
  }
  const session = read("krois-games-" + id + "-v1")?.session;
  if (!session) return false;
  if (id === "sudoku") return !session.done && (session.grid.some((n, i) => n !== session.clues[i]) || session.notes.some(Boolean));
  if (id === "snake") return ["running", "paused"].includes(session.status);
  return session.moves > 0;
}

function record(id) {
  if (id === "ord") {
    const saved = read("krois-ord-v1");
    const wins = (Number(saved?.en?.stats?.won) || 0) + (Number(saved?.da?.stats?.won) || 0);
    return wins > 0 ? tr(wins + (wins === 1 ? " word solved" : " words solved"), wins + " løste ord") : "";
  }
  const saved = read("krois-games-" + id + "-v1");
  if (id === "sudoku") {
    const solved = Number(saved?.record?.completed) || 0;
    return solved > 0 ? tr(solved + " solved", solved + " løst") : "";
  }
  return saved?.best > 0 ? tr("Best ", "Rekord ") + new Intl.NumberFormat(document.documentElement.lang).format(saved.best) : "";
}

function render() {
  $("hub-title").innerHTML = tr("Play a<br><em>little.</em>", "Spil<br><em>lidt.</em>");
  $("hub-intro").textContent = tr("Wordplay, number puzzles, and a round of Snake. Pick a game and play at your own pace.", "Ordspil, talgåder og en runde Snake. Vælg et spil, og spil i dit eget tempo.");
  $("pick").textContent = tr("Pick a game", "Vælg et spil");
  $("catalog").innerHTML = games.map(game => {
    const label = resume(game.id) ? tr("Resume", "Fortsæt") : tr("Play", "Spil");
    return '<a class="game-card" data-game="' + game.id + '" href="' + game.id + '/"><div class="card-art" aria-hidden="true">' + art[game.id]
      + '</div><div class="card-copy"><div class="card-meta"><p class="category">' + localized(game.type) + '</p><span>' + record(game.id) + '</span></div><h3>' + game.title + '</h3><p>'
      + localized(game.description) + '</p><span class="card-action">' + label + ' <span aria-hidden="true">↗</span></span></div></a>';
  }).join("");
}
bindLanguage(render);
render();
window.addEventListener("pageshow", render);
offline();
