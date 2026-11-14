const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const C = require('../web/public/vocabulary-core.js');
test('all-word sessions include words beyond the original twenty', () => {
  const p = Array.from({ length: 47 }, (_, id) => ({ id }));
  assert.equal(C.sessionWords(p, 'all').items.length, 47);
  assert.equal(C.sessionWords(p, 'all').items[46].id, 46);
});
test('short sessions rotate through the entire growing bank and wrap', () => {
  const p = Array.from({ length: 40 }, (_, id) => ({ id }));
  assert.deepEqual(
    C.sessionWords(p, 5, 38).items.map((x) => x.id),
    [38, 39, 0, 1, 2],
  );
  assert.equal(C.sessionWords(p, 5, 38).nextCursor, 3);
  assert.equal(C.sessionWords([], 5).items.length, 0);
});
test('same-realm duplicates merge without removing distinct realm meanings', () => {
  const p = [{ scenarioId: 'hotel', term: 'une serviette', translation: 'a towel' }];
  const a = [
    { realm: 'hotel', term: ' Une Serviette ', translation: 'a towel' },
    { realm: 'cafe', term: 'une serviette', translation: 'a napkin' },
  ];
  assert.equal(C.merge(p, a).length, 2);
});
test('unknown meaning and excessive fields are rejected without inventing translations', () => {
  assert(C.validate({ term: 'bonjour', meaning: '' }));
  assert(C.validate({ term: 'x'.repeat(121), meaning: 'test' }));
  assert.equal(C.validate({ term: 'un parapluie', meaning: 'an umbrella', level: 'B1' }), null);
});
test('sentence practice is created only when the actual word occurs', () => {
  const a = C.exerciseWord({ term: 'un parapluie', meaning: 'an umbrella', example: 'J’ai un parapluie.' }, []);
  assert.equal(a.fillPrompt, 'J’ai ______.');
  assert.equal(C.exerciseWord({ term: 'un parapluie', meaning: 'an umbrella', example: 'Il pleut.' }, []).fillPrompt, '');
});
test('all expanded packs exceed twenty and have distinct IDs and terms', () => {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['hotel-content.js', 'realm-content.js', 'vocabulary-expansion.js', 'vocabulary-core.js', 'vocabulary-base.js'])
    vm.runInContext(fs.readFileSync('web/public/' + f, 'utf8'), ctx);
  const built = ctx.window.vocaBuiltins;
  assert.equal(new Set(built.map((x) => x.id)).size, built.length);
  for (const realm of ['hotel', 'cafe', 'school', 'transport', 'life']) {
    const words = built.filter((x) => x.realm === realm);
    assert(words.length > 20);
    assert.equal(new Set(words.map((x) => C.norm(x.term))).size, words.length);
    for (const w of words) {
      assert(w.term && w.translation);
      assert(!w.distractors.some((x) => C.norm(x) === C.norm(w.translation)));
    }
  }
});
test('pronunciation parser never scores absent or unclear speech', () => {
  const source = fs.readFileSync('integrations/pronunciation/response.js', 'utf8').replace('export function', 'function');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(source + ';this.parse=assessmentResult', ctx);
  assert.equal(ctx.parse({ RecognitionStatus: 'NoMatch' }).error, 'unclear_audio');
  assert.equal(
    ctx.parse({ RecognitionStatus: 'Success', NBest: [{ Confidence: 0.2, Words: [{ Word: 'bonjour', AccuracyScore: 20, ErrorType: 'Mispronunciation' }] }] })
      .error,
    'unclear_audio',
  );
  const r = ctx.parse({
    RecognitionStatus: 'Success',
    NBest: [
      {
        Confidence: 0.9,
        Words: [
          { Word: 'bonjour', AccuracyScore: 52, ErrorType: 'Mispronunciation' },
          { Word: 'madame', ErrorType: 'Omission' },
          { Word: 'oui', ErrorType: 'Insertion' },
        ],
      },
    ],
  });
  assert.equal(r.words[0].errorType, 'Mispronunciation');
  assert.equal(r.words[1].errorType, 'Omission');
  assert.equal(r.words[1].accuracy, null);
  assert.equal(r.words[2].errorType, 'Insertion');
});
test('fresh and older account progress supports word practice after login', () => {
  const normalize = require('../web/public/learning-data.js');
  for (const saved of [null, {}, { xp: 50 }, { vocabularyProgress: null, attempts: 'bad' }]) {
    const data = normalize(saved);
    assert(Array.isArray(data.attempts));
    assert(Array.isArray(data.missed));
    assert(data.vocabularyProgress && data.packBest && data.packCursor);
    data.attempts.push({ vocabularyId: 'new-word' });
    data.vocabularyProgress['new-word'] = { state: 'learning' };
  }
  assert.equal(normalize({ xp: 50 }).xp, 50);
});
