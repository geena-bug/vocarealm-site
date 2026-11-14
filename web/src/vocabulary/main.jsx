import { mount } from '../shared/mount.jsx';
import VocabularyPage from './VocabularyPage.jsx';

// vocabulary-store.js (a classic script loaded first) resolves once the guest or account vocabulary is ready.
window.vocaVocabularyReady.then((store) => mount(<VocabularyPage store={store} />));
