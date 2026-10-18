// omgwhy: log who lost the Apex game, and why. Data lives in localStorage only.

const KEY = 'omgwhy:v1';
const REASONS = { h: 'Hubris', p: 'Positioning' };
const MAX_NAME = 24;
const HISTORY_SHOWN = 8;

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(v)) return v.filter((e) => e && typeof e.n === 'string' && REASONS[e.r] && typeof e.t === 'number');
  } catch (e) { /* missing or corrupt: start fresh */ }
  return [];
}
function save(entries) {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); return true; } catch (e) { return false; }
}
const keyOf = (name) => name.toLocaleLowerCase('en-GB');
const pad2 = (n) => String(n).padStart(2, '0');

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text; // names are user input: never innerHTML
  return e;
}

function init(root) {
  const $ = (s) => root.querySelector(s);
  const form = $('[data-omg-form]');
  const nameIn = $('[data-omg-name]');
  const err = $('[data-omg-err]');
  const card = $('[data-omg-card]');
  const ep = $('[data-omg-ep]');
  const who = $('[data-omg-who]');
  const why = $('[data-omg-why]');
  const datalist = $('[data-omg-names]');
  const empty = $('[data-omg-empty]');
  const tallyWrap = $('[data-omg-tally-wrap]');
  const totals = $('[data-omg-totals]');
  const tally = $('[data-omg-tally]');
  const histWrap = $('[data-omg-history-wrap]');
  const hist = $('[data-omg-history]');

  let entries = load();
  root.hidden = false;

  function setCard(entry) {
    ep.textContent = 'GAME:' + pad2(entries.length);
    if (entry) {
      card.classList.remove('is-blank');
      who.textContent = entry.n + ',';
      why.textContent = REASONS[entry.r] + '.';
    } else {
      card.classList.add('is-blank');
      who.textContent = 'Who,';
      why.textContent = 'Why.';
    }
  }

  // Group by name, case-insensitively; show the most recent spelling.
  function grouped() {
    const map = new Map();
    for (const e of entries) {
      const k = keyOf(e.n);
      const g = map.get(k) || { name: e.n, h: 0, p: 0 };
      g.name = e.n;
      g[e.r] += 1;
      map.set(k, g);
    }
    return [...map.values()].sort((a, b) => (b.h + b.p) - (a.h + a.p) || b.h - a.h || a.name.localeCompare(b.name));
  }

  function render() {
    const groups = grouped();
    const has = entries.length > 0;
    empty.hidden = has;
    tallyWrap.hidden = !has;
    histWrap.hidden = !has;
    setCard(entries[entries.length - 1]);

    datalist.replaceChildren(...groups.map((g) => { const o = el('option'); o.value = g.name; return o; }));
    if (!has) { tally.replaceChildren(); hist.replaceChildren(); totals.replaceChildren(); return; }

    const h = entries.filter((e) => e.r === 'h').length;
    const p = entries.length - h;
    const kh = el('span', 'omg-key omg-key-h'); kh.append('Hubris ', el('b', null, h));
    const kp = el('span', 'omg-key omg-key-p'); kp.append('Positioning ', el('b', null, p));
    totals.replaceChildren(kh, kp, el('span', null, `across ${entries.length} game${entries.length === 1 ? '' : 's'}`));

    const top = Math.max(...groups.map((g) => g.h + g.p));
    tally.replaceChildren(...groups.map((g) => {
      const li = el('li', 'omg-row');
      const bar = el('div', 'omg-bar');
      bar.setAttribute('role', 'img');
      bar.setAttribute('aria-label', `${g.name}: ${g.h} hubris, ${g.p} positioning`);
      const bh = el('span', 'omg-bar-h'); bh.style.width = (g.h / top * 100) + '%';
      const bp = el('span', 'omg-bar-p'); bp.style.width = (g.p / top * 100) + '%';
      bar.append(bh, bp);
      const nh = el('span', 'omg-n omg-n-h', g.h); nh.title = 'Hubris';
      const np = el('span', 'omg-n omg-n-p', g.p); np.title = 'Positioning';
      li.append(el('span', 'omg-row-name', g.name), bar, nh, np);
      return li;
    }));

    const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    hist.replaceChildren(...entries.slice(-HISTORY_SHOWN).reverse().map((e) => {
      const li = el('li');
      const t = el('time', null, fmt.format(e.t));
      t.dateTime = new Date(e.t).toISOString();
      li.append(t, el('span', 'who', e.n), el('span', e.r === 'h' ? 'why-h' : 'why-p', REASONS[e.r].toLowerCase()));
      return li;
    }));
  }

  function commit(next) {
    const prev = entries;
    entries = next;
    if (!save(entries)) {
      entries = prev;
      err.textContent = "Couldn't save: this browser is blocking local storage (private mode?).";
      return false;
    }
    render();
    return true;
  }

  function clearError() { err.textContent = ''; nameIn.removeAttribute('aria-invalid'); }
  nameIn.addEventListener('input', clearError);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    clearError();
    const name = nameIn.value.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
    if (!name) {
      err.textContent = 'Enter a name. Someone lost that game.';
      nameIn.setAttribute('aria-invalid', 'true');
      nameIn.focus();
      return;
    }
    const r = form.elements.reason.value;
    if (!REASONS[r]) return;
    if (commit(entries.concat({ n: name, r, t: Date.now() }))) {
      card.classList.remove('cut');
      void card.offsetWidth; // restart the animation
      card.classList.add('cut');
      nameIn.select();
    }
  });

  $('[data-omg-undo]').addEventListener('click', () => {
    if (entries.length) commit(entries.slice(0, -1));
  });
  $('[data-omg-clear]').addEventListener('click', () => {
    if (entries.length && confirm(`Delete all ${entries.length} logged games? This can't be undone.`)) commit([]);
  });

  render();
}

const omgRoot = document.querySelector('[data-omg]');
if (omgRoot) init(omgRoot);
