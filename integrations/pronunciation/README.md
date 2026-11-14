# Pronunciation feedback integration

The deployed Supabase Edge Function `pronunciation-assessment` uses server-side Azure Speech credentials. Current status is not configured; the browser displays this honestly and offers local recording/replay without showing invented word scores.

## Setup

Add `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` as protected Edge Function secrets in the Supabase dashboard. Use the exact region belonging to the Azure Speech resource. Never put these secrets in browser JavaScript or paste them into a repository. Recheck the function's GET status after configuration and test with real French recordings before declaring the feature ready.

The existing connector does not expose Edge Function secret management or Azure Speech resource creation. No Azure resource, billing activation, secret creation or credentials were assumed.

## Behavior

The client records at most 20 seconds, prepares mono 16 kHz PCM WAV in memory, and sends the clip plus the reference text only after the user gives consent and requests assessment. The function validates the user's current Supabase identity, validates WAV parameters, then calls the French fr-FR assessment API. It requests word-level assessment without French prosody scoring.

The endpoint's platform JWT check is disabled because the body implements current-user verification against Supabase Auth for every POST, allowing the GET readiness check and CORS preflight without a login. No client-provided user ID is trusted. Unauthenticated POSTs return 401. The current per-user 30-second throttle is per warm function instance, not a durable global quota; add centralized usage controls and cost limits before a larger public rollout.

The UI displays provider Mispronunciation flags as words to retry, Omission as not heard, and Insertion as extra words. All words are clickable slow model examples. Low-confidence recognition and absent speech return an unclear-recording result, not a pronunciation failure. Assessment is after recording, not live streaming. General free conversation must not be graded against a fixed scripted reply unless the learner is intentionally reading that reply.

Audio is held only in browser and request memory by this application. Review Microsoft's data-handling terms and your Speech resource configuration before production. No audio, reference text or assessments are stored in the app's database by this function.

## Validation

Unit tests verify word flag mapping, missing results and low-confidence handling. The deployed service was checked to return configured:false and to reject an unauthenticated POST. Real Azure pronunciation scoring has not been tested because credentials are not configured. Microphone and audio conversion still require real browser/device validation.

Official API reference: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-speech-to-text-short
