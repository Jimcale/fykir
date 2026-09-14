let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!ctx) ctx = new AudioCtx();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(
  freq: number,
  start: number,
  duration: number,
  gainPeak = 0.16,
  type: OscillatorType = "sine"
) {
  const audio = getCtx();
  if (!audio) return;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audio.currentTime + start);
  gain.gain.setValueAtTime(0, audio.currentTime + start);
  gain.gain.linearRampToValueAtTime(gainPeak, audio.currentTime + start + 0.015);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    audio.currentTime + start + duration
  );
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(audio.currentTime + start);
  osc.stop(audio.currentTime + start + duration + 0.05);
}

export const sounds = {
  tap() {
    tone(720, 0, 0.08, 0.08);
  },
  pop() {
    tone(520, 0, 0.1, 0.14);
    tone(780, 0.05, 0.12, 0.1);
  },
  success() {
    tone(523.25, 0, 0.14, 0.14);
    tone(659.25, 0.1, 0.14, 0.14);
    tone(783.99, 0.2, 0.22, 0.16);
  },
  countdownTick() {
    tone(440, 0, 0.09, 0.12);
  },
  reveal() {
    tone(392, 0, 0.12, 0.12);
    tone(523.25, 0.08, 0.12, 0.14);
    tone(659.25, 0.16, 0.12, 0.15);
    tone(783.99, 0.24, 0.16, 0.16);
    tone(1046.5, 0.32, 0.3, 0.14);
  },
  notification() {
    tone(880, 0, 0.09, 0.12);
    tone(1174.66, 0.09, 0.14, 0.12);
  },
  error() {
    tone(220, 0, 0.18, 0.12, "sawtooth");
  },
};
