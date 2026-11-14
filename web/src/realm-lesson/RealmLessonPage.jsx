import { useEffect, useMemo, useRef, useState } from 'react';
import ConversationReview from '../shared/ConversationReview.jsx';
import { ShowEnglish } from '../shared/English.jsx';
import { builtins, core, courses, readStorage, realms, writeStorage } from '../shared/legacy.js';
import Conversation from './Conversation.jsx';
import Reading from './Reading.jsx';
import WordPractice from './WordPractice.jsx';

const TABS = ['Vocabulary', 'Read & understand', 'Conversation', 'Conversation review'];

// The realm's course words plus the learner's own words tagged to it, as practice items.
function realmWords(realm, store) {
  const C = core();
  const bank = builtins().filter((w) => w.realm === realm);
  const mine = store.items
    .filter((w) => w.realm === realm)
    .map((w) => ({ ...w, id: 'user_' + w.id, translation: w.meaning, sentence: w.example, sentenceTranslation: w.example_translation }));
  return C.merge(bank, mine).map((w) => C.exerciseWord(w, bank));
}

// One of the nineteen non-Hotel realm packs (?realm=id): vocabulary, reading, conversation and review.
export default function RealmLessonPage({ store }) {
  const realm = new URLSearchParams(location.search).get('realm');
  const pack = courses()[realm];
  const meta = realms().find((r) => r.id === realm);
  const progressKey = window.RealmLearningCore.key(store.user);
  const progress = useRef(null);
  if (!progress.current) progress.current = window.normalizeLearningProgress(readStorage(progressKey, null));
  const save = () => writeStorage(progressKey, progress.current);
  const words = useMemo(() => (pack ? realmWords(realm, store) : []), [realm, store, pack]);
  const [tab, setTab] = useState(TABS[0]);
  const [visit, setVisit] = useState(0); // remounts the tab, as reopening it did before
  const [showEnglish, setShowEnglish] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const epoch = useRef(0);

  function stopAudio() {
    epoch.current++;
    window.VocaFrenchAudio?.stop();
  }

  // Lesson audio: status messages and the "finished" callback only count for the current turn/tab.
  function speak(text, actor = 0, done = () => {}) {
    const token = epoch.current;
    setFeedback((f) => f ?? '');
    return window.VocaFrenchAudio.play(text, {
      actor,
      rate: 0.86,
      status: (t) => token === epoch.current && setFeedback(t),
      onEnd: () => token === epoch.current && done(),
    });
  }

  function open(next) {
    stopAudio();
    window.VocaConversationReview.clearAudio();
    setFeedback(null);
    setTab(next);
    setVisit((v) => v + 1);
  }

  useEffect(() => {
    window.addEventListener('pagehide', stopAudio);
    return () => window.removeEventListener('pagehide', stopAudio);
  }, []);

  if (!pack) {
    return (
      <main>
        <section className="wrap section" id="lessonRoot">
          <h1>Choose a realm</h1>
          <a href="realms.html">Explore all realms</a>
        </section>
      </main>
    );
  }

  const panels = {
    Vocabulary: <WordPractice realm={realm} words={words} progress={progress.current} save={save} speak={speak} />,
    'Read & understand': <Reading pack={pack} speak={speak} />,
    Conversation: (
      <Conversation
        realm={realm}
        meta={meta}
        pack={pack}
        progress={progress.current}
        save={save}
        speak={speak}
        stopAudio={stopAudio}
        onReview={() => open('Conversation review')}
      />
    ),
    'Conversation review': <ConversationReview realm={realm} />,
  };

  return (
    <main>
      <ShowEnglish.Provider value={showEnglish}>
        <section className="wrap section" id="lessonRoot">
          <a href="realms.html">← All realms</a>
          {store.warning && <p>{store.warning}</p>}
          <h1>{meta.name}</h1>
          <p>{pack.level + ' suggested difficulty · ' + words.length + ' words · 2 conversations'}</p>
          <p>Practise useful French, understand the meaning, then take a role. These packs support practice; completing one does not certify a CEFR level.</p>
          <div className="lesson-tools">
            <button type="button" aria-pressed={showEnglish} onClick={() => setShowEnglish(!showEnglish)}>
              {showEnglish ? 'Hide English' : 'Show English'}
            </button>
          </div>
          <div className="lesson-tabs">
            {TABS.map((t) => (
              <button key={t} type="button" onClick={() => open(t)}>{t}</button>
            ))}
            <a href={'vocabulary.html?realm=' + realm}>Add my own words</a>
          </div>
          <section className="lesson-panel" key={visit}>
            {panels[tab]}
            {feedback !== null && <p className="audio-feedback" role="status">{feedback}</p>}
          </section>
        </section>
      </ShowEnglish.Provider>
    </main>
  );
}
