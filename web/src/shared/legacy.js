// React pages still use the site's shared classic scripts, loaded by each page's HTML before the React bundle:
// accounts (auth-client.js), French speech (french-audio.js), level rules and content, the word bank,
// the vocabulary store and lesson content. Reading them here keeps every window.* dependency in one place.
import { useEffect } from 'react';

export const auth = () => window.vocaAuth;
export const core = () => window.VocaVocabularyCore;
export const builtins = () => window.vocaBuiltins;
export const realms = () => window.vocaRealmList;
export const courses = () => window.VocaRealmCourses;
export const levelCore = () => window.VocaLevelCore;
export const levelContent = () => window.VocaLevelContent;

export function speak(text, status, options = {}) {
  window.VocaFrenchAudio.play(text, { status, ...options });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.VocaFrenchAudio.stop();
}

// Stops French speech when the visitor leaves the page, as every page did before React.
export function useStopSpeakingOnLeave() {
  useEffect(() => {
    window.addEventListener('pagehide', stopSpeaking);
    return () => window.removeEventListener('pagehide', stopSpeaking);
  }, []);
}

export function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
