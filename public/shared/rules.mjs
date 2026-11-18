export function slide(board, direction) {
  const next = Array(16).fill(0);
  let points = 0;
  const vertical = direction === "up" || direction === "down";
  const reverse = direction === "right" || direction === "down";
  for (let line = 0; line < 4; line++) {
    const indexes = Array.from({ length: 4 }, (_, i) => {
      const offset = reverse ? 3 - i : i;
      return vertical ? offset * 4 + line : line * 4 + offset;
    });
    const tiles = indexes.map(i => board[i]).filter(Boolean);
    let target = 0;
    for (let i = 0; i < tiles.length; i++) {
      let value = tiles[i];
      if (value === tiles[i + 1]) {
        value *= 2;
        points += value;
        i++;
      }
      next[indexes[target++]] = value;
    }
  }
  return { board: next, points, changed: next.some((x, i) => x !== board[i]) };
}

export function spawn(board, random = Math.random) {
  const holes = board.flatMap((value, index) => value ? [] : [index]);
  if (holes.length) board[holes[Math.floor(random() * holes.length)]] = random() < 0.9 ? 2 : 4;
  return board;
}

export const directions = ["up", "right", "down", "left"];
export const opposite = (first, second) => (directions.indexOf(first) + 2) % 4 === directions.indexOf(second);

export function foodCell(body, random = Math.random) {
  const occupied = new Set(body);
  const free = Array.from({ length: 400 }, (_, i) => i).filter(i => !occupied.has(i));
  return free.length ? free[Math.floor(random() * free.length)] : null;
}

export function snakeStep(body, heading, food) {
  const [head] = body;
  const x = head % 20 + (heading === "right" ? 1 : heading === "left" ? -1 : 0);
  const y = Math.floor(head / 20) + (heading === "down" ? 1 : heading === "up" ? -1 : 0);
  const next = y * 20 + x;
  const ate = next === food;
  const rest = ate ? body : body.slice(0, -1);
  if (x < 0 || x >= 20 || y < 0 || y >= 20 || rest.includes(next)) return null;
  return { body: [next, ...rest], ate };
}

export const box = i => Math.floor(i / 12) * 2 + Math.floor(i % 6 / 3);
const row = i => Math.floor(i / 6);
const column = i => i % 6;
export const peers = Array.from({ length: 36 }, (_, i) =>
  Array.from({ length: 36 }, (_, j) => j).filter(j =>
    i !== j && (row(i) === row(j) || column(i) === column(j) || box(i) === box(j))));

export function conflicts(grid, i) {
  return Boolean(grid[i] && peers[i].some(j => grid[j] === grid[i]));
}

export function solve(grid, limit = 2, order = [1, 2, 3, 4, 5, 6]) {
  const work = [...grid];
  const solutions = [];
  if (work.some((_, i) => conflicts(work, i))) return solutions;
  function search() {
    let index = -1;
    let choices;
    for (let i = 0; i < 36; i++) {
      if (work[i]) continue;
      const available = order.filter(n => !peers[i].some(j => work[j] === n));
      if (!available.length) return;
      if (!choices || available.length < choices.length) {
        index = i;
        choices = available;
      }
    }
    if (index < 0) { solutions.push([...work]); return; }
    for (const digit of choices) {
      work[index] = digit;
      search();
      if (solutions.length >= limit) break;
    }
    work[index] = 0;
  }
  search();
  return solutions;
}

function shuffle(items, random) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

export function sudoku(random = Math.random) {
  const order = shuffle([1, 2, 3, 4, 5, 6], random);
  const [solution] = solve(Array(36).fill(0), 1, order);
  const clues = [...solution];
  let remaining = 36;
  for (const i of shuffle(Array.from({ length: 36 }, (_, i) => i), random)) {
    clues[i] = 0;
    if (solve(clues).length !== 1) clues[i] = solution[i];
    else if (--remaining === 18) break;
  }
  return { solution, clues };
}
