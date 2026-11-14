import { assessmentResult } from './response.js';
const origin = 'https://vocarealm-explore.steadytern512.chatgpt.site';
const cors = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  Vary: 'Origin',
};
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const history = new Map<string, number>();
Deno.serve(async (req: Request) => {
  if (req.headers.get('Origin') && req.headers.get('Origin') !== origin) return json({ error: 'origin_not_allowed' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const key = Deno.env.get('AZURE_SPEECH_KEY'),
    region = Deno.env.get('AZURE_SPEECH_REGION');
  const configured = !!key && !!region && /^[a-z0-9-]+$/.test(region);
  if (req.method === 'GET') return json({ configured, language: 'fr-FR' });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  // Validate identity server-side, including current user status. Never trust client user IDs.
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'sign_in_required', message: 'Log in to request pronunciation feedback.' }, 401);
  const auth = await fetch(Deno.env.get('SUPABASE_URL') + '/auth/v1/user', {
    headers: { Authorization: authorization, apikey: Deno.env.get('SUPABASE_ANON_KEY')! },
  }).catch(() => null);
  if (!auth?.ok) return json({ error: 'sign_in_required', message: 'Please log in again.' }, 401);
  const user = await auth.json();
  if (!user.id) return json({ error: 'sign_in_required' }, 401);
  if (!configured)
    return json({ error: 'not_configured', message: 'Pronunciation assessment is not connected yet. You can still listen, record and replay.' }, 503);
  const now = Date.now();
  if (now - (history.get(user.id) || 0) < 30000) return json({ error: 'rate_limit', message: 'Please wait 30 seconds before another assessment.' }, 429);
  if (Number(req.headers.get('Content-Length') || 0) > 750000) return json({ error: 'audio_too_large' }, 413);
  try {
    const form = await req.formData(),
      audio = form.get('audio'),
      reference = String(form.get('reference') || '').trim();
    if (!(audio instanceof File) || audio.size > 660000 || audio.size < 3200 || !reference || reference.length > 500)
      return json({ error: 'invalid_request', message: 'Use a short French word or sentence and record for up to 20 seconds.' }, 400);
    const buffer = await audio.arrayBuffer(),
      view = new DataView(buffer),
      bytes = new Uint8Array(buffer);
    const text = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
    if (
      text(0, 4) !== 'RIFF' ||
      text(8, 12) !== 'WAVE' ||
      text(12, 16) !== 'fmt ' ||
      view.getUint16(20, true) !== 1 ||
      view.getUint16(22, true) !== 1 ||
      view.getUint32(24, true) !== 16000 ||
      view.getUint16(34, true) !== 16 ||
      text(36, 40) !== 'data' ||
      view.getUint32(40, true) > buffer.byteLength - 44
    )
      return json({ error: 'invalid_audio', message: 'This recording format could not be assessed. Please record again.' }, 400);
    history.set(user.id, now);
    if (history.size > 5000) for (const [id, time] of history) if (now - time > 60000) history.delete(id);
    const options = { ReferenceText: reference, GradingSystem: 'HundredMark', Granularity: 'Word', Dimension: 'Comprehensive', EnableMiscue: true };
    const header = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(options))));
    const response = await fetch(
      'https://' + region + '.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=fr-FR&format=detailed',
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key!,
          'Pronunciation-Assessment': header,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          Accept: 'application/json',
        },
        body: buffer,
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!response.ok) return json({ error: 'assessment_unavailable', message: 'Pronunciation feedback is unavailable right now. Please try later.' }, 502);
    const result = assessmentResult(await response.json());
    return json(result, 'error' in result ? 422 : 200);
  } catch {
    return json({ error: 'assessment_unavailable', message: 'The recording could not be assessed. Please try again.' }, 502);
  }
});
