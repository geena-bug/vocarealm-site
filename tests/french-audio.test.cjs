const test = require('node:test'),
  assert = require('node:assert/strict'),
  vm = require('node:vm'),
  fs = require('node:fs');
function setup(initial = []) {
  let voices = initial,
    spoke = [],
    resumed = 0,
    listener;
  const timers = new Map();
  let i = 0;
  const synth = {
    paused: true,
    getVoices: () => voices,
    cancel() {},
    resume() {
      resumed++;
    },
    speak(u) {
      spoke.push(u);
    },
    addEventListener(t, f) {
      listener = f;
    },
    removeEventListener() {
      listener = null;
    },
  };
  const window = {
    speechSynthesis: synth,
    SpeechSynthesisUtterance: function (text) {
      this.text = text;
    },
    addEventListener() {},
  };
  const ctx = {
    window,
    setTimeout: (f) => {
      timers.set(++i, f);
      return i;
    },
    clearTimeout: (id) => timers.delete(id),
    setInterval: () => ++i,
    clearInterval() {},
  };
  vm.runInNewContext(fs.readFileSync('web/public/french-audio.js', 'utf8'), ctx);
  return {
    api: window.VocaFrenchAudio,
    spoke,
    timers,
    setVoices(v) {
      voices = v;
      listener?.();
    },
    get resumed() {
      return resumed;
    },
    synth,
  };
}
test('audio waits for asynchronous voices and selects French instead of English default', () => {
  const x = setup(),
    messages = [];
  x.api.play('Bonjour', { status: (t) => messages.push(t) });
  assert.equal(x.spoke.length, 0);
  x.setVoices([
    { name: 'English', lang: 'en-US' },
    { name: 'French', lang: 'fr-CA' },
  ]);
  assert.equal(x.spoke.length, 1);
  assert.equal(x.spoke[0].voice.name, 'French');
  assert.equal(x.resumed, 1);
  x.spoke[0].onstart();
  assert.equal(messages.at(-1), 'Playing French audio…');
});
test('a later click cancels pending voice loading and obsolete completion callbacks', () => {
  const x = setup(),
    ended = [];
  x.api.play('Old', { onEnd: () => ended.push('old') });
  x.api.play('New', { onEnd: () => ended.push('new') });
  x.setVoices([{ name: 'French', lang: 'fr-FR' }]);
  assert.equal(x.spoke.length, 1);
  assert.equal(x.spoke[0].text, 'New');
  const u = x.spoke[0];
  x.api.stop();
  u.onend();
  assert.equal(ended.length, 0);
});
test('a silent synthesizer reports timeout rather than pretending audio completed', () => {
  const x = setup([{ name: 'French', lang: 'fr-FR' }]),
    messages = [];
  let complete = false;
  x.api.play('Bonjour', { status: (t) => messages.push(t), onEnd: () => (complete = true) });
  [...x.timers.values()].forEach((f) => f());
  assert.match(messages.at(-1), /could not play/);
  assert.equal(complete, false);
});
test('audio errors do not advance a conversation', () => {
  const x = setup([{ name: 'French', lang: 'fr-FR' }]);
  let advanced = false,
    error;
  x.api.play('Bonjour', { onEnd: () => (advanced = true), onError: (e) => (error = e) });
  x.spoke[0].onerror({ error: 'not-allowed' });
  assert.equal(advanced, false);
  assert.equal(error, 'not-allowed');
});
