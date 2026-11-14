// Converts a browser recording into the 16 kHz mono 16-bit PCM WAV the pronunciation function accepts
// (at most 20 seconds).
export async function toWav(input) {
  const Context = window.AudioContext || window.webkitAudioContext;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!Context || !Offline) throw Error('This browser cannot prepare audio for assessment. Try a current Chrome or Safari browser.');
  const ctx = new Context();
  let decoded;
  try {
    decoded = await ctx.decodeAudioData(await input.arrayBuffer());
  } finally {
    await ctx.close();
  }
  const n = Math.min(320000, Math.ceil(decoded.duration * 16000));
  const offline = new Offline(1, n, 16000);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const pcm = (await offline.startRendering()).getChannelData(0);
  const result = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(result);
  const str = (offset, s) => {
    for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 16000, true);
  v.setUint32(28, 32000, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, 'data');
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const x = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 32768 : x * 32767, true);
  }
  return new Blob([result], { type: 'audio/wav' });
}
