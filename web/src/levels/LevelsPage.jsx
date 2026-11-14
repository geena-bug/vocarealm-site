import { useState } from 'react';
import { levelContent, levelCore } from '../shared/legacy.js';

// `state` comes from level-state.js: the learner's saved level path ({ data, save }).
export default function LevelsPage({ state }) {
  const codes = levelCore().codes;
  const content = levelContent();
  const requested = new URLSearchParams(location.search).get('level');
  const [selected, setSelected] = useState(codes.includes(requested) ? requested : state.data.selectedLevel);
  const [status, setStatus] = useState('');
  const level = content.levels.find((l) => l.code === selected);

  function choose(code) {
    setSelected(code);
    state.data.selectedLevel = code;
    setStatus(state.save() ? 'Your chosen level is ' + code + '.' : 'Your level is selected for now. Browser storage is unavailable.');
  }

  return (
    <main>
      <section className="wrap section " id="levelRoot">
        <div className="sectionhead">
          <span className="eyebrow">Your French learning path</span>
          <h1>Start where you belong.</h1>
          <p>Choose a level from A1 to C2, or take a written placement check to find a useful starting point. You can revisit earlier levels whenever you want.</p>
        </div>
        <section className="placementpromo">
          <div>
            <h2>Already know some French?</h2>
            <p>Check your foundations and move on to harder questions. Six questions per stage, up to 36 in total. No timer.</p>
          </div>
          <a className="btn blue" href="placement.html">Find my starting level →</a>
        </section>
        {state.data.result && codes.includes(state.data.result.recommended) && (
          <p className="tiny">
            Your last written placement suggestion: {state.data.result.recommended}. Your chosen level: {state.data.selectedLevel}. Saved on this browser.
          </p>
        )}
        <div className="levelgrid">
          {content.levels.map((l) => (
            <article key={l.code} className={'levelcard' + (l.code === selected ? ' chosen' : '')}>
              <span className="levelcode">{l.code}</span>
              <h2>{l.name}</h2>
              <p>{l.description}</p>
              <small className="catalogbadge">{l.availability}</small>
              <button type="button" className="btn" aria-pressed={l.code === selected} onClick={() => choose(l.code)}>
                {l.code === selected ? 'Selected level ✓' : 'Choose ' + l.code}
              </button>
            </article>
          ))}
        </div>
        <section className="selectedlevel">
          <span className="eyebrow">{selected} / {level.name}</span>
          <h2>{level.title}</h2>
          <p>
            {selected === 'A1'
              ? 'Start a full A1 pack in one of five realms, or try a short reading activity.'
              : 'Try an original short reading with three practice questions. Full ' + selected + ' courses and speaking assessments are still being developed.'}
          </p>
          <a className="btn blue" href={'level-practice.html?level=' + selected}>Start {selected} practice →</a>
          {selected === 'A1' && <a className="btn" href="realms.html">Explore full A1 realm packs</a>}
          {selected === 'A2' && <a className="btn" href="learn.html?realm=hotel&course=A2">Try an A2 Hotel scenario</a>}
        </section>
        <p className="tiny">
          The placement check covers selected reading, grammar and written interaction skills. Its questions and thresholds are provisional, not a validated CEFR
          exam. It does not assess speaking, listening or extended writing.
        </p>
        <a className="tiny" href="https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions" target="_blank" rel="noopener">
          About the CEFR levels ↗
        </a>
        <p className="status" id="levelChoiceStatus" role="status">{status}</p>
      </section>
    </main>
  );
}
