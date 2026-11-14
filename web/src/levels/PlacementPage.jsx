import { useEffect, useRef, useState } from 'react';
import { levelContent, levelCore } from '../shared/legacy.js';

const QUESTIONS_PER_STAGE = 6;

function shuffledOrders() {
  return Array.from({ length: 36 }, () => {
    const a = [0, 1, 2, 3];
    for (let i = 3; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  });
}

// Heading that takes focus whenever the view changes, so screen readers announce the new question.
function Heading({ children }) {
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), [children]);
  return (
    <h1 ref={ref} tabIndex={-1}>
      {children}
    </h1>
  );
}

function Question({ attempt, onAnswer }) {
  const C = levelCore();
  const bank = levelContent().bank;
  const [selected, setSelected] = useState(null);
  const i = attempt.answers.length;
  const code = C.codes[Math.floor(i / QUESTIONS_PER_STAGE)];
  const q = bank[code][i % QUESTIONS_PER_STAGE];
  const n = (i % QUESTIONS_PER_STAGE) + 1;
  return (
    <>
      <span className="eyebrow">{code} stage · Question {n} of 6</span>
      <Heading>{q.prompt}</Heading>
      <p className="tiny">{q.skill} · Choose one answer.</p>
      <progress max={6} value={n - 1} aria-label={'Question ' + n + ' of 6 in ' + code} />
      {q.text && <blockquote className="readingtext" lang="fr">{q.text}</blockquote>}
      <fieldset className="placementchoices">
        <legend className="sr-only">Answer choices</legend>
        {attempt.orders[i].map((index) => (
          <label className="placementchoice" key={index}>
            <input type="radio" name="placementAnswer" value={index} onChange={() => setSelected(index)} />
            <span>{q.options[index]}</span>
          </label>
        ))}
      </fieldset>
      <div className="actions">
        <button type="button" className="btn blue" disabled={selected === null} onClick={() => onAnswer(selected)}>Continue →</button>
        <button type="button" className="btn" onClick={() => onAnswer(null)}>I don’t know / skip</button>
      </div>
      <p className="tiny">There’s no timer. Completed answers are saved on this browser so you can return later.</p>
    </>
  );
}

