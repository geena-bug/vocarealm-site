import { useEffect, useRef, useState } from 'react';

// Records one spoken reply with MediaRecorder, up to `maxSeconds`. `clip` is { blob, url } once a recording
// with audio has finished. `reset()` stops any recording and forgets the clip (call it when the turn changes).
export function useRecorder({ maxSeconds, onStatus }) {
  const [state, setState] = useState('idle'); // idle | starting | recording | stopping
  const [clip, setClip] = useState(null);
  const live = useRef({ recorder: null, stream: null, timer: null, epoch: 0 });

  function reset() {
    const l = live.current;
    l.epoch++;
    clearInterval(l.timer);
    if (l.recorder?.state === 'recording') {
      l.recorder.onstop = null;
      l.recorder.stop();
    }
    l.recorder = null;
    l.stream?.getTracks().forEach((t) => t.stop());
    l.stream = null;
    setState('idle');
    setClip((c) => {
      if (c) URL.revokeObjectURL(c.url);
      return null;
    });
  }

  useEffect(() => reset, []);

  async function toggle() {
    const l = live.current;
    if (l.recorder?.state === 'recording') {
      l.recorder.stop();
      setState('stopping');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      onStatus('Recording is unavailable in this browser. Type your reply instead.');
      return;
    }
    const token = l.epoch;
    setState('starting');
    onStatus('Allow microphone access to record.');
    try {
      const mic = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (token !== l.epoch) return mic.getTracks().forEach((t) => t.stop());
      l.stream = mic;
      window.VocaFrenchAudio?.stop();
      const chunks = [];
      const recorder = new MediaRecorder(mic);
      l.recorder = recorder;
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        clearInterval(l.timer);
        mic.getTracks().forEach((t) => t.stop());
        l.stream = null;
        if (token !== l.epoch) return;
        l.recorder = null;
        setState('idle');
        const blob = new Blob(chunks, { type: recorder.mimeType });
        setClip((old) => {
          if (old) URL.revokeObjectURL(old.url);
          return blob.size ? { blob, url: URL.createObjectURL(blob) } : null;
        });
        onStatus(blob.size ? 'Recording ready. Replay it, then choose Use my reply.' : 'No audio was captured. Try again or type your reply.');
      };
      recorder.start();
      setClip((old) => {
        if (old) URL.revokeObjectURL(old.url);
        return null;
      });
      setState('recording');
      let seconds = 0;
      onStatus('Recording · 0 / ' + maxSeconds + ' seconds');
      l.timer = setInterval(() => {
        seconds++;
        onStatus('Recording · ' + seconds + ' / ' + maxSeconds + ' seconds');
        if (seconds >= maxSeconds && recorder.state === 'recording') {
          recorder.stop();
          setState('stopping');
        }
      }, 1000);
    } catch {
      if (token === l.epoch) {
        setState('idle');
        onStatus('Microphone could not start. Check browser permission or type your reply.');
      }
    }
  }

  return { state, clip, toggle, reset };
}
