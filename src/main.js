import "./style.css";

const MAX_H = 4;

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

/**
 * 各配列は底→上（index 0 が底）。空の筒は []。
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

const state = {
  levelIndex: 0,
  tubes: cloneTubes(LEVELS[0]),
  selected: /** @type {number | null} */ (null),
  moves: 0,
  history: /** @type {ColorKey[][][]} */ ([]),
  won: false,
};

const app = document.getElementById("app");
if (!app) throw new Error("#app not found");

function pushHistory() {
  state.history.push(cloneTubes(state.tubes));
  if (state.history.length > 80) state.history.shift();
}

function undo() {
  const prev = state.history.pop();
  if (!prev) return;
  state.tubes = prev;
  state.selected = null;
  state.moves = Math.max(0, state.moves - 1);
  state.won = false;
  render();
}

function resetLevel() {
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
  if (isWin(state.tubes)) state.won = true;
  return true;
}

function onTubeClick(index) {
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

  const mouth = document.createElement("div");
  mouth.className = "mouth";
  tube.appendChild(mouth);

  const inner = document.createElement("div");
  inner.className = "tube-inner";

  const colors = state.tubes[index];
  for (let i = 0; i < colors.length; i += 1) {
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

function overlayWin() {
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

function render() {
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

  app.append(top, actions, hint, board, moves);

  if (state.won) app.appendChild(overlayWin());
}

render();
