import { useState } from 'react';
import { rotatedOrder } from './lesson.js';
import { MotionToggle, SceneArt } from './screens.jsx';
import VoicePanel from './VoicePanel.jsx';

const levelName = (level) => level + ' ' + (level === 'A1' ? 'Beginner' : 'Elementary');

function WatchConversationPanel({ app }) {
  return (
    <div className="workspace panel">
      <div className="eyebrow">WATCH A REAL CONVERSATION</div>
      <h2>Meet the receptionist and guest.</h2>
      <p className="muted">Follow a booking call or a normal check-in, with French audio, animated speaking turns and English translations.</p>
      <button className="primary" onClick={() => app.openPlayer('checkin')}>
        ▶ Watch check-in
      </button>{' '}
      <button className="secondary" onClick={() => app.openPlayer('booking')}>
        ☎ Watch booking
      </button>
    </div>
  );
}

// "Your mission" screen before a lesson: choose the session length, then enter the realm.
export function Setup({ app, realm }) {
  const packLesson = app.level === 'A1';
  const pack = app.contentPacks[realm.id];
  const [length, setLength] = useState(packLesson ? '10' : '7');
  return (
    <>
      <div className="workspace">
        <button className="secondary" onClick={() => app.go('Realms')}>
          ← All realms
        </button>
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ height: 210 }}>
            <SceneArt realm={realm} />
          </div>
          <div style={{ padding: 28 }}>
            <div className="eyebrow">{realm.name} REALM</div>
            <h1>Your mission</h1>
            <p>{realm.mission}</p>
            <label htmlFor="session">Lesson length</label>
            <select id="session" value={length} onChange={(e) => setLength(e.target.value)}>
              {packLesson ? (
                <>
                  <option value="all">All available · {pack.length} words</option>
                  <option value="10">Standard · up to 10 words</option>
                  <option value="5">Quick · up to 5 words</option>
                </>
              ) : (
                <>
                  <option value="7">Full journey · 3 words + challenge + conversation</option>
                  <option value="5">Quick practice · 1 word + challenge + conversation</option>
                </>
              )}
            </select>
            {packLesson && (
              <p className="muted">Your word bank can keep growing. Choose a manageable session; shorter sessions rotate through all available words.</p>
            )}
            <p className="muted">French → English &nbsp; · &nbsp; {levelName(app.level)}</p>
            <button className="primary" onClick={() => (packLesson ? app.startPack(realm.id, length) : app.startStarter(realm.id, Number(length)))}>
              Enter the realm →
            </button>
            {packLesson && <a href={'vocabulary.html?realm=' + realm.id}>Add or practise your own words →</a>}
          </div>
        </div>
      </div>
      <div className="workspace">
        <VoicePanel target="Bonjour !" listen={app.listen} registerStatus={app.registerStatus} />
      </div>
      {realm.id === 'hotel' && <WatchConversationPanel app={app} />}
    </>
  );
}

function Feedback({ q, ok, packLesson, reviewing }) {
  return (
    <>
      <div className={'feedback ' + (ok ? '' : 'bad')}>
        <b>{ok ? '✓ Correct!' + (reviewing ? '' : ' +10 XP') : '↻ Not quite.'}</b>
        <br />
        {q.options[q.answer]}
        {q.example && (
          <>
            <br />
            <span className="muted">{q.example}</span>
          </>
        )}
      </div>
      {packLesson && q.word && (
        <p className="muted">
          {q.word.sentenceTranslation}
          <br />
          {q.word.grammar}
        </p>
      )}
    </>
  );
}

