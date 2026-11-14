import { useEffect, useState } from 'react';
import { auth } from '../shared/legacy.js';

// Landing page for the confirmation link in signup emails (Supabase sends people back here).
export default function AuthCallbackPage() {
  const [status, setStatus] = useState('Checking your confirmation link…');

  useEffect(() => {
    if (new URLSearchParams(location.hash.slice(1)).get('error_description')) {
      setStatus('This link is invalid or has expired. Please log in, or request a new password reset link.');
      history.replaceState(null, '', location.pathname);
      return;
    }
    if (auth()?.recoveryLink) {
      location.replace('reset-password.html' + location.hash);
      return;
    }
    auth().ready.then((state) => {
      if (state.user) {
        history.replaceState(null, '', location.pathname);
        location.replace('levels.html');
      } else {
        setStatus('If you confirmed your email, you can now log in. If the link expired, try signing up again or request a password reset.');
      }
    });
  }, []);

  return (
    <main className="wrap section">
      <h1>Welcome to VocaRealm.</h1>
      <p id="callbackStatus" role="status">
        {status}
      </p>
      <a className="btn blue" href="login.html">
        Go to login
      </a>
    </main>
  );
}
