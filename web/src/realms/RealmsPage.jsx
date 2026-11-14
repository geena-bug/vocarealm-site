import { useState } from 'react';
import { courses } from '../shared/legacy.js';
import catalogue from './catalogue.json';

const CATEGORIES = ['All categories', 'Everyday', 'Travel', 'Social', 'Work', 'Media', 'Celebrations'];

function RealmCard({ realm }) {
  return (
    <article className="realm catalogcard">
      {realm.image ? (
        <img src={'/assets/' + realm.id + '-cast-v3.png'} alt={realm.name + ' scene'} loading="lazy" />
      ) : (
        <div className={'catalogart cat-' + realm.category.toLowerCase()}>
          <span>{realm.category}</span>
          <strong>{realm.name}</strong>
        </div>
      )}
      <div>
        <small className="catalogbadge">{realm.id === 'hotel' ? 'HOTEL PRACTICE' : courses()[realm.id].level + ' · 2 CONVERSATIONS'}</small>
        <h3>{realm.name}</h3>
        <p>{realm.description}</p>
        <a className="btn" href={(realm.id === 'hotel' ? 'learn.html' : 'realm-learning.html') + '?realm=' + realm.id}>Start learning →</a>
      </div>
    </article>
  );
}

export default function RealmsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const term = search.toLowerCase().trim();
  const shown = catalogue.filter(
    (r) => (category === CATEGORIES[0] || r.category === category) && (r.name + ' ' + r.description + ' ' + r.category).toLowerCase().includes(term),
  );

  return (
    <main>
      <section className="wrap section">
        <div className="sectionhead">
          <span className="eyebrow">A whole world of French</span>
          <h1>Where will your words take you?</h1>
          <p>
            Explore 20 realms across everyday life, travel, work, media and celebrations, with vocabulary and conversation practice. Each realm has a suggested
            difficulty; choose a scene and practise either role.
          </p>
        </div>
        <section className="mini-path">
          <b>Looking for the right difficulty?</b>
          <p>Realm practice ranges from everyday A1–A2 exchanges to B1–B2 discussions. A1–C2 starter reading practice and placement checks are available on your learning path.</p>
          <a href="levels.html">Choose a level →</a>
          <a href="placement.html">Take the placement check →</a>
        </section>
        <div className="catalogtools">
          <label htmlFor="realmSearch">
            Find your next situation
            <input id="realmSearch" type="search" placeholder="Search shopping, wedding, interview…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </label>
          <label htmlFor="realmCategory">
            Category
            <select id="realmCategory" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <p id="catalogCount" className="tiny" role="status">{shown.length} of 20 realms</p>
        <div className="cataloggrid" id="catalogGrid">
          {shown.map((r) => (
            <RealmCard key={r.id} realm={r} />
          ))}
          {!shown.length && <p>No realms match. Try another word or category.</p>}
        </div>
      </section>
    </main>
  );
}
