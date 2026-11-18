import { $, games, tr, localized, read, write, bindLanguage, offline, modal, celebrate, swipes } from "./site.mjs";
import { slide, spawn, directions, opposite, foodCell, snakeStep, sudoku, conflicts, box } from "./rules.mjs";

const id = document.body.dataset.game;
const game = games.find(item => item.id === id);
const key = "krois-games-" + id + "-v1";
const saved = read(key) || {};
const board = $("play-board");
const controls = $("controls");
const dialog = $("dialog");
const stat = (value, label) => '<div><strong>' + value + '</strong><span>' + label + '</span></div>';
const setStats = (...values) => { $("scoreboard").innerHTML = values.map(value => stat(...value)).join(""); };
const button = (label, action, options = {}) => {
  const element = document.createElement("button");
  element.textContent = label;
  element.onclick = action;
  element.disabled = Boolean(options.disabled);
  if (options.pressed !== undefined) element.setAttribute("aria-pressed", String(options.pressed));
  if (options.name) element.setAttribute("aria-label", options.name);
  return element;
};
const scoreLabel = () => tr("Score", "Point");
const bestLabel = () => tr("Best", "Rekord");
const again = () => tr("Play again", "Spil igen");
const time = seconds => Math.floor(seconds / 60) + ":" + String(seconds % 60).padStart(2, "0");
const help = {
  "2048": () => tr("Swipe across the board or use the arrow keys or buttons. Equal tiles merge once per move. Reach 2048 to win, then keep going if you like.", "Stryg over brættet, eller brug piletasterne eller knapperne. Ens brikker smelter sammen én gang pr. træk. Nå 2048 for at vinde, og fortsæt, hvis du har lyst."),
  sudoku: () => tr("Fill each row, column, and outlined box with the numbers 1–6. Select a cell and use the number pad or keyboard. Notes keep track of candidates. Hints fill the selected square.", "Udfyld hver række, kolonne og indrammet boks med tallene 1–6. Vælg et felt, og brug tallene på skærmen eller tastaturet. Noter gemmer mulige tal. Et tip udfylder det valgte felt."),
  snake: () => tr("Swipe on the board, use the direction buttons, or steer with arrows or WASD. Eat the food and avoid the walls and your tail. Eat five to speed up. Press Space to pause.", "Stryg på brættet, brug retningsknapperne, eller styr med piletasterne eller WASD. Spis maden, og undgå væggene og din hale. Farten stiger for hver femte bid. Pause med mellemrum."),
};

function pad(action) {
  const icons = ["↑", "→", "↓", "←"];
  const names = [["Up", "Op"], ["Right", "Højre"], ["Down", "Ned"], ["Left", "Venstre"]];
  controls.classList.add("direction-pad");
  if (!controls.children.length) {
    controls.replaceChildren(...directions.map((direction, i) => button(icons[i], () => action(direction))));
  }
  Array.from(controls.children).forEach((element, i) => element.setAttribute("aria-label", localized(names[i])));
}

function arrows(action, extras = () => {}) {
  document.addEventListener("keydown", event => {
    if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
    const direction = event.key.startsWith("Arrow") ? event.key.slice(5).toLowerCase() : null;
    if (directions.includes(direction)) {
      event.preventDefault();
      action(direction);
    } else extras(event);
  });
}

