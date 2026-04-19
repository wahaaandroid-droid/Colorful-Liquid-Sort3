import "./style.css";

const MAX_H = 4;
const START_LIVES = 3;
const HI_KEY = "liquid-sort-endless-hi-v1";

const PALETTE = {
  r: "linear-gradient(180deg, #ff8aa0, var(--c-r))",
  b: "linear-gradient(180deg, #8fe6ff, var(--c-b))",
  g: "linear-gradient(180deg, #9cffc8, var(--c-g))",
  y: "linear-gradient(180deg, #ffe98f, var(--c-y))",
  p: "linear-gradient(180deg, #e9c2ff, var(--c-p))",
  o: "linear-gradient(180deg, #ffc48a, var(--c-o))",
  c: "linear-gradient(180deg, #9cfbf4, var(--c-c))",
};

/** @typedef {keyof typeof PALETTE} ColorKey */

const COLOR_KEYS = /** @type {ColorKey[]} */ (Object.keys(PALETTE));

/**
 * @type {ColorKey[][][]}
 */
const LEVELS = [
  [
    ["r", "b", "r", "b"],
    ["b", "r", "b", "r"],
    [],
    [],
  ],
  [
    ["g", "y", "g", "y"],
    ["y", "g", "y", "g"],
    ["r", "b", "r", "b"],
    ["b", "r", "b", "r"],
    [],
    [],
  ],
  [
    ["p", "o", "c", "p"],
    ["o", "c", "p", "o"],
    ["c", "p", "o", "c"],
    [],
    [],
  ],
];

/** @type {{ mode: 'menu' | 'classic' | 'endless'; levelIndex: number; tubes: ColorKey[][]; selected: number | null; moves: number; history: ColorKey[][][]; won: boolean; lives: number; clearedStages: number; maxMoves: number; stageSnapshot: ColorKey[][] | null; endlessGameOver: boolean; lifeLossReason: null | 'moves' | 'declare' }} */
const state = {
  mode: "menu",
  levelIndex: 0,
  tubes: cloneTubes(LEVELS[0]),
  selected: null,
  moves: 0,
  history: [],
  won: false,
  lives: START_LIVES,
  clearedStages: 0,
  maxMoves: 0,
  stageSnapshot: null,
  endlessGameOver: false,
  lifeLossReason: null,
};

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

function cloneTubes(tubes) {
  return tubes.map((t) => t.slice());
}

function topSegment(tube) {
  if (tube.length === 0) return { color: /** @type {ColorKey | null} */ (null), count: 0 };
  const top = /** @type {ColorKey} */ (tube[tube.length - 1]);
  let count = 0;
  for (let i = tube.length - 1; i >= 0 && tube[i] === top; i -= 1) count += 1;
  return { color: top, count };
}

function canPour(from, to) {
  if (from.length === 0) return 0;
  const { color, count } = topSegment(from);
  if (!color) return 0;
  const space = MAX_H - to.length;
  if (space <= 0) return 0;
  if (to.length === 0) return Math.min(count, space);
  if (to[to.length - 1] !== color) return 0;
  return Math.min(count, space);
}

function pour(from, to, n) {
  const nextFrom = from.slice();
  const nextTo = to.slice();
  for (let i = 0; i < n; i += 1) nextFrom.pop();
  const color = /** @type {ColorKey} */ (from[from.length - 1]);
  for (let i = 0; i < n; i += 1) nextTo.push(color);
  return { from: nextFrom, to: nextTo };
}

function isWin(tubes) {
  return tubes.every((t) => {
    if (t.length === 0) return true;
    if (t.length !== MAX_H) return false;
    const c = t[0];
    return t.every((x) => x === c);
  });
}

/** @param {ColorKey[][]} tubes */
function listLegalPours(tubes) {
  const out = [];
  for (let f = 0; f < tubes.length; f += 1) {
    for (let t = 0; t < tubes.length; t += 1) {
      if (f === t) continue;
      const n = canPour(tubes[f], tubes[t]);
      if (n > 0) out.push({ f, t, n });
    }
  }
  return out;
}

