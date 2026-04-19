let /** @type {AudioContext | null} */ audioCtx = null;

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function resumeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === "suspended") void audioCtx.resume();
  return audioCtx;
}

/** @param {AudioContext} ctx */
function softClick(ctx) {
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(660, t);
  o.frequency.exponentialRampToValueAtTime(880, t + 0.04);
  g.gain.setValueAtTime(0.07, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.08);
}

export function playTubeSelect() {
  const ctx = resumeAudio();
  if (!ctx) return;
  softClick(ctx);
}

/** @param {AudioContext} ctx */
function pourNoise(ctx, duration = 0.38) {
  const t = ctx.currentTime;
  const len = ctx.sampleRate * duration;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * 0.35;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1400, t);
  bp.Q.setValueAtTime(0.55, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.11, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  src.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  src.start(t);
  src.stop(t + duration + 0.02);
}

export function playPourStart() {
  const ctx = resumeAudio();
  if (!ctx) return;
  pourNoise(ctx, 0.42);
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(95, t + 0.35);
  g.gain.setValueAtTime(0.04, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.36);
}

export function playPourLand() {
  const ctx = resumeAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const bp = ctx.createBiquadFilter();
  o.type = "triangle";
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(75, t + 0.14);
  bp.type = "lowpass";
  bp.frequency.setValueAtTime(1200, t);
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(bp);
  bp.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.18);

  const t2 = t + 0.02;
  const o2 = ctx.createOscillator();
  const g2 = ctx.createGain();
  o2.type = "sine";
  o2.frequency.setValueAtTime(520, t2);
  o2.frequency.exponentialRampToValueAtTime(240, t2 + 0.06);
  g2.gain.setValueAtTime(0.05, t2);
  g2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.08);
  o2.connect(g2);
  g2.connect(ctx.destination);
  o2.start(t2);
  o2.stop(t2 + 0.09);
}

export function playWinFanfare() {
  const ctx = resumeAudio();
  if (!ctx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  let t = ctx.currentTime;
  for (let i = 0; i < notes.length; i += 1) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(notes[i], t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.24);
    t += 0.11;
  }
}

/**
 * @param {HTMLElement} fromWrapEl
 * @param {HTMLElement} toWrapEl
 * @param {number} n
 * @param {string} liquidBackground
 * @param {() => void} onComplete
 */
export function runPourAnimation(fromWrapEl, toWrapEl, n, liquidBackground, onComplete) {
  if (prefersReducedMotion()) {
    queueMicrotask(onComplete);
    return;
  }

  const fromTube = fromWrapEl.querySelector(".tube");
  const toTube = toWrapEl.querySelector(".tube");
  const fromInner = fromWrapEl.querySelector(".tube-inner");
  const toInner = toWrapEl.querySelector(".tube-inner");
  if (!fromTube || !toTube || !fromInner || !toInner) {
    queueMicrotask(onComplete);
    return;
  }

  const fi = fromInner.getBoundingClientRect();
  const ti = toInner.getBoundingClientRect();
  const segH = (fi.height - 9) / 4;
  const h = Math.max(18, segH * n + (n - 1) * 3);
  const w = Math.max(20, fi.width * 0.62);

  const sx = fi.left + fi.width / 2 - w / 2;
  const sy = fi.top + 4;
  const ex = ti.left + ti.width / 2 - w / 2;
  const ey = ti.top + 2;

  const cpx = (sx + ex) / 2;
  const cpy = Math.min(sy, ey) - Math.max(56, Math.abs(ex - sx) * 0.35);

  const layer = document.createElement("div");
  layer.className = "pour-fx-layer";
  layer.setAttribute("aria-hidden", "true");

  const slug = document.createElement("div");
  slug.className = "pour-slug";
  slug.style.width = `${w}px`;
  slug.style.height = `${h}px`;
  slug.style.background = liquidBackground;
  const gloss = document.createElement("div");
  gloss.className = "pour-slug-gloss";
  slug.appendChild(gloss);

  layer.appendChild(slug);
  document.body.appendChild(layer);

  playPourStart();

  slug.style.left = "0px";
  slug.style.top = "0px";

  const anim = slug.animate(
    [
      { transform: `translate(${sx}px, ${sy}px) rotate(-8deg) scale(1, 1.02)`, opacity: 0.96 },
      { transform: `translate(${cpx}px, ${cpy}px) rotate(5deg) scale(0.96, 1.05)`, opacity: 1 },
      { transform: `translate(${ex}px, ${ey}px) rotate(0deg) scale(1, 1)`, opacity: 1 },
    ],
    { duration: 560, easing: "cubic-bezier(0.42, 0, 0.2, 1)", fill: "forwards" },
  );

  let settled = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let safety = null;
  const settle = () => {
    if (settled) return;
    settled = true;
    if (safety != null) window.clearTimeout(safety);
    try {
      anim.cancel();
    } catch {
      /* ignore */
    }
    layer.remove();
    onComplete();
  };
  safety = window.setTimeout(settle, 900);
  anim.onfinish = () => settle();
}
