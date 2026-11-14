import { useEffect, useState } from 'react';

const review = () => window.VocaConversationReview; // storage + text checks from conversation-review.js

function extension(type) {
  return type.includes('mp4') ? '.m4a' : type.includes('ogg') ? '.ogg' : '.webm';
}

// Plays a recorded reply; the object URL lives only as long as this player.
function Recording({ blob, index }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  if (!url) return null;
  return (
    <>
      <audio controls preload="none" src={url} />
      <a href={url} download={'vocarealm-turn-' + (index + 1) + extension(blob.type)}>Download my recording</a>
    </>
  );
}

function Turn({ session, turn }) {
  const [feedback, setFeedback] = useState('');
  const [corrected, setCorrected] = useState(turn.corrected || '');
  const issues = review().suggestions(turn.text);
  const pieces = [];
  let at = 0;
  issues.forEach((issue, i) => {
    pieces.push(<span key={'t' + i}>{turn.text.slice(at, issue.start)}</span>, <mark key={'m' + i}>{turn.text.slice(issue.start, issue.end)}</mark>);
    at = issue.end;
  });
  pieces.push(<span key="end">{(turn.text || 'No transcript — listen to your recording.').slice(at)}</span>);

  return (
    <article className="review-turn">
      <h4>Turn {turn.index + 1}</h4>
      {turn.partnerFr && (
        <>
          <strong>Your partner said</strong>
          <p lang="fr">{turn.partnerFr}</p>
          <details>
            <summary>Show English</summary>
            <p>{turn.partnerEn}</p>
          </details>
        </>
      )}
      <strong>Your reply</strong>
      <p lang="fr">{pieces}</p>
      {turn.blob?.size > 0 && <Recording blob={turn.blob} index={turn.index} />}
      <strong>Suggested model reply</strong>
      <p lang="fr">{turn.modelFr}</p>
      <button onClick={() => window.VocaFrenchAudio.play(turn.modelFr, { status: setFeedback })}>Listen to model</button>
      <p role="status">{feedback}</p>
      <details>
        <summary>Show English</summary>
        <p>{turn.modelEn}</p>
      </details>
      {issues.length ? (
        issues.map((issue, i) => (
          <div key={i}>
            <p lang="fr">{issue.text + ' → ' + issue.replacement}</p>
            <p lang="fr">{issue.why}</p>
          </div>
        ))
      ) : (
        <p>{turn.text ? 'No covered text pattern was flagged. This is not a full grammar or pronunciation assessment.' : 'Pronunciation and grammar are not assessed for this recording.'}</p>
      )}
      <label>
        My corrected reply
        <textarea lang="fr" aria-label="My corrected French reply" value={corrected} onChange={(e) => setCorrected(e.target.value)} />
      </label>
      <button
        onClick={async () => {
          turn.corrected = corrected.trim();
          setFeedback((await review().persist(session)) ? 'Correction saved on this browser.' : 'Correction kept for this page only; browser storage is unavailable.');
        }}
      >
        Save correction
      </button>
      <a href={'pronunciation.html?text=' + encodeURIComponent(turn.modelFr)} target="_blank" rel="noopener">Record the model again for practice</a>
    </article>
  );
}

// The learner's last five submitted conversations in a realm, with text checks, recordings and model replies.
// Used by the realm lesson page and the Hotel app.
export default function ConversationReview({ realm }) {
  const [sessions, setSessions] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let current = true;
    review().list(realm).then((list) => current && setSessions(list));
    return () => {
      current = false;
    };
  }, [realm, version]);

  return (
    <>
      <h2>Conversation review</h2>
      <p>
        Your last five conversations in this realm stay on this browser when storage is available. Recordings are not uploaded. If browser storage is unavailable,
        review lasts only until you leave this page.
      </p>
      <p>
        Text guidance checks a few common patterns. A different valid reply is not an error. Audio-only replies have no transcript or verified pronunciation
        assessment; compare your recording with the model.
      </p>
      {sessions?.length === 0 && <p>No submitted replies yet. Take a role and send a reply to start your review.</p>}
      {sessions?.map((session) => (
        <section className="review-session" key={session.id}>
          <h3>{session.title} · {session.role}</h3>
          <small>{new Date(session.created).toLocaleString()}</small>
          <button
            onClick={async () => {
              await review().remove(session.id);
              setVersion((v) => v + 1);
            }}
          >
            Delete this conversation
          </button>
          {session.turns.map((turn) => (
            <Turn key={turn.index} session={session} turn={turn} />
          ))}
        </section>
      ))}
    </>
  );
}
