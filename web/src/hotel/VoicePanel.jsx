import { useEffect, useEffectEvent, useRef, useState } from 'react';

const normalize = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const RECOGNITION_ERRORS = {
  'not-allowed': 'Microphone access was blocked. Allow it in browser settings, then retry.',
  'no-speech': 'No speech was detected. Try again.',
  network: 'The browser speech service is unavailable. Try Record & replay.',
  'audio-capture': 'No microphone was found. Check your input device.',
};

// "Listen & speak" box: hear the phrase, check what speech recognition hears, or record (≤30 s) and replay.
// While mounted it receives the app's audio status messages (`registerStatus`).
export default function VoicePanel({ target, listen, registerStatus }) {
  const [status, setStatus] = useState('');
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState(null);
  const live = useRef({ recognizer: null, recorder: null, stream: null, timer: null });

  // `registerStatus` comes from a fresh app object each render; only the mount/unmount calls matter.
  const register = useEffectEvent((fn) => registerStatus(fn));

  useEffect(() => {
    register(setStatus);
    const l = live.current;
    return () => {
      register(null);
      l.recognizer?.abort();
      if (l.recorder?.state === 'recording') {
        l.recorder.onstop = null;
        l.recorder.stop();
      }
      l.stream?.getTracks().forEach((t) => t.stop());
      clearTimeout(l.timer);
    };
  }, []);

  useEffect(() => () => clip && URL.revokeObjectURL(clip), [clip]);

  function speakPractice() {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    const l = live.current;
    if (!R) {
      setStatus('Speech recognition is unavailable here. Use Record & replay to hear yourself, or open this site in a browser with speech recognition.');
      return;
    }
    if (l.recognizer) {
      l.recognizer.stop();
      return;
    }
    window.VocaFrenchAudio.stop();
    const r = new R();
    l.recognizer = r;
    r.lang = 'fr-FR';
    r.interimResults = false;
    r.maxAlternatives = 3;
    r.onstart = () => setStatus('Listening… Say the phrase above.');
    r.onresult = (e) => {
      const heard = e.results[0][0].transcript;
      const match = Array.from(e.results[0]).some((a) => normalize(a.transcript) === normalize(target));
      setStatus(
        'Heard: “' + heard + '”. ' + (match ? '✓ The recognised words match the phrase.' : 'Compare this transcript with the phrase above, listen again, then retry.') + ' This is a word match, not a pronunciation score.',
      );
    };
    r.onerror = (e) => setStatus(RECOGNITION_ERRORS[e.error] || 'Speech recognition failed: ' + e.error);
    r.onend = () => {
      l.recognizer = null;
    };
    try {
      r.start();
    } catch {
      l.recognizer = null;
      setStatus('Could not start speech recognition. Try Record & replay.');
    }
  }

  async function toggleRecording() {
    const l = live.current;
    if (l.recorder?.state === 'recording') {
      l.recorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Recording is unavailable in this browser. You can still practise aloud and use the written reply choices.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      l.stream = stream;
      const recorder = new MediaRecorder(stream);
      l.recorder = recorder;
      const chunks = [];
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        clearTimeout(l.timer);
        stream.getTracks().forEach((t) => t.stop());
        setClip(URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })));
        setRecording(false);
        setStatus('Recording ready. It has not been uploaded or scored.');
      };
      recorder.start();
      setRecording(true);
      setStatus('Recording… tap Stop when finished (maximum 30 seconds).');
      l.timer = setTimeout(() => recorder.state === 'recording' && recorder.stop(), 30000);
    } catch {
      setStatus('Microphone could not be opened. Allow microphone access and check your input device.');
    }
  }

  return (
    <section className="voicebox">
      <b>Listen & speak</b>
      <p id="speakTarget">{target}</p>
      <button className="secondary" onClick={() => listen(target)}>▶ Listen</button>
      <button className="secondary" onClick={speakPractice}>🎙 Speak this phrase</button>
      <button className={'secondary' + (recording ? ' recording' : '')} id="recordButton" onClick={toggleRecording}>
        {recording ? '■ Stop recording' : clip ? 'Record again' : 'Record & replay'}
      </button>
      <p>Allow microphone access when asked. Recognition may send audio to your browser’s speech service. Recording stays on this page.</p>
      <div id="voiceStatus" role="status" aria-live="polite" className="status">{status}</div>
      <div id="recordPlayback">
        {clip && (
          <>
            <p>Your recording · listen and compare with the model</p>
            <audio controls style={{ maxWidth: '100%' }} src={clip} />
          </>
        )}
      </div>
    </section>
  );
}