function Result({ result, onUse, onRetake }) {
  const C = levelCore();
  const bank = levelContent().bank;
  return (
    <>
      <Heading>{'A useful place to begin: ' + result.recommended}</Heading>
      <p>This suggestion reflects the written questions you answered. You can choose another level, revisit earlier lessons or retake the check.</p>
      <table className="scoretable">
        <caption>Your written stage results</caption>
        <tbody>
          <tr>
            <th>Stage</th>
            <th>Score</th>
            <th>Outcome</th>
          </tr>
          {C.codes.map((code) => {
            const assessed = result.answers.some((a) => a.level === code);
            const score = C.stageScore(result.answers, code);
            return (
              <tr key={code}>
                <th>{code}</th>
                <td>{assessed ? score + '/6' : '—'}</td>
                <td>{assessed ? (score >= 5 ? 'Threshold met' : 'Review recommended') : 'Not assessed'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button type="button" className="btn blue" onClick={onUse}>Use {result.recommended} as my starting level →</button>
      <button type="button" className="btn" onClick={onRetake}>Retake the check</button>
      <a className="btn" href="levels.html">Choose a different level</a>
      <details>
        <summary>Review answers and explanations</summary>
        {result.answers.map((row) => {
          const q = bank[row.level][row.index];
          return (
            <section className="answerreview" key={row.level + row.index}>
              <h3>{row.level} · {q.prompt}</h3>
              <p>Your answer: {row.choice === null ? 'Skipped' : q.options[row.choice]}</p>
              <p>Answer: {q.options[q.answer]}</p>
              <p className="tiny">{q.explanation}</p>
            </section>
          );
        })}
      </details>
      <p className="tiny">
        Provisional placement only. Not a validated CEFR or TEF assessment. Speaking, listening and extended writing still need separate evaluation. Your result is
        saved in this browser.
      </p>
    </>
  );
}

// Written placement: six questions per stage from A1 upward; 5/6 opens the next stage.
export default function PlacementPage({ state }) {
  const C = levelCore();
  const bank = levelContent().bank;
  const [attempt, setAttempt] = useState(state.data.attempt);
  const [view, setView] = useState(() => (C.validateAttempt(state.data.attempt, bank) && state.data.attempt.finished ? 'result' : 'intro'));
  const [saveFailed, setSaveFailed] = useState(false);
  const summary = (a) => C.decide(C.normalizedAnswers(a, bank));
  const valid = C.validateAttempt(attempt, bank);

  function persist(next) {
    state.data.attempt = next;
    if (!state.save()) setSaveFailed(true);
    setAttempt({ ...next });
  }

  function create() {
    persist({ version: 1, answers: [], orders: shuffledOrders() });
    setView('question');
  }

  function finish(a) {
    const answers = C.normalizedAnswers(a, bank);
    const s = summary(a);
    state.data.result = { version: 1, recommended: s.recommended, passed: s.passed, answers, date: new Date().toISOString() };
    persist({ ...a, finished: true });
    setView('result');
  }

  function afterAnswer(a) {
    if (a.answers.length % QUESTIONS_PER_STAGE !== 0) {
      setView('question');
      return;
    }
    const s = summary(a);
    if (s.complete || s.passed.includes('C2')) finish(a);
    else setView('stageEnd');
  }

  function answer(choice) {
    const i = attempt.answers.length;
    const code = C.codes[Math.floor(i / QUESTIONS_PER_STAGE)];
    if (!code || view === 'result') return;
    const next = { ...attempt, answers: [...attempt.answers, { level: code, index: i % QUESTIONS_PER_STAGE, choice }] };
    persist(next);
    afterAnswer(next);
  }

  function resume() {
    const next = { ...attempt, answers: C.normalizedAnswers(attempt, bank) };
    setAttempt(next);
    if (next.answers.length && next.answers.length % QUESTIONS_PER_STAGE === 0) afterAnswer(next);
    else setView('question');
  }

  let body;
  if (view === 'intro') {
    body = (
      <>
        <Heading>Find your French starting point.</Heading>
        <p>
          Begin with six A1 questions. A score of at least 5/6 opens the next stage. We stop when a stage needs more practice, or after C2. Depending on your
          answers, you’ll see 6–36 questions.
        </p>
        <p>Use your own knowledge, without a dictionary or translator. You can skip a question. Answers and explanations appear after the check, rather than during it.</p>
        <p className="tiny">
          This is a provisional written placement check, not a CEFR certificate. It does not test listening, speaking or extended writing. Advanced courses currently
          offer starter practice.
        </p>
        {valid && attempt.answers.length > 0 && !attempt.finished ? (
          <>
            <button type="button" className="btn blue" onClick={resume}>Resume my check →</button>
            <button type="button" className="btn" onClick={() => confirm('Discard this unfinished check and start again?') && create()}>Start again</button>
          </>
        ) : (
          <button type="button" className="btn blue" onClick={create}>Start the check →</button>
        )}
        <a className="btn" href="levels.html">Choose a level myself</a>
      </>
    );
  } else if (view === 'question') {
    body = <Question key={attempt.answers.length} attempt={attempt} onAnswer={answer} />;
  } else if (view === 'stageEnd') {
    const answers = C.normalizedAnswers(attempt, bank);
    const s = summary(attempt);
    const passedCode = C.codes[attempt.answers.length / QUESTIONS_PER_STAGE - 1];
    body = (
      <>
        <Heading>{passedCode + ' foundations checked.'}</Heading>
        <p>
          You scored {C.stageScore(answers, passedCode)}/6 in this stage. Next, try {s.recommended} questions to refine your starting point.
        </p>
        <button type="button" className="btn blue" onClick={() => setView('question')}>Continue to {s.recommended} →</button>
        <button type="button" className="btn" onClick={() => finish(attempt)}>Finish here and use {s.recommended}</button>
        <p className="tiny">Finishing here recommends the next stage because you met the earlier-stage threshold; it does not mean the next stage has been assessed.</p>
      </>
    );
  } else {
    const answers = C.normalizedAnswers(attempt, bank);
    const s = summary(attempt);
    body = (
      <Result
        result={{ recommended: s.recommended, passed: s.passed, answers }}
        onUse={() => {
          state.data.selectedLevel = s.recommended;
          state.save();
          location.href = 'levels.html?level=' + s.recommended;
        }}
        onRetake={() => confirm('Start a new check? Your current result remains until you finish the new one.') && create()}
      />
    );
  }

  return (
    <main>
      <section className="wrap section testwrap" id="placementRoot">
        {body}
        {saveFailed && <p className="tiny" id="saveWarning">Browser storage is unavailable. Keep this tab open to finish your check.</p>}
      </section>
    </main>
  );
}
