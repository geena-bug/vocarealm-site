import { useEffect, useReducer, useRef } from 'react';
import { hotelConversations, hotelVideoClips, sceneAssets, TOTAL_PLANNED_CLIPS } from './data.js';

const ROLE_NAME = { desk: 'Receptionist', guest: 'Guest' };
const READY = 'Ready. Press Play to hear the conversation in French.';
const RECOGNITION_ERRORS = {
  'not-allowed': 'Microphone permission was blocked. Allow microphone access for this site in browser settings, then retry—or type your reply.',
  'service-not-allowed': 'Your browser blocked its speech recognition service. You can type your reply.',
  'audio-capture': 'No microphone was found. Check your input device or type your reply.',
  'no-speech': 'No speech was detected. Try again and speak after “Listening”, or type your reply.',
  network: 'Speech-to-text could not connect. Record my reply still lets you send a voice recording, or you can type.',
  'language-not-supported': 'This speech service does not support French here. Please type your reply.',
};
const review = () => window.VocaConversationReview;

// The Hotel conversation player: watch both characters, or take a role and reply by typing, speech-to-text or a
// voice recording. Playback uses recorded video for the first check-in turns and system French speech elsewhere.
// All playback, recording and recognition state lives in one mutable controller (as the original page did) because
// browser media callbacks need the latest state; `refresh()` re-renders after each change.
function createController(rerender, app) {
  const c = {
    mounted: false,
    s: null,
    token: 0,
    utterance: null,
    watchdog: null,
    video: null,
    pending: null,
    recognition: null,
    recognitionEpoch: 0,
    recognitionTimer: null,
    recorder: null,
    stream: null,
    sendAfterRecording: false,
    limit: null,
    meter: { context: null, frame: null, clock: null },
  };
  const refresh = () => c.mounted && rerender();
  const lines = () => hotelConversations[c.s.kind].lines;
  const line = () => lines()[c.s.index];
  const set = (patch) => {
    Object.assign(c.s, patch);
    refresh();
  };
  const status = (text, error = false) => set({ status: { text, error } });
  const learnerStatus = (text, error = false) => set({ learnerStatus: { text, error } });

  c.learnerTurn = () => !!c.s && !c.s.examplePreview && c.s.role !== 'watch' && line()[0] === c.s.role;
  c.hasVideo = () => c.s.kind === 'checkin' && !!hotelVideoClips[c.s.index] && !c.s.systemAudio[c.s.index];

  c.open = (kind) => {
    c.s = {
      kind,
      index: 0,
      playing: false,
      paused: false,
      finished: false,
      talking: false,
      translations: true,
      voices: { desk: '', guest: '' },
      role: 'watch',
      responses: {},
      drafts: {},
      systemAudio: {},
      examplePreview: null,
      reviewSession: null,
      status: { text: READY },
      learnerStatus: { text: '' },
      showSuggestion: false,
      videoError: false,
      recording: { state: 'idle', clip: null, level: 0, seconds: 0 },
      recognizing: false,
    };
    c.chooseRole('guest');
  };

  // Called whenever the visible turn changes (the original repainted the turn and reset its reply tools).
  c.turnChanged = () => {
    c.clearVoiceReply();
    c.s.showSuggestion = false;
    if (c.learnerTurn()) {
      c.s.learnerStatus = { text: 'Ready. Choose Record my reply, speak French, stop the recording, then send. You can also type.' };
      c.s.status = {
        text: 'Waiting for your reply as ' + (c.s.role === 'guest' ? 'the guest' : 'the receptionist') + '. Speak or type, then choose Send reply & continue.',
      };
    }
    refresh();
  };

  // Rebuilding the player view also resets its status line and any video fallback button.
  c.rebuilt = () => {
    c.s.status = { text: READY };
    c.s.videoError = false;
    c.turnChanged();
  };

  c.stopAudio = () => {
    const v = c.video;
    if (v) {
      v.onended = v.onplay = v.onerror = null;
      v.pause();
    }
    c.token++;
    c.pending = null;
    clearTimeout(c.watchdog);
    if (window.speechSynthesis) window.VocaFrenchAudio.stop();
    c.utterance = null;
    if (c.s) Object.assign(c.s, { playing: false, paused: false, talking: false });
    refresh();
  };

  // Playback starts after React has rendered the current turn (so its <video> exists).
  c.requestPlay = (autoContinue = true, example = false) => {
    c.pending = { autoContinue, example };
    refresh();
  };

  c.runPending = () => {
    if (!c.pending || !c.s) return;
    const { autoContinue, example } = c.pending;
    c.pending = null;
    const started = c.play(autoContinue);
    if (example) {
      if (!started) c.finishExample(c.s.status.text || 'The example audio could not start.');
      else status('Playing the ' + (line()[0] === 'guest' ? 'guest' : 'receptionist') + ' example. This does not submit your reply.');
    }
  };

  // Returns true when audio or video started.
  c.play = (autoContinue = true) => {
    if (c.hasVideo() && !c.learnerTurn() && c.video) return c.playVideo(autoContinue);
    if (c.learnerTurn()) {
      c.stopAudio();
      c.turnChanged();
      status('Your turn. Speak or type, then choose Send reply & continue.');
      return false;
    }
    if (!window.speechSynthesis) {
      status(
        'Audio is unavailable in this browser. You can read both translations and move through the scene. Try a browser with a French speech voice for audio.',
        true,
      );
      return false;
    }
    c.stopAudio();
    const token = c.token;
    const s = c.s;
    const l = line();
    const u = new SpeechSynthesisUtterance(l[1]);
    c.utterance = u;
    u.lang = 'fr-FR';
    const v = speechSynthesis.getVoices().find((x) => x.name === s.voices[l[0]]);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    }
    u.rate = app.audioRate;
    let began = false;
    s.playing = true;
    status('Starting French audio…');
    u.onstart = () => {
      if (token !== c.token) return;
      began = true;
      s.talking = true;
      status(ROLE_NAME[l[0]] + ' is speaking…');
    };
    u.onend = () => {
      if (token !== c.token || c.s !== s) return;
      clearTimeout(c.watchdog);
      s.talking = false;
      c.lineEnded(
        autoContinue,
        'Conversation complete. Replay a line, start again, or try the other scene.',
        'Line finished. Press Play to continue the conversation.',
      );
    };
    u.onerror = (e) => {
      if (token !== c.token) return;
      Object.assign(s, { playing: false, paused: false, talking: false });
      clearTimeout(c.watchdog);
      status('French audio could not play (' + e.error + '). Check your sound and French voice settings. This line has not been skipped.', true);
      if (s.examplePreview) c.finishExample(s.status.text);
    };
    speechSynthesis.resume();
    speechSynthesis.speak(u);
    c.watchdog = setTimeout(() => {
      if (token === c.token && !began) {
        c.stopAudio();
        status(
          'Audio did not start. Check device sound and install or select a French system voice. You can still step through the translated conversation.',
          true,
        );
        if (s.examplePreview) c.finishExample(s.status.text);
      }
    }, 6000);
    return true;
  };

  c.lineEnded = (autoContinue, completeText, lineText) => {
    const s = c.s;
    if (autoContinue && s.index < lines().length - 1) {
      s.index++;
      c.turnChanged();
      c.requestPlay();
      return;
    }
    Object.assign(s, { playing: false, paused: false, finished: autoContinue });
    status(autoContinue ? completeText : lineText);
    if (s.examplePreview) c.finishExample('Example finished. Continue in your chosen role.');
  };

  c.playVideo = (autoContinue) => {
    c.stopAudio();
    const s = c.s;
    const token = c.token;
    const v = c.video;
    Object.assign(s, { playing: true, paused: false });
    v.currentTime = 0;
    v.playbackRate = app.audioRate;
    status('Loading the Hotel video…');
    v.onplay = () => {
      if (c.s !== s || token !== c.token) return;
      s.talking = true;
      status('Playing the ' + (line()[0] === 'desk' ? 'receptionist’s' : 'guest’s') + ' recorded French dialogue.');
    };
    v.onended = () => {
      if (c.s !== s || token !== c.token) return;
      s.talking = false;
      c.lineEnded(autoContinue, 'Conversation complete.', 'Line finished. Replay it or continue.');
    };
    v.onerror = () => c.videoFailed(s, token, 'The video could not load.');
    v.play()?.catch?.(() => c.videoFailed(s, token, 'Video playback was blocked. Tap Play again, or use system audio.'));
    return true;
  };

  c.videoFailed = (s, token, message) => {
    if (c.s !== s || token !== c.token) return;
    Object.assign(s, { playing: false, paused: false, talking: false, videoError: true });
    status(message, true);
    if (s.examplePreview) c.finishExample(message);
  };

  c.useSystemAudio = () => {
    c.s.systemAudio[c.s.index] = true;
    c.s.videoError = false;
    c.turnChanged();
    c.requestPlay();
  };

  c.toggle = () => {
    const s = c.s;
    if (c.hasVideo() && !c.learnerTurn() && c.video) {
      if (s.playing) {
        c.video.pause();
        Object.assign(s, { playing: false, paused: true, talking: false });
        status('Video paused.');
      } else if (s.paused) {
        set({ playing: true, paused: false });
        const token = c.token;
        c.video.play()?.catch?.(() => c.videoFailed(s, token, 'Could not resume the video.'));
      } else c.requestPlay();
      return;
    }
    if (c.learnerTurn() && !s.finished) {
      learnerStatus('It’s your turn. Send your reply using the blue button below.');
      document.getElementById('learnerReply')?.focus();
      return;
    }
    if (s.paused) {
      speechSynthesis.resume();
      Object.assign(s, { paused: false, playing: true, talking: true });
      status('Resumed.');
      return;
    }
    if (s.playing) {
      speechSynthesis.pause();
      Object.assign(s, { paused: true, playing: false, talking: false });
      status('Paused.');
      return;
    }
    if (s.finished) {
      s.index = 0;
      s.finished = false;
      c.turnChanged();
    }
    c.requestPlay();
  };

  c.move = (delta) => {
    const s = c.s;
    if (s.examplePreview) c.finishExample();
    if (delta > 0 && c.learnerTurn() && !s.responses[s.index]) {
      learnerStatus('Send your reply first, or use the hint to get started.', true);
      return;
    }
    c.stopRecognition();
    const wasPlaying = s.playing;
    c.stopAudio();
    s.finished = false;
    s.index = Math.max(0, Math.min(lines().length - 1, s.index + delta));
    c.turnChanged();
    if (wasPlaying) c.requestPlay();
    else status('Ready. Press Play or Replay line to listen.');
  };

  c.replay = () => {
    if (c.learnerTurn()) {
      c.playExample(c.s.index);
      return;
    }
    c.s.finished = false;
    c.requestPlay(false);
  };

  // "Listen to this line" plays any line as an example, even the learner's own, without submitting a reply.
  c.playExample = (index) => {
    const s = c.s;
    if (!lines()[index]) return;
    if (s.examplePreview) c.finishExample();
    c.stopRecognition();
    c.clearVoiceReply();
    c.stopAudio();
    s.examplePreview = { returnIndex: s.index, returnFinished: s.finished };
    s.index = index;
    c.turnChanged();
    c.requestPlay(false, true);
  };

  c.finishExample = (message) => {
    const s = c.s;
    const preview = s?.examplePreview;
    if (!preview) return;
    c.stopAudio();
    s.examplePreview = null;
    s.index = preview.returnIndex;
    s.finished = preview.returnFinished;
    c.turnChanged();
    status(message || 'Example finished. Your role and reply have been kept.');
  };

  c.toggleTranslations = () => set({ translations: !c.s.translations });
  c.revealSuggestion = () => set({ showSuggestion: true });
  c.setLearnerStatus = learnerStatus;

  c.changeConversation = (kind) => {
    if (!hotelConversations[kind]) return;
    if (c.s.examplePreview) c.finishExample();
    c.stopRecognition();
    Object.assign(c.s, { reviewSession: null, responses: {}, drafts: {} });
    c.clearVoiceReply();
    c.stopAudio();
    Object.assign(c.s, { kind, index: 0 });
    c.rebuilt();
  };

  c.chooseRole = (role) => {
    if (!['watch', 'guest', 'desk'].includes(role)) return;
    if (c.s.examplePreview) c.finishExample();
    c.s.reviewSession = null;
    c.clearVoiceReply();
    c.stopAudio();
    c.stopRecognition();
    Object.assign(c.s, { role, index: 0, finished: false, responses: {}, drafts: {} });
    c.rebuilt();
    status(
      role === 'watch'
        ? 'Ready to watch both characters.'
        : 'You are the ' + (role === 'guest' ? 'guest' : 'receptionist') + '. Press Play to begin, or send your reply if it is your turn.',
    );
  };

  c.setVoice = (role, name) => {
    c.s.voices[role] = name;
    if (c.s.playing || c.s.paused) {
      c.stopAudio();
      status('Voice changed. Press Play to hear this line.');
    } else refresh();
  };

  c.setDraft = (text) => {
    c.s.drafts[c.s.index] = text;
    refresh();
  };

  c.useSuggestion = () => {
    c.s.drafts[c.s.index] = line()[1];
    learnerStatus('Suggested line added. You can edit it, then choose Send reply & continue.');
    document.getElementById('learnerReply')?.focus();
  };

  function reviewSession() {
    const s = c.s;
    if (!s.reviewSession)
      s.reviewSession = review().create('hotel', s.kind === 'booking' ? 'Hotel booking' : 'Hotel check-in', s.role === 'guest' ? 'Guest' : 'Receptionist');
    return s.reviewSession;
  }

  c.previousPartnerLine = () =>
    lines()
      .slice(0, c.s.index)
      .reverse()
      .find((l) => l[0] !== c.s.role);

  c.submit = () => {
    const s = c.s;
    if (!c.learnerTurn()) {
      status('Wait for your turn before sending a reply.');
      return;
    }
    if (c.recorder?.state === 'recording') {
      c.sendAfterRecording = true;
      learnerStatus('Finishing your recording before sending…');
      c.recorder.stop();
      return;
    }
    const text = (s.drafts[s.index] || '').trim();
    const clip = s.recording.clip;
    if (text || clip) {
      const index = s.index;
      const l = line();
      const previous = c.previousPartnerLine();
      reviewSession().then((session) =>
        review().capture(session, {
          index,
          text,
          blob: clip?.blob || null,
          partnerFr: previous?.[1] || '',
          partnerEn: previous?.[2] || '',
          modelFr: l[1],
          modelEn: l[2],
        }),
      );
    }
    if (clip) {
      s.responses[s.index] = '🎙 Spoken reply (recorded without transcription)';
      c.clearVoiceReply();
      c.continueRoleplay();
      return;
    }
    if (!text) {
      learnerStatus(
        c.recognition
          ? 'No words have been transcribed yet. Keep speaking, or stop the microphone and type your reply.'
          : 'No reply was captured. Start the microphone and wait for words to appear, or type your reply.',
        true,
      );
      document.getElementById('learnerReply')?.focus();
      return;
    }
    s.responses[s.index] = text;
    c.stopRecognition();
    c.continueRoleplay();
  };

  c.continueRoleplay = () => {
    const s = c.s;
    if (!s.responses[s.index]) return;
    c.stopRecognition();
    c.stopAudio();
    if (s.index === lines().length - 1) {
      s.finished = true;
      status('Role-play complete. You played the ' + (s.role === 'guest' ? 'guest' : 'receptionist') + '. Try switching roles next.');
      return;
    }
    s.index++;
    c.turnChanged();
    c.requestPlay();
  };

  // Optional speech-to-text into the reply box.
  c.stopRecognition = () => {
    c.recognitionEpoch++;
    clearTimeout(c.recognitionTimer);
    const active = c.recognition;
    c.recognition = null;
    if (active) {
      active.onend = active.onresult = active.onerror = null;
      try {
        active.abort();
      } catch {}
    }
    if (c.s) c.s.recognizing = false;
    refresh();
  };

  c.recognize = () => {
    if (!c.learnerTurn()) return;
    if (c.recognition) {
      try {
        learnerStatus('Finishing transcription…');
        c.recognition.stop();
      } catch {
        c.stopRecognition();
      }
      return;
    }
    const R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) {
      learnerStatus(
        'This browser does not expose speech recognition. Type your reply here, or open the site directly in Chrome or Safari and allow microphone access.',
        true,
      );
      document.getElementById('learnerReply')?.focus();
      return;
    }
    c.stopRecognition();
    c.stopAudio();
    const s = c.s;
    const index = s.index;
    const epoch = c.recognitionEpoch;
    const prefix = (s.drafts[index] || '').trim();
    let heard = false;
    let failed = false;
    const active = new R();
    c.recognition = active;
    Object.assign(active, { lang: 'fr-FR', interimResults: true, continuous: true, maxAlternatives: 1 });
    const current = () => c.s === s && s.index === index && c.recognitionEpoch === epoch;
    active.onstart = () => {
      if (!current()) return;
      s.recognizing = true;
      learnerStatus('Listening… speak French now. Your words will appear above.');
      c.recognitionTimer = setTimeout(() => {
        if (current() && !heard)
          learnerStatus(
            'The microphone started, but no transcript has arrived. Speak closer to it, then stop. If no words appear, type your reply—the browser’s recognition service may be unavailable.',
            true,
          );
      }, 10000);
    };
    active.onresult = (e) => {
      if (!current()) return;
      let interim = '';
      let finalized = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalized += t + ' ';
        else interim += t + ' ';
      }
      const text = [prefix, finalized.trim(), interim.trim()].filter(Boolean).join(' ').trim();
      if (!text) return;
      heard = true;
      s.drafts[index] = text;
      learnerStatus(interim ? 'Hearing: ' + text : 'Captured your reply. Check the text, then send it to continue.');
    };
    active.onerror = (e) => {
      if (!current()) return;
      failed = true;
      learnerStatus(RECOGNITION_ERRORS[e.error] || 'Speech recognition stopped (' + e.error + '). Your draft is kept; you can edit or type it.', true);
      clearTimeout(c.recognitionTimer);
    };
    active.onend = () => {
      if (!current()) return;
      clearTimeout(c.recognitionTimer);
      if (c.recognition === active) c.recognition = null;
      s.recognizing = false;
      if (heard) learnerStatus('Microphone stopped. Your reply is in the text box. Send it to continue.');
      else if (!failed) learnerStatus('Speech-to-text ended without returning words. Use Record my reply to send your voice, or type a reply.', true);
      else refresh();
    };
    try {
      learnerStatus('Requesting microphone access…');
      active.start();
    } catch {
      c.stopRecognition();
      learnerStatus('Could not start speech recognition. Check microphone permissions or type your reply.', true);
    }
  };

  // Voice reply recording (≤45 s) with a clock and microphone level meter.
  function stopIndicators() {
    const m = c.meter;
    if (m.frame !== null) cancelAnimationFrame(m.frame);
    m.frame = null;
    clearInterval(m.clock);
    m.context?.close().catch(() => {});
    m.context = null;
  }

  function startIndicators(stream) {
    stopIndicators();
    const started = Date.now();
    const rec = c.s.recording;
    rec.seconds = 0;
    c.meter.clock = setInterval(() => {
      rec.seconds = Math.floor((Date.now() - started) / 1000);
      refresh();
    }, 1000);
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      const context = new AC();
      c.meter.context = context;
      context.resume().catch(() => {});
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      const frame = () => {
        if (c.meter.context !== context) return;
        analyser.getByteTimeDomainData(samples);
        let power = 0;
        for (const x of samples) power += ((x - 128) / 128) ** 2;
        rec.level = Math.min(100, Math.round(Math.sqrt(power / samples.length) * 350));
        refresh();
        c.meter.frame = requestAnimationFrame(frame);
      };
      frame();
    } catch {
      /* Recording still works when a level meter is unsupported. */
    }
  }

  c.clearVoiceReply = () => {
    stopIndicators();
    clearTimeout(c.limit);
    c.sendAfterRecording = false;
    if (c.recorder?.state === 'recording') {
      c.recorder.onstop = null;
      try {
        c.recorder.stop();
      } catch {}
    }
    c.recorder = null;
    c.stream?.getTracks().forEach((t) => t.stop());
    c.stream = null;
    if (c.s) {
      if (c.s.recording.clip) URL.revokeObjectURL(c.s.recording.clip.url);
      c.s.recording = { state: 'idle', clip: null, level: 0, seconds: 0 };
    }
  };

  c.record = async () => {
    if (!c.learnerTurn()) return;
    if (c.recorder?.state === 'recording') {
      c.recorder.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      learnerStatus('Voice recording is unavailable in this browser. Please type a reply.', true);
      return;
    }
    c.stopRecognition();
    c.stopAudio();
    c.clearVoiceReply();
    const s = c.s;
    const index = s.index;
    try {
      learnerStatus('Requesting microphone access for recording…');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (c.s !== s || s.index !== index) return stream.getTracks().forEach((t) => t.stop());
      c.stream = stream;
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      c.recorder = recorder;
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      recorder.onstop = () => {
        stopIndicators();
        clearTimeout(c.limit);
        stream.getTracks().forEach((t) => t.stop());
        if (c.s !== s || s.index !== index) return;
        c.recorder = null;
        const blob = new Blob(chunks, { type: recorder.mimeType });
        s.recording = { state: 'idle', clip: null, level: 0, seconds: 0 };
        if (!blob.size) {
          learnerStatus('The recording was empty. Try again or type your reply.', true);
          return;
        }
        s.recording.clip = { blob, url: URL.createObjectURL(blob) };
        learnerStatus('Voice reply recorded. Listen if you wish, then choose Send reply & continue. No transcript was produced.');
        if (c.sendAfterRecording) {
          c.sendAfterRecording = false;
          c.submit();
        }
      };
      recorder.start();
      s.recording.state = 'recording';
      learnerStatus('Recording your voice… Stop when finished, then send your reply.');
      startIndicators(stream);
      c.limit = setTimeout(() => recorder.state === 'recording' && recorder.stop(), 45000);
    } catch (e) {
      c.clearVoiceReply();
      learnerStatus(
        e.name === 'NotAllowedError'
          ? 'Microphone permission was blocked. Open this site in a browser tab, allow microphone access, then retry—or type your reply.'
          : 'The microphone could not record (' + e.name + '). Check your input device or type a reply.',
        true,
      );
    }
  };

  c.shutdown = () => {
    c.stopRecognition();
    c.clearVoiceReply();
    c.stopAudio();
  };

  return c;
}

