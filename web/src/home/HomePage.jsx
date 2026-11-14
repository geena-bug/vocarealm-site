const featuredRealms = [
  { href: 'learn.html?realm=hotel', image: 'hotel', name: 'Hotel', line: 'Check in with confidence.' },
  { href: 'realm-learning.html?realm=cafe', image: 'cafe', name: 'Café', line: 'Make your next order in French.' },
  { href: 'realm-learning.html?realm=school', image: 'school', name: 'School', line: 'Ask, learn and join in.' },
  { href: 'realm-learning.html?realm=transport', image: 'transport', name: 'Transport', line: 'Find your way around.' },
  { href: 'realm-learning.html?realm=life', image: 'life', name: 'Everyday Life', line: 'Practise the little things.' },
];

const steps = [
  ['01 / LEARN IT', 'Meet the useful words', 'Choose a short session or explore all the words available in a growing A1 pack. Listen, match meanings and practise sentences.'],
  ['02 / SEE IT', 'Watch the situation unfold', 'Follow illustrated scenes and French dialogue, with English support when you need it.'],
  ['03 / USE IT', 'Take your turn', 'Choose either role in a guided conversation. Record a reply, listen back and send when you’re ready.'],
];

export default function HomePage() {
  return (
    <main>
      <section className="wrap hero">
        <div>
          <span className="eyebrow">A little practice. A world of possibility.</span>
          <h1>Your next French conversation starts here.</h1>
          <p>Step into everyday worlds. Learn the words, hear them in context, then take your turn in the conversation.</p>
          <div className="actions">
            <a className="btn blue" href="signup.html">Start your journey ↗</a>
            <a className="btn" href="demo.html">▷ See how it works</a>
          </div>
          <p className="tiny">French with English support · A1–C2 learning pathway</p>
        </div>
        <div className="visual">
          <img src="/assets/hotel-cast-v3.png" alt="A guest speaking with a friendly hotel receptionist" />
          <div className="caption">
            <strong>Bonsoir ! Vous avez une réservation ?</strong>
            <small>Good evening! Do you have a reservation?</small>
          </div>
        </div>
      </section>

      <section className="wrap">
        <div className="placementpromo">
          <div>
            <span className="eyebrow">Not starting from zero?</span>
            <h2>Find your French starting point.</h2>
            <p>Explore A1 to C2, or take a short written placement check. You can skip familiar foundations and practise at a level that fits.</p>
          </div>
          <a className="btn blue" href="placement.html">Find my level →</a>
        </div>
      </section>

      <section className="tint">
        <div className="wrap section">
          <div className="sectionhead">
            <span className="eyebrow">Learn in the places life happens</span>
            <h2>
              A world of familiar situations.
              <br />
              A reason to use every word.
            </h2>
            <p>
              From shopping and directions to celebrations, work and news, discover French for the moments that matter. Explore vocabulary, bilingual
              conversations and comprehension practice across all 20 realms.
            </p>
          </div>
          <div className="realmgrid">
            {featuredRealms.map((r) => (
              <a className="realm" href={r.href} key={r.name}>
                <img src={'/assets/' + r.image + '-cast-v3.png'} alt={r.name + ' practice scene'} loading="lazy" />
                <div>
                  <h3>{r.name}</h3>
                  <p>{r.line}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="actions">
            <a className="btn blue" href="realms.html">Explore all 20 realms →</a>
          </div>
        </div>
      </section>

      <section className="wrap section" id="how-it-works">
        <span className="eyebrow">Small steps into real conversations</span>
        <h2>Learn it. See it. Use it.</h2>
        <div className="steps">
          {steps.map(([num, title, text]) => (
            <div key={num}>
              <div className="num">{num}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section split" id="realms">
        <img src="/assets/cafe-cast-v3.png" alt="Two characters speaking at a café counter" loading="lazy" />
        <div>
          <span className="eyebrow">A space to try again</span>
          <h2>You don’t need the perfect words to begin.</h2>
          <p>Use a hint, hear a model line, slow down the audio or type your response. The conversation waits for you.</p>
          <p className="tiny">Conversations follow a guided script. Pronunciation scoring is planned; recording and replay are available now.</p>
          <a className="btn" href="demo.html">Try the interactive demo →</a>
        </div>
      </section>

      <section className="wrap section">
        <div className="placementpromo">
          <div>
            <span className="eyebrow">Learn from your own life</span>
            <h2>Found a word? Make it yours.</h2>
            <p>
              Build a personal vocabulary from conversations, books, news and everyday discoveries. Add a meaning, an example and a realm, then practise it
              alongside your learning.
            </p>
          </div>
          <a className="btn blue" href="vocabulary.html">Build my vocabulary →</a>
        </div>
      </section>

      <section className="wrap">
        <div className="end">
          <div>
            <h2>Make your first French check-in.</h2>
            <p>Try a short walkthrough, then explore at your own pace.</p>
          </div>
          <a className="btn" href="demo.html">Let’s try it →</a>
        </div>
      </section>
    </main>
  );
}
