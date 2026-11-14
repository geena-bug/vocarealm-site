import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { English } from '../shared/English.jsx';
import { useRecorder } from '../shared/useRecorder.js';

const WATCH = -1;
const CAST_IMAGES = ['cafe', 'school', 'transport', 'life'];
const review = () => window.VocaConversationReview;
const nextIndex = (...args) => window.RealmLearningCore.next(...args);

function PartnerTurn({ line, roleName, watching, speak, onContinue }) {
  const [status, setStatus] = useState('Listen, then continue when ready.');
  // Each turn is mounted once (keyed by line), so it speaks once with the props it was given.
  const playTurn = useEffectEvent((onDone) => {
    speak(line.fr, line.actor, () => watching && onDone());
    if (!window.speechSynthesis && watching) setStatus('Audio unavailable. Use Continue to read each turn.');
  });
  const advance = useEffectEvent(() => onContinue());
  useEffect(() => {
    let timer;
    playTurn(() => (timer = setTimeout(advance, 700)));
    return () => clearTimeout(timer);
  }, []);
  return (
    <>
      <strong>{roleName}</strong>
      <div className="speech-bubble" lang="fr">{line.fr}</div>
      <p role="status">{status}</p>
      <details>
        <summary>English translation</summary>
        <p>{line.en}</p>
      </details>
      <button type="button" onClick={() => speak(line.fr, line.actor)}>Replay line</button>
      <button type="button" onClick={onContinue}>Continue</button>
    </>
  );
}

function MyTurn({ line, previous, roles, speak, onReply }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Waiting for your reply.');
  const recorder = useRecorder({ maxSeconds: 45, onStatus: setStatus });
  return (
    <>
      <strong>{roles[line.actor]}</strong>
      <div className="speech-bubble" lang="fr">Your turn — respond in French.</div>
      <p role="status">{status}</p>
      {previous ? (
        <section className="partner-context">
          <strong>{roles[previous.actor]} said</strong>
          <p lang="fr">{previous.fr}</p>
          <English>{previous.en}</English>
          <button type="button" onClick={() => speak(previous.fr, previous.actor)}>Listen to partner again</button>
        </section>
      ) : (
        <p>You start this conversation. Use the mission or a hint to begin.</p>
      )}
      <details>
        <summary>Show a suggested reply</summary>
        <p lang="fr">{line.fr}</p>
        <p>{line.en}</p>
        <button type="button" onClick={() => speak(line.fr, line.actor)}>Listen to suggested reply</button>
        <a href={'pronunciation.html?text=' + encodeURIComponent(line.fr)} target="_blank">Practise pronunciation of this suggestion</a>
      </details>
      <textarea placeholder="Type your reply in French, or record it below" aria-label="Your French reply" value={text} onChange={(e) => setText(e.target.value)} />
      <button
        type="button"
        onClick={() => {
          if (!text.trim() && !recorder.clip) {
            setStatus('Type a reply or finish a recording first.');
            return;
          }
          onReply(text.trim(), recorder.clip?.blob || null);
        }}
      >
        Use my reply
      </button>
      <button type="button" disabled={recorder.state === 'starting' || recorder.state === 'stopping'} onClick={recorder.toggle}>
        {recorder.state === 'recording' ? 'Stop recording' : recorder.clip ? 'Record again' : 'Record my reply'}
      </button>
      {recorder.clip && <audio controls src={recorder.clip.url} />}
    </>
  );
}

// "Conversation" tab: pick a scene and a role (or watch both), then play it turn by turn.
// Submitted replies are saved to Conversation review on this browser.
export default function Conversation({ realm, meta, pack, progress, save, speak, stopAudio, onReview }) {
  const [sceneIndex, setSceneIndex] = useState('0');
  const [roleChoice, setRoleChoice] = useState('0');
  const [play, setPlay] = useState(null); // { scene, sceneIndex, role, index, run }
  const reviewSession = useRef(null);

  function startScene() {
    stopAudio();
    const role = Number(roleChoice);
    const scene = pack.scenes[sceneIndex];
    reviewSession.current = review().create(realm, scene.title, pack.roles[role] || 'Watch both');
    setPlay({ scene, sceneIndex, role, index: 0, run: Date.now() });
  }

  function advance(event) {
    const index = nextIndex(play.scene.lines, play.index, play.role, event);
    if (index === play.index) return;
    stopAudio();
    if (index >= play.scene.lines.length && play.role !== WATCH) {
      progress.realmPackProgress = progress.realmPackProgress || {};
      progress.realmPackProgress[realm + ':' + play.sceneIndex + ':' + play.role] = true;
      save();
    }
    setPlay({ ...play, index });
  }

  function changed(setter) {
    return (e) => {
      setter(e.target.value);
      stopAudio();
      setPlay('changed');
    };
  }

  let body = null;
  if (play === 'changed') {
    body = <p>Press Start conversation with your new choices.</p>;
  } else if (play && play.index >= play.scene.lines.length) {
    body = (
      <>
        <h3>Scene complete</h3>
        <p>You practised {play.scene.title}. Try the other role or the next scene.</p>
        <button type="button" onClick={onReview}>Review this conversation</button>
      </>
    );
  } else if (play) {
    const { scene, index, role } = play;
    const line = scene.lines[index];
    const mine = line.actor === role;
    const previous = scene.lines.slice(0, index).reverse().find((l) => l.actor !== role);
    body = (
      <>
        <p>{scene.mission}</p>
        <p>{'Turn ' + (index + 1) + ' / ' + scene.lines.length + ' · ' + (mine ? 'Your turn' : pack.roles[line.actor])}</p>
        {mine ? (
          <MyTurn
            key={play.run + ':' + index}
            line={line}
            previous={previous}
            roles={pack.roles}
            speak={speak}
            onReply={(text, blob) => {
              const session = reviewSession.current;
              session.then((s) =>
                review().capture(s, { index, partnerFr: previous?.fr || '', partnerEn: previous?.en || '', text, blob, modelFr: line.fr, modelEn: line.en }),
              );
              advance('reply');
            }}
          />
        ) : (
          <PartnerTurn
            key={play.run + ':' + index}
            line={line}
            roleName={pack.roles[line.actor]}
            watching={role === WATCH}
            speak={speak}
            onContinue={() => advance('partner-ended')}
          />
        )}
      </>
    );
  }

  return (
    <>
      {CAST_IMAGES.includes(realm) && <img className="lesson-cast" src={'/assets/' + realm + '-cast-v3.png'} alt={meta.name + ' conversation characters'} />}
      <h2>Take part in the conversation</h2>
      <p>
        Choose either role, or watch both. Scripted practice uses browser French audio and text. Submitted replies and recordings are kept in Conversation review on
        this browser. Automatic pronunciation assessment is not connected.
      </p>
      <div className="role-tools">
        <select aria-label="Conversation scene" value={sceneIndex} onChange={changed(setSceneIndex)}>
          {pack.scenes.map((s, i) => (
            <option key={i} value={i}>{s.title}</option>
          ))}
        </select>
        <select aria-label="Your role" value={roleChoice} onChange={changed(setRoleChoice)}>
          {pack.roles.map((r, i) => (
            <option key={i} value={i}>I am the {r}</option>
          ))}
          <option value={WATCH}>Watch both</option>
        </select>
        <button type="button" onClick={startScene}>Start conversation</button>
      </div>
      <div>{body}</div>
    </>
  );
}