function frenchVoices() {
  return window.speechSynthesis ? speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr')) : [];
}

function SceneBubble({ c }) {
  const s = c.s;
  const l = hotelConversations[s.kind].lines[s.index];
  const mine = c.learnerTurn();
  const draft = s.drafts[s.index] || s.responses[s.index] || '';
  const empty = mine && !draft;
  return (
    <div id="sceneDialogBubble" className={'scene-dialog-bubble ' + l[0] + ' ' + (mine ? 'learner' : '')} aria-live="polite" aria-atomic="true">
      <div className="bubble-speaker">
        <span>{mine ? 'You · ' + ROLE_NAME[s.role] : ROLE_NAME[l[0]]}</span>
        <span className="bubble-turn">{s.index + 1 + ' / ' + hotelConversations[s.kind].lines.length}</span>
      </div>
      <p className={'bubble-fr ' + (empty ? 'bubble-learner-prompt' : '')} lang={empty ? 'en' : 'fr'}>
        {mine ? draft || 'À vous ! · Your turn to reply' : l[1]}
      </p>
      {s.translations && (
        <p className="bubble-en">
          <span className="bubble-task-label">{mine ? 'Your task in English' : 'English translation'}</span>
          {l[2]}
        </p>
      )}
    </div>
  );
}

