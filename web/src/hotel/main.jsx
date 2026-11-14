import { mount } from '../shared/mount.jsx';
import HotelApp from './HotelApp.jsx';
import './hotel.css';

// Wait for the shared classic scripts: the signed-in account, the learner's words and their chosen level.
Promise.all([window.vocaAuth.ready, window.vocaVocabularyReady, window.vocaLevelReady]).then(([account, store, levelState]) =>
  mount(<HotelApp account={account} store={store} levelState={levelState} />),
);
