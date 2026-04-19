let /** @type {AudioContext | null} */ audioCtx = null;

/** 各 ColorKey 用（Canvas メタボール塗り） */
const LIQUID_RGB = {
  r: [255, 108, 135],
  b: [90, 210, 255],
  g: [100, 245, 170],
  y: [255, 210, 80],
  p: [220, 150, 255],
  o: [255, 160, 95],
  c: [100, 235, 230],
};

/**
 * @param {number} u
 * @param {{ x: number; y: number }} p0
 * @param {{ x: number; y: number }} p1
 * @param {{ x: number; y: number }} p2
 */
function quadPoint(u, p0, p1, p2) {
  const t = 1 - u;
  return {
    x: t * t * p0.x + 2 * t * u * p1.x + u * u * p2.x,
    y: t * t * p0.y + 2 * t * u * p1.y + u * u * p2.y,
  };
}

/**
 * @param {number} u
 * @param {{ x: number; y: number }} p0
 * @param {{ x: number; y: number }} p1
 * @param {{ x: number; y: number }} p2
 */
function quadTan(u, p0, p1, p2) {
  const t = 1 - u;
  return {
    x: 2 * t * (p1.x - p0.x) + 2 * u * (p2.x - p1.x),
    y: 2 * t * (p1.y - p0.y) + 2 * u * (p2.y - p1.y),
  };
}

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
 * @param {number} n 注ぐ段数（ボールの伸び・個数に反映）
 * @param {string} colorKey PALETTE のキー
 * @param {() => void} onComplete
 */
export function runPourAnimation(fromWrapEl, toWrapEl, n, colorKey, onComplete) {
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
  const blobW = Math.max(20, fi.width * 0.62);

  const sx = fi.left + fi.width / 2 - blobW / 2;
  const sy = fi.top + 4;
  const ex = ti.left + ti.width / 2 - blobW / 2;
  const ey = ti.top + 2;

  const cpx = (sx + ex) / 2;
  const cpy = Math.min(sy, ey) - Math.max(56, Math.abs(ex - sx) * 0.35);

  const p0 = { x: sx, y: sy };
  const p1 = { x: cpx, y: cpy };
  const p2 = { x: ex, y: ey };

  const pad = 76;
  const minX = Math.floor(Math.min(sx, ex, cpx) - pad);
  const maxX = Math.ceil(Math.max(sx, ex, cpx) + pad);
  const minY = Math.floor(Math.min(sy, ey, cpy) - pad);
  const maxY = Math.ceil(Math.max(sy, ey, cpy) + pad);
  const cw = maxX - minX;
  const ch = maxY - minY;
  if (cw < 16 || ch < 16) {
    queueMicrotask(onComplete);
    return;
  }

  const rgb = LIQUID_RGB[/** @type {keyof typeof LIQUID_RGB} */ (colorKey)] ?? LIQUID_RGB.r;

  const layer = document.createElement("div");
  layer.className = "pour-fx-layer";
  layer.setAttribute("aria-hidden", "true");

  const canvas = document.createElement("canvas");
  canvas.className = "pour-fx-canvas";

  const area = cw * ch;
  const downScale = area > 320000 ? 0.34 : area > 140000 ? 0.42 : 0.52;
  const rw = Math.max(56, Math.floor(cw * downScale));
  const rh = Math.max(56, Math.floor(ch * downScale));

  canvas.width = rw;
  canvas.height = rh;
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;
  canvas.style.left = `${minX}px`;
  canvas.style.top = `${minY}px`;

  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) {
    queueMicrotask(onComplete);
    return;
  }

  layer.appendChild(canvas);
  document.body.appendChild(layer);

  playPourStart();

  const ballCount = Math.min(8, 4 + Math.min(4, n));
  const baseR = 9 + n * 1.6;
  const duration = 600;
  const threshold = 1.12;
  const edgeBlend = threshold * 0.32;

  /** @type {{ x: number; y: number; r: number }[]} */
  const buildBalls = (globalT) => {
    const balls = [];
    for (let i = 0; i < ballCount; i += 1) {
      const stagger = i * 0.12;
      const u = Math.max(0, Math.min(1, globalT * 1.08 - stagger));
      if (u <= 0.001 && i > 2) continue;
      const pt = quadPoint(u, p0, p1, p2);
      const tan = quadTan(u, p0, p1, p2);
      const len = Math.hypot(tan.x, tan.y) || 1;
      const nx = -tan.y / len;
      const ny = tan.x / len;
      const wob = Math.sin(globalT * Math.PI * 7 + i * 1.1) * (4 + i * 0.8);
      const pul = 0.88 + 0.14 * Math.sin(globalT * 14 + i);
      balls.push({
        x: pt.x + nx * wob,
        y: pt.y + ny * wob,
        r: baseR * pul * (0.9 + 0.1 * (1 - u)),
      });
    }
    if (balls.length === 0) {
      balls.push({ x: p0.x, y: p0.y, r: baseR });
    }
    return balls;
  };

  const renderFrame = (globalT) => {
    const balls = buildBalls(globalT);
    const imageData = ctx.createImageData(rw, rh);
    const d = imageData.data;

    for (let py = 0; py < rh; py += 1) {
      for (let px = 0; px < rw; px += 1) {
        const scrX = minX + ((px + 0.5) / rw) * cw;
        const scrY = minY + ((py + 0.5) / rh) * ch;
        let sum = 0;
        for (let b = 0; b < balls.length; b += 1) {
          const ball = balls[b];
          const dx = scrX - ball.x;
          const dy = scrY - ball.y;
          sum += (ball.r * ball.r) / (dx * dx + dy * dy + 1.2);
        }
        if (sum < threshold - edgeBlend) continue;

        let a = 1;
        if (sum < threshold + edgeBlend) {
          a = (sum - (threshold - edgeBlend)) / (2 * edgeBlend);
          if (a < 0.02) continue;
          if (a > 1) a = 1;
        }

        const spec = Math.min(1.35, sum / (threshold * 2.8));
        const hi = 0.78 + 0.22 * spec;
        const idx = (py * rw + px) * 4;
        d[idx] = Math.min(255, rgb[0] * hi);
        d[idx + 1] = Math.min(255, rgb[1] * hi);
        d[idx + 2] = Math.min(255, rgb[2] * hi);
        d[idx + 3] = Math.round(a * 255);
      }
    }
    ctx.putImageData(imageData, 0, 0);
  };

  let settled = false;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let safety = null;
  /** @type {number} */
  let rafId = 0;

  const settle = () => {
    if (settled) return;
    settled = true;
    if (safety != null) window.clearTimeout(safety);
    window.cancelAnimationFrame(rafId);
    layer.remove();
    onComplete();
  };

  const start = performance.now();
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    renderFrame(t);
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      settle();
    }
  };

  rafId = requestAnimationFrame(tick);
  safety = window.setTimeout(settle, 980);
}
