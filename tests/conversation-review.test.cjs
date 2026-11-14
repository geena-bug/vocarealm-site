const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
function setup() {
  let user = null;
  const window = {
    addEventListener() {},
    get vocaAuth() {
      return { ready: Promise.resolve({ user }) };
    },
  };
  vm.runInNewContext(fs.readFileSync('web/public/conversation-review.js', 'utf8'), { window, URL, Date, Math });
  return {
    R: window.VocaConversationReview,
    setUser(value) {
      user = value;
    },
  };
}
test('submitted audio survives turn cleanup independently of temporary playback URL', async () => {
  const { R } = setup();
  const session = await R.create('cafe', 'Order coffee', 'Customer');
  const blob = new Blob(['recorded clip'], { type: 'audio/webm' });
  await R.capture(session, { index: 1, text: 'Bonjour', blob, modelFr: 'Bonjour !', partnerFr: 'Vous désirez ?' });
  const [stored] = await R.list('cafe');
  assert.equal(stored.turns[0].blob, blob);
  assert.equal(await stored.turns[0].blob.text(), 'recorded clip');
  assert.equal(stored.turns[0].partnerFr, 'Vous désirez ?');
  assert.equal(stored.turns[0].text, 'Bonjour');
});
test('known written mistakes are flagged while a valid paraphrase is not penalized', () => {
  const { R } = setup();
  const errors = R.suggestions('Je fait une réservation et je voudrais un chambre et une café.');
  assert.equal(errors.length, 3);
  assert.deepEqual(
    Array.from(errors, (x) => x.replacement),
    ['je fais', 'une chambre', 'un café'],
  );
  assert.equal(R.suggestions('Bonjour, je souhaite réserver une chambre pour demain.').length, 0);
  assert.equal(R.suggestions('').length, 0);
});
test('review history separates guests, signed-in users and realms', async () => {
  const { R, setUser } = setup();
  const guest = await R.create('cafe', 'Guest session', 'Customer');
  await R.capture(guest, { index: 0, text: 'Bonjour' });
  setUser({ id: 'alice' });
  assert.equal((await R.list('cafe')).length, 0);
  const alice = await R.create('hotel', 'Private session', 'Guest');
  await R.capture(alice, { index: 0, text: 'Merci' });
  assert.equal((await R.list('hotel')).length, 1);
  setUser({ id: 'bob' });
  assert.equal((await R.list('hotel')).length, 0);
  setUser(null);
  assert.equal((await R.list('cafe')).length, 1);
});
test('revisited turns replace their recording rather than duplicating responses', async () => {
  const { R } = setup();
  const s = await R.create('cafe', 'Order', 'Customer');
  await R.capture(s, { index: 2, text: 'First' });
  await R.capture(s, { index: 2, text: 'Corrected attempt' });
  const [stored] = await R.list('cafe');
  assert.equal(stored.turns.length, 1);
  assert.equal(stored.turns[0].text, 'Corrected attempt');
});
