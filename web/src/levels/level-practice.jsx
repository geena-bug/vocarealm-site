import { mount } from '../shared/mount.jsx';
import LevelPracticePage from './LevelPracticePage.jsx';

// level-state.js (a classic script loaded first) resolves with this learner's saved level path.
window.vocaLevelReady.then((state) => mount(<LevelPracticePage state={state} />));
