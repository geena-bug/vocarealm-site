import { useEffect, useMemo, useRef, useState } from 'react';
import ConversationReview from '../shared/ConversationReview.jsx';
import { readStorage, stopSpeaking, writeStorage } from '../shared/legacy.js';
import ConversationPlayer from './ConversationPlayer.jsx';
import { a1Realms, hotelDialogues, realmsFor } from './data.js';
import { emptyProgress, exercise, logAttempt, newSession, rememberMissed, reviewSession, starterQuestion } from './lesson.js';
import { PackResults, Question, Setup, StarterResults } from './Lesson.jsx';
import { Home, Profile, Progress } from './screens.jsx';

const NAV = [
  ['Home', '⌂'],
  ['Realms', '◈'],
  ['Progress', '▥'],
  ['Profile', '◉'],
];

// Each A1 realm's practice words: the course words plus the learner's own A1 (or unlevelled) words for that realm.
function buildPacks(store) {
  const C = window.VocaVocabularyCore;
  return Object.fromEntries(
    a1Realms.map(({ id }) => {
      const built = window.vocaBuiltins.filter((w) => w.scenarioId === id && w.source === 'course');
      const custom = store.items
        .filter((w) => w.realm === id && (!w.level || w.level === 'A1'))
        .map((w) => ({
          ...w,
          id: 'user_' + w.id,
          translation: w.meaning,
          sentence: w.example,
          sentenceTranslation: w.example_translation,
          scenarioId: id,
          sceneId: 'My words · ' + id,
        }));
      const merged = C.merge(built, custom);
      return [id, merged.map((w) => C.exerciseWord(w, merged))];
    }),
  );
}

function AccountSlot({ account, levelCode }) {
  const [message, setMessage] = useState('');
  async function logout() {
    const { error } = await window.vocaAuth.client.auth.signOut({ scope: 'local' });
    if (error) setMessage('Could not log out. Please try again.');
    else location.replace('index.html');
  }
  return (
    <div className="sidebottom">
      <b>{account.profile?.username || (account.user ? 'Learner' : 'Guest learner')}</b>
      <p style={{ fontSize: 11 }}>Progress saved on this browser</p>
      {account.user ? (
        <button className="secondary" onClick={logout}>
          Log out
        </button>
      ) : (
        <a className="secondary" href="login.html">
          Log in
        </a>
      )}
      <p id="accountNavStatus" role="status" style={{ fontSize: 12 }}>
        {message}
      </p>
      <a href="levels.html" style={{ display: 'block', marginTop: 15, color: '#2563eb', fontSize: 12 }}>
        My learning level · {levelCode} →
      </a>
      <a href="vocabulary.html" style={{ display: 'block', marginTop: 12, color: '#2563eb' }}>
        My vocabulary →
      </a>
    </div>
  );
}

// Where the page opens: ?realm=hotel (or ?realm=x&course=A2) goes to that realm, ?practice=hotel to the conversation player.
function initialView() {
  const params = new URLSearchParams(location.search);
  const realm = params.get('realm');
  if (a1Realms.some((r) => r.id === realm)) return { name: 'setup', realmId: realm, level: params.get('course') === 'A2' ? 'A2' : 'A1' };
  if (params.get('practice') === 'hotel') return { name: 'player', kind: 'checkin', previous: { name: 'Home' } };
  return { name: 'Home' };
}

