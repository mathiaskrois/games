import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { answers, scoreGuess, chooseAnswer } from "../../public/ord/engine.mjs";

test("repeated letters consume exact matches before misplaced matches", () => {
  assert.deepEqual(scoreGuess("ALLEY", "APPLE"), ["correct", "present", "absent", "present", "absent"]);
  assert.deepEqual(scoreGuess("PAPAL", "APPLE"), ["present", "present", "correct", "absent", "present"]);
  assert.deepEqual(scoreGuess("ÆBLER", "ÆBLER"), Array(5).fill("correct"));
});
test("answer pools contain valid unique words and never immediately repeat", async () => {
  for (const lang of ["en", "da"]) {
    const dictionary = new Set((await readFile(new URL(`../../public/ord/${lang === "en" ? "english" : "danish"}.txt`, import.meta.url), "utf8")).toUpperCase().trim().split(/\s+/));
    assert.ok(answers[lang].length > 100);
    assert.equal(new Set(answers[lang]).size, answers[lang].length);
    for (const word of answers[lang]) { assert.match(word, /^[A-ZÆØÅ]{5}$/); assert.ok(dictionary.has(word), word); }
    for (let i = 0; i < 20; i++) assert.notEqual(chooseAnswer(answers[lang], answers[lang][0]), answers[lang][0]);
  }
});
test("the standalone Danish dictionary matches its recorded checksum", async () => {
  const bytes = await readFile(new URL("../../public/ord/danish.txt", import.meta.url));
  const metadata = JSON.parse(await readFile(new URL("../../public/ord/danish-source.json", import.meta.url), "utf8"));
  assert.equal(createHash("sha256").update(bytes).digest("hex"), metadata.sha256);
  assert.equal(bytes.toString("utf8").trim().split("\n").length, metadata.count);
});