function mergeGame() {
  let best = saved.best || 0;
  let state = saved.session || { board: spawn(spawn(Array(16).fill(0))), score: 0, won: false, moves: 0 };
  let undo = saved.undo || null;
  let rounds = saved.rounds || 0;
  const persist = () => write(key, { best, session: state, rounds, undo });
  const ended = () => !directions.some(direction => slide(state.board, direction).changed);
  const cells = Array.from({ length: 16 }, () => board.appendChild(document.createElement("div")));
  function render(direction) {
    board.setAttribute("aria-label", tr("2048 board", "2048-bræt"));
    state.board.forEach((value, i) => {
      const cell = cells[i];
      const changed = cell.textContent !== String(value || "");
      cell.textContent = value || "";
      cell.dataset.value = value;
      cell.toggleAttribute("data-large", value > 2048);
      cell.className = "merge-cell";
      if (changed && value) {
        cell.getAnimations?.().forEach(animation => animation.cancel());
        const offset = { up: "0, 9px", right: "-9px, 0", down: "0, -9px", left: "9px, 0" }[direction];
        if (offset && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          cell.animate?.([{ transform: "translate(" + offset + ") scale(.92)", opacity: .72 }, { transform: "none", opacity: 1 }], 155);
        }
      }
    });
    setStats([state.score, scoreLabel()], [best, bestLabel()], [state.moves, tr("Moves", "Træk")]);
    $("status").textContent = ended() ? tr("No moves left.", "Ingen træk tilbage.") : "";
    $("aux").textContent = tr("Undo", "Fortryd");
    $("aux").disabled = !undo;
    pad(move);
  }
  function reset() {
    state = { board: spawn(spawn(Array(16).fill(0))), score: 0, won: false, moves: 0 };
    undo = null;
    persist();
    render();
  }
  function move(direction) {
    if (dialog.open) return;
    const result = slide(state.board, direction);
    if (!result.changed) return;
    undo = { ...state };
    const won = !state.won && result.board.includes(2048);
    state = { board: spawn(result.board), score: state.score + result.points, moves: state.moves + 1, won: won || state.won };
    best = Math.max(best, state.score);
    const over = ended();
    if (over) rounds++;
    persist();
    render(direction);
    if (won) {
      celebrate();
      modal(tr("You made 2048!", "Du nåede 2048!"), "<p>" + tr("Your score is ", "Dine point er ") + state.score + ".</p>", over
        ? [[again(), reset]] : [[tr("Keep playing", "Fortsæt")], [tr("Start over", "Start forfra"), reset]]);
    } else if (over) modal(tr("No moves left", "Ingen træk tilbage"), "<p>" + scoreLabel() + " · " + state.score + "</p>", [[again(), reset]]);
  }
  $("aux").onclick = () => {
    if (!undo) return;
    if (ended()) rounds = Math.max(0, rounds - 1);
    state = undo;
    undo = null;
    persist();
    render();
  };
  arrows(move);
  swipes(board, move);
  return { render, reset, stats: () => [[best, bestLabel()], [rounds, tr("Finished", "Gennemført")]] };
}