function LearnerReply({ c }) {
  const s = c.s;
  const l = hotelConversations[s.kind].lines[s.index];
  const previous = c.previousPartnerLine();
  const rec = s.recording;
  return (
    <section id="learnerReplyPanel" className="panel">
      {previous && (
        <section className="partner-context">
          <strong>{ROLE_NAME[previous[0]]} said</strong>
          <p lang="fr">{previous[1]}</p>
          <details>
            <summary>Show English</summary>
            <p>{previous[2]}</p>
          </details>
          <button className="secondary" onClick={() => window.VocaFrenchAudio.play(previous[1], { status: (t) => c.setLearnerStatus(t) })}>
            Listen to partner again
          </button>
        </section>
      )}
      <div className="eyebrow">YOUR PARTNER IS WAITING</div>
      <h2>Your reply</h2>
      <p className="muted">Record and send your spoken French reply. Optional speech-to-text can also put your words in the text box.</p>
      <label htmlFor="learnerReply">Your French reply</label>
      <textarea
        id="learnerReply"
        lang="fr"
        rows={3}
        style={{ width: '100%', font: 'inherit', padding: 14, border: '1px solid var(--line)', borderRadius: 12, margin: '10px 0' }}
        placeholder="Optional: type a reply or use speech-to-text…"
        value={s.drafts[s.index] || ''}
        onChange={(e) => c.setDraft(e.target.value)}
      />
      <div className="player-controls">
        <button id="recordReplyButton" className="secondary" onClick={c.record}>
          {rec.state === 'recording' ? '■ Stop recording' : rec.clip ? '🎙 Record again' : '🎙 Record my reply'}
        </button>
        <button id="learnerMic" className="secondary" onClick={c.recognize}>
          {s.recognizing ? '■ Stop transcription' : 'Speech to text (optional)'}
        </button>
        <button className="primary" onClick={c.submit}>
          Send reply & continue →
        </button>
        <button className="secondary" onClick={c.revealSuggestion}>
          Need a hint?
        </button>
      </div>
      <p id="learnerStatus" className={'status' + (s.learnerStatus.error ? ' dialog-error' : '')} role="status">
        {s.learnerStatus.text}
      </p>
      <div id="recordingIndicator" hidden={rec.state !== 'recording'} style={{ padding: 12, background: '#edf8f4', borderRadius: 12 }}>
        <b id="recordingClock">
          Recording · {Math.floor(rec.seconds / 60)}:{String(rec.seconds % 60).padStart(2, '0')}
        </b>
        <label style={{ display: 'block', marginTop: 8 }}>
          Microphone level <meter id="recordingMeter" min={0} max={100} value={rec.level} style={{ width: '100%' }} />
        </label>
        <span style={{ fontSize: 12 }}>Tap Stop recording when finished. Maximum 45 seconds.</span>
      </div>
      <div id="recordedReplyPlayback">
        {rec.clip && (
          <>
            <p>Your voice reply · listen, then send</p>
            <audio controls style={{ maxWidth: '100%' }} src={rec.clip.url} />
          </>
        )}
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Record your voice, listen, then send. Recording does not need speech-to-text and stays on this page. Use optional transcription if you also want written
        words.
      </p>
      <div id="learnerSuggestion" hidden={!s.showSuggestion}>
        <p lang="fr">{l[1]}</p>
        <p className="muted">{l[2]}</p>
        <button className="secondary" onClick={() => c.playExample(s.index)}>
          ▶ Listen to the example
        </button>{' '}
        <button className="secondary" onClick={c.useSuggestion}>
          Put this line in my reply
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Having trouble?{' '}
        <a href={location.href} target="_blank" rel="noopener">
          Open VocaRealm in a browser tab
        </a>{' '}
        and allow microphone access. Your browser may send speech to its recognition service. If transcription is unavailable, you can type. This guided
        conversation follows a script; replies are not graded.
      </p>
    </section>
  );
}

