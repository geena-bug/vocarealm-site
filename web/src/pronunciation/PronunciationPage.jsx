import { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking } from '../shared/legacy.js';
import { toWav } from './wav.js';

const endpoint = 'https://gizmaijlhtwjfmvrlzyv.supabase.co/functions/v1/pronunciation-assessment';
const MAX_SECONDS = 20;
const ERROR_CLASS = { Mispronunciation: 'needs-practice', Omission: 'not-heard', Insertion: 'extra-word', None: 'heard' };
const ERROR_SUFFIX = { Mispronunciation: ' · retry', Omission: ' · not heard', Insertion: ' · extra' };
const ERROR_LABEL = { Mispronunciation: 'Try this word again', Omission: 'Not heard', Insertion: 'Extra word', None: 'Heard' };

function Feedback({ result, say }) {
  return (
    <>
      <h2>Words to practise</h2>
      <p className="tiny">Underlined: try again · Amber: not heard · Blue: extra word. Select any word to hear a slow model.</p>
      <div className="assessedwords" lang="fr">
        {(result.words || []).map((w, i) => {
          const label = ERROR_LABEL[w.errorType] || 'Not assessed';
          return (
            <button
              key={i}
              type="button"
              className={'assessedword ' + (ERROR_CLASS[w.errorType] || '')}
              aria-label={w.word + ' — ' + label + '. Play slow example.'}
              title={label + (Number.isFinite(w.accuracy) ? ' · Provider accuracy ' + Math.round(w.accuracy) + '/100' : '')}
              onClick={() => say(w.word, 0.65)}
            >
              {w.word + (ERROR_SUFFIX[w.errorType] || '')}
            </button>
          );
        })}
      </div>
      <p className="tiny">
        This is automated feedback, not a judgement of your accent. If the recording was noisy or the words were misheard, record again. Omissions and extra words
        are separate from pronunciation errors.
      </p>
    </>
  );
}