function sudokuGame() {
  let record = saved.record || { completed: 0, bestTime: null };
  const fresh = () => {
    const puzzle = sudoku();
    return { ...puzzle, grid: [...puzzle.clues], notes: Array(36).fill(0), seconds: 0, hints: 0, done: false };
  };
  let state = saved.session || fresh();
  let selected = state.clues.indexOf(0);
  let notes = false;
  let history = [];
  let started = performance.now();
  const persist = () => write(key, { record, session: state });
  const cells = Array.from({ length: 36 }, (_, i) => {
    const cell = button("", () => select(i));
    cell.dataset.box = box(i);
    if (i % 6 === 2) cell.classList.add("box-end");
    if (Math.floor(i / 6) % 2 === 1 && i < 30) cell.classList.add("box-bottom");
    board.append(cell);
    return cell;
  });
  function select(i, focus = false) {
    selected = i;
    render();
    if (focus) cells[i].focus();
  }
  function clock() {
    setStats([time(state.seconds), tr("Time", "Tid")], [state.hints, tr("Hints", "Tip")],
      [state.grid.filter(Boolean).length + "/36", tr("Filled", "Udfyldt")]);
  }
  function render() {
    board.setAttribute("aria-label", tr("Sudoku board", "Sudokubræt"));
    cells.forEach((cell, i) => {
      const value = state.grid[i];
      cell.textContent = value || "";
      if (!value && state.notes[i]) {
        const marks = document.createElement("span");
        marks.className = "notes";
        for (let n = 1; n <= 6; n++) {
          const mark = document.createElement("span");
          mark.textContent = state.notes[i] & (1 << n) ? n : "";
          marks.append(mark);
        }
        cell.append(marks);
      }
      cell.classList.toggle("given", Boolean(state.clues[i]));
      cell.classList.toggle("conflict", conflicts(state.grid, i));
      cell.classList.toggle("selected", selected === i);
      cell.setAttribute("aria-pressed", String(selected === i));
      cell.setAttribute("aria-label", tr("Row", "Række") + " " + (Math.floor(i / 6) + 1) + ", " + tr("column", "kolonne") + " " + (i % 6 + 1) + (value ? ": " + value : "")
        + (state.clues[i] ? " · " + tr("given", "fast") : "")
        + (conflicts(state.grid, i) ? " · " + tr("conflict", "konflikt") : "")
        + (!value && state.notes[i] ? " · " + tr("notes ", "noter ") + [1, 2, 3, 4, 5, 6].filter(n => state.notes[i] & (1 << n)).join(", ") : ""));
      cell.tabIndex = selected === i ? 0 : -1;
    });
    clock();
    $("status").textContent = state.done ? tr("Puzzle solved.", "Sudokuen er løst.") : state.grid.some((_, i) => conflicts(state.grid, i)) ? tr("Matching numbers share a row, column, or box.", "Ens tal deler række, kolonne eller boks.") : "";
    $("aux").textContent = tr("Undo", "Fortryd");
    $("aux").disabled = !history.length || state.done;
    const locked = state.done || Boolean(state.clues[selected]);
    const active = document.activeElement?.dataset.sudokuControl;
    const keys = Array.from({ length: 6 }, (_, i) => button(i + 1, () => enter(i + 1), { disabled: locked }));
    keys.push(button(tr("Notes", "Noter"), () => { notes = !notes; render(); }, { pressed: notes, disabled: state.done }),
      button(tr("Clear", "Ryd"), () => enter(0), { disabled: locked }),
      button(tr("Hint", "Tip"), () => enter(state.solution[selected], true), { disabled: locked || state.grid[selected] === state.solution[selected] }));
    keys.forEach((element, index) => { element.dataset.sudokuControl = index; });
    controls.replaceChildren(...keys);
    if (active !== undefined && !keys[active].disabled) keys[active].focus({ preventScroll: true });
  }
  function enter(n, hint = false) {
    if (state.clues[selected] || state.done) return;
    history.push({ grid: [...state.grid], notes: [...state.notes] });
    if (history.length > 100) history.shift();
    if (hint) state.hints++;
    if (notes && n && !hint && !state.grid[selected]) state.notes[selected] ^= 1 << n;
    else {
      state.grid[selected] = n;
      state.notes[selected] = 0;
    }
    if (state.grid.every((v, i) => v === state.solution[i])) {
      state.done = true;
      record.completed++;
      if (!state.hints) record.bestTime = Math.min(record.bestTime ?? Infinity, state.seconds);
      celebrate();
      modal(tr("Beautifully solved!", "Flot løst!"), "<p>" + time(state.seconds) + " · " + state.hints + " " + tr("hints", "tip") + "</p>", [[tr("New puzzle", "Ny sudoku"), reset]]);
    }
    persist();
    render();
  }
  function reset() {
    state = fresh();
    selected = state.clues.indexOf(0);
    history = [];
    notes = false;
    started = performance.now();
    persist();
    render();
  }
  $("aux").onclick = () => {
    if (!history.length || state.done) return;
    Object.assign(state, history.pop());
    persist();
    render();
  };
  arrows(direction => {
    const deltas = { up: -6, down: 6, left: -1, right: 1 };
    if ((direction === "left" && selected % 6 === 0) || (direction === "right" && selected % 6 === 5)) return;
    select(Math.max(0, Math.min(35, selected + deltas[direction])), true);
  }, event => {
    if (/^[1-6]$/.test(event.key)) enter(Number(event.key));
    if (event.key === "Backspace" || event.key === "Delete") { event.preventDefault(); enter(0); }
  });
  document.addEventListener("visibilitychange", () => { started = performance.now(); persist(); });
  setInterval(() => {
    const now = performance.now();
    if (document.hidden || state.done || dialog.open) { started = now; return; }
    const seconds = Math.floor((now - started) / 1000);
    if (seconds) { state.seconds += seconds; started += seconds * 1000; persist(); clock(); }
  }, 250);
  return { render, reset, stats: () => [[record.completed, tr("Solved", "Løst")], [record.bestTime === null ? "–" : time(record.bestTime), tr("Best without hints", "Bedst uden tip")]] };
}

