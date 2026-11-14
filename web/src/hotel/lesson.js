// Hotel app lesson rules, free of React so they can be unit-tested. `C` is VocaVocabularyCore.

// A vocabulary question for one word: "flashcard" asks for the meaning, "sentence" fills the gap.
// Wrong options are the first three other answers from the same pack.
export function exercise(word, type, { pack, C, review = false }) {
  const fill = type === 'sentence' && !!word.fillPrompt;
  const correct = fill ? word.fillAnswer : word.translation;
  const others = [...new Set(pack.filter((x) => x.id !== word.id).map((x) => (fill ? x.term : x.translation)).filter((x) => C.norm(x) !== C.norm(correct)))];
  return {
    title: fill ? 'Complete the sentence' : 'What does this mean?',
    prompt: fill ? word.fillPrompt : word.term,
    translation: word.translation,
    options: [correct, ...others.slice(0, 3)],
    answer: 0,
    example: word.sentence,
    word,
    type: review ? 'Review' : fill ? 'Sentence' : 'Discover',
    activity: fill ? 'sentence' : 'flashcard',
    review,
    scene: word.sceneId,
  };
}

const exercisesFor = (word, opts) => [exercise(word, 'flashcard', opts), ...(word.fillPrompt ? [exercise(word, 'sentence', opts)] : [])];

// A new practice session: `length` is '5', '10' or 'all'; shorter sessions rotate through the pack.
export function newSession(pack, length, cursor, { C, dialogues }) {
  const plan = C.sessionWords(pack, length, cursor);
  const queue = plan.items.flatMap((w) => exercisesFor(w, { pack, C })).concat(dialogues.map((q) => ({ ...q })));
  return { queue, nextCursor: plan.nextCursor, wordCount: length === 'all' ? pack.length : Math.min(Number(length) || 5, pack.length) };
}

// Review of every introduced word in a pack, words needing review first.
export function reviewSession(pack, progress, { C }) {
  const items = pack.filter((w) => progress[w.id]);
  items.sort((a, b) => (progress[a.id].state === 'needs_review' ? -1 : 0) - (progress[b.id].state === 'needs_review' ? -1 : 0));
  return items.flatMap((w) => [exercise(w, 'flashcard', { pack, C, review: true }), exercise(w, 'sentence', { pack, C, review: true })]);
}

// Records an answer and updates the word's learning state (new → learning → familiar → mastered, or needs review).
export function logAttempt(data, q, ok, sessionId, now = Date.now()) {
  data.attempts.push({
    id: 'attempt-' + now + '-' + data.attempts.length,
    sessionId,
    vocabularyId: q.word?.id || null,
    type: q.activity || 'dialogue',
    isCorrect: ok,
    answeredAt: new Date(now).toISOString(),
    review: !!q.review,
  });
  if (!q.word) return;
  const p = data.vocabularyProgress[q.word.id] || { correctCount: 0, incorrectCount: 0, types: [], afterError: 0, hasLaterReview: false, sessionId };
  if (ok) {
    p.correctCount++;
    p.afterError++;
    if (!p.types.includes(q.activity)) p.types.push(q.activity);
    if (q.review && p.sessionId !== sessionId) p.hasLaterReview = true;
    if (p.state === 'needs_review' && p.afterError < 2) p.state = 'needs_review';
    else if (p.correctCount >= 4 && p.types.length >= 2 && p.hasLaterReview) p.state = 'mastered';
    else if (p.afterError >= 2 && p.types.length >= 2) p.state = 'familiar';
    else p.state = 'learning';
  } else {
    p.incorrectCount++;
    p.afterError = 0;
    p.state = 'needs_review';
    p.hasLaterReview = false;
    p.types = [];
  }
  p.nextReviewAt = new Date(now + (p.state === 'mastered' ? 7 : p.state === 'familiar' ? 1 : 0) * 86400000).toISOString();
  data.vocabularyProgress[q.word.id] = p;
}

// Adds missed words ([French, English, example]) to the "Words to revisit" list without duplicates.
export function rememberMissed(data, missed) {
  data.missed = [...data.missed, ...missed].filter((w, i, a) => Array.isArray(w) && a.findIndex((v) => v[0] === w[0]) === i);
}

// Answer buttons are shown in a rotated order so the right answer is not always first.
export function rotatedOrder(count, step) {
  const indices = Array.from({ length: count }, (_, i) => i);
  const shift = (step + 1) % count;
  return indices.slice(shift).concat(indices.slice(0, shift));
}

// The short A2 starter lesson: words, one sentence challenge, then three dialog replies.
export function starterQuestion(realm, order, step, reviewing, missed) {
  if (reviewing) {
    const w = missed[step];
    return {
      title: 'Let’s give this word another look.',
      prompt: w[0],
      translation: w[1],
      options: [w[1], ...realm.words.filter((x) => x[1] !== w[1]).map((x) => x[1]), 'A map'].slice(0, 4),
      answer: 0,
      example: w[2],
      type: 'Review',
    };
  }
  if (step < order.length) {
    const w = realm.words[order[step]];
    return { title: 'What does this mean?', prompt: w[0], translation: w[1], options: [...realm.words.map((x) => x[1]), 'A map'], answer: order[step], example: w[2], word: w, type: 'Discover' };
  }
  if (step === order.length) {
    const [prompt, options, answer] = realm.challenge;
    return { title: 'Complete the sentence', prompt, options, answer, type: 'Mini challenge' };
  }
  const [prompt, translation, options, answer] = realm.dialog[step - order.length - 1];
  return { title: 'How would you reply?', prompt, translation, options, answer, type: 'Conversation' };
}

export const emptyProgress = () => ({
  xp: 0,
  done: {},
  missed: [],
  sessions: 0,
  best: {},
  a2Unlocked: false,
  attempts: [],
  vocabularyProgress: {},
  hotelBest: 0,
  packBest: {},
  packCursor: {},
});
