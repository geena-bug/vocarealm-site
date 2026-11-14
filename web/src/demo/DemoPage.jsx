import { useEffect, useRef, useState } from 'react';
import { speak, stopSpeaking, useStopSpeakingOnLeave } from '../shared/legacy.js';

const stages = [
  {
    label: '01 / Learn a word',
    title: 'Une réservation',
    instruction: 'What does this mean in English?',
    fr: 'une réservation',
    en: 'Listen, then choose the meaning.',
    choices: ['A reservation', 'A room key', 'A passport'],
    right: 0,
    correct: 'That’s right — a reservation. Let’s use it at reception.',
    hint: 'Think of booking a room ahead of time.',
  },
  {
    label: '02 / Use it in a conversation',
    title: 'You’re the guest',
    instruction: 'The receptionist asks if you have a reservation. Choose a reply.',
    fr: 'Bonsoir ! Vous avez une réservation ?',
    en: 'Good evening! Do you have a reservation?',
    choices: ['Oui, j’ai une réservation.', 'Merci, au revoir.', 'Un café, s’il vous plaît.'],
    right: 0,
    correct: 'Exactly. “Yes, I have a reservation.” Your reply fits the situation.',
    hint: 'The receptionist is asking about your booking.',
  },
  {
    label: '03 / Make it your own',
    title: 'Now it’s your turn to speak',
    instruction: 'In the learning app, record your reply, listen back and send when you’re ready. The partner waits for you.',
    fr: 'Oui, j’ai une réservation au nom de Martin Dupont.',
    en: 'Yes, I have a reservation under the name Martin Dupont.',
  },
];
const LAST = stages.length - 1;

export default function DemoPage() {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);
  const [status, setStatus] = useState('');
  const title = useRef(null);
  const moved = useRef(false);
  const s = stages[step];
  const answered = picked === s.right;
  useStopSpeakingOnLeave();

  useEffect(() => {
    if (moved.current) title.current?.focus();
  }, [step]);

  function goTo(next) {
    stopSpeaking();
    setStep(next);
    setPicked(null);
    setStatus(next === LAST ? 'Recording is available in Hotel practice. Pronunciation scoring is not connected yet.' : '');
  }

  function choose(i) {
    setPicked(i);
    setStatus(i === s.right ? s.correct : 'Try another answer. ' + s.hint);
  }

  return (
    <main>
      <section className="wrap">
        <div className="demohead">
          <span className="eyebrow">Your first two minutes in VocaRealm</span>
          <h1>From a word to a conversation.</h1>
          <p>Try this guided Hotel sample. No microphone needed.</p>
        </div>
        <div className="demolayout">
          <div className="stage">
            <img src="/assets/hotel-conversation-v2.png" alt="Hotel receptionist and guest" />
            <div className="bubble" id="demoBubble">
              <strong lang="fr">{s.fr}</strong>
              <small>{s.en}</small>
            </div>
          </div>
          <section className="demopanel" aria-label="Interactive learning sample">
            <div className="progress" id="demoProgress" aria-label={'Step ' + (step + 1) + ' of 3'}>
              {stages.map((_, i) => (
                <span key={i} className={i <= step ? 'on' : ''} />
              ))}
            </div>
            <span className="eyebrow" id="demoLabel">
              {s.label}
            </span>
            <h2 id="demoTitle" ref={title} tabIndex={moved.current ? -1 : undefined}>
              {s.title}
            </h2>
            <p id="demoInstruction">{s.instruction}</p>
            <button className="btn" id="listenDemo" type="button" onClick={() => speak(s.fr, setStatus, { rate: 0.85 })}>
              ▷ Listen to the French
            </button>
            <div id="demoChoices" className="choices">
              {s.choices?.map((text, i) => (
                <button key={text} type="button" className="choice" aria-pressed={picked === i} onClick={() => choose(i)}>
                  {text}
                </button>
              ))}
            </div>
            <p className="status" id="demoStatus" role="status">
              {status}
            </p>
            <button
              className="btn blue"
              id="demoNext"
              type="button"
              disabled={step !== LAST && !answered}
              onClick={() => {
                stopSpeaking();
                if (step === LAST) {
                  location.href = 'learn.html?practice=hotel';
                } else if (answered) {
                  moved.current = true;
                  goTo(step + 1);
                }
              }}
            >
              {step === LAST ? 'Open Hotel practice →' : 'Continue →'}
            </button>
          </section>
        </div>
        <div className="demofooter">
          <button className="btn" id="restartDemo" type="button" onClick={() => goTo(0)}>
            ↻ Restart demo
          </button>
          <span className="tiny">Illustrative walkthrough · Your demo answers do not change learning progress.</span>
        </div>
      </section>
    </main>
  );
}
