import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Every React page's HTML has <div id="root"> where the old <main> used to be; the nav and footer stay
// as plain HTML so account-navigation.js can keep swapping "Log in" for "Log out".
export function mount(element) {
  createRoot(document.getElementById('root')).render(<StrictMode>{element}</StrictMode>);
}
