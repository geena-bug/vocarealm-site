// Account requests for the login, signup, forgot-password and reset-password pages, kept free of React so
// they can be unit-tested with a fake Supabase client. Each returns what the page should do next:
// { message, error } to show, { redirect } to leave, and { clearPasswords } after a successful send.

const messages = {
  invalid_credentials: 'The email or password is incorrect. Please try again.',
  email_not_confirmed: 'Please confirm your email before logging in. Check your inbox and spam folder.',
  user_already_exists: 'If you already have an account, log in or reset your password.',
  over_email_send_rate_limit: 'Too many emails have been requested. Please wait a while before trying again.',
  over_request_rate_limit: 'Too many attempts. Please wait before trying again.',
  email_address_not_authorized: 'Verification email is not available for this address yet. Public registration is waiting for our email service to be configured.',
  signup_disabled: 'Registration is temporarily closed. You can still explore the demo.',
  weak_password: 'Please choose a longer, stronger password.',
  same_password: 'Choose a password different from your current one.',
  unexpected_failure: 'We couldn’t create your account. Try another username, or log in if you already registered.',
};

export const submitLabels = { signup: 'Create account', login: 'Log in', forgot: 'Send reset link', reset: 'Save new password' };

export function friendly(error) {
  if (error?.message?.toLowerCase().includes('email address not authorized')) return messages.email_address_not_authorized;
  return messages[error?.code] || (error?.status === 429 ? messages.over_request_rate_limit : 'We couldn’t complete that request. Check your connection and try again.');
}

// Checks done before contacting Supabase. Returns an error message, or null.
export function precheck(mode, { password = '', confirmPassword, username }) {
  if (confirmPassword !== undefined && password !== confirmPassword) return { message: 'Your passwords don’t match. Please enter them again.', error: true, focus: 'confirmPassword' };
  if (mode === 'signup' && !/^[a-z0-9_]{3,24}$/.test(username.trim().toLowerCase())) {
    return { message: 'Use 3–24 letters, numbers or underscores for your username.', error: true };
  }
  return null;
}

export async function submitAccount(mode, fields, { client, origin, session = sessionStorage }) {
  const email = fields.email?.trim();
  const password = fields.password || '';
  try {
    if (mode === 'signup') {
      const username = fields.username.trim().toLowerCase();
      const result = await client.auth.signUp({ email, password, options: { data: { username }, emailRedirectTo: origin + '/auth-callback.html' } });
      if (result.error) throw result.error;
      if (result.data.session) return { redirect: 'levels.html', clearPasswords: true };
      return {
        clearPasswords: true,
        message: 'Check your email for a confirmation link. After confirming, you can log in. If you already registered, use Log in or Forgot password.',
      };
    }
    if (mode === 'login') {
      const result = await client.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      return { redirect: 'levels.html', clearPasswords: true };
    }
    if (mode === 'forgot') {
      const result = await client.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password.html' });
      if (result.error) throw result.error;
      return { message: 'If an account is registered with that email, you’ll receive a password reset link. Check your inbox and spam folder.' };
    }
    if (mode === 'reset') {
      const result = await client.auth.updateUser({ password });
      if (result.error) throw result.error;
      session.removeItem('vocarealm-recovery');
      await client.auth.signOut({ scope: 'local' });
      return { redirect: 'login.html?password=updated', replace: true, clearPasswords: true };
    }
  } catch (e) {
    return { message: friendly(e), error: true };
  }
  return { message: 'We couldn’t complete that request. Check your connection and try again.', error: true };
}

// The reset page only works after arriving from the emailed recovery link (remembered for this tab).
export async function checkRecovery({ client, recoveryLink, session = sessionStorage }) {
  const recovery = recoveryLink || session.getItem('vocarealm-recovery') === 'active';
  if (recoveryLink) session.setItem('vocarealm-recovery', 'active');
  try {
    const { data } = await client.auth.getSession();
    if (!recovery || !data.session) return { message: 'Open the password reset link from your email first. If it expired, request a new one.', error: true, expired: true };
    return { message: 'Choose a new password for your VocaRealm account.', ready: true };
  } catch {
    return { message: 'This reset link could not be verified. Request another link.', error: true };
  }
}
