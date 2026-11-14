import { useState } from 'react';
import { Bilingual, English } from '../shared/English.jsx';

function Question({ q, number, total, onAnswered, onNext }) {
  const [picked, setPicked] = useState(null);
  return (
    <>
      <p>{number + ' / ' + total}</p>
      <blockquote lang="fr">{q.text}</blockquote>
      <h3 lang="fr">{q.promptFr}</h3>
      <English>{q.prompt}</English>
      <div className="answers">
        {q.optionsFr.map((option, j) => (
          <button
            key={j}
            type="button"
            disabled={picked !== null}
            onClick={() => {
              setPicked(j);
              onAnswered(j === q.answer);
            }}
          >
            <Bilingual fr={option} en={q.options[j]} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <>
          <p lang="fr">{picked === q.answer ? 'Bonne réponse.' : 'Réponse : ' + q.optionsFr[q.answer] + '.'}</p>
          <English>{q.explanation}</English>
          <button type="button" onClick={onNext}>Next</button>
        </>
      )}
    </>
  );
}

// "Read & understand" tab: the realm's reading (if any) and its comprehension questions.
export default function Reading({ pack, speak }) {
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [round, setRound] = useState(0);
  const total = pack.questions.length;
  return (
    <>
      <h2>Read & understand</h2>
      {pack.reading && (
        <>
          <small>{pack.reading.label}</small>
          <h3>{pack.reading.title}</h3>
          <p lang="fr">{pack.reading.fr}</p>
          <English>{pack.reading.en}</English>
          <button type="button" onClick={() => speak(pack.reading.fr)}>Listen to the text</button>
        </>
      )}
      <div>
        {i === total ? (
          <>
            <h3>{'Comprehension complete · ' + correct + '/' + i}</h3>
            <button
              type="button"
              onClick={() => {
                setI(0);
                setCorrect(0);
                setRound(round + 1);
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <Question
            key={round + ':' + i}
            q={pack.questions[i]}
            number={i + 1}
            total={total}
            onAnswered={(ok) => ok && setCorrect((c) => c + 1)}
            onNext={() => setI(i + 1)}
          />
        )}
      </div>
    </>
  );
}
