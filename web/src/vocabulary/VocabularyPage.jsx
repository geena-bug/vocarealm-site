import { useMemo, useState } from 'react';
import AddWord from './AddWord.jsx';
import Practice from './Practice.jsx';
import { builtins, core, realms, speak, useStopSpeakingOnLeave } from '../shared/legacy.js';

const SOURCE_LABEL = { personal: 'MY WORD', sample: 'REALM SAMPLE' };

// Course words plus the learner's own words, in the shape the practice and list code expect.
function allWords(store) {
  const C = core();
  const bank = builtins();
  return [
    ...bank,
    ...store.items.map((w) =>
      C.exerciseWord(
        { ...w, id: 'user_' + w.id, recordId: w.id, translation: w.meaning, sentence: w.example, sentenceTranslation: w.example_translation, scenarioId: w.realm, source: 'personal' },
        bank,
      ),
    ),
  ];
}

function WordCard({ word, onEdit, onRemove, setStatus }) {
  const realm = realms().find((r) => r.id === word.realm);
  const say = (text) => speak(text, setStatus, { rate: 0.82 });
  return (
    <article className="wordcard">
      <span className="catalogbadge">{SOURCE_LABEL[word.source] || 'COURSE WORD'}</span>
      <h3 lang="fr">{word.term}</h3>
      <p>{word.translation}</p>
      {word.sentence && <p className="tiny" lang="fr">{word.sentence}</p>}
      <small className="tiny">{(realm?.name || word.realm) + (word.level ? ' · ' + word.level : '')}</small>
      <div className="wordactions">
        <button className="btn" onClick={() => say(word.term)}>▷ Listen to word</button>
        {word.sentence && (
          <button type="button" className="btn" aria-label={'Listen to sentence: ' + word.sentence} onClick={() => say(word.sentence)}>
            ▷ Listen to sentence
          </button>
        )}
        <a className="btn" href={'pronunciation.html?text=' + encodeURIComponent(word.sentence || word.term)}>Read aloud</a>
        {word.source === 'personal' && (
          <>
            <button className="btn" onClick={() => onEdit(word.recordId)}>Edit</button>
            <button className="btn" onClick={() => onRemove(word)}>Remove</button>
          </>
        )}
      </div>
    </article>
  );
}

export default function VocabularyPage({ store }) {
  const C = core();
  const queryRealm = new URLSearchParams(location.search).get('realm');
  const knownRealm = realms().some((r) => r.id === queryRealm) ? queryRealm : '';
  const defaultRealm = knownRealm || 'life';
  const [version, setVersion] = useState(0); // bumped after every save/remove; store.items is not React state
  const [status, setStatus] = useState(store.warning || '');
  const [search, setSearch] = useState('');
  const [realmFilter, setRealmFilter] = useState(knownRealm);
  const [source, setSource] = useState('');
  const [editing, setEditing] = useState(null);
  const [quiz, setQuiz] = useState(null);

  useStopSpeakingOnLeave();

  const words = useMemo(() => allWords(store), [store, version]);
  const shown = useMemo(() => {
    const term = C.norm(search);
    return words.filter(
      (w) => (!realmFilter || w.realm === realmFilter) && (!source || w.source === source) && (C.norm(w.term) + ' ' + C.norm(w.translation)).includes(term),
    );
  }, [words, search, realmFilter, source, C]);

  async function save(word) {
    const error = C.validate(word);
    if (error) {
      setStatus(error);
      return false;
    }
    try {
      await store.save(word);
    } catch (e) {
      setStatus(e.message);
      return false;
    }
    setEditing(null);
    setVersion((v) => v + 1);
    setStatus(store.user ? 'Saved to your vocabulary. You can practise it now.' : 'Saved on this browser. It will appear in your vocabulary practice.');
    return true;
  }

  async function remove(word) {
    if (!confirm('Remove “' + word.term + '” from your personal vocabulary?')) return;
    try {
      await store.remove(word.recordId);
      setVersion((v) => v + 1);
      setStatus('Word removed.');
    } catch (e) {
      setStatus(e.message);
    }
  }

  return (
    <main>
      <section className="wrap section">
        <div className="sectionhead">
          <span className="eyebrow">Your everyday discoveries belong here</span>
          <h1>A vocabulary that grows with you.</h1>
          <p>Meet a new word in a book, a conversation, an advert or on the street? Save it here, keep its context and bring it into your practice.</p>
          <p id="wordStorageNote" className="tiny">
            {store.user
              ? 'Your words are private and saved to your VocaRealm account. Course practice history currently stays on this browser.'
              : 'Guest words stay on this browser. You can add and practise them without an account. Signing in uses a separate vocabulary; guest words are not moved automatically.'}
          </p>
        </div>

        <AddWord
          store={store}
          defaultRealm={defaultRealm}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
          onSave={save}
          setStatus={setStatus}
        />
        <p id="wordStatus" className="status" role="status">{status}</p>

        <div className="vocabtools">
          <label>
            Search words
            <input id="vocabSearch" type="search" placeholder="Search French or English" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label>
            Realm
            <select id="vocabRealm" value={realmFilter} onChange={(e) => setRealmFilter(e.target.value)}>
              <option value="">All realms</option>
              {realms().map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
          <label>
            Word source
            <select id="vocabSource" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">All words</option>
              <option value="personal">My words</option>
              <option value="course">Course words</option>
              <option value="sample">Realm samples</option>
            </select>
          </label>
        </div>
        <div className="sectionline">
          <p id="vocabCount" className="tiny" role="status">
            {shown.length} words shown · {builtins().length} course and sample entries · {store.items.length} personal words. No 20-word limit.
          </p>
          <button
            id="startVocabPractice"
            className="btn blue"
            onClick={() => {
              if (!shown.length) setStatus('Add a word or choose a different filter first.');
              else setQuiz([...shown].sort(() => Math.random() - 0.5).slice(0, 10));
            }}
          >
            Practise these words →
          </button>
        </div>
        <div id="wordList" className="wordgrid">
          {shown.map((w) => (
            <WordCard
              key={w.id}
              word={w}
              setStatus={setStatus}
              onRemove={remove}
              onEdit={(id) => {
                const record = store.items.find((x) => x.id === id);
                if (record) setEditing(record);
              }}
            />
          ))}
          {!shown.length && <p>No words match. Try another filter, or add a word you discovered.</p>}
        </div>
      </section>
      <Practice quiz={quiz} pool={words} store={store} onClose={() => setQuiz(null)} setStatus={setStatus} />
    </main>
  );
}
