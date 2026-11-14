import { mount } from '../shared/mount.jsx';
import PlacementPage from './PlacementPage.jsx';

// level-state.js (a classic script loaded first) resolves with this learner's saved level path.
window.vocaLevelReady.then((state) => mount(<PlacementPage state={state} />));