/** @param {ColorKey[][]} tubes */
function applyPourState(tubes, f, t) {
  const n = canPour(tubes[f], tubes[t]);
  if (n <= 0) return null;
  const nt = tubes.map((x) => x.slice());
  const fr = nt[f];
  const tt = nt[t];
  const color = fr[fr.length - 1];
  for (let i = 0; i < n; i += 1) {
    fr.pop();
    tt.push(color);
  }
  return nt;
}

/** 完成形（各色4段の筒 + 空筒） */
function makeSolved(numColors, emptyCount) {
  const tubes = [];
  for (let i = 0; i < numColors; i += 1) {
    const c = COLOR_KEYS[i];
    tubes.push(Array.from({ length: MAX_H }, () => c));
  }
  for (let e = 0; e < emptyCount; e += 1) tubes.push([]);
  return tubes;
}

/** 完成形から合法な注ぎを繰り返して混ぜる（必ず解ける） */
function shuffleFromSolved(numColors, emptyCount, steps) {
  let tubes = makeSolved(numColors, emptyCount);
  for (let s = 0; s < steps; s += 1) {
    const moves = listLegalPours(tubes);
    if (moves.length === 0) break;
    const pick = moves[Math.floor(Math.random() * moves.length)];
    const next = applyPourState(tubes, pick.f, pick.t);
    if (next) tubes = next;
  }
  return tubes;
}

function endlessParams(clearedStages) {
  const numColors = Math.min(7, 2 + Math.floor(clearedStages / 2));
  const emptyCount = 2;
  const shuffleSteps = 26 + clearedStages * 5 + numColors * 8;
  const maxMoves = Math.max(52, shuffleSteps * 2 + numColors * 18 + 24);
  return { numColors, emptyCount, shuffleSteps, maxMoves };
}

function startEndlessStage() {
  const { numColors, emptyCount, shuffleSteps, maxMoves } = endlessParams(state.clearedStages);
  let tubes = shuffleFromSolved(numColors, emptyCount, shuffleSteps);
  let guard = 0;
  while (isWin(tubes) && guard < 40) {
    tubes = shuffleFromSolved(numColors, emptyCount, shuffleSteps + 12 + guard * 3);
    guard += 1;
  }
  state.tubes = tubes;
  state.stageSnapshot = cloneTubes(tubes);
  state.maxMoves = maxMoves;
  state.moves = 0;
  state.history = [];
  state.selected = null;
  state.won = false;
}

function startEndlessRun() {
  state.mode = "endless";
  state.lives = START_LIVES;
  state.clearedStages = 0;
  state.endlessGameOver = false;
  state.lifeLossReason = null;
  startEndlessStage();
  render();
}

function readHighScore() {
  const v = Number(localStorage.getItem(HI_KEY) || "0");
  return Number.isFinite(v) ? v : 0;
}

function writeHighScore(score) {
  const prev = readHighScore();
  if (score > prev) localStorage.setItem(HI_KEY, String(score));
}

/** @param {'moves' | 'declare'} reason */
function failEndless(reason) {
  state.lifeLossReason = null;
  state.lives -= 1;
  state.selected = null;
  state.won = false;
  if (state.lives <= 0) {
    writeHighScore(state.clearedStages);
    state.endlessGameOver = true;
    render();
    return;
  }
  state.lifeLossReason = reason;
  render();
}

function acknowledgeLifeLoss() {
  state.lifeLossReason = null;
  startEndlessStage();
  render();
}

function goMenu() {
  state.mode = "menu";
  state.endlessGameOver = false;
  state.lifeLossReason = null;
  state.won = false;
  state.selected = null;
  render();
}

function startClassic() {
  state.mode = "classic";
  state.levelIndex = 0;
  resetLevel();
}

function pushHistory() {
  state.history.push(cloneTubes(state.tubes));
  if (state.history.length > 80) state.history.shift();
}

function undo() {
  if (state.mode === "endless" && (state.won || state.endlessGameOver || state.lifeLossReason)) return;
  const prev = state.history.pop();
  if (!prev) return;
  state.tubes = prev;
  state.selected = null;
  state.moves = Math.max(0, state.moves - 1);
  state.won = false;
  render();
}