export default function HotelApp({ account, store, levelState }) {
  const progressKey = account.user ? 'vocarealm-user-' + account.user.id : 'vocarealm-v1';
  const data = useRef(null);
  if (!data.current) data.current = window.normalizeLearningProgress(readStorage(progressKey, null));
  const start = initialView();
  const [level, setLevel] = useState(start.level || 'A1');
  const [view, setView] = useState(start);
  const [lesson, setLesson] = useState(null);
  const [globalStatus, setGlobalStatus] = useState(null);
  const [audioRate, setAudioRate] = useState(0.82);
  const [voiceName, setVoiceName] = useState(null);
  const [voiceList, setVoiceList] = useState([]);
  const [motionPaused, setMotionPaused] = useState(() => localStorage.getItem('vocarealm-motion') === 'paused');
  const [reviewOpen, setReviewOpen] = useState(0);
  const statusTarget = useRef(null);
  const reviewDialog = useRef(null);
  const contentPacks = useMemo(() => buildPacks(store), [store]);
  const realms = useMemo(() => realmsFor(level), [level]);

  // Non-Hotel A1 realms have their own full lesson page.
  if (view.name === 'setup' && view.realmId !== 'hotel' && (view.level || level) === 'A1') location.replace('realm-learning.html?realm=' + view.realmId);

  useEffect(() => {
    document.body.classList.toggle('motion-paused', motionPaused);
  }, [motionPaused]);

  useEffect(() => {
    const load = () => {
      const voices = window.speechSynthesis ? speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr')) : [];
      setVoiceList(voices);
      setVoiceName((current) => current ?? voices[0]?.name ?? null);
    };
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    const signedInElsewhere = (e) => e.key === 'vocarealm-auth-session' && location.reload();
    window.addEventListener('storage', signedInElsewhere);
    window.addEventListener('pagehide', stopSpeaking);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', load);
      window.removeEventListener('storage', signedInElsewhere);
      window.removeEventListener('pagehide', stopSpeaking);
    };
  }, []);

  useEffect(() => {
    if (reviewOpen && !reviewDialog.current.open) reviewDialog.current.showModal();
  }, [reviewOpen]);

  const persist = () => writeStorage(progressKey, data.current);
  const C = () => window.VocaVocabularyCore;

  // Audio status goes to the visible "Listen & speak" box when there is one, otherwise under the header.
  function status(text) {
    if (statusTarget.current) statusTarget.current(text);
    else setGlobalStatus(text);
  }

  function show(next) {
    stopSpeaking();
    setGlobalStatus((s) => (s === null ? null : ''));
    setView(next);
    window.scrollTo(0, 0);
  }

  const app = {
    data: data.current,
    level,
    realms,
    a1Realms,
    contentPacks,
    audioRate,
    setAudioRate,
    voiceName,
    setVoiceName,
    frenchVoices: voiceList,
    motionPaused,
    toggleMotion() {
      const next = !motionPaused;
      localStorage.setItem('vocarealm-motion', next ? 'paused' : 'playing');
      setMotionPaused(next);
    },
    registerStatus(fn) {
      statusTarget.current = fn;
    },
    listen(text) {
      window.VocaFrenchAudio.play(text, { rate: audioRate, voiceName: voiceName || undefined, status });
    },
    go(page) {
      if (page === 'Realms') {
        location.href = 'realms.html';
        return;
      }
      setLesson(null);
      show({ name: page });
    },
    setup(id) {
      if (id !== 'hotel' && level === 'A1') {
        location.href = 'realm-learning.html?realm=' + encodeURIComponent(id);
        return;
      }
      setLesson(null);
      show({ name: 'setup', realmId: id });
    },
    startPack(realmId, length) {
      const pack = contentPacks[realmId].slice();
      const session = newSession(pack, length, data.current.packCursor[realmId] || 0, { C: C(), dialogues: realmId === 'hotel' ? hotelDialogues : [] });
      data.current.packCursor[realmId] = session.nextCursor;
      setLesson({
        mode: 'pack',
        realmId,
        pack,
        queue: session.queue,
        step: 0,
        selected: -1,
        checked: false,
        correct: 0,
        earned: 0,
        missed: [],
        review: false,
        session: 'session-' + Date.now(),
        wordCount: session.wordCount,
        baseTotal: session.queue.length,
      });
      show({ name: 'lesson' });
    },
    reviewRealm(realmId) {
      const pack = contentPacks[realmId];
      const queue = reviewSession(pack, data.current.vocabularyProgress, { C: C() });
      if (!queue.length) {
        alert(
          realmId === 'hotel'
            ? 'Start a Hotel lesson first. Introduced words will be available here.'
            : 'Start a lesson in this realm first. Introduced words will appear here.',
        );
        return;
      }
      setLevel('A1');
      setLesson({
        mode: 'pack',
        realmId,
        pack,
        queue,
        step: 0,
        selected: -1,
        checked: false,
        correct: 0,
        earned: 0,
        missed: [],
        review: true,
        session: 'session-' + Date.now(),
        wordCount: 0,
        baseTotal: queue.length,
      });
      show({ name: 'lesson' });
    },
    startStarter(realmId, length) {
      setLesson({
        mode: 'starter',
        realmId,
        order: length === 5 ? [0] : [0, 1, 2],
        step: 0,
        selected: -1,
        checked: false,
        score: 0,
        earned: 0,
        missed: [],
        reviewing: false,
      });
      show({ name: 'lesson' });
    },
    reviewMissed() {
      setLesson({ ...lesson, reviewing: true, step: 0, selected: -1, checked: false });
      show({ name: 'lesson' });
    },
    choose(i) {
      if (!lesson.checked) setLesson({ ...lesson, selected: i });
    },
    check() {
      if (lesson.checked) return app.next();
      if (lesson.selected < 0) return;
      const q = currentQuestion();
      const ok = lesson.selected === q.answer;
      const d = data.current;
      if (lesson.mode === 'pack') {
        logAttempt(d, q, ok, lesson.session);
        const next = { ...lesson, checked: true, lastOk: ok };
        if ((!q.review || lesson.review) && ok) next.correct++;
        if (ok) {
          next.earned += 10;
          d.xp += 10;
        } else if (q.word) {
          const opts = { pack: lesson.pack, C: C(), review: true };
          next.queue = [...lesson.queue, exercise(q.word, 'flashcard', opts), exercise(q.word, 'sentence', opts)];
          if (!lesson.missed.some((w) => w[0] === q.word.term)) next.missed = [...lesson.missed, [q.word.term, q.word.translation, q.word.sentence]];
        }
        persist();
        setLesson(next);
        return;
      }
      const next = { ...lesson, checked: true, lastOk: ok };
      if (!lesson.reviewing) {
        if (ok) {
          next.score++;
          next.earned += 10;
          d.xp += 10;
          persist();
        } else if (q.word) next.missed = [...lesson.missed, q.word];
      }
      setLesson(next);
    },
    next() {
      stopSpeaking();
      const d = data.current;
      const step = lesson.step + 1;
      if (lesson.mode === 'pack') {
        if (step < lesson.queue.length) return setLesson({ ...lesson, step, selected: -1, checked: false });
        d.sessions++;
        d.done['A1:' + lesson.realmId] = true;
        if (lesson.wordCount >= lesson.pack.length && !lesson.review) {
          d.packBest[lesson.realmId] = Math.max(d.packBest[lesson.realmId] || 0, lesson.correct / lesson.baseTotal);
          if (lesson.realmId === 'hotel') d.hotelBest = d.packBest.hotel;
        }
        rememberMissed(d, lesson.missed);
        persist();
        const count = (state) => lesson.pack.filter((w) => d.vocabularyProgress[w.id]?.state === state).length;
        show({
          name: 'packResults',
          realmId: lesson.realmId,
          result: { correct: lesson.correct, baseTotal: lesson.baseTotal, earned: lesson.earned, familiar: count('familiar'), mastered: count('mastered') },
        });
        return;
      }
      const total = lesson.reviewing ? lesson.missed.length : lesson.order.length + 4;
      if (!lesson.reviewing && lesson.step === lesson.order.length + 3 && lesson.order.length === 3) {
        const key = level + ':' + lesson.realmId;
        d.best[key] = Math.max(d.best[key] || 0, lesson.score);
      }
      if (step < total) return setLesson({ ...lesson, step, selected: -1, checked: false });
      if (!lesson.reviewing) {
        d.sessions++;
        d.done[level + ':' + lesson.realmId] = true;
        rememberMissed(d, lesson.missed);
        persist();
      }
      show({ name: 'starterResults', realmId: lesson.realmId });
    },
    leaveLesson() {
      if (confirm('Leave this lesson? XP already earned is saved. This lesson will restart when you return.')) app.go('Realms');
    },
    openPlayer(kind) {
      stopSpeaking();
      setView({ name: 'player', kind, previous: view, run: Date.now() });
    },
    openReview(beforeOpen) {
      beforeOpen?.();
      stopSpeaking();
      setReviewOpen((n) => n + 1);
    },
    resetProgress() {
      data.current = emptyProgress();
      setLevel('A1');
      persist();
      app.go('Home');
    },
  };

  function currentQuestion() {
    if (!lesson) return null;
    if (lesson.mode === 'pack') return lesson.queue[lesson.step];
    return starterQuestion(
      realms.find((r) => r.id === lesson.realmId),
      lesson.order,
      lesson.step,
      lesson.reviewing,
      lesson.missed,
    );
  }

  const navPage = ['Home', 'Progress', 'Profile'].includes(view.name)
    ? view.name
    : view.name === 'player'
      ? ['Home', 'Progress', 'Profile'].includes(view.previous.name)
        ? view.previous.name
        : 'Realms'
      : 'Realms';
  const realm = realms.find((r) => r.id === (view.realmId || lesson?.realmId));
  let screen = null;
  if (view.name === 'Home') screen = <Home app={app} />;
  else if (view.name === 'Progress') screen = <Progress app={app} />;
  else if (view.name === 'Profile') screen = <Profile app={app} />;
  else if (view.name === 'setup' && realm) screen = <Setup key={realm.id + level} app={app} realm={realm} />;
  else if (view.name === 'lesson' && lesson) {
    const q = currentQuestion();
    const total = lesson.mode === 'pack' ? lesson.queue.length : lesson.reviewing ? lesson.missed.length : lesson.order.length + 4;
    const label =
      lesson.mode === 'pack'
        ? realm.name + ' · ' + (q.review ? 'Review' : 'Practice') + ' · ' + (lesson.step + 1) + '/' + total
        : realm.name + ' · ' + q.type + ' · ' + (lesson.step + 1) + '/' + total;
    screen = <Question key={lesson.session || lesson.realmId} app={app} realm={realm} lesson={lesson} q={q} label={label} progress={lesson.step / total} />;
  } else if (view.name === 'packResults') screen = <PackResults app={app} realm={realm} result={view.result} />;
  else if (view.name === 'starterResults') screen = <StarterResults app={app} realm={realm} lesson={lesson} />;
  else if (view.name === 'player') screen = <ConversationPlayer key={view.run || 0} app={app} kind={view.kind} onClose={() => setView(view.previous)} />;

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <img src="/assets/vocarealm-logo.png" alt="" width="43" height="43" style={{ verticalAlign: 'middle', marginRight: 7, borderRadius: 10 }} />
          VocaRealm
        </div>
        <a href="index.html" style={{ display: 'block', marginTop: 14, fontSize: 12, color: '#2563eb' }}>
          ← VocaRealm website
        </a>
        <div className="tag">LEARN IT. SEE IT. USE IT.</div>
        <nav id="nav">
          {NAV.map(([page, icon]) => (
            <button key={page} className={navPage === page ? 'active' : ''} onClick={() => app.go(page)}>
              {icon} &nbsp; {page}
            </button>
          ))}
        </nav>
        <AccountSlot account={account} levelCode={levelState.data.selectedLevel} />
      </aside>
      <main>
        <header>
          <span className="muted">Your next conversation starts here.</span>
          <div className="stats">
            <span className="pill">🇫🇷 French</span>
            <span className="pill" id="xp">
              ✦ {data.current.xp} XP
            </span>
          </div>
        </header>
        {globalStatus !== null && (
          <p id="globalVoiceStatus" role="status" className="status">
            {globalStatus}
          </p>
        )}
        <div id="app">{screen}</div>
      </main>
      <dialog
        id="conversationReviewDialog"
        ref={reviewDialog}
        style={{ maxWidth: 900, width: '90vw', maxHeight: '85vh', border: '1px solid #d1dcea', borderRadius: 20, padding: 24 }}
        onClose={() => {
          window.VocaConversationReview.clearAudio();
          window.VocaFrenchAudio.stop();
          setReviewOpen(0);
        }}
      >
        <button onClick={() => reviewDialog.current.close()}>Close review</button>
        <div id="hotelReviewBody">{reviewOpen > 0 && <ConversationReview key={reviewOpen} realm="hotel" />}</div>
      </dialog>
    </div>
  );
}
