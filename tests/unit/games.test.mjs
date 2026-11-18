import { test } from "node:test";
import assert from "node:assert/strict";
import { slide, spawn, solve, sudoku, conflicts, foodCell, opposite, snakeStep } from "../../public/shared/rules.mjs";

test("2048 merges in travel order, once per tile, and identifies no-op moves", () => {
  const board = [2, 2, 4, 4, 4, 4, 8, 0, 2, 0, 0, 0, 2, 0, 0, 0];
  assert.deepEqual(slide(board, "left").board.slice(0, 8), [4, 8, 0, 0, 8, 8, 0, 0]);
  assert.equal(slide(board, "left").points, 20);
  assert.deepEqual(slide(board, "right").board.slice(0, 4), [0, 0, 4, 8]);
  assert.deepEqual(slide(board, "up").board.filter((_, i) => i % 4 === 0), [2, 4, 4, 0]);
  const corner = [2, ...Array(15).fill(0)];
  assert.equal(slide(corner, "left").changed, false);
  assert.deepEqual(spawn([...corner], () => 0).slice(0, 3), [2, 2, 0]);
});

test("mini Sudoku generates varied puzzles with exactly one solution", () => {
  let seed = 2026;
  const random = () => (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32;
  const layouts = new Set();
  for (let i = 0; i < 25; i++) {
    const { solution, clues } = sudoku(random);
    assert.deepEqual(solve(clues), [solution]);
    assert.equal(clues.filter(Boolean).length, 18);
    assert.ok(solution.every((_, index) => !conflicts(solution, index)));
    layouts.add(clues.join(""));
  }
  assert.equal(layouts.size, 25);
  assert.equal(conflicts([2, 2, ...Array(34).fill(0)], 0), true);
});

test("Snake grows at food, may enter its moving tail, and cannot cross walls or body", () => {
  assert.equal(opposite("left", "right"), true);
  assert.equal(opposite("up", "right"), false);
  assert.deepEqual(snakeStep([210, 209, 208], "right", 211), { body: [211, 210, 209, 208], ate: true });
  assert.deepEqual(snakeStep([21, 22, 42, 41], "down", 0), { body: [41, 21, 22, 42], ate: false });
  assert.equal(snakeStep([19, 18, 17], "right", 0), null);
  assert.equal(snakeStep([21, 22, 42, 41, 40], "down", 0), null);
  assert.equal(foodCell([0, 1], () => 0), 2);
  assert.equal(foodCell(Array.from({ length: 400 }, (_, i) => i)), null);
});
