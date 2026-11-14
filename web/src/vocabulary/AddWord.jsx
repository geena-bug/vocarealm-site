import { useEffect, useRef, useState } from 'react';
import { builtins, readStorage, realms, speak, writeStorage } from '../shared/legacy.js';
import { explain, lookup, lookupFrench, normalize, translateRemote } from './translate.js';

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const DIRECTIONS = {
  'en-fr': {
    label: 'English word or expression',
    lang: 'en',
    placeholder: 'e.g. a receipt, an umbrella, to reserve',
    hint: 'Enter only the English word. Translate fills in the French word, an example sentence and its translation for you to check.',
    from: 'English',
  },
  'fr-en': {
    label: 'French word or expression',
    lang: 'fr',
    placeholder: 'e.g. un reçu, un parapluie, réserver',
    hint: 'Enter only the French word. Translate fills in the English meaning, an example sentence and its translation for you to check.',
    from: 'French',
  },
};

export const emptyWord = (realm) => ({ term: '', meaning: '', example: '', example_translation: '', realm, level: '', encounter: '' });

// The "Add a word you discovered" panel: translation direction, Translate, word-bank matches and the editable form.
// `editing` holds the record being edited from the word list; the parent owns saving.
export default function AddWord({ store, defaultRealm, editing, onCancelEdit, onSave, setStatus }) {
  const [direction, setDirection] = useState('en-fr');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { matches, heading, alternativesFor }
  const [formOpen, setFormOpen] = useState(false);
  const [word, setWord] = useState(() => emptyWord(defaultRealm));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const pendingKey = 'vocarealm-pending-english-' + (store.user?.id || 'guest');
  const [pending, setPending] = useState(() => {
    const value = readStorage(pendingKey, []);
    return Array.isArray(value) ? value.filter((x) => typeof x === 'string' && x.length <= 250) : [];
  });
  const request = useRef(0);
  const queryInput = useRef(null);
  const termInput = useRef(null);
  const details = useRef(null);
  const focusTerm = useRef(false);
  const d = DIRECTIONS[direction];

  useEffect(() => {
    if (focusTerm.current && formOpen) {
      termInput.current?.focus();
      focusTerm.current = false;
    }
  });

  // Loading a saved word for editing opens the form with its values.
  useEffect(() => {
    if (!editing) return;
    setWord({ ...emptyWord(defaultRealm), ...Object.fromEntries(Object.keys(emptyWord()).map((k) => [k, editing[k] || ''])) });
    setFormOpen(true);
    setNote('');
    if (details.current) details.current.open = true;
    focusTerm.current = true;
  }, [editing, defaultRealm]);

  function clearResults() {
    setResult(null);
    setFormOpen(false);
    setNote('');
  }

  function chooseDirection(next) {
    request.current++;
    setDirection(next);
    setBusy(false);
    setNotice('');
    clearResults();
    queryInput.current?.focus();
  }

  function populate(w) {
    if (editing) onCancelEdit();
    setWord((current) => ({
      ...current,
      term: w.term || '',
      meaning: w.translation || w.meaning || '',
      example: w.sentence || w.example || '',
      example_translation: w.sentenceTranslation || w.example_translation || '',
      realm: w.realm || current.realm,
      level: w.level || current.level,
    }));
    setNote(w.note || '');
    setFormOpen(true);
    focusTerm.current = true;
  }

  async function translate(text = query.trim(), dir = direction) {
    clearResults();
    if (!text) {
      setNotice('Enter the ' + DIRECTIONS[dir].from + ' word or expression first.');
      queryInput.current?.focus();
      return;
    }
    const words = [...builtins(), ...store.items];
    const matches = dir === 'en-fr' ? lookup(text, words) : lookupFrench(text, words);
    const best = matches.find((w) => w.rank === 0 && (w.sentence || w.example));
    if (best) {
      populate(best);
      setNotice('Filled in from VocaRealm’s word bank. Edit anything you like, then choose Add to my vocabulary.');
      setResult({ matches: matches.filter((w) => w !== best), heading: 'Other matches in the word bank' });
      return;
    }
    const id = ++request.current;
    setBusy(true);
    setNotice('Translating…');
    const reply = await translateRemote(text, dir, { auth: window.vocaAuth, fetch: (...a) => window.fetch(...a) });
    if (id !== request.current) return;
    setBusy(false);
    if (!reply.error) {
      populate(reply);
      setNotice('Translated automatically. Check and edit the fields before saving — automatic translations can be wrong.');
      setResult({ matches, heading: 'Related words in the word bank' });
      return;
    }
    setNotice(explain(reply));
    setResult({ matches, heading: 'Related words in the word bank', alternativesFor: text });
  }

  function savePending(next, failure) {
    if (!writeStorage(pendingKey, next)) {
      setNotice(failure);
      return false;
    }
    setPending(next);
    return true;
  }

  function saveForLater(text) {
    if (pending.some((x) => normalize(x) === normalize(text))) {
      setNotice('This English word is already on your list.');
      return;
    }
    if (savePending([...pending, text], 'Could not save this word. Browser storage is unavailable.')) {
      setNotice('English word saved on this browser. No French word was required.');
    }
  }

  function listen(field, empty) {
    const text = word[field].trim();
    if (!text) setNotice(empty);
    else speak(text, setNotice, { rate: 0.82 });
  }

  async function submit(event) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setSaving(true);
    const saved = await onSave(editing ? { ...word, id: editing.id } : word);
    setSaving(false);
    if (!saved) return;
    savePending(pending.filter((x) => normalize(x) !== normalize(word.meaning)), 'Could not update the saved word list.');
    setWord(emptyWord(defaultRealm));
    setNote('');
  }

  const set = (field) => (event) => setWord({ ...word, [field]: event.target.value });

  return (
    <details id="addWordDetails" className="addword" open ref={details}>
      <summary>Add a word you discovered</summary>
      <div className="actions" role="group" aria-label="Translation direction">
        <button id="englishEntryMode" type="button" className="btn blue" aria-pressed={direction === 'en-fr'} onClick={() => chooseDirection('en-fr')}>
          English → French
        </button>
        <button id="frenchEntryMode" type="button" className="btn" aria-pressed={direction === 'fr-en'} onClick={() => chooseDirection('fr-en')}>
          French → English
        </button>
      </div>

      <section id="englishLookupPanel">
        <label id="entryLabel" htmlFor="englishWord">{d.label}</label>
        <div className="actions">
          <input
            id="englishWord"
            ref={queryInput}
            lang={d.lang}
            maxLength={250}
            placeholder={d.placeholder}
            autoComplete="off"
            value={query}
            onChange={(e) => {
              request.current++;
              setQuery(e.target.value);
              setBusy(false);
              setNotice('');
              clearResults();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                translate();
              }
            }}
          />
          <button id="findFrenchWord" className="btn blue" type="button" disabled={busy} onClick={() => translate()}>
            Translate
          </button>
        </div>
        <p id="entryHint" className="tiny">{d.hint}</p>
        <p id="englishLookupStatus" className="status" role="status">{notice}</p>
        <div id="englishMatches" className="wordgrid">
          {result?.matches.length > 0 && <h3>{result.heading}</h3>}
          {result?.matches.map((w) => (
            <article className="wordcard" key={w.term + '|' + (w.translation || w.meaning)}>
              <small>{w.rank === 0 ? 'MEANING MATCH' : 'RELATED MEANING'}</small>
              <h3 lang="fr">{w.term}</h3>
              <p>{w.translation || w.meaning}</p>
              {(w.sentence || w.example) && <p lang="fr">{w.sentence || w.example}</p>}
              <button type="button" className="btn" onClick={() => speak(w.term, setNotice)}>Listen to word</button>
              {(w.sentence || w.example) && (
                <button type="button" className="btn" onClick={() => speak(w.sentence || w.example, setNotice)}>Listen to sentence</button>
              )}
              <button
                type="button"
                className="btn"
                onClick={() => {
                  populate(w);
                  setNotice('Translation added to the form. Review it, then choose Add to my vocabulary.');
                }}
              >
                Use this translation
              </button>
            </article>
          ))}
          {result?.alternativesFor && (
            <div className="actions">
              {direction === 'en-fr' && (
                <button type="button" className="btn" onClick={() => saveForLater(result.alternativesFor)}>
                  Save English word for later
                </button>
              )}
              <a
                className="btn"
                target="_blank"
                rel="noopener noreferrer"
                href={'https://translate.google.com/?sl=' + (direction === 'en-fr' ? 'en&tl=fr' : 'fr&tl=en') + '&text=' + encodeURIComponent(result.alternativesFor) + '&op=translate'}
              >
                Look up in Google Translate ↗
              </a>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  const text = result.alternativesFor;
                  populate(direction === 'en-fr' ? { term: '', translation: text } : { term: text, translation: '' });
                  setNotice('Fill in the remaining fields, then choose Add to my vocabulary.');
                }}
              >
                Enter the details myself
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="pendingEnglishWords">
        {pending.length > 0 && (
          <>
            <h3>English words to translate later</h3>
            <p>Saved on this browser. Add a French translation before practising these words.</p>
            {pending.map((text) => (
              <div className="actions" key={text}>
                <strong>{text}</strong>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    request.current++;
                    setDirection('en-fr');
                    setQuery(text);
                    queryInput.current?.focus();
                    translate(text, 'en-fr');
                  }}
                >
                  Translate
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => savePending(pending.filter((x) => x !== text), 'Could not remove the saved word. Browser storage is unavailable.')}
                >
                  Remove
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      <form id="wordForm" className="wordform" hidden={!formOpen} onSubmit={submit}>
        <label>
          French word or expression
          <input ref={termInput} name="term" lang="fr" maxLength={120} placeholder="e.g. un parapluie" required value={word.term} onChange={set('term')} />
        </label>
        <label>
          English meaning
          <input name="meaning" maxLength={250} placeholder="e.g. an umbrella" required value={word.meaning} onChange={set('meaning')} />
        </label>
        <label>
          Example in French <span className="tiny">optional</span>
          <textarea name="example" lang="fr" maxLength={500} placeholder="J’ai oublié mon parapluie." value={word.example} onChange={set('example')} />
        </label>
        <label>
          Example translation <span className="tiny">optional</span>
          <textarea name="example_translation" maxLength={500} placeholder="I forgot my umbrella." value={word.example_translation} onChange={set('example_translation')} />
        </label>
        <label>
          Realm
          <select id="wordRealm" name="realm" value={word.realm} onChange={set('realm')}>
            {realms().map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </label>
        <label>
          Level <span className="tiny">optional</span>
          <select name="level" value={word.level} onChange={set('level')}>
            <option value="">Not sure yet</option>
            {LEVELS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </label>
        <div className="wide actions">
          <button id="formListenWord" type="button" className="btn" onClick={() => listen('term', 'Add a French word first.')}>
            ▷ Listen to word
          </button>
          <button id="formListenSentence" type="button" className="btn" onClick={() => listen('example', 'Add a French example sentence first.')}>
            ▷ Listen to sentence
          </button>
        </div>
        <p id="translationNote" className="tiny wide" role="note" hidden={!note}>{note}</p>
        <label className="wide">
          Where did you find it? <span className="tiny">optional</span>
          <input name="encounter" maxLength={500} placeholder="A conversation, a sign, a book…" value={word.encounter} onChange={set('encounter')} />
        </label>
        <div className="wide actions">
          <button id="wordSubmit" type="submit" className="btn blue" disabled={saving}>
            {editing ? 'Save changes' : 'Add to my vocabulary'}
          </button>
          <button
            id="wordCancel"
            type="button"
            className="btn"
            hidden={!editing}
            onClick={() => {
              onCancelEdit();
              setWord(emptyWord(defaultRealm));
            }}
          >
            Cancel editing
          </button>
        </div>
      </form>
      <p className="tiny">Your words stay in your own collection. Automatic translations can be wrong: check and edit the meaning and example before saving.</p>
    </details>
  );
}
