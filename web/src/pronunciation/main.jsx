import { mount } from '../shared/mount.jsx';
import PronunciationPage from './PronunciationPage.jsx';

window.vocaAuth.ready.then((state) => mount(<PronunciationPage user={state.user} />));
