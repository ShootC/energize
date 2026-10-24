// Optional local audio for story rehearsal (spec §4.5): record with
// MediaRecorder, play back after the card. The recording lives only in memory
// as a blob URL — never uploaded, never saved.

export function canRecord() {
  try {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  } catch {
    return false;
  }
}

// Resolves to { stop(): Promise<url|null>, cancel() } or rejects when the
// microphone is refused or unavailable (file:// pages often are).
export async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const chunks = [];
  const rec = new MediaRecorder(stream);
  rec.addEventListener('dataavailable', (e) => {
    if (e.data && e.data.size) chunks.push(e.data);
  });
  rec.start();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  return {
    stop: () =>
      new Promise((resolve) => {
        if (rec.state === 'inactive') {
          release();
          resolve(null);
          return;
        }
        rec.addEventListener(
          'stop',
          () => {
            release();
            resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || 'audio/webm' })) : null);
          },
          { once: true },
        );
        rec.stop();
      }),
    cancel: () => {
      try {
        if (rec.state !== 'inactive') rec.stop();
      } catch {
        /* already stopped */
      }
      release();
    },
  };
}
