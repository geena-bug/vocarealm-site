import { useState } from 'react';
import { core } from '../shared/legacy.js';
import { Bilingual, English } from '../shared/English.jsx';

// Updates a word's spaced-practice record after an answer (same rules as the vocabulary page).
function recordAnswer(progress, word, ok, type) {
  const old = progress.vocabularyProgress[word.id] || { correctCount: 0, incorrectCount: 0, types: [], afterError: 0, hasLaterReview: false };
  if (ok) {
    old.correctCount++;
    old.afterError++;
    if (!old.types.includes(type)) old.types.push(type);
    if (old.state !== 'mastered') {
      old.state = old.state === 'needs_review' && old.afterError < 2 ? 'needs_review' : old.types.length >= 2 && old.afterError >= 2 ? 'familiar' : 'learning';
    }
  } else {
    old.incorrectCount++;
    old.afterError = 0;
    old.state = 'needs_review';
    old.types = [];
    old.hasLaterReview = false;
  }
  progress.vocabularyProgress[word.id] = old;
}

function Question({ q, number, total, review, words, speak, onAnswered, onNext }) {
  const C = core();
  const w = q.w;
  const answer = q.fill ? w.fillAnswer : w.term;
  const [options] = useState(() =>
    [answer, ...[...new Set(words.map((x) => x.term))].filter((x) => C.norm(x) !== C.norm(answer)).slice(0, 3)].sort(() => Math.random() - 0.5),
  );
  const [picked, setPicked] = useState(null);
  const ok = picked !== null && C.norm(picked) === C.norm(answer);
  return (
    <>
      <p>{(review ? 'Review' : 'Question') + ' ' + number + ' / ' + total}</p>
      <h3 lang="fr">{q.fill ? 'Quel mot complète la phrase ?' : 'Écoutez le mot, puis sélectionnez-le.'}</h3>
      <English>{q.fill ? 'Which word completes the sentence?' : 'Listen to the word, then select it.'}</English>
      {q.fill && <p lang="fr">{w.fillPrompt}</p>}
      <English>{q.fill ? w.sentenceTranslation : w.translation}</English>
      <button type="button" onClick={() => speak(q.fill ? w.sentence : w.term)}>Listen</button>
      <div className="answers">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={picked !== null}
            onClick={() => {
              setPicked(option);
              onAnswered(C.norm(option) === C.norm(answer));
            }}
          >
            <Bilingual fr={option} en={words.find((x) => C.norm(x.term) === C.norm(option))?.translation} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p lang="fr">{(ok ? 'Bonne réponse. ' : 'Continuez à vous entraîner. ') + w.term}</p>
          <English>{w.translation}</English>
          <p lang="fr">{w.sentence}</p>
          <English>{w.sentenceTranslation}</English>
          <button type="button" onClick={onNext}>Next</button>
        </>
      )}
    </>
  );
}

// "Vocabulary" tab: short listening/fill-in sessions over the realm's words, with a missed-question review.
export default function WordPractice({ realm, words, progress, save, speak }) {
  const C = core();
  const [length, setLength] = useState('5');
  const [session, setSession] = useState(null); // { queue, i, correct, missed, review, id }

  function start() {
    const plan = C.sessionWords(words, length, progress.packCursor[realm] || 0);
    progress.packCursor[realm] = plan.nextCursor;
    save();
    const queue = plan.items.flatMap((w) => [{ w, fill: false }, ...(w.fillPrompt ? [{ w, fill: true }] : [])]);
    setSession({ queue, i: 0, correct: 0, missed: [], review: false, id: Date.now() });
  }

  function answered(ok) {
    const q = session.queue[session.i];
    if (!session.review) {
      recordAnswer(progress, q.w, ok, q.fill ? 'sentence' : 'flashcard');
      save();
    }
    setSession((s) => ({ ...s, correct: s.correct + (ok ? 1 : 0), missed: ok ? s.missed : [...s.missed, q] }));
  }

  function next() {
    const i = session.i + 1;
    if (i >= session.queue.length && !session.review) {
      progress.sessions++;
      progress.xp += session.correct * 5;
      save();
    }
    setSession({ ...session, i });
  }

  const done = session && session.i >= session.queue.length;
  return (
    <>
      <h2>Words in context</h2>
      <div className="lesson-tools">
        <select aria-label="Session length" value={length} onChange={(e) => setLength(e.target.value)}>
          <option value="5">5 words</option>
          <option value="10">10 words</option>
          <option value="all">All {words.length} words</option>
        </select>
        <button type="button" onClick={start}>Start practice</button>
      </div>
      <p>Short sessions rotate through your word bank. Personal words tagged to this realm are included.</p>
      <div>
        {done && (
          <>
            <h3>{(session.review ? 'Review complete' : 'Practice complete') + ' · ' + session.correct + '/' + session.queue.length}</h3>
            {session.missed.length > 0 && (
              <button type="button" onClick={() => setSession({ queue: session.missed, i: 0, correct: 0, missed: [], review: true, id: Date.now() })}>
                Review missed questions
              </button>
            )}
          </>
        )}
        {session && !done && (
          <Question
            key={session.id + ':' + session.i}
            q={session.queue[session.i]}
            number={session.i + 1}
            total={session.queue.length}
            review={session.review}
            words={words}
            speak={speak}
            onAnswered={answered}
            onNext={next}
          />
        )}
      </div>
    </>
  );
}
