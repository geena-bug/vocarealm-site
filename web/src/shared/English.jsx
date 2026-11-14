import { createContext, useContext } from 'react';

// Lesson pages show French first; "Show English" reveals every translation at once without
// changing anything the learner has already answered.
export const ShowEnglish = createContext(false);

export function English({ children }) {
  const show = useContext(ShowEnglish);
  if (!children) return null;
  return (
    <span lang="en" className="english-support" hidden={!show}>
      {children}
    </span>
  );
}

export function Bilingual({ fr, en }) {
  return (
    <>
      <span lang="fr">{fr}</span>
      <English>{en}</English>
    </>
  );
}
