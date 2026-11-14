import { mount } from '../shared/mount.jsx';
import LevelsPage from './LevelsPage.jsx';

// level-state.js (a classic script loaded first) resolves with this learner's saved level path.
window.vocaLevelReady.then((state) => mount(<LevelsPage state={state} />));