function resetLevel() {
  if (state.mode === "endless") {
    if (!state.stageSnapshot || state.won || state.endlessGameOver || state.lifeLossReason) return;
    state.tubes = cloneTubes(state.stageSnapshot);
    state.selected = null;
    state.moves = 0;
    state.history = [];
    state.won = false;
    render();
    return;
  }
  state.tubes = cloneTubes(LEVELS[state.levelIndex]);
  state.selected = null;
  state.moves = 0;
  state.history = [];
  state.won = false;
  render();
}

function nextLevel() {
  state.levelIndex = (state.levelIndex + 1) % LEVELS.length;
  resetLevel();
}

function tryPour(fromIdx, toIdx) {
  const from = state.tubes[fromIdx];
  const to = state.tubes[toIdx];
  const n = canPour(from, to);
  if (n <= 0) return false;
  pushHistory();
  const { from: nf, to: nt } = pour(from, to, n);
  state.tubes[fromIdx] = nf;
  state.tubes[toIdx] = nt;
  state.moves += 1;
  state.selected = null;
  if (isWin(state.tubes)) {
    state.won = true;
    return true;
  }
  if (state.mode === "endless" && state.moves > state.maxMoves) {
    failEndless("moves");
    return true;
  }
  return true;
}

function onTubeClick(index) {
  if (state.mode === "endless" && (state.won || state.endlessGameOver || state.lifeLossReason)) return;
  if (state.won) return;
  if (state.selected === null) {
    if (state.tubes[index].length === 0) return;
    state.selected = index;
    render();
    return;
  }
  if (state.selected === index) {
    state.selected = null;
    render();
    return;
  }
  const fromIdx = state.selected;
  const ok = tryPour(fromIdx, index);
  if (!ok && state.tubes[index].length > 0) {
    state.selected = index;
  } else if (!ok) {
    state.selected = fromIdx;
  }
  render();
}

function tubeEl(index) {
  const wrap = document.createElement("div");
  wrap.className = "tube-wrap";

  const tube = document.createElement("button");
  tube.type = "button";
  tube.className = "tube";
  tube.setAttribute("aria-label", `試験管 ${index + 1}`);
  if (state.selected === index) tube.classList.add("selected");
  if (state.mode === "endless" && (state.won || state.endlessGameOver || state.lifeLossReason)) {
    tube.disabled = true;
  }

  const mouth = document.createElement("div");
  mouth.className = "mouth";
  tube.appendChild(mouth);

  const inner = document.createElement("div");
  inner.className = "tube-inner";

  const colors = state.tubes[index];
  for (let i = colors.length - 1; i >= 0; i -= 1) {
    const seg = document.createElement("div");
    seg.className = "liquid";
    const key = colors[i];
    seg.style.background = PALETTE[key] ?? PALETTE.r;
    inner.appendChild(seg);
  }

  tube.appendChild(inner);
  tube.addEventListener("click", () => onTubeClick(index));

  const label = document.createElement("div");
  label.className = "tube-label";
  label.textContent = colors.length ? `${colors.length}/${MAX_H}` : "空";

  wrap.appendChild(tube);
  wrap.appendChild(label);
  return wrap;
}

