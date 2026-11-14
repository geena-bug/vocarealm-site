import { sceneAssets, sceneDescriptions } from './data.js';
import VoicePanel from './VoicePanel.jsx';

const levelName = (level) => level + ' ' + (level === 'A1' ? 'Beginner' : 'Elementary');
const stateLabel = (data, id) => (data.vocabularyProgress[id]?.state || 'new').replace('_', ' ');

// Photo of a realm with its caption (the caption is hidden on cards by CSS).
export function SceneArt({ realm }) {
  return (
    <div className="polished-scene">
      <img src={sceneAssets[realm.id]} alt={sceneDescriptions[realm.id]} loading="lazy" />
      <div className="scene-caption">{sceneDescriptions[realm.id]}</div>
    </div>
  );
}

// Brand accent: three stacked lines of decreasing length, like lines of dialogue. Decorative only.
export function Lines({ size = 'md' }) {
  return (
    <span className={'lines lines-' + size} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

export function MotionToggle({ app }) {
  return (
    <button data-motion-toggle className="secondary" aria-pressed={app.motionPaused} onClick={app.toggleMotion}>
      {app.motionPaused ? '▶ Resume animations' : 'Ⅱ Pause animations'}
    </button>
  );
}

const linkButton = { display: 'inline-block', padding: '13px 18px', borderRadius: 12, textDecoration: 'none' };

function PathwayPanel() {
  return (
    <section className="panel" style={{ marginBottom: 22 }}>
      <h2>Your French pathway · A1 to C2</h2>
      <p className="muted">Already know some French? Find a starting level without repeating every beginner lesson.</p>
      <div className="row">
        <a href="levels.html" className="secondary" style={linkButton}>
          Choose my level →
        </a>
        <a href="placement.html" className="secondary" style={linkButton}>
          Take placement check →
        </a>
      </div>
    </section>
  );
}

function EverydayWordsPanel() {
  return (
    <section className="panel" style={{ marginTop: 24 }}>
      <h2>Words from your everyday life</h2>
      <p>Save a word you hear, read or discover, then add it to your own practice. Your vocabulary is not limited to 20 words.</p>
      <a href="vocabulary.html" className="primary" style={{ display: 'inline-block', padding: '14px 20px', borderRadius: 12, textDecoration: 'none' }}>
        Open my vocabulary →
      </a>
    </section>
  );
}

function ReviewPanel({ app }) {
  return (
    <section className="panel">
      <h2>Review your conversations</h2>
      <button className="secondary" onClick={app.openReview}>
        Hotel conversation review
      </button>
    </section>
  );
}

function RealmCard({ app, realm }) {
  const { data, level } = app;
  let badge, foot, best, fill;
  if (level === 'A1') {
    const pack = app.contentPacks[realm.id];
    const seen = pack.filter((w) => data.vocabularyProgress[w.id]).length;
    badge = 'A1 · 20 WORDS';
    foot = seen + '/20 introduced · 4 conversations';
    best = Math.round((data.packBest[realm.id] || 0) * 100) + '% best';
    fill = (seen / 20) * 100;
  } else {
    const done = data.done[level + ':' + realm.id];
    badge = done ? '✓ COMPLETED' : level + ' · ELEMENTARY';
    foot = '3 words · 1 conversation';
    best = done ? '100%' : 'Start exploring';
    fill = done ? 100 : 0;
  }
  return (
    <button className="card" onClick={() => app.setup(realm.id)}>
      <div className="card-art">
        <SceneArt realm={realm} />
        <span className="badge">{badge}</span>
      </div>
      <div className="cardbody">
        <h3>
          {realm.name}
          <span style={{ float: 'right', color: '#8a9bad' }}>↗</span>
        </h3>
        <p>{realm.desc}</p>
        <div className="cardfoot">
          <span>{foot}</span>
          <span>{best}</span>
        </div>
        <div className="track">
          <div className="fill" style={{ width: fill + '%' }} />
        </div>
      </div>
    </button>
  );
}

export function Home({ app }) {
  const { data, level, realms } = app;
  return (
    <>
      <PathwayPanel />
      {level === 'A2' && (
        <p className="muted">A2 starter preview · These short lessons introduce the next stage. A1 offers larger, growing vocabulary packs.</p>
      )}
      <div className="intro">
        <div>
          <div className="eyebrow">A WORLD OF WORDS AWAITS</div>
          <h1>A little practice. A world of possibility.</h1>
          <p className="muted">Step into everyday moments. Leave with something to say.</p>
        </div>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">YOUR NEXT ADVENTURE · HOTEL REALM</span>
          <h2>Make yourself at home.</h2>
          <p>A friendly welcome. Your first check-in. Practise the French you’ll actually use.</p>
          <button className="primary" onClick={() => app.setup('hotel')}>
            {data.done[level + ':hotel'] ? 'Practise again' : 'Start your first lesson'} &nbsp; →
          </button>
          <p style={{ fontSize: 11, margin: '14px 0 0' }}>{levelName(level)} &nbsp; · &nbsp; Choose your session size &nbsp; · &nbsp; No pressure</p>
        </div>
        <SceneArt realm={realms[0]} />
      </section>
      <div className="sectionline">
        <h2>Explore the realms</h2>
        <span className="muted">5 places. Endless possibilities.</span>
      </div>
      <div className="grid">
        {realms.map((r) => (
          <RealmCard key={r.id} app={app} realm={r} />
        ))}
      </div>
      <div className="tip">
        <Lines />
        <div>
          <b>Build confidence, one conversation at a time.</b>
          <br />
          <span className="muted">Listen, learn a few words, then put them to use in a real-life scene.</span>
        </div>
      </div>
      <div className="scene-actions">
        <span className="muted">Illustrated scenes with gentle motion · pause at any time</span>
        <MotionToggle app={app} />
      </div>
      <section className="panel" style={{ marginTop: 25 }}>
        <h2>Discover more worlds</h2>
        <p>Shopping, directions, news, celebrations, work and more. Explore all 20 realms.</p>
        <a className="primary" style={{ display: 'inline-block', padding: '14px 22px', borderRadius: 12, textDecoration: 'none' }} href="realms.html">
          Explore the complete catalogue →
        </a>
      </section>
      <EverydayWordsPanel />
      <ReviewPanel app={app} />
    </>
  );
}

export function Progress({ app }) {
  const { data, level, realms } = app;
  const hotelPack = window.hotelPack;
  return (
    <>
      <PathwayPanel />
      <div className="eyebrow">YOUR JOURNEY</div>
      <h1>Every word is a step forward.</h1>
      <p className="muted">Your practice on this browser.</p>
      <div className="row">
        <div className="metric">
          <strong>{data.xp}</strong>XP earned
        </div>
        <div className="metric">
          <strong>{data.sessions}</strong>Lessons completed
        </div>
        <div className="metric">
          <strong>{realms.filter((r) => data.done[level + ':' + r.id]).length}/5</strong>Realms explored
        </div>
      </div>
      <div className="panel">
        <h2>Your realms</h2>
        {realms.map((r) => (
          <p className="row" key={r.id}>
            <span>{r.name}</span>
            <span>{data.done[level + ':' + r.id] ? '✓ Lesson completed' : 'Ready to explore'}</span>
          </p>
        ))}
      </div>
      <div className="panel">
        <h2>Words to revisit</h2>
        {data.missed.length ? (
          data.missed.map((w) => (
            <p key={w[0]}>
              {w[0]} <span className="muted">— {w[1]}</span> <button onClick={() => app.listen(w[0])}>Listen</button>
            </p>
          ))
        ) : (
          <p className="muted">Words you miss in lessons will appear here.</p>
        )}
      </div>
      <div className="panel">
        <h2>Hotel starter vocabulary</h2>
        {hotelPack.map((w) => (
          <p className="row" key={w.id}>
            <span>
              {w.term} <span className="muted">{w.translation}</span>
            </span>
            <span>{stateLabel(data, w.id)}</span>
          </p>
        ))}
        <button className="secondary" onClick={() => app.reviewRealm('hotel')}>
          Review introduced Hotel words
        </button>
      </div>
      <div className="panel">
        <h2>Review another realm</h2>
        <p className="muted">Review words you’ve introduced in your A1 lessons.</p>
        {app.a1Realms
          .filter((r) => r.id !== 'hotel')
          .map((r) => (
            <button key={r.id} className="secondary" style={{ margin: 5 }} onClick={() => app.reviewRealm(r.id)}>
              {r.name}
            </button>
          ))}
      </div>
      <div className="panel">
        <h2>Your expanded A1 realms</h2>
        {app.a1Realms
          .filter((r) => r.id !== 'hotel')
          .map((r) => {
            const pack = app.contentPacks[r.id];
            return (
              <details key={r.id} style={{ padding: '15px 0', borderBottom: '1px solid var(--line)' }}>
                <summary style={{ cursor: 'pointer', minHeight: 44, fontWeight: 650 }}>
                  {r.name} · {pack.filter((w) => data.vocabularyProgress[w.id]).length}/20 introduced
                </summary>
                {pack.map((w) => (
                  <p className="row" key={w.id}>
                    <span>
                      {w.term} <span className="muted">— {w.translation}</span>
                    </span>
                    <span>{stateLabel(data, w.id)}</span>
                  </p>
                ))}
              </details>
            );
          })}
      </div>
      <EverydayWordsPanel />
      <ReviewPanel app={app} />
    </>
  );
}

function AudioSettings({ app }) {
  const voices = app.frenchVoices;
  return (
    <div className="panel">
      <h2>Audio settings</h2>
      <p className="muted">Playback uses an installed French voice. Select a voice, then test your sound.</p>
      <label htmlFor="voiceChoice">French voice</label>
      <select id="voiceChoice" value={app.voiceName || ''} onChange={(e) => app.setVoiceName(e.target.value)}>
        {voices.length ? (
          voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name} ({v.lang})
            </option>
          ))
        ) : (
          <option value="">No French voice found — try the system default</option>
        )}
      </select>
      <label htmlFor="speechRate">Playback speed</label>
      <select id="speechRate" value={app.audioRate} onChange={(e) => app.setAudioRate(Number(e.target.value))}>
        <option value={0.82}>Slow</option>
        <option value={1}>Normal</option>
      </select>
      <button className="primary" onClick={() => app.listen('Bonjour ! Bienvenue à VocaRealm.')}>
        Test French audio
      </button>
      <p className="muted">If the device has no French voice, install one in its speech settings. The app cannot supply a recorded voice yet.</p>
    </div>
  );
}

export function Profile({ app }) {
  const { level } = app;
  return (
    <>
      <PathwayPanel />
      <div className="eyebrow">YOUR SPACE</div>
      <h1>Make learning your own.</h1>
      <div className="panel">
        <h2>French for everyday life</h2>
        <p className="muted">Target language: French · Support language: English · Level: {levelName(level)}</p>
        <p>This first version includes guided conversations and browser text-to-speech. Progress is saved on this device.</p>
        <button className="secondary" onClick={() => confirm('Reset all learning progress on this browser?') && app.resetProgress()}>
          Reset learning progress
        </button>
      </div>
      <VoicePanel target="Bonjour ! Je voudrais pratiquer le français." listen={app.listen} registerStatus={app.registerStatus} />
      <p className="muted">
        These are VocaRealm practice stages, not a CEFR certification. Speech recognition checks the transcript, not pronunciation quality.
      </p>
      <AudioSettings app={app} />
      <EverydayWordsPanel />
      <ReviewPanel app={app} />
    </>
  );
}
