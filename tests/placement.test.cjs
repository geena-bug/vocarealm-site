const test = require('node:test'),
  assert = require('node:assert/strict'),
  vm = require('node:vm'),
  fs = require('node:fs');
const C = require('../web/public/level-core.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync('web/public/level-content.js', 'utf8'), context);
const { bank, practice } = context.window.VocaLevelContent;
function stage(level, score) {
  return Array.from({ length: 6 }, (_, index) => ({
    level,
    index,
    choice: index < score ? bank[level][index].answer : (bank[level][index].answer + 1) % 4,
    correct: index < score,
  }));
}
test('first-stage gaps recommend A1 without forcing later tests', () => {
  assert.deepEqual(C.decide(stage('A1', 4)), { recommended: 'A1', passed: [], complete: true });
});
test('five of six qualifies while four does not, at every stage', () => {
  for (let i = 0; i < 6; i++) {
    const before = C.codes.slice(0, i).flatMap((x) => stage(x, 6));
    const failed = C.decide([...before, ...stage(C.codes[i], 4)]);
    assert.equal(failed.recommended, C.codes[i]);
    assert.equal(failed.complete, true);
    assert.equal(failed.passed.length, i);
    const passed = C.decide([...before, ...stage(C.codes[i], 5)]);
    assert.equal(passed.recommended, C.codes[Math.min(i + 1, 5)]);
    assert.equal(passed.passed.length, i + 1);
  }
});
test('perfect run stops at C2 without inventing a higher level', () => {
  const r = C.decide(C.codes.flatMap((x) => stage(x, 6)));
  assert.equal(r.recommended, 'C2');
  assert.equal(r.complete, true);
  assert.equal(r.passed.length, 6);
});
test('later strong results cannot mask an earlier gap', () => {
  const r = C.decide([...stage('A1', 6), ...stage('A2', 3), ...stage('B1', 6)]);
  assert.equal(r.recommended, 'A2');
});
test('saved attempts validate sequencing, choices and option permutations', () => {
  const a = { version: 1, answers: stage('A1', 5), orders: Array.from({ length: 36 }, () => [2, 0, 3, 1]) };
  assert(C.validateAttempt(a, bank));
  a.answers[1].index = 3;
  assert(!C.validateAttempt(a, bank));
  a.answers = stage('A1', 5);
  a.orders[0] = [0, 0, 2, 3];
  assert(!C.validateAttempt(a, bank));
});
test('skips count as incorrect and saved correctness is recalculated', () => {
  const a = { answers: stage('A1', 6) };
  a.answers[0].choice = null;
  a.answers[1].choice = (bank.A1[1].answer + 1) % 4;
  assert.equal(C.stageScore(C.normalizedAnswers(a, bank), 'A1'), 4);
});
test('every level has six valid placement items and separate starter practice', () => {
  for (const code of C.codes) {
    assert.equal(bank[code].length, 6);
    for (const q of bank[code]) {
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4);
      assert(q.answer >= 0 && q.answer < 4);
      assert(q.prompt && q.explanation);
    }
    assert.equal(practice[code].qs.length, 3);
    assert(practice[code].text);
  }
});
