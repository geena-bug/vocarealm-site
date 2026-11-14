import { useState } from 'react';
import { levelContent, levelCore } from '../shared/legacy.js';

const QUESTIONS = 3;

// Three-question starter reading for the chosen (or ?level=) CEFR level.
export default function LevelPracticePage({ state }) {
  const requested = new URLSearchParams(location.search).get('level');
  const level = levelCore().codes.includes(requested) ? requested : state.data.selectedLevel;
  const pack = levelContent().practice[level];
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);
  const q = pack.qs[index];

  function restart() {
    setIndex(0);
    setScore(0);
    setPicked(null);
    setChecked(false);
    setFinished(false);
  }

  function next() {
    if (!checked) {
      setChecked(true);
      if (picked === q.answer) setScore(score + 1);
      return;
    }
    if (index === QUESTIONS - 1) {
      state.data.practice = state.data.practice || {};
      state.data.practice[level] = { lastScore: score, total: QUESTIONS, date: new Date().toISOString() };
      state.save();
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setPicked(null);
    setChecked(false);
  }

  if (finished) {
    return (
      <main>
        <section className="wrap section testwrap" id="practiceRoot">
          <span className="eyebrow">{level} starter complete</span>
          <h1>Keep your French moving.</h1>
          <p>
            {score}/3 correct. Revisit the text or choose another practice activity. Completing this sample does not establish that you have mastered {level}.
          </p>
          <a className="btn blue" href={'levels.html?level=' + level}>Back to my learning path →</a>
          <button className="btn" onClick={restart}>Practise again</button>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="wrap section testwrap" id="practiceRoot">
        <span className="eyebrow">{level} starter practice · {index + 1}/3</span>
        <h1>{pack.title}</h1>
        <blockquote className="readingtext" lang="fr">{pack.text}</blockquote>
        <h2>{q.prompt}</h2>
        <fieldset className="placementchoices" disabled={checked} key={index}>
          <legend className="sr-only">Answer choices</legend>
          {q.options.map((text, i) => (
            <label className="placementchoice" key={i}>
              <input type="radio" name="practiceAnswer" onChange={() => setPicked(i)} />
              <span>{text}</span>
            </label>
          ))}
        </fieldset>
        <p className="status" role="status">
          {checked && (picked === q.answer ? 'Correct. ' : 'Not quite. ') + q.options[q.answer] + ' — ' + q.explanation}
        </p>
        <button className="btn blue" disabled={picked === null} onClick={next}>
          {!checked ? 'Check answer' : index === QUESTIONS - 1 ? 'See practice result →' : 'Next question →'}
        </button>
        <p className="tiny">Short practice sample, not a complete {level} course. This activity does not change your placement recommendation.</p>
      </section>
    </main>
  );
}
