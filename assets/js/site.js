// Site behaviour: scroll ring, menu toggle, and the terminal.
// Everything here is progressive enhancement: the site works without it.

const me = document.currentScript;
const FS_URL = (me && me.dataset.fs) || '/fs.json';
const HOST = (me && me.dataset.host) || 'site';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function readJSON(store, key, fallback) {
  try { const v = store.getItem(key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; }
}
function writeJSON(store, key, value) {
  try { store.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode etc. */ }
}

/* ------------------------------------------------------------------ */
/* Scroll ring                                                         */
/* ------------------------------------------------------------------ */
(function scrollRing() {
  const prog = document.querySelector('[data-ring-progress]');
  const pct = document.querySelector('[data-ring-pct]');
  const btn = document.querySelector('[data-to-top]');
  if (!prog || !pct || !btn) return;
  const C = 144.51;
  let queued = false;
  function update() {
    queued = false;
    const d = document.documentElement;
    const max = d.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    prog.setAttribute('stroke-dashoffset', (C * (1 - p)).toFixed(2));
    pct.textContent = String(Math.round(p * 100)).padStart(2, '0');
    if (window.scrollY <= 1) arrived();
  }
  // While scrolling back up the ring shows the arrow; at the top it goes back to the percentage.
  let fallback = null;
  function arrived() {
    if (!btn.classList.contains('going-up')) return;
    btn.classList.remove('going-up');
    clearTimeout(fallback);
    btn.blur();
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  btn.addEventListener('click', () => {
    if (window.scrollY <= 1) { btn.blur(); return; }
    btn.classList.add('going-up');
    clearTimeout(fallback);
    fallback = setTimeout(arrived, 3000); // in case the scroll is interrupted
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  update();
})();

/* ------------------------------------------------------------------ */
/* Menu collapse (remembered across visits)                            */
/* ------------------------------------------------------------------ */
(function navToggle() {
  const btn = document.querySelector('[data-nav-toggle]');
  if (!btn) return;
  const root = document.documentElement;
  function sync() {
    const collapsed = root.classList.contains('nav-collapsed');
    const label = collapsed ? 'Show menu' : 'Hide menu';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  btn.addEventListener('click', () => {
    const collapsed = root.classList.toggle('nav-collapsed');
    try { localStorage.setItem('nav-collapsed', collapsed ? '1' : '0'); } catch (e) { /* ignore */ }
    sync();
  });
  sync();
})();

/* ------------------------------------------------------------------ */
/* Terminal                                                            */
/* ------------------------------------------------------------------ */
(function terminal() {
  const el = document.querySelector('[data-term]');
  if (!el) return;
  const out = el.querySelector('[data-term-out]');
  const body = el.querySelector('[data-term-body]');
  const input = el.querySelector('[data-term-input]');
  const promptEl = el.querySelector('[data-term-prompt]');
  const titleEl = el.querySelector('[data-term-title]');
  const menuEl = el.querySelector('[data-term-menu]');
  const toggles = document.querySelectorAll('[data-term-toggle]');

  const MAX_LINES = 300;
  const COMMANDS = ['cat', 'cd', 'clear', 'echo', 'exit', 'help', 'history', 'list-tags', 'ls', 'open', 'pwd', 'tags', 'tree', 'whoami'];

  // Persisted per tab, so the terminal survives page navigation.
  const st = Object.assign({ open: false, cwd: [], history: [], lines: null }, readJSON(sessionStorage, 'term', {}));
  let fs = null;
  let fsPromise = null;
  let menu = null;      // { base, idx, items: [{ name, dir }] }
  let histIdx = null;

  function persist() { writeJSON(sessionStorage, 'term', st); }

  /* ---------- file system (built by Hugo into fs.json) ---------- */
  function prepare(node) {
    if (node.type === 'd') node.children.forEach(prepare);
    return node;
  }
  function loadFs() {
    if (!fsPromise) {
      fsPromise = fetch(FS_URL)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((root) => {
          fs = prepare(root);
          fs.children.unshift({ name: '.plan', type: 'f', title: '.plan', body: 'nothing to see here. yet.', size: 26, tags: [] });
          return fs;
        })
        .catch(() => { fs = { name: '~', type: 'd', url: '/', children: [] }; line('rsh: could not load the file list', 't-err'); return fs; });
    }
    return fsPromise;
  }
  function child(dir, name) { return dir.children.find((c) => c.name === name); }
  function resolve(p) {
    if (p == null || p === '') p = '.';
    if (p === '~' || p === '/') return { node: fs, parts: [] };
    let parts;
    if (p[0] === '/') { parts = []; p = p.slice(1); }
    else if (p.slice(0, 2) === '~/') { parts = []; p = p.slice(2); }
    else parts = st.cwd.slice();
    for (const s of p.split('/')) {
      if (!s || s === '.') continue;
      if (s === '..') { parts.pop(); continue; }
      parts.push(s);
    }
    let node = fs;
    for (const part of parts) {
      if (node.type !== 'd') return null;
      node = child(node, part);
      if (!node) return null;
    }
    return { node, parts };
  }
  const label = (parts) => '~' + (parts.length ? '/' + parts.join('/') : '');
  const isHidden = (n) => n[0] === '.';
  function posts() {
    const dir = child(fs, 'posts');
    return dir ? dir.children.filter((c) => c.type === 'f').map((c) => ({ path: 'posts/' + c.name, node: c })) : [];
  }
  function tagIndex() {
    const byTag = {};
    posts().forEach((p) => (p.node.tags || []).forEach((t) => {
      const tag = '#' + t;
      (byTag[tag] = byTag[tag] || []).push(p);
    }));
    return byTag;
  }

  /* ---------- output ---------- */
  function renderLine(segs) {
    const div = document.createElement('div');
    div.className = 'term-line';
    segs.forEach(([t, cls]) => {
      const span = document.createElement('span');
      if (cls) span.className = cls;
      span.textContent = t;
      div.appendChild(span);
    });
    out.appendChild(div);
  }
  function push(segs) {
    st.lines.push(segs);
    if (st.lines.length > MAX_LINES) { st.lines.splice(0, st.lines.length - MAX_LINES); out.firstChild && out.removeChild(out.firstChild); }
    renderLine(segs);
  }
  const line = (t, cls) => push([[t, cls || '']]);
  const S = (t, cls) => [t, cls || ''];
  function promptSegs() {
    return [S('guest@' + HOST, 't-ok'), S(':', 't-dim'), S(label(st.cwd), 't-dir'), S('λ ', 't-dim')];
  }
  function renderPrompt() {
    promptEl.textContent = '';
    promptSegs().forEach(([t, cls]) => {
      const span = document.createElement('span');
      span.className = cls;
      span.textContent = t;
      promptEl.appendChild(span);
    });
    titleEl.textContent = 'guest@' + HOST + ': ' + label(st.cwd);
  }
  function scrollDown() { body.scrollTop = body.scrollHeight; }
  function renderAll() {
    out.textContent = '';
    st.lines.forEach(renderLine);
    renderPrompt();
    renderMenu();
    scrollDown();
  }
  function renderMenu() {
    if (!menu) { menuEl.hidden = true; menuEl.textContent = ''; return; }
    menuEl.hidden = false;
    menuEl.textContent = '';
    menu.items.forEach((it, i) => {
      const span = document.createElement('span');
      const on = i === menu.idx;
      span.className = 'mi' + (on ? ' mi-on' : it.dir ? ' t-dir' : '');
      span.textContent = it.name + (it.dir ? '/' : '');
      menuEl.appendChild(span);
    });
    scrollDown();
  }

  /* ---------- ls / tree helpers ---------- */
  const pad = (s, n) => String(s).padStart(n, ' ');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function dateStr(node) {
    if (!node.date) return pad('-', 12);
    const [y, m, d] = node.date.split('-').map(Number);
    return MONTHS[m - 1] + ' ' + pad(d, 2) + '  ' + y;
  }
  const size = (n) => (n.type === 'd' ? 4096 : n.size || 0);
  function longLine(name, node) {
    const d = node.type === 'd';
    return [S((d ? 'drwxr-xr-x' : '-rw-r--r--') + ' 1 rowan rowan ' + pad(size(node), 5) + ' ' + dateStr(node) + ' ', 't-dim'), S(name, d ? 't-dir' : '')];
  }
  function items(node, flags) {
    let list = node.children.filter((c) => flags.a || !isHidden(c.name)).map((c) => ({ name: c.name, node: c }));
    if (flags.a) list = [{ name: '.', node }, { name: '..', node: { type: 'd' } }].concat(list);
    if (flags.r) list.reverse();
    return list;
  }
  function lsDir(node, flags, lbl) {
    const list = items(node, flags);
    if (flags.l) {
      const total = list.reduce((t, it) => t + Math.ceil(size(it.node) / 1024) * 4, 0);
      line('total ' + total, 't-dim');
      list.forEach((it) => push(longLine(it.name, it.node)));
    } else if (list.length) {
      const segs = [];
      list.forEach((it, i) => { if (i) segs.push(S('  ')); segs.push(S(it.name, it.node.type === 'd' ? 't-dir' : '')); });
      push(segs);
    }
    if (flags.R) {
      list.forEach((it) => {
        if (it.node.type === 'd' && it.name !== '.' && it.name !== '..') {
          const sub = lbl.replace(/\/$/, '') + '/' + it.name;
          line('');
          line(sub + ':', 't-hi');
          lsDir(it.node, flags, sub);
        }
      });
    }
  }
  function treeDir(node, prefix, flags, counts) {
    const list = items(node, { a: flags.a }).filter((it) => it.name !== '.' && it.name !== '..');
    list.forEach((it, i) => {
      const last = i === list.length - 1;
      const d = it.node.type === 'd';
      push([S(prefix + (last ? '└── ' : '├── '), 't-dim'), S(it.name + (d ? '/' : ''), d ? 't-dir' : '')]);
      if (d) { counts.d++; treeDir(it.node, prefix + (last ? '    ' : '│   '), flags, counts); } else counts.f++;
    });
  }

  /* ---------- commands ---------- */
  function navigate(url) {
    persist();
    const target = new URL(url, location.href);
    if (target.pathname === location.pathname && target.hash) {
      const dest = document.getElementById(target.hash.slice(1));
      if (dest) { dest.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', target.hash); return; }
    }
    location.href = target.href;
  }

  function run(raw) {
    push(promptSegs().concat([S(raw)]));
    const cmd = raw.trim();
    if (!cmd) return;
    st.history.push(cmd);
    if (st.history.length > 100) st.history.shift();
    const argv = cmd.split(/\s+/);
    let name = argv[0];
    const args = argv.slice(1);
    const flags = {};
    const paths = [];
    args.forEach((a) => {
      if (a[0] === '-' && a.length > 1) a.slice(1).split('').forEach((c) => { flags[c] = true; });
      else paths.push(a);
    });
    if (name === 'll') { name = 'ls'; flags.l = true; flags.a = true; }

    switch (name) {
      case 'help':
        [
          ['ls [-alrR] [path]', 'list directory contents'],
          ['cd [path]', 'change directory'],
          ['pwd', 'print working directory'],
          ['cat <file>...', 'print files'],
          ['tree [-a] [path]', 'show the directory tree'],
          ['open [path]', 'go to it on the site'],
          ['tags [post | #tag]', "list tags, a post's tags, or posts by tag"],
          ['clear', 'clear the screen (or Ctrl+L)'],
          ['history', 'list previous commands'],
          ['whoami, echo, exit', ''],
        ].forEach(([c, d]) => push([S('  ' + c.padEnd(22), 't-ok'), S(d, 't-dim')]));
        line('  tab completes · ↑/↓ history · esc closes', 't-dim');
        break;

      case 'ls': {
        const targets = paths.length ? paths : ['.'];
        targets.forEach((p, i) => {
          const r = resolve(p);
          if (!r) { line("ls: cannot access '" + p + "': No such file or directory", 't-err'); return; }
          if (r.node.type === 'f') { push(flags.l ? longLine(p, r.node) : [S(p)]); return; }
          if (i > 0) line('');
          if (targets.length > 1 || flags.R) line(p + ':', 't-hi');
          lsDir(r.node, flags, p);
        });
        break;
      }

      case 'cd': {
        const r = resolve(paths[0] || '~');
        if (!r) line('cd: no such file or directory: ' + paths[0], 't-err');
        else if (r.node.type !== 'd') line('cd: not a directory: ' + paths[0], 't-err');
        else st.cwd = r.parts;
        break;
      }

      case 'pwd':
        line('/home/' + HOST + (st.cwd.length ? '/' + st.cwd.join('/') : ''));
        break;

      case 'cat':
        if (!paths.length) { line('usage: cat <file>...', 't-err'); break; }
        paths.forEach((p) => {
          const r = resolve(p);
          if (!r) { line('cat: ' + p + ': No such file or directory', 't-err'); return; }
          if (r.node.type === 'd') { line('cat: ' + p + ': Is a directory', 't-err'); return; }
          const n = r.node;
          const md = /\.md$/.test(n.name);
          if (md && !/^#\s/.test(n.body || '')) { line('# ' + n.title, 't-hi'); line(''); }
          (n.body || '').split('\n').forEach((ln) => line(ln, /^#{1,6}\s/.test(ln) ? 't-hi' : ''));
          if (n.tags && n.tags.length) { line(''); line('tags: ' + n.tags.map((t) => '#' + t).join(' '), 't-ok'); }
        });
        break;

      case 'tree': {
        const p = paths[0] || '.';
        const r = resolve(p);
        if (!r) { line(p + ' [error opening dir]', 't-err'); break; }
        if (r.node.type !== 'd') { line(p); break; }
        const counts = { d: 0, f: 0 };
        line(p, 't-dir');
        treeDir(r.node, '', flags, counts);
        line('');
        line(counts.d + ' director' + (counts.d === 1 ? 'y' : 'ies') + ', ' + counts.f + ' file' + (counts.f === 1 ? '' : 's'), 't-dim');
        break;
      }

      case 'open': {
        const p = paths[0] || '.';
        const r = resolve(p);
        if (!r) { line('open: ' + p + ': No such file or directory', 't-err'); break; }
        if (!r.node.url) { line('open: ' + p + ': nothing to show on the site', 't-err'); break; }
        line('→ ' + r.node.url, 't-ok');
        navigate(r.node.url);
        break;
      }

      case 'tags':
      case 'list-tags': {
        const byTag = tagIndex();
        const arg = paths[0];
        if (!arg) {
          const names = Object.keys(byTag).sort();
          const w = names.reduce((m, t) => Math.max(m, t.length), 0);
          names.forEach((t) => {
            const n = byTag[t].length;
            push([S('  ' + t.padEnd(w + 2), 't-ok'), S(n + ' post' + (n === 1 ? '' : 's'), 't-dim')]);
          });
          line('  tags <post> · tags #<tag>', 't-dim');
          break;
        }
        const r = arg[0] === '#' ? null : resolve(arg);
        if (r) {
          if (r.node.type === 'd') { line('tags: ' + arg + ': Is a directory', 't-err'); break; }
          const own = (r.node.tags || []).map((t) => '#' + t);
          if (!own.length) { line('tags: ' + arg + ': no tags', 't-dim'); break; }
          const segs = [];
          own.forEach((t, i) => { if (i) segs.push(S('  ')); segs.push(S(t, 't-ok')); });
          push(segs);
          break;
        }
        const tag = arg[0] === '#' ? arg : '#' + arg;
        const hits = byTag[tag];
        if (!hits) { line('tags: no posts tagged ' + tag, 't-err'); break; }
        hits.forEach((h) => push([S('  ' + h.path), S('  ' + h.node.title, 't-dim')]));
        line('  open <post> to read it', 't-dim');
        break;
      }

      case 'clear': st.lines = []; out.textContent = ''; break;
      case 'history': st.history.forEach((h, i) => push([S(pad(i + 1, 4) + '  ', 't-dim'), S(h)])); break;
      case 'whoami': line('guest'); break;
      case 'echo': line(args.join(' ')); break;
      case 'sudo': line('guest is not in the sudoers file. This incident will be reported.', 't-err'); break;
      case 'rm': case 'mv': case 'touch': case 'mkdir': line(name + ': read-only file system', 't-err'); break;
      case 'exit': close(); break;
      default: line('rsh: command not found: ' + name, 't-err');
    }
  }

  /* ---------- zsh-style completion ---------- */
  function complete(back) {
    if (menu) {
      const n = menu.items.length;
      menu.idx = back ? (menu.idx <= 0 ? n - 1 : menu.idx - 1) : (menu.idx + 1) % n;
      input.value = menu.base + menu.items[menu.idx].name;
      return;
    }
    const v = input.value;
    const m = v.match(/^(.*?)(\S*)$/);
    const before = m[1];
    const tok = m[2];
    const first = before.trim().split(/\s+/)[0];
    let matches;
    let base = before;
    let isDir = () => false;
    if ((first === 'tags' || first === 'list-tags') && tok[0] === '#') {
      matches = Object.keys(tagIndex()).sort().filter((t) => t.startsWith(tok));
    } else if (before.trim() === '') {
      matches = COMMANDS.filter((c) => c.startsWith(tok));
    } else {
      const slash = tok.lastIndexOf('/');
      const dirPart = slash >= 0 ? tok.slice(0, slash + 1) : '';
      const pre = tok.slice(slash + 1);
      const r = resolve(dirPart || '.');
      if (!r || r.node.type !== 'd') return;
      matches = r.node.children.map((c) => c.name).filter((n) => n.startsWith(pre) && (pre[0] === '.' || !isHidden(n)));
      base = before + dirPart;
      isDir = (n) => child(r.node, n).type === 'd';
    }
    if (matches.length === 1) {
      input.value = base + matches[0] + (isDir(matches[0]) ? '/' : ' ');
    } else if (matches.length > 1) {
      let common = matches[0];
      matches.forEach((n) => { while (!n.startsWith(common)) common = common.slice(0, -1); });
      input.value = base + common;
      menu = { base, idx: -1, items: matches.map((n) => ({ name: n, dir: isDir(n) })) };
    }
  }
  function acceptMenu() {
    const it = menu.items[menu.idx];
    input.value = menu.base + it.name + (it.dir ? '/' : ' ');
    menu = null;
  }
  function closeMenu() { if (menu) { menu = null; renderMenu(); } }

  /* ---------- open / close ---------- */
  function boot() {
    st.lines = [];
    line('rsh — a very small shell for this site.', 't-dim');
    line("type 'help' for commands, 'exit' or Esc to close.", 't-dim');
    line('');
  }
  function show() {
    el.hidden = !st.open;
    toggles.forEach((t) => {
      const lbl = st.open ? 'Close terminal' : 'Open terminal';
      t.setAttribute('aria-expanded', st.open ? 'true' : 'false');
      t.setAttribute('aria-label', lbl);
      t.setAttribute('title', lbl);
    });
  }
  function open(focus) {
    if (!st.lines) boot();
    st.open = true;
    show();
    renderAll();
    persist();
    return loadFs().then(() => { if (focus !== false) input.focus({ preventScroll: true }); });
  }
  function close() {
    st.open = false;
    closeMenu();
    show();
    persist();
  }

  /* ---------- events ---------- */
  document.querySelectorAll('[data-term-open]').forEach((b) => b.addEventListener('click', () => open()));
  // Terminal ring: open / close.
  toggles.forEach((b) => b.addEventListener('click', () => {
    if (st.open) { close(); b.blur(); } else open();
  }));
  el.querySelector('[data-term-close]').addEventListener('click', close);
  body.addEventListener('click', (e) => { if (!window.getSelection().toString() && e.target !== input) input.focus({ preventScroll: true }); });

  // Tag chips: open the terminal on `tags #x` (ctrl/cmd-click still follows the link).
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a.tagchip[data-tag]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open().then(() => { run('tags ' + a.dataset.tag); scrollDown(); persist(); });
  });

  input.addEventListener('input', closeMenu);
  input.addEventListener('keydown', (e) => {
    const h = st.history;
    if (menu && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
      e.preventDefault();
      complete(e.key === 'ArrowLeft' || e.key === 'ArrowUp');
      renderMenu();
      return;
    }
    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        if (menu && menu.idx >= 0) { acceptMenu(); renderMenu(); return; }
        closeMenu();
        const raw = input.value;
        input.value = '';
        histIdx = null;
        loadFs().then(() => { run(raw); renderPrompt(); scrollDown(); persist(); });
        break;
      }
      case 'Tab':
        e.preventDefault();
        if (!fs) return;
        complete(e.shiftKey);
        renderMenu();
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!h.length) return;
        histIdx = histIdx == null ? h.length - 1 : Math.max(0, histIdx - 1);
        input.value = h[histIdx];
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (histIdx == null) return;
        histIdx += 1;
        if (histIdx >= h.length) { histIdx = null; input.value = ''; } else input.value = h[histIdx];
        break;
      case 'Escape':
        e.preventDefault();
        if (menu) closeMenu(); else close();
        break;
      default:
        if ((e.key === 'l' || e.key === 'L') && e.ctrlKey) {
          e.preventDefault();
          st.lines = [];
          out.textContent = '';
          persist();
        }
    }
  });

  // Restore the terminal if it was open on the previous page.
  if (st.open) {
    if (!st.lines) boot();
    show();
    renderAll();
    loadFs();
  }
})();