function overlayWinClassic() {
  const root = document.createElement("div");
  root.className = "overlay";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>クリア！</h2>
    <p>このステージを完成させました。<br />手数: <strong>${state.moves}</strong></p>
    <div class="row">
      <button class="btn primary" type="button" data-action="next">次のステージ</button>
      <button class="btn" type="button" data-action="again">もう一度</button>
    </div>
  `;

  card.querySelector('[data-action="next"]')?.addEventListener("click", () => {
    nextLevel();
    root.remove();
  });
  card.querySelector('[data-action="again"]')?.addEventListener("click", () => {
    resetLevel();
    root.remove();
  });

  root.addEventListener("click", (e) => {
    if (e.target === root) {
      nextLevel();
      root.remove();
    }
  });

  root.appendChild(card);
  return root;
}

function overlayWinEndless() {
  const root = document.createElement("div");
  root.className = "overlay";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>ラウンドクリア！</h2>
    <p>手数: <strong>${state.moves}</strong> / ${state.maxMoves}<br />累計クリア: <strong>${state.clearedStages + 1}</strong></p>
    <div class="row">
      <button class="btn primary" type="button" data-action="next">次のラウンド</button>
      <button class="btn" type="button" data-action="again">この盤でもう一度</button>
    </div>
  `;

  card.querySelector('[data-action="next"]')?.addEventListener("click", () => {
    state.clearedStages += 1;
    startEndlessStage();
    root.remove();
    render();
  });
  card.querySelector('[data-action="again"]')?.addEventListener("click", () => {
    state.tubes = cloneTubes(state.stageSnapshot ?? state.tubes);
    state.moves = 0;
    state.history = [];
    state.selected = null;
    state.won = false;
    root.remove();
    render();
  });

  root.appendChild(card);
  return root;
}

function overlayLifeLoss() {
  const root = document.createElement("div");
  root.className = "overlay";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");

  const title = state.lifeLossReason === "moves" ? "手数オーバー" : "詰みを宣言";
  const msg =
    state.lifeLossReason === "moves"
      ? `このラウンドの手数上限（${state.maxMoves}手）を超えました。`
      : "このラウンドを諦めました。";

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>${title}</h2>
    <p>${msg}<br />ライフが <strong>1</strong> つ減りました（残り <strong>${state.lives}</strong>）。</p>
    <div class="row">
      <button class="btn primary" type="button" data-action="ok">次のラウンドへ</button>
    </div>
  `;

  card.querySelector('[data-action="ok"]')?.addEventListener("click", () => {
    root.remove();
    acknowledgeLifeLoss();
  });

  root.appendChild(card);
  return root;
}

function overlayGameOver() {
  const root = document.createElement("div");
  root.className = "overlay";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");

  const best = readHighScore();
  const score = state.clearedStages;

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h2>ゲームオーバー</h2>
    <p>このランのスコア（累計クリア）: <strong>${score}</strong><br />自己ベスト: <strong>${best}</strong></p>
    <div class="row">
      <button class="btn primary" type="button" data-action="menu">モード選択へ</button>
    </div>
  `;

  card.querySelector('[data-action="menu"]')?.addEventListener("click", () => {
    root.remove();
    goMenu();
  });

  root.appendChild(card);
  return root;
}

function renderMenu() {
  app.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "menu-screen";

  wrap.innerHTML = `
    <div class="brand menu-brand">
      <h1>カラフルリキッドソート</h1>
      <p>モードを選んでください</p>
    </div>
    <div class="menu-actions">
      <button class="btn primary menu-btn" type="button" data-go="classic">ステージモード</button>
      <button class="btn menu-btn" type="button" data-go="endless">エンドレス（ライフ）</button>
    </div>
    <p class="hint menu-hint">エンドレスは1プレイ内のライフ制です。手数上限を超えるか「詰み宣言」でライフが減り、0で終了します。</p>
  `;

  wrap.querySelector('[data-go="classic"]')?.addEventListener("click", () => startClassic());
  wrap.querySelector('[data-go="endless"]')?.addEventListener("click", () => startEndlessRun());

  app.appendChild(wrap);
}

