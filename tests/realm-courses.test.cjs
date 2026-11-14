const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
function content() {
  const c = { window: {} };
  vm.createContext(c);
  for (const f of ['hotel-content', 'realm-content', 'vocabulary-expansion', 'vocabulary-core', 'realm-courses', 'vocabulary-base'])
    vm.runInContext(fs.readFileSync('web/public/' + f + '.js', 'utf8'), c);
  return c.window;
}
test('all nineteen non-hotel realms have two complete bilingual roleplays and valid comprehension', () => {
  const w = content(),
    packs = w.VocaRealmCourses;
  assert.equal(Object.keys(packs).length, 19);
  const ids = new Set();
  for (const [id, p] of Object.entries(packs)) {
    assert.equal(p.roles.length, 2, id);
    assert.equal(p.scenes.length, 2, id);
    assert.equal(p.questions.length, 4, id);
    for (const s of p.scenes) {
      assert.ok(s.mission && s.title);
      assert.ok(s.lines.length >= 10);
      assert.deepEqual([...new Set(s.lines.map((x) => x.actor))].sort(), [0, 1]);
      for (const l of s.lines) assert.ok(l.fr && l.en);
    }
    for (const q of p.questions) {
      assert.ok(q.text && q.prompt && q.explanation);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length);
    }
    for (const v of p.words) {
      assert.ok(v.term && v.translation && v.sentence && v.sentenceTranslation);
      assert.equal(v.realm, id);
      assert.ok(!ids.has(v.id));
      ids.add(v.id);
    }
  }
  assert.equal(ids.size, 360);
});
test('shared bank incorporates expanded packs, retains stable samples and supports all-word practice', () => {
  const w = content();
  assert.equal(w.vocaBuiltins.length, 546);
  for (const id of Object.keys(w.VocaRealmCourses)) {
    const words = w.vocaBuiltins.filter((x) => x.realm === id);
    assert.ok(words.length >= 24, id);
    assert.equal(w.VocaVocabularyCore.sessionWords(words, 'all').items.length, words.length);
    const terms = words.map((x) => w.VocaVocabularyCore.norm(x.term));
    assert.equal(new Set(terms).size, terms.length, id);
  }
  assert.ok(w.vocaBuiltins.some((x) => x.id === 'sample_shopping_2'));
});
test('partner playback cannot advance learner turn; explicit reply advances either selected role', () => {
  const k = require('../web/public/realm-learning-core.js');
  const lines = [{ actor: 0 }, { actor: 1 }, { actor: 0 }];
  assert.equal(k.next(lines, 0, 0, 'partner-ended'), 0);
  assert.equal(k.next(lines, 0, 0, 'reply'), 1);
  assert.equal(k.next(lines, 1, 0, 'reply'), 1);
  assert.equal(k.next(lines, 1, 0, 'partner-ended'), 2);
  assert.equal(k.next(lines, 1, 1, 'partner-ended'), 1);
  assert.equal(k.next(lines, 1, 1, 'reply'), 2);
  assert.equal(k.next(lines, 0, -1, 'partner-ended'), 1);
  assert.equal(k.next(lines, 3, 0, 'reply'), 3);
});
test('guest and account progress use separate existing app keys', () => {
  const k = require('../web/public/realm-learning-core.js');
  assert.equal(k.key(null), 'vocarealm-v1');
  assert.equal(k.key({ id: 'alice' }), 'vocarealm-user-alice');
  assert.notEqual(k.key({ id: 'alice' }), k.key({ id: 'bob' }));
});
test('all comprehension questions have paired French and English choices with identical answer indexes', () => {
  const w = content();
  for (const p of Object.values(w.VocaRealmCourses))
    for (const q of p.questions) {
      assert.ok(q.promptFr);
      assert.equal(q.optionsFr.length, q.options.length);
      assert.ok(q.optionsFr.every((x) => typeof x === 'string' && x.length));
      assert.ok(q.optionsFr[q.answer]);
    }
});