// One question of a lesson. `lesson` comes from the app; `q` is the current question.
export function Question({ app, realm, lesson, q, label, progress }) {
  const [sceneRun, setSceneRun] = useState(0);
  const packLesson = lesson.mode === 'pack';
  const order = rotatedOrder(q.options.length, lesson.step);
  const target = q.type === 'Conversation' ? q.options[q.answer] : q.example || q.prompt;
  const readAloud = q.word?.sentence || q.word?.term || q.prompt;
  return (
    <div className="workspace">
      <div className="row">
        <button className="secondary" onClick={app.leaveLesson}>
          ← Leave lesson
        </button>
        <span className="muted">{label}</span>
      </div>
      <div className="track">
        <div className="fill" style={{ width: progress * 100 + '%' }} />
      </div>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 230 }} key={sceneRun}>
          <SceneArt realm={realm} />
        </div>
        <div style={{ padding: 28 }}>
          <div className="eyebrow">{q.title}</div>
          {q.type === 'Conversation' ? (
            <div className="bubble">
              {q.prompt}
              <small>{q.translation}</small>
            </div>
          ) : (
            <h2 className="word">{q.prompt}</h2>
          )}
          <div style={{ textAlign: 'center' }}>
            <button className="secondary" onClick={() => app.listen(q.prompt)}>
              ♫ Listen
            </button>
          </div>
          <div className="options">
            {order.map((i) => (
              <button key={i} className={'option' + (lesson.selected === i ? ' selected' : '')} id={'o' + i} onClick={() => app.choose(i)}>
                {q.options[i]}
              </button>
            ))}
          </div>
          <VoicePanel key={lesson.step} target={target} listen={app.listen} registerStatus={app.registerStatus} />
          {packLesson && q.word && (
            <p className="muted" style={{ fontSize: 12 }}>
              {q.scene} · {q.word.id}
            </p>
          )}
          <div className="scene-actions">
            <span className="muted" style={{ fontSize: 12 }}>
              Watch the scene, then try the phrase.
            </span>
            <div>
              <button className="secondary" onClick={() => setSceneRun(sceneRun + 1)}>
                ↻ Replay action
              </button>{' '}
              <MotionToggle app={app} />
            </div>
          </div>
          {realm.id === 'hotel' && q.type === 'Conversation' && (
            <button className="secondary" onClick={() => app.openPlayer('checkin')}>
              ▶ Watch the full check-in conversation
            </button>
          )}
          <div id="feedback" aria-live="polite">
            {lesson.checked && <Feedback q={q} ok={lesson.lastOk} packLesson={packLesson} reviewing={lesson.reviewing} />}
          </div>
          <button
            id="check"
            className="primary"
            disabled={lesson.selected < 0}
            onClick={app.check}
            style={{ width: '100%', opacity: lesson.selected < 0 ? 0.5 : 1 }}
          >
            {lesson.checked ? 'Continue →' : 'Check answer'}
          </button>
          <a
            className="read-aloud-link secondary"
            href={'pronunciation.html?text=' + encodeURIComponent(readAloud)}
            target="_blank"
            rel="noopener"
            style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 15, padding: 12, borderRadius: 12 }}
          >
            Read aloud and practise pronunciation →
          </a>
        </div>
      </div>
      <p className="muted" style={{ textAlign: 'center', fontSize: 12 }}>
        Take your time. Mistakes are part of the journey.
      </p>
    </div>
  );
}

// End of an A1 word-pack session (or a review of introduced words).
export function PackResults({ app, realm, result }) {
  return (
    <div className="workspace panel">
      <div className="eyebrow">{realm.name.toUpperCase()} SESSION COMPLETE</div>
      <h1>You’ve put your words to use.</h1>
      <div className="row">
        <div className="metric">
          <strong>
            {result.correct}/{result.baseTotal}
          </strong>
          First-attempt score
        </div>
        <div className="metric">
          <strong>+{result.earned}</strong>XP earned
        </div>
      </div>
      <p>
        Across the {realm.name} pack: {result.familiar} familiar · {result.mastered} mastered. Repeated success across activities builds familiarity; mastery
        also needs a later review session.
      </p>
      <button className="primary" onClick={() => (location.href = 'levels.html')}>
        View your next step →
      </button>{' '}
      <button className="secondary" onClick={() => app.go('Realms')}>
        Explore realms
      </button>
    </div>
  );
}

// End of an A2 starter lesson, with an optional review of missed words.
export function StarterResults({ app, realm, lesson }) {
  const { missed, reviewing, score, earned, order } = lesson;
  return (
    <>
      <div className="workspace panel empty">
        <div style={{ fontSize: 50 }}>✧</div>
        <div className="eyebrow">{reviewing ? 'REVIEW COMPLETE' : 'REALM COMPLETE'}</div>
        <h1>More words. More confidence.</h1>
        <p className="muted">You’ve practised {realm.mission.toLowerCase().replace(/\.$/, '')}.</p>
        <div className="row">
          <div className="metric">
            <strong>
              {score}/{order.length + 4}
            </strong>
            Correct answers
          </div>
          <div className="metric">
            <strong>+{earned}</strong>XP earned
          </div>
        </div>
        <p>{missed.length ? missed.length + ' word(s) could use another look.' : 'You’re ready to try another everyday moment.'}</p>
        {missed.length > 0 && (
          <>
            <button className="secondary" onClick={app.reviewMissed}>
              Review missed words
            </button>{' '}
          </>
        )}
        <button className="primary" onClick={() => app.go('Realms')}>
          Explore another realm →
        </button>
        <p>
          <button onClick={() => app.go('Home')}>Back home</button>
        </p>
      </div>
      <div className="workspace panel">
        <h2>Your next step</h2>
        <p>Continue practising the five A2 scenarios. B1 lessons are not available yet.</p>
        <button className="secondary" onClick={() => (location.href = 'levels.html')}>
          View learning path →
        </button>
      </div>
    </>
  );
}
