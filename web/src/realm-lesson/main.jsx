import { mount } from '../shared/mount.jsx';
import RealmLessonPage from './RealmLessonPage.jsx';

// vocabulary-store.js (a classic script loaded first) resolves with the learner's words, which join the realm's practice.
window.vocaVocabularyReady.then((store) => mount(<RealmLessonPage store={store} />));