function snakeGame() {
  let best = saved.best || 0;
  let rounds = saved.rounds || 0;
  const fresh = () => ({ body: [210, 209, 208], heading: "right", food: 215, score: 0, status: "ready" });
  let state = saved.session || fresh();
  if (state.status === "running") state.status = "paused";
  let queued = null;
  let timer;
  const persist = () => write(key, { best, rounds, session: state });
  const cells = Array.from({ length: 400 }, () => board.appendChild(document.createElement("span")));
  function draw() {
    for (const cell of cells) cell.className = "";
    state.body.forEach((index, i) => { cells[index].className = i ? "body" : "head"; });
    if (state.food !== null) cells[state.food].className = "food";
    setStats([state.score, scoreLabel()], [best, bestLabel()], [Math.min(12, 6 + Math.floor(state.score / 5)), tr("Speed", "Fart")]);
    $("status").textContent = ({
      ready: tr("Choose Start or a direction to begin.", "Vælg Start eller en retning."),
      paused: tr("Paused", "På pause"),
      over: tr("Round finished", "Runden er slut"),
    })[state.status] || "";
  }
  function render() {
    board.setAttribute("aria-label", tr("Snake board", "Snake-bræt"));
    draw();
    $("aux").textContent = state.status === "running" ? tr("Pause", "Pause") : state.status === "paused" ? tr("Resume", "Fortsæt") : tr("Start", "Start");
    $("aux").disabled = state.status === "over";
    pad(turn);
  }
  function schedule() {
    clearTimeout(timer);
    if (state.status === "running") timer = setTimeout(tick, 1000 / Math.min(12, 6 + Math.floor(state.score / 5)));
  }
  function pause() {
    if (state.status !== "running") return;
    clearTimeout(timer);
    state.status = "paused";
    persist();
    render();
  }
  function start() {
    if (state.status === "over" || document.hidden) return;
    state.status = "running";
    persist();
    render();
    schedule();
  }
  function end(won) {
    state.status = "over";
    rounds++;
    persist();
    render();
    if (won) celebrate();
    modal(won ? tr("Full board!", "Hele brættet!") : tr("Round over", "Runden er slut"), "<p>" + scoreLabel() + " · " + state.score + "</p>", [[again(), reset]]);
  }
  function tick() {
    if (document.hidden || dialog.open) { pause(); return; }
    state.heading = queued || state.heading;
    queued = null;
    const result = snakeStep(state.body, state.heading, state.food);
    if (!result) { end(false); return; }
    state.body = result.body;
    if (result.ate) {
      state.score++;
      best = Math.max(best, state.score);
      state.food = foodCell(state.body);
      if (state.food === null) { end(true); return; }
    }
    persist();
    draw();
    schedule();
  }
  function turn(direction) {
    if (dialog.open || state.status === "over" || opposite(state.heading, direction)) return;
    if (!queued && direction !== state.heading) queued = direction;
    if (state.status !== "running") start();
  }
  function reset() {
    clearTimeout(timer);
    queued = null;
    state = fresh();
    persist();
    render();
  }
  $("aux").onclick = () => state.status === "running" ? pause() : start();
  arrows(turn, event => {
    const heading = { w: "up", a: "left", s: "down", d: "right" }[event.key.toLowerCase()];
    if (heading) turn(heading);
    if (event.key === " " && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      $("aux").click();
    }
  });
  swipes(board, turn);
  document.addEventListener("visibilitychange", () => { if (document.hidden) pause(); });
  window.addEventListener("pagehide", pause);
  return { render, reset, pause, stats: () => [[best, bestLabel()], [rounds, tr("Rounds", "Runder")]] };
}

const instance = ({ "2048": mergeGame, sudoku: sudokuGame, snake: snakeGame })[id]();
bindLanguage(() => {
  $("description").textContent = localized(game.description);
  $("category").textContent = localized(game.type);
  $("help").setAttribute("aria-label", tr("How to play", "Sådan spiller du"));
  $("stats").setAttribute("aria-label", tr("Statistics", "Statistik"));
  $("new").textContent = id === "sudoku" ? tr("New puzzle", "Ny sudoku") : tr("New game", "Nyt spil");
  instance.render();
});
document.querySelector('[data-lang][aria-pressed="true"]').click();
$("new").onclick = () => {
  instance.pause?.();
  modal($("new").textContent, "<p>" + tr("Start a fresh board?", "Vil du starte forfra?") + "</p>",
    [[tr("Start fresh", "Start forfra"), instance.reset], [tr("Keep this game", "Behold spillet")]]);
};
$("help").onclick = () => {
  instance.pause?.();
  modal(tr("How to play", "Sådan spiller du"), "<p>" + help[id]() + "</p>", [[tr("Back to game", "Tilbage til spillet")]]);
};
$("stats").onclick = () => {
  instance.pause?.();
  modal(tr("Statistics", "Statistik"), '<div class="scoreboard">' + instance.stats().map(value => stat(...value)).join("") + "</div>", [[tr("Back to game", "Tilbage til spillet")]]);
};
offline();