function renderClassic() {
  app.innerHTML = "";

  const top = document.createElement("div");
  top.className = "topbar";
  top.innerHTML = `
    <div class="brand">
      <h1>カラフルリキッドソート</h1>
      <p>同じ色だけを重ねて、試験管をそろえよう</p>
    </div>
    <div class="pill" aria-live="polite">Lv.${state.levelIndex + 1} / ${LEVELS.length}</div>
  `;

  const menuLink = document.createElement("button");
  menuLink.type = "button";
  menuLink.className = "btn ghost";
  menuLink.textContent = "モード選択";
  menuLink.addEventListener("click", () => goMenu());

  const topRow = document.createElement("div");
  topRow.className = "top-actions";
  topRow.append(top, menuLink);

  const actions = document.createElement("div");
  actions.className = "actions";

  const btnUndo = document.createElement("button");
  btnUndo.type = "button";
  btnUndo.className = "btn";
  btnUndo.textContent = "戻す";
  btnUndo.disabled = state.history.length === 0 || state.won;
  btnUndo.addEventListener("click", () => undo());

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.className = "btn";
  btnReset.textContent = "やり直し";
  btnReset.addEventListener("click", () => resetLevel());

  const btnSkip = document.createElement("button");
  btnSkip.type = "button";
  btnSkip.className = "btn primary";
  btnSkip.textContent = "次のステージ";
  btnSkip.addEventListener("click", () => nextLevel());

  actions.append(btnUndo, btnReset, btnSkip);

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent =
    state.selected === null
      ? "色の入った試験管をタップして選び、移し先の試験管をタップします。"
      : "移し先の試験管をタップ（同じ筒をもう一度タップでキャンセル）。";

  const board = document.createElement("div");
  board.className = "board";
  for (let i = 0; i < state.tubes.length; i += 1) board.appendChild(tubeEl(i));

  const moves = document.createElement("p");
  moves.className = "hint";
  moves.style.marginTop = "10px";
  moves.textContent = `手数: ${state.moves}`;

  app.append(topRow, actions, hint, board, moves);

  if (state.won) app.appendChild(overlayWinClassic());
}

function renderEndless() {
  app.innerHTML = "";

  const top = document.createElement("div");
  top.className = "topbar";
  top.innerHTML = `
    <div class="brand">
      <h1>エンドレス</h1>
      <p>ライフあり・1ラン限り</p>
    </div>
    <div class="pill" aria-live="polite">♥${state.lives}　クリア${state.clearedStages}</div>
  `;

  const menuLink = document.createElement("button");
  menuLink.type = "button";
  menuLink.className = "btn ghost";
  menuLink.textContent = "モード選択";
  menuLink.addEventListener("click", () => goMenu());

  const topRow = document.createElement("div");
  topRow.className = "top-actions";
  topRow.append(top, menuLink);

  const actions = document.createElement("div");
  actions.className = "actions";

  const btnUndo = document.createElement("button");
  btnUndo.type = "button";
  btnUndo.className = "btn";
  btnUndo.textContent = "戻す";
  btnUndo.disabled =
    state.history.length === 0 || state.won || !!state.lifeLossReason || state.endlessGameOver;
  btnUndo.addEventListener("click", () => undo());

  const btnReset = document.createElement("button");
  btnReset.type = "button";
  btnReset.className = "btn";
  btnReset.textContent = "やり直し";
  btnReset.disabled = !!state.lifeLossReason || state.endlessGameOver || state.won;
  btnReset.addEventListener("click", () => resetLevel());

  actions.append(btnUndo, btnReset);

  const declare = document.createElement("button");
  declare.type = "button";
  declare.className = "btn danger full";
  declare.textContent = "詰み宣言（このラウンドを諦める）";
  declare.disabled = !!state.lifeLossReason || state.endlessGameOver || state.won;
  declare.addEventListener("click", () => failEndless("declare"));

  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent =
    state.selected === null
      ? "色の入った試験管をタップして選び、移し先の試験管をタップします。"
      : "移し先の試験管をタップ（同じ筒をもう一度タップでキャンセル）。";

  const cap = document.createElement("p");
  cap.className = "hint";
  cap.style.marginBottom = "4px";
  cap.textContent = `手数: ${state.moves} / ${state.maxMoves}（上限を超えるとライフが1減ります）`;

  const board = document.createElement("div");
  board.className = "board";
  for (let i = 0; i < state.tubes.length; i += 1) board.appendChild(tubeEl(i));

  app.append(topRow, actions, declare, cap, hint, board);

  if (state.won) app.appendChild(overlayWinEndless());
  else if (state.lifeLossReason) app.appendChild(overlayLifeLoss());
  else if (state.endlessGameOver) app.appendChild(overlayGameOver());
}

function render() {
  if (state.mode === "menu") renderMenu();
  else if (state.mode === "classic") renderClassic();
  else renderEndless();
}

render();
