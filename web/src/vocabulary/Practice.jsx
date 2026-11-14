import { useEffect, useRef, useState } from 'react';
import { core, readStorage, speak, stopSpeaking, writeStorage } from '../shared/legacy.js';

const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

// Saves a flashcard answer into the same per-user progress record the rest of the site reads.
function record(store, word, correct, setStatus) {
  const key = store.user ? 'vocarealm-user-' + store.user.id : 'vocarealm-v1';
  const blank = { xp: 0, done: {}, missed: [], sessions: 0 };
  const data = readStorage(key, blank) || blank;
  data.vocabularyProgress = data.vocabularyProgress || {};
  const old = data.vocabularyProgress[word.id] || { correctCount: 0, incorrectCount: 0, types: [], afterError: 0, hasLaterReview: false };
  if (correct) {
    old.correctCount++;
    old.afterError++;
    if (!old.types.includes('flashcard')) old.types.push('flashcard');
    if (old.state !== 'mastered') {
      old.state = old.state === 'needs_review' && old.afterError < 2 ? 'needs_review' : old.types.length >= 2 && old.afterError >= 2 ? 'familiar' : 'learning';
    }
    data.xp = (data.xp || 0) + 10;
  } else {
    old.incorrectCount++;
    old.afterError = 0;
    old.state = 'needs_review';
    old.types = [];
    old.hasLaterReview = false;
  }
  data.vocabularyProgress[word.id] = old;
  if (!writeStorage(key, data)) setStatus('Practice result could not be saved on this browser.');
}

function Question({ word, index, total, pool, onAnswer, onNext }) {
  const C = core();
  const [choices] = useState(() =>
    shuffle([
      word.translation,
      ...shuffle([...new Set(pool.map((x) => x.translation).filter((t) => C.norm(t) !== C.norm(word.translation)))]).slice(0, 3),
    ]),
  );
  const [answer, setAnswer] = useState(null);
  const correct = answer === word.translation;
  return (
    <>
      <span className="eyebrow">Word {index + 1} of {total}</span>
      <h2>{word.term}</h2>
      <p>Choose the meaning.</p>
      <button type="button" className="btn" onClick={() => speak(word.term, () => {}, { rate: 0.82 })}>▷ Listen to word</button>
      <div className="choices">
        {choices.map((t) => (
          <button
            key={t}
            type="button"
            className="choice"
            disabled={answer !== null}
            onClick={() => {
              setAnswer(t);
              onAnswer(t === word.translation);
            }}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="status" role="status">
        {answer !== null && (correct ? 'Correct. ' : 'Not quite. ') + word.translation + (word.sentence ? ' · ' + word.sentence : '')}
      </p>
      {answer !== null && (
        <button type="button" className="btn blue" onClick={onNext}>Next word →</button>
      )}
    </>
  );
}

// Ten-word multiple-choice practice over the currently filtered list, shown in the page's <dialog>.
export default function Practice({ quiz, pool, store, onClose, setStatus }) {
  const dialog = useRef(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (quiz) {
      setIndex(0);
      setScore(0);
      if (!dialog.current?.open) dialog.current?.showModal();
    }
  }, [quiz]);

  const word = quiz?.[index];
  return (
    <dialog
      id="vocabPractice"
      aria-labelledby="vocabPracticeLabel"
      ref={dialog}
      onClose={() => {
        stopSpeaking();
        onClose();
      }}
    >
      <button id="closeVocabPractice" type="button" className="btn" onClick={() => dialog.current.close()}>Close ×</button>
      <h2 id="vocabPracticeLabel" className="sr-only">Vocabulary practice</h2>
      <div id="vocabPracticeBody">
        {quiz && !word && (
          <>
            <h2>Practice complete</h2>
            <p>{score}/{quiz.length} correct. Revisit any words you want to hear again.</p>
          </>
        )}
        {word && (
          <Question
            key={index}
            word={word}
            index={index}
            total={quiz.length}
            pool={pool}
            onAnswer={(ok) => {
              if (ok) setScore((s) => s + 1);
              record(store, word, ok, setStatus);
            }}
            onNext={() => setIndex((i) => i + 1)}
          />
        )}
      </div>
    </dialog>
  );
}
