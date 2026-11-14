import { useEffect, useRef, useState } from 'react';
import { auth } from '../shared/legacy.js';
import { checkRecovery, precheck, submitAccount, submitLabels } from './actions.js';

const PRIVACY = 'Your password is sent securely to our account service and is never saved in your browser. Learning progress currently stays on this device.';

function PasswordInput({ id, label, autoComplete, placeholder, value, onChange, inputRef }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <div className="passwordfield">
        <input
          id={id}
          name={id}
          ref={inputRef}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          minLength={12}
          placeholder={placeholder}
          required
          value={value}
          onChange={onChange}
        />
        <button type="button" className="showpass" aria-controls={id} aria-pressed={visible} onClick={() => setVisible(!visible)}>
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </>
  );
}

function Art({ mode }) {
  if (mode === 'forgot' || mode === 'reset') {
    return (
      <div className="authart">
        <img src="/assets/hotel-conversation-v2.png" alt="VocaRealm Hotel scene" />
        <h2>Your next conversation is waiting.</h2>
      </div>
    );
  }
  return (
    <div className="authart">
      <img src="/assets/hotel-conversation-v2.png" alt="A conversation at the hotel" />
      <h2>Every conversation opens a door.</h2>
      <p>Explore everyday situations, build your French and practise at your pace.</p>
      <a className="btn" href="realms.html">
        Explore the realms →
      </a>
    </div>
  );
}

const INTRO = {
  login: ['Welcome back.', 'Log in with your email and password.'],
  signup: ['Start your journey.', 'Choose a username and create your account. Then choose your French level or take the placement check.'],
  forgot: ['Forgot your password?', 'Enter your account email and we’ll send a reset link.'],
  reset: ['A fresh start.', 'Choose a new password with at least 12 characters.'],
};

// One component for the four account pages; `mode` is login | signup | forgot | reset.
export default function AccountPage({ mode }) {
  const client = auth()?.client;
  const [fields, setFields] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [status, setStatus] = useState({ message: mode === 'reset' ? 'Checking your reset link…' : 'Connecting securely…' });
  const [busy, setBusy] = useState(true);
  const [expired, setExpired] = useState(false);
  const confirmInput = useRef(null);
  const hasConfirm = mode === 'signup' || mode === 'reset';
  const [title, intro] = INTRO[mode];

  useEffect(() => {
    if (!client) {
      setStatus({ message: 'We couldn’t connect to the account service. Reload the page or try the demo.', error: true });
      return;
    }
    if (mode === 'reset') {
      checkRecovery({ client, recoveryLink: auth().recoveryLink }).then((result) => {
        setStatus(result);
        setExpired(!!result.expired);
        setBusy(!result.ready);
      });
      return;
    }
    setBusy(false);
    setStatus({
      message: mode === 'login' && new URLSearchParams(location.search).get('password') === 'updated' ? 'Password updated. Log in with your new password.' : '',
    });
  }, [client, mode]);

  const set = (field) => (event) => setFields({ ...fields, [field]: event.target.value });

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const problem = precheck(mode, { ...fields, confirmPassword: hasConfirm ? fields.confirmPassword : undefined });
    if (problem?.focus) {
      setStatus(problem);
      confirmInput.current?.focus();
      return;
    }
    if (!event.currentTarget.reportValidity()) return;
    if (problem) {
      setStatus(problem);
      return;
    }
    setBusy(true);
    setStatus({ message: '' });
    const result = await submitAccount(mode, fields, { client, origin: location.origin });
    if (result.clearPasswords) setFields((f) => ({ ...f, password: '', confirmPassword: '' }));
    if (result.redirect) {
      if (result.replace) location.replace(result.redirect);
      else location.assign(result.redirect);
      return;
    }
    setStatus(result);
    setBusy(false);
  }

  return (
    <main>
      <section className="wrap auth">
        <Art mode={mode} />
        <div className="authbox">
          <span className="eyebrow">Your VocaRealm account</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <form id="accountForm" data-mode={mode} aria-busy={busy} onSubmit={submit}>
            {mode === 'signup' && (
              <>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  minLength={3}
                  maxLength={24}
                  pattern="[A-Za-z0-9_]{3,24}"
                  placeholder="Choose your username"
                  required
                  value={fields.username}
                  onChange={set('username')}
                />
                <small>3–24 letters, numbers or underscores. Usernames are saved in lowercase.</small>
              </>
            )}
            {mode !== 'reset' && (
              <>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={fields.email}
                  onChange={set('email')}
                />
              </>
            )}
            {mode !== 'forgot' && (
              <PasswordInput
                id="password"
                label={mode === 'reset' ? 'New password' : 'Password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={{ login: 'Enter your password', signup: 'Create a strong password' }[mode]}
                value={fields.password}
                onChange={set('password')}
              />
            )}
            {mode === 'signup' && <small>Use at least 12 characters. A longer passphrase works well.</small>}
            {hasConfirm && (
              <>
                <label htmlFor="confirmPassword">{mode === 'reset' ? 'Confirm new password' : 'Confirm password'}</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  ref={confirmInput}
                  type="password"
                  autoComplete="new-password"
                  minLength={mode === 'reset' ? 12 : undefined}
                  placeholder={mode === 'signup' ? 'Enter your password again' : undefined}
                  required
                  value={fields.confirmPassword}
                  onChange={set('confirmPassword')}
                />
              </>
            )}
            <p
              id="accountStatus"
              className={mode === 'login' || mode === 'signup' ? 'notice' : undefined}
              role="status"
              style={{ color: status.error ? '#b42318' : '#22624f' }}
            >
              {status.message}
            </p>
            <button type="submit" className="btn blue" disabled={busy} aria-describedby="accountStatus">
              {busy ? 'Please wait…' : submitLabels[mode]}
            </button>
          </form>
          {mode === 'login' && (
            <>
              <p className="tiny">
                New here?{' '}
                <a href="signup.html">
                  <u>Create an account</u>
                </a>
              </p>
              <p>
                <a href="forgot-password.html">
                  <u>Forgot password?</u>
                </a>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <>
              <p className="tiny">
                Already have an account?{' '}
                <a href="login.html">
                  <u>Log in</u>
                </a>
              </p>
              <p className="tiny">Pilot registration: verification emails are currently limited while our public email service is being configured.</p>
            </>
          )}
          {mode === 'reset' && (
            <p id="requestAnotherReset" hidden={!expired}>
              <a href="forgot-password.html">Request a new reset link</a>
            </p>
          )}
          {(mode === 'forgot' || mode === 'reset') && (
            <p>
              <a href="login.html">← Back to login</a>
            </p>
          )}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <a className="btn" href="demo.html">
                Try the demo
              </a>
              <p className="tiny">{PRIVACY}</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