export default function ConversationPlayer({ app, kind, onClose }) {
  const [, refresh] = useReducer((n) => n + 1, 0);
  const ctrl = useRef(null);
  if (!ctrl.current) {
    ctrl.current = createController(refresh, app);
    ctrl.current.open(kind);
  }
  const c = ctrl.current;
  const s = c.s;

  useEffect(() => c.runPending());

  useEffect(() => {
    c.mounted = true;
    const voicesChanged = () => {
      const voices = frenchVoices();
      ['desk', 'guest'].forEach((role, i) => {
        if (!c.s.voices[role] && voices.length) c.s.voices[role] = voices[Math.min(i, voices.length - 1)].name;
      });
      refresh();
    };
    voicesChanged();
    window.speechSynthesis?.addEventListener('voiceschanged', voicesChanged);
    window.addEventListener('pagehide', c.shutdown);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', voicesChanged);
      window.removeEventListener('pagehide', c.shutdown);
      c.shutdown();
      c.mounted = false;
    };
  }, [c]);

  const conversation = hotelConversations[s.kind];
  const l = conversation.lines[s.index];
  const mine = c.learnerTurn();
  const showVideo = c.hasVideo() && !mine;
  const voices = frenchVoices();
  const playLabel =
    mine && !s.finished ? 'Your turn · reply below' : s.paused ? '▶ Resume' : s.playing ? 'Ⅱ Pause' : s.finished ? '↻ Play again' : '▶ Play conversation';

  return (
    <div className="hotel-player">
      <div className="row">
        <button
          className="secondary"
          onClick={() => {
            c.shutdown();
            onClose();
          }}
        >
          ← Back to learning
        </button>
        <span className="eyebrow">WATCH · LISTEN · UNDERSTAND</span>
      </div>
      <h1>A conversation at the hotel.</h1>
      <p className="muted">Listen to both people. Follow the French and reveal the English meaning.</p>
      <div className="row">
        <label htmlFor="dialogScene">Choose a conversation</label>
        <select id="dialogScene" style={{ width: 'auto', margin: 0 }} value={s.kind} onChange={(e) => c.changeConversation(e.target.value)}>
          <option value="booking">1 · Booking a room</option>
          <option value="checkin">2 · Checking in</option>
        </select>
        <div style={{ width: '100%', margin: '15px 0' }}>
          <label htmlFor="dialogRole">Your role</label>
          <select id="dialogRole" value={s.role} onChange={(e) => c.chooseRole(e.target.value)}>
            <option value="watch">Watch both characters · automatic playback</option>
            <option value="guest">I’m the guest · wait for my replies</option>
            <option value="desk">I’m the receptionist · wait for my replies</option>
          </select>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>
            Your partner speaks, then waits for you. Speak or type a reply and send it to continue.
          </p>
        </div>
      </div>
      <div id="conversationStage" className={'dialog-stage speaker-' + l[0] + (s.talking ? ' audio-talking' : '')}>
        <div className="portrait-stage">
          {showVideo ? (
            <video
              key={s.index}
              id="hotelDialogVideo"
              ref={(v) => (c.video = v)}
              playsInline
              preload="metadata"
              poster={sceneAssets.hotel}
              src={hotelVideoClips[s.index]}
              aria-label="French Hotel conversation video"
            />
          ) : (
            <img src={sceneAssets.hotel} alt="A receptionist in a navy blazer speaks with a guest in a teal jacket at a warm hotel reception desk." />
          )}
        </div>
        <span className="stage-speaker desk">
          <span className="audio-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Receptionist
        </span>
        <span className="stage-speaker guest">
          <span className="audio-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Guest
        </span>
        <SceneBubble c={c} />
      </div>
      {s.kind === 'checkin' && (
        <p className="video-stage-note">
          <span className="video-mode-badge">
            Video preview · {Object.keys(hotelVideoClips).length}/{TOTAL_PLANNED_CLIPS} clips available
          </span>
          The first three turns use recorded video and audio. Other turns use illustrated practice; their videos are not installed yet.
        </p>
      )}
      <div className="subtitle-panel" aria-live="off">
        <div className="row">
          <span id="dialogSpeaker" className="speaker-chip">
            {mine ? 'Your turn · ' + ROLE_NAME[s.role] : l[0] === 'desk' ? 'Receptionist · Réceptionniste' : 'Guest · Client'}
          </span>
          <span id="dialogCount" className="muted">
            {s.index + 1 + ' / ' + conversation.lines.length}
          </span>
        </div>
        <p id="dialogFrench" lang="fr" className="subtitle-fr">
          {mine ? s.drafts[s.index] || s.responses[s.index] || 'What would you say in French?' : l[1]}
        </p>
        <p id="dialogEnglish" className="subtitle-en" hidden={!s.translations}>
          {mine ? 'Your task: ' + l[2] : l[2]}
        </p>
      </div>
      <button id="hotelReviewButton" className="secondary" onClick={() => app.openReview(c.shutdown)}>
        Conversation review
      </button>
      {mine && !(s.finished && s.index === conversation.lines.length - 1) && <LearnerReply key={s.kind + s.index} c={c} />}
      <div className="player-controls">
        <button id="dialogPlay" className="primary" onClick={c.toggle}>
          {playLabel}
        </button>
        <button className="secondary" onClick={() => c.move(-1)}>
          ← Previous
        </button>
        <button className="secondary" onClick={c.replay}>
          ↻ Replay line
        </button>
        <button className="secondary" onClick={() => c.move(1)}>
          Next →
        </button>
        <button id="dialogTranslationToggle" className="secondary" onClick={c.toggleTranslations}>
          {s.translations ? 'Hide English' : 'Show English'}
        </button>
      </div>
      <p id="dialogStatus" className={'status' + (s.status.error ? ' dialog-error' : '')} role="status">
        {s.status.text}
      </p>
      {s.videoError && (
        <button id="systemAudioFallback" className="secondary" onClick={c.useSystemAudio}>
          Use system audio for this line
        </button>
      )}
      <details className="panel">
        <summary style={{ cursor: 'pointer', minHeight: 44 }}>Voices & playback settings</summary>
        <p className="muted">
          Audio uses the French voices on your device. Two different voices are selected when available; otherwise both roles share one voice.
        </p>
        <div className="dialog-voices">
          {['desk', 'guest'].map((role) => (
            <div key={role}>
              <label htmlFor={role + 'Voice'}>{role === 'desk' ? 'Receptionist voice' : 'Guest voice'}</label>
              <select id={role + 'Voice'} value={s.voices[role]} onChange={(e) => c.setVoice(role, e.target.value)}>
                {voices.length ? (
                  voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} · {v.lang}
                    </option>
                  ))
                ) : (
                  <option value="">System French voice</option>
                )}
              </select>
            </div>
          ))}
        </div>
        <label htmlFor="dialogRate">Speed</label>
        <select id="dialogRate" value={app.audioRate} onChange={(e) => app.setAudioRate(Number(e.target.value))}>
          <option value={0.82}>Slow · 0.82×</option>
          <option value={1}>Normal · 1×</option>
        </select>
      </details>
      <details className="panel">
        <summary style={{ cursor: 'pointer', minHeight: 44 }}>Full conversation · French & English</summary>
        <p className="muted" style={{ fontSize: 13 }}>
          “Listen to this line” plays an example for either character, even when that character is your role. It does not send a learner reply. Voice settings
          above apply to system speech; video clips use their recorded voices.
        </p>
        <div id="dialogTranscript">
          {conversation.lines.map((line, i) => (
            <div key={i} className={'transcript-turn' + (i === s.index ? ' current' : '')} data-turn={i}>
              <b>{ROLE_NAME[line[0]]}</b>
              <p lang="fr">{line[1]}</p>
              <p className="muted" data-translation hidden={!s.translations}>
                {line[2]}
              </p>
              <button className="secondary" onClick={() => c.playExample(i)}>
                ▶ Listen to this line
              </button>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