// Read-aloud practice: listen to the model, record (max 20 s), replay, and optionally send for assessment.
export default function PronunciationPage({ user }) {
  const [reference, setReference] = useState(() => new URLSearchParams(location.search).get('text')?.slice(0, 500) || 'Bonjour, je voudrais réserver une chambre.');
  const [configured, setConfigured] = useState(null);
  const [status, setStatus] = useState('');
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState(null); // { blob, url }
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const live = useRef({ recorder: null, stream: null, timer: null, clock: null, epoch: 0, request: null });
  const say = (text, rate) => speak(text, setStatus, { rate });

  useEffect(() => {
    fetch(endpoint)
      .then((r) => r.json())
      .then((s) => setConfigured(s.configured === true))
      .catch(() => setConfigured(false));
  }, []);

  function cleanup() {
    const l = live.current;
    l.epoch++;
    clearTimeout(l.timer);
    clearInterval(l.clock);
    if (l.recorder?.state === 'recording') {
      l.recorder.onstop = null;
      l.recorder.stop();
    }
    l.recorder = null;
    l.stream?.getTracks().forEach((t) => t.stop());
    l.stream = null;
    setRecording(false);
    setClip((c) => {
      if (c) URL.revokeObjectURL(c.url);
      return null;
    });
  }

  useEffect(() => {
    const leave = () => {
      live.current.request?.abort();
      cleanup();
      stopSpeaking();
    };
    window.addEventListener('pagehide', leave);
    return () => window.removeEventListener('pagehide', leave);
  }, []);

  async function record() {
    const l = live.current;
    if (l.recorder?.state === 'recording') {
      l.recorder.stop();
      return;
    }
    if (!reference.trim()) return setStatus('Add a French word or short sentence first.');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return setStatus('Recording is unavailable in this browser. You can listen to the model instead.');
    cleanup();
    const current = l.epoch;
    stopSpeaking();
    setResult(null);
    try {
      setStatus('Requesting microphone access…');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (l.epoch !== current) return stream.getTracks().forEach((t) => t.stop());
      l.stream = stream;
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      l.recorder = recorder;
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        clearTimeout(l.timer);
        clearInterval(l.clock);
        stream.getTracks().forEach((t) => t.stop());
        if (current !== l.epoch) return;
        l.recorder = null;
        setRecording(false);
        const blob = new Blob(chunks, { type: recorder.mimeType });
        if (!blob.size) return setStatus('No audio was captured. Try again.');
        setClip({ blob, url: URL.createObjectURL(blob) });
        setStatus(configured ? 'Recording ready. Replay it, then check your pronunciation when you’re ready.' : 'Recording ready for replay. Assessment is not connected yet.');
      };
      recorder.start();
      setRecording(true);
      const start = Date.now();
      setStatus('Recording · 0:00');
      l.clock = setInterval(() => setStatus('Recording · 0:' + String(Math.floor((Date.now() - start) / 1000)).padStart(2, '0') + ' / 0:20'), 300);
      l.timer = setTimeout(() => recorder.state === 'recording' && recorder.stop(), MAX_SECONDS * 1000);
    } catch (e) {
      cleanup();
      setStatus(e.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow microphone access in your browser settings, then try again.' : 'The microphone could not record. Check your input device and try again.');
    }
  }

  async function check() {
    setBusy(true);
    setStatus('Checking your recording…');
    const request = new AbortController();
    live.current.request = request;
    try {
      const { data: { session } } = await window.vocaAuth.client.auth.getSession();
      if (!session) throw Error('Please log in again to request feedback.');
      const body = new FormData();
      body.append('reference', reference.trim());
      body.append('audio', await toWav(clip.blob), 'reading.wav');
      const r = await fetch(endpoint, { method: 'POST', headers: { Authorization: 'Bearer ' + session.access_token }, body, signal: request.signal });
      const reply = await r.json();
      if (!r.ok || reply.error) throw Error(reply.message || 'Assessment is unavailable. Please try again later.');
      if (!Array.isArray(reply.words) || !reply.words.length) throw Error('No word-level feedback was returned. Please record again.');
      setResult(reply);
      setStatus('Feedback ready. Listen to highlighted words, then try the sentence again.');
    } catch (e) {
      if (e.name !== 'AbortError') setStatus(e.message || 'Assessment failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const availability =
    configured === null
      ? 'Checking assessment availability…'
      : configured
        ? user
          ? 'Read the French text, record, then choose Check pronunciation.'
          : 'Log in to request pronunciation feedback. You can still record and replay.'
        : 'Word-level pronunciation feedback is not connected yet. Listen, record and replay are available. No words will be marked as incorrect without an assessment.';

  return (
    <main>
      <section className="wrap section testwrap">
        <span className="eyebrow">Listen. Say it. Try again.</span>
        <h1>Bring your words to life.</h1>
        <p>Read a French word or short sentence aloud. Listen to the model, record your reading and replay it.</p>
        <p id="pronAvailability" className="notice" role="status">{availability}</p>
        <label htmlFor="pronReference">French text to read</label>
        <textarea
          id="pronReference"
          className="pronreference"
          lang="fr"
          maxLength={500}
          rows={3}
          disabled={busy}
          value={reference}
          onChange={(e) => {
            setReference(e.target.value);
            live.current.request?.abort();
            cleanup();
            setResult(null);
            setStatus('Text changed. Record a new reading of this text.');
          }}
        />
        <div className="actions">
          <button id="pronListen" className="btn" type="button" onClick={() => say(reference, 0.85)}>▷ Listen to the example</button>
          <button id="pronSlow" className="btn" type="button" onClick={() => say(reference, 0.65)}>▷ Listen slowly</button>
          <button id="pronRecord" className="btn blue" type="button" disabled={busy} onClick={record}>
            {recording ? '■ Stop recording' : clip ? '🎙 Record again' : '🎙 Record my reading'}
          </button>
        </div>
        <p id="pronStatus" className="status" role="status">{status}</p>
        <audio id="pronPlayback" controls hidden={!clip} src={clip?.url} />
        <label className="consent">
          <input id="pronConsent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          Send this recording to Microsoft Azure for pronunciation assessment. The recording stays on this page until I request assessment; VocaRealm does not save a
          copy of the audio.
        </label>
        <button id="pronCheck" className="btn blue" type="button" disabled={!(configured && user && clip && consent && !busy)} onClick={check}>
          Check pronunciation
        </button>
        <p className="tiny">
          Maximum 20 seconds per recording. Feedback appears after assessment, not live while speaking. Automatic feedback may be affected by noise or recognition
          errors.
        </p>
        <div id="pronResult">{result && <Feedback result={result} say={say} />}</div>
        <p>
          <a href="vocabulary.html">← Back to vocabulary</a>
        </p>
      </section>
    </main>
  );
}
