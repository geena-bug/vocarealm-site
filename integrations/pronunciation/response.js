export function assessmentResult(body) {
  const best = body?.NBest?.[0];
  if (body?.RecognitionStatus !== 'Success' || !best || !Array.isArray(best.Words) || !best.Words.length)
    return { error: 'unclear_audio', message: 'We could not hear enough clearly to assess this recording. Please try again.' };
  if (typeof best.Confidence === 'number' && best.Confidence < 0.45)
    return { error: 'unclear_audio', message: 'The recording was not clear enough for reliable word feedback. Please try again in a quieter place.' };
  const score = best.PronunciationAssessment || best;
  const words = best.Words.map((w) => {
    const a = w.PronunciationAssessment || w;
    return {
      word: String(w.Word || ''),
      errorType: ['None', 'Mispronunciation', 'Omission', 'Insertion'].includes(a.ErrorType) ? a.ErrorType : 'Unknown',
      accuracy: typeof a.AccuracyScore === 'number' ? a.AccuracyScore : null,
    };
  }).filter((w) => w.word);
  return { words, display: best.Display || body.DisplayText || '', accuracy: typeof score.AccuracyScore === 'number' ? score.AccuracyScore : null };
}
