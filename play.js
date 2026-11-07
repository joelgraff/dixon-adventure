// Dixon: the scene-card runtime. Reads docs/game-data/*.yaml and plays it.
// No story text lives here; see game-data/FORMAT.md for the data format.
/* global jsyaml */

const DATA = 'game-data/';
const params = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
const L = v => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const EFFECTS = ['set', 'clear', 'give', 'take', 'money', 'reveal', 'say', 'move', 'death', 'rewind', 'leave_behind', 'describe', 'end', 'if'];
const SAVE_KEY = 'dixon.ch1.save';
const AUTO_KEY = 'dixon.ch1.auto';
const SETTINGS_KEY = 'dixon.settings';

let G, CH, SRC, ROOMS;           // game, chapter, sources, rooms
let S;                           // live state
let snapshot = null;             // state before the current command (for Retry)
let halted = false;              // a death stops the rest of a command
let pending = null;              // {kind: 'death' | 'restart'}
let speaker = null;              // NPC whose lines an action's quoted says belong to
let untimed = false;             // the current command took no time (see UNTIMED)
let seed = params.has('seed') ? Number(params.get('seed')) || 1 : null;
const settings = { inventory: true, sidebar: true, highlight: 'off', clickable: false, histories: false };

// ---------------------------------------------------------------- utilities
function rand() {
  if (seed === null) return Math.random();
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const pickOne = list => list[Math.floor(rand() * list.length)];
const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cap = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const norm = t => String(t).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};

function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return row[b.length];
}

// ------------------------------------------------------------------- state
function freshState() {
  return {
    room: CH.start, flags: new Set(), items: [...L(CH.start_items)], money: CH.start_money || 0,
    turns: 0, scored: new Set(), found: new Set(), notes: {}, parted: new Set(), spoke: new Set(), visited: [CH.start], n: null,
    lines: {},                   // room id -> its description parts as last shown (see describe)
  };
}
const SET_FIELDS = ['flags', 'scored', 'found', 'parted', 'spoke'];
function serialize(s) {
  const o = { ...s, _version: G.version, _compat: G.save_compat };
  for (const f of SET_FIELDS) o[f] = [...s[f]];
  return o;
}
// A save from an incompatible version is refused rather than half-loaded.
function compatible(saved) { return saved && saved._compat === G.save_compat; }
// True when version string a is older than b ("0.12.1" < "0.12.2").
function olderThan(a, b) {
  const x = String(a || '0').split('.').map(Number);
  const y = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0);
  return false;
}
function deserialize(o) {
  const s = { ...o };
  delete s._version;
  delete s._compat;
  for (const f of SET_FIELDS) s[f] = new Set(o[f] || []);
  s.lines = o.lines || {};
  // Before 0.12.2 an introduction was keyed on `known.<id>`; now it is keyed
  // on `met.<id>`. Anyone an older save already knows has been met, so they
  // don't introduce themselves a second time.
  if (olderThan(o._version, '0.12.2')) for (const f of [...s.flags]) if (f.startsWith('known.')) s.flags.add(`met.${f.slice(6)}`);
  return s;
}
const clone = s => deserialize(JSON.parse(JSON.stringify(serialize(s))));
const room = () => ROOMS[S.room];

// -------------------------------------------------------------- conditions
function cond(c) {
  if (c && typeof c === 'object') return L(c.any).some(cond);
  let t = String(c).trim();
  let neg = false;
  if (t.startsWith('not ')) { neg = true; t = t.slice(4).trim(); }
  let r;
  const m = t.match(/^(money|score|turns|n)\s*(>=|<=|==|>|<)\s*(-?\d+)$/);
  if (m) {
    const a = { money: S.money, score: score(), turns: S.turns, n: S.n === null ? -Infinity : S.n }[m[1]];
    const b = Number(m[3]);
    r = { '>=': a >= b, '<=': a <= b, '==': a === b, '>': a > b, '<': a < b }[m[2]];
  } else if (t.startsWith('has:')) r = S.items.includes(t.slice(4));
  else if (t.startsWith('here:')) r = npcHere(t.slice(5));
  else if (t.startsWith('in:')) r = S.room === t.slice(3);
  else if (t.startsWith('era:')) r = String(room().era) === t.slice(4);
  else r = S.flags.has(t);
  return neg ? !r : r;
}
const ok = when => L(when).every(cond);

// Variant selection: returns {text, do} for the first entry that holds.
function pick(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') return { text: v };
  if (!Array.isArray(v)) return ok(v.when) ? { text: v.text ?? v.say, do: v.do } : null;
  for (const e of v) {
    if (typeof e === 'string') return { text: e };
    if (ok(e.when)) return { text: e.text ?? e.say, do: e.do };
  }
  return null;
}
const textOf = v => (pick(v) || {}).text || '';

// ------------------------------------------------------------------- score
function score() {
  let s = 0;
  for (const f of S.scored) s += (CH.flags[f] && CH.flags[f].score) || 0;
  return s;
}
function setFlag(f) {
  S.flags.add(f);
  const d = CH.flags && CH.flags[f];
  if (d && d.score && !S.scored.has(f)) S.scored.add(f);
}
function rewind() {
  for (const f of [...S.flags]) if (f.startsWith('1830.')) S.flags.delete(f);
  for (const f of [...S.scored]) if (f.startsWith('1830.')) S.scored.delete(f);
  S.items = S.items.filter(i => String((CH.items[i] || {}).era) !== '1830');
  S.money = 0;
  for (const k of [...S.found]) if (String((ROOMS[k.split(':')[0]] || {}).era) === '1830') S.found.delete(k);
}

// ----------------------------------------------------------------- effects
function run(list) {
  for (const e of L(list)) {
    if (halted) return;
    const k = Object.keys(e).find(x => EFFECTS.includes(x));
    const v = e[k];
    switch (k) {
      case 'set': L(v).forEach(setFlag); break;
      case 'clear': L(v).forEach(f => S.flags.delete(f)); break;
      case 'give': if (!S.items.includes(v)) S.items.push(v); break;
      case 'take': S.items = S.items.filter(i => i !== v); break;
      case 'money': S.money += v === 'n' ? S.n : v === '-n' ? -S.n : Number(v); break;
      case 'reveal': L(v).forEach(n => S.found.add(`${S.room}:${n}`)); break;
      case 'say': show(v, { speaker }); break;
      case 'move': arrive(v); break;
      case 'death': die(v); break;
      case 'rewind': rewind(); break;
      // Nothing from the past comes back through the fog: its items and silver stay there.
      case 'leave_behind': S.items = S.items.filter(i => String((CH.items[i] || {}).era) !== String(v)); S.money = 0; break;
      case 'describe': describe(); break;
      // The chapter's ending screen; after it only meta commands work (see handle).
      case 'end':
        say((CH.ending || {}).title || 'The End', { cls: 'death', raw: true });
        meta(`Final score: ${score()} of ${CH.max_score}.`);
        meta((CH.ending || {}).blocked || 'Type restart to play again.');
        break;
      case 'if': run(ok(v.when) ? v.do : v.else); break;
      default: break;
    }
  }
}
// Print a variant's text (as a spoken line if it starts with a quote) and run its effects.
function show(v, opts = {}) {
  const e = pick(v);
  if (!e) return false;
  if (e.text) {
    if (opts.speaker && /^["“]/.test(e.text.trim())) speak(opts.speaker, e.text);
    else say(e.text, opts);
  }
  run(e.do);
  return true;
}

// -------------------------------------------------------------------- veil
// In the past the fog makes you look as if you belong, and your phone looks
// like a tin case to anyone else. Using it openly (chapter `veil.verbs`) where
// someone can see breaks that: the first time, whoever saw goes cold until you
// leave the room; the second time, `veil.again` runs (the fog takes you back).
const veilVerb = canon => !!CH.veil && L(CH.veil.verbs).includes(canon);
const spooked = id => S.flags.has(`1830.spooked.${id}`);
function cold(id) {
  if (!spooked(id)) return false;
  const c = (CH.veil || {}).cold || {};
  if (!show(c[id]) && !show(c.default)) say(`${cap(npcName(id))} won't look at you.`);
  return true;
}
function veil(canon, rest) {
  const V = CH.veil;
  if (!veilVerb(canon) || String(room().era) !== '1830' || !S.items.includes(V.item)) return false;
  let [thing, toWho] = rest.split(/\s+(?:to|at)\s+/);
  const m = !toWho && thing.match(/^(.+?)\s+(?:the\s+|my\s+|your\s+)?(\S+)$/);
  if (m && canon === 'show') { const r = resolve(m[2]); if (r && r.one && r.one.id === V.item) [toWho, thing] = [m[1], m[2]]; }
  if (canon === 'show') { const r = resolve(thing || ''); if (!(r && r.one && r.one.kind === 'item' && r.one.id === V.item)) return false; }
  const here = npcIdsIn(S.room);
  const npcIn = t => { const r = t && resolve(t); return r && r.one && r.one.kind === 'npc' && here.includes(r.one.id) ? r.one.id : null; };
  const target = npcIn(toWho) || (canon === 'photograph' ? npcIn(thing) : null);
  // Showing it to one person is discreet: only they see it. Anything else,
  // everybody here sees.
  const saw = canon === 'show' && target ? [target] : here;
  if (!saw.length) return false;
  const watched = saw.filter(id => !L(V.exempt).includes(id));
  if (!watched.length) { show(V.exempt_text); return true; }
  if (S.flags.has(V.warned)) { run(V.again); return true; }
  S.flags.add(V.warned);
  for (const id of watched) S.flags.add(`1830.spooked.${id}`);
  const who = watched.includes(target) ? target : watched[0];
  const rx = V.react || {};
  if (!show(rx[who]) && !show(rx.default)) say(`${cap(npcName(who))} goes very still.`);
  show(V.warning);
  return true;
}

// -------------------------------------------------------------------- NPCs
function npcDef(id) { return (room().npcs || {})[id] || (CH.npcs || {})[id] || findNpcAnywhere(id); }
function findNpcAnywhere(id) {
  for (const r of Object.values(ROOMS)) if ((r.npcs || {})[id]) return r.npcs[id];
  return null;
}
function npcRoom(id) {
  const n = (CH.npcs || {})[id];
  if (!n) return null;
  for (const v of L(n.at)) if (ok(v.when)) return v.room;
  return null;
}
function npcIdsIn(rid) {
  const r = ROOMS[rid];
  const ids = Object.entries(r.npcs || {}).filter(([, n]) => ok(n.when)).map(([id]) => id);
  for (const id of Object.keys(CH.npcs || {})) if (npcRoom(id) === rid && ok(CH.npcs[id].when)) ids.push(id);
  return ids;
}
const npcHere = id => npcIdsIn(S.room).includes(id);
const known = id => S.flags.has(`known.${id}`);
// An unnamed person is "a man in a buckskin shirt" the first time the player
// sees them and "the man in the buckskin shirt" after that (`seen.<id>`).
const definite = s => String(s).replace(/\b(a|an)\b/gi, 'the');
const markSeen = id => { if (!known(id)) S.flags.add(`seen.${id}`); };
function npcName(id, full = false) {
  const n = npcDef(id);
  if (!n) return id;
  if (!known(id)) return S.flags.has(`seen.${id}`) ? definite(n.unknown || n.name) : (n.unknown || n.name);
  return full ? n.name : (n.short || n.name);
}
// How narration refers to someone: their short name once known, else `ref`.
function refName(id) {
  const n = npcDef(id);
  if (known(id)) return n.short || n.name;
  return n.ref || String(n.unknown || n.name).replace(/^(a|an) /, 'the ');
}
// Calling someone by their real name means you know it.
function learnName(c, typed) {
  if (c.kind !== 'npc' || known(c.id)) return;
  const n = c.def;
  // Only proper names count ("Ogee", "James Dixon"), not "boys".
  const names = [n.name, n.short, ...String(n.name).split(' ')].filter(w => w && w.length >= 4 && /^[A-Z]/.test(w)).map(norm);
  if (names.includes(cleanNoun(typed))) S.flags.add(`known.${c.id}`);
}
function pronoun(t) { return /^(him|her|them|he|she)$/.test(cleanNoun(t)); }
function speak(id, text) {
  const t = text.trim();
  // A line that opens with a quote gets a speech tag, unless it tags itself
  // ("Joseph Ogee," he says, ...).
  const tagged = /^["“][^"”]*[,?!]["”]\s+(?:he|she|they|(?:the|one|another)(?:\s+[a-z]+){1,3}|[A-Z][a-z]+)\s+(?:says|adds|asks|calls|answers|replies)\b/.test(t);
  if (/^["“]/.test(t) && !tagged) { const who = cap(npcName(id)); markSeen(id); say(`${who} says, ${t}`, { npcPrefix: true }); }
  else { if (tagged) markSeen(id); say(t); }
}

// ------------------------------------------------------------------- nouns
function nounVisible(rid, id, n) {
  return ok(n.when) && (!n.hidden || S.found.has(`${rid}:${id}`));
}
function labelMap(rid) {
  const r = ROOMS[rid];
  const map = new Map();
  const add = (labels, ref) => labels.filter(Boolean).forEach(l => { if (!map.has(norm(l))) map.set(norm(l), ref); });
  for (const [id, n] of Object.entries(r.nouns || {})) add([id, n.name, ...L(n.aliases)], { kind: 'noun', id });
  for (const id of npcIdsIn(rid)) { const n = npcDef(id); add([id, n.name, n.unknown, ...L(n.aliases)], { kind: 'npc', id }); }
  return map;
}
function isKey(ref, rid) {
  if (!ref) return false;
  if (ref.kind === 'npc') return true;
  const n = ROOMS[rid].nouns[ref.id];
  if (n.key !== undefined) return !!n.key;
  return L(n.reveals).length > 0;
}

// Things the player can name right now.
function candidates() {
  const r = room();
  const list = [];
  for (const [id, n] of Object.entries(r.nouns || {})) {
    if (nounVisible(S.room, id, n)) list.push({ kind: 'noun', id, def: n, name: n.name, labels: [id, n.name, ...L(n.aliases)] });
  }
  for (const id of npcIdsIn(S.room)) {
    const n = npcDef(id);
    const labels = [id, ...L(n.aliases)];
    // What narration calls them is something the player can type back.
    if (known(id)) labels.push(n.name); else for (const d of [n.unknown, n.ref]) if (d) labels.push(d.replace(/^(a|an|the) /, ''));
    list.push({ kind: 'npc', id, def: n, name: npcName(id), labels });
  }
  for (const id of S.items) {
    const it = CH.items[id];
    list.push({ kind: 'item', id, def: it, name: it.name, labels: [id, it.name, ...L(it.aliases)] });
  }
  return list.map(c => ({ ...c, labels: c.labels.filter(Boolean).map(norm) }));
}
function cleanNoun(t) {
  let s = norm(t);
  let prev;
  do {
    prev = s;
    s = s.replace(/^(the|a|an|at|to|in|into|on|onto|under|behind|through|thru|out of|out|inside|around|over|up|with|some|his|her|my)\s+/, '');
  } while (s !== prev);
  return s;
}
function resolve(name) {
  const n = cleanNoun(name);
  if (!n) return null;
  const cands = candidates();
  const exact = cands.filter(c => c.labels.includes(n));
  const uniq = list => [...new Map(list.map(c => [`${c.kind}:${c.id}`, c])).values()];
  if (exact.length) {
    const u = uniq(exact);
    if (u.length === 1) return { one: u[0] };
    // One thing in the room and one in the pocket answer to the same word:
    // the one whose own id or name it is wins ("key" is the brass key, not the
    // crow that has it); if it is only an alias for both, the room wins ("case"
    // in the museum is a glass case, not the phone).
    const inRoom = u.filter(c => c.kind !== 'item');
    if (inRoom.length === 1 && u.length === 2) {
      const item = u.find(c => c.kind === 'item');
      const own = c => [c.id, c.kind === 'npc' && !known(c.id) ? null : c.def.name].filter(Boolean).map(norm).includes(n);
      return { one: own(item) && !own(inRoom[0]) ? item : inRoom[0] };
    }
    return { many: u };
  }
  if (n.length < 4) return null;
  const scored = cands.map(c => ({ c, d: Math.min(...c.labels.map(l => editDistance(n, l))) })).sort((a, b) => a.d - b.d);
  if (!scored.length) return null;
  if (scored[0].d <= 1) {
    const best = uniq(scored.filter(x => x.d === scored[0].d).map(x => x.c));
    return best.length === 1 ? { one: best[0] } : { many: best };
  }
  if (scored[0].d <= 2 && n.length >= 7) return { maybe: uniq(scored.filter(x => x.d <= 2).map(x => x.c)).slice(0, 2) };
  return null;
}
function clarify(res) {
  const names = (res.many || res.maybe).map(c => c.kind === 'npc' && !known(c.id) ? definite(c.name) : c.name).join(' or ');
  say((res.many ? G.ambiguous : G.did_you_mean).replace('{options}', names));
}

// ---------------------------------------------------------------- printing
function vars(extra = {}) {
  const v = { money: S.money, score: score(), max_score: CH.max_score, ...extra };
  for (const [k, def] of Object.entries(CH.vars || {})) v[k] = textOf(def);
  return v;
}
function smartQuotes(t) {
  return t
    .replace(/(^|[\s(\[—-])"/g, '$1“').replace(/"/g, '”')
    .replace(/(^|[\s(\[—-])'/g, '$1‘').replace(/'/g, '’');
}
// Text markup -> HTML: {vars}, [noun|shown], speaker capitalisation.
function render(text, opts = {}) {
  const rid = opts.room || S.room;
  const v = vars(opts.vars);
  // {town} is a variable; {ogee} / {ogee's} is a character, by name once known
  // and by their `ref` description until then, capitalised at a sentence start.
  let t = String(text).replace(/\{([a-z_]+)('s)?\}/g, (m, k, poss, off, whole) => {
    if (k in v) return `${v[k]}${poss ? "'s" : ''}`;
    if (!npcDef(k)) return m;
    const w = refName(k) + (poss ? "'s" : '');
    const prior = whole.slice(0, off);
    return !prior.trim() || /[.!?]["”]?\s*$/.test(prior) ? cap(w) : w;
  });
  t = smartQuotes(t.replace(/\s+/g, ' ').trim());
  const labels = labelMap(rid);
  let out = '';
  let last = 0;
  for (const m of t.matchAll(/\[([^\]|]+)(?:\|([^\]]*))?\]/g)) {
    const before = t.slice(last, m.index);
    out += esc(before);
    const key = norm(m[1]);
    const ref = labels.get(key);
    let shown = smartQuotes(m[2] !== undefined ? m[2] : ref && ref.kind === 'npc' ? npcName(ref.id) : m[1]);
    if (m[2] === undefined && ref && ref.kind === 'npc') markSeen(ref.id);
    const prior = t.slice(0, m.index);
    if (!prior.trim() || /[.!?]["”]?\s*$/.test(prior)) shown = cap(shown);
    const cls = isKey(ref, rid) ? 'key' : 'minor';
    out += `<span class="noun ${cls}" data-noun="${esc(ref ? (ref.kind === 'npc' ? ref.id : m[1]) : m[1])}">${esc(shown)}</span>`;
    last = m.index + m[0].length;
  }
  out += esc(t.slice(last));
  return out;
}
function say(text, opts = {}) {
  if (!text) return;
  const p = document.createElement('p');
  if (opts.cls) p.className = opts.cls;
  p.innerHTML = opts.raw ? esc(text) : render(text, opts);
  $('output').appendChild(p);
  $('output').scrollTop = $('output').scrollHeight;
  return p;
}
const meta = t => say(t, { cls: 'meta', raw: true });
// A banner for things the player should not miss (the tour offer, updates).
function notice(label, text, button) {
  const d = document.createElement('div');
  d.className = 'notice';
  d.setAttribute('role', 'status');
  d.innerHTML = `<span class="label">${esc(label)}</span><span class="msg">${esc(text)}</span>`;
  if (button) {
    const b = document.createElement('button');
    b.textContent = button.text;
    b.addEventListener('click', button.onClick);
    d.appendChild(b);
  }
  $('output').appendChild(d);
}

// -------------------------------------------------------------------- rooms
// The room description: `look`, then each visible noun's and person's
// `room_line`. On a return visit (`brief`), if the room's own `look` reads as
// it did last time, it is the room's `brief` line, then only the room lines
// that changed since the player was last here, then who is still here.
// `look` always gives the whole description.
function describe(brief = false) {
  const r = room();
  const e = pick(r.look) || { text: '' };
  const lines = { look: e.text };
  for (const [id, n] of Object.entries(r.nouns || {})) {
    if (n.room_line && nounVisible(S.room, id, n)) lines[`noun:${id}`] = textOf(n.room_line);
  }
  for (const id of npcIdsIn(S.room)) lines[`npc:${id}`] = textOf(npcDef(id).room_line);
  const last = S.lines[S.room];
  S.lines[S.room] = lines;
  let parts;
  if (brief && r.brief && last && last.look === e.text) {
    parts = [textOf(r.brief)];
    // a noun with `always` (true, or a condition list) keeps its line even when unchanged
    const always = k => {
      if (!k.startsWith('noun:')) return false;
      const a = ((r.nouns || {})[k.slice(5)] || {}).always;
      return a === true || (Array.isArray(a) && ok(a));
    };
    const still = [];
    const now = [];
    for (const [k, t] of Object.entries(lines)) {
      if (k === 'look') continue;
      const unchanged = k in last && last[k] === t;
      if (t && (!unchanged || always(k))) parts.push(t);
      else if (k.startsWith('npc:')) (unchanged ? still : now).push(k.slice(4));
    }
    parts.push(presentLine(still, 'still here'), presentLine(now, 'here'));
  } else parts = Object.values(lines);
  if (String(r.era) === '1830' && CH.fog_lock && ok(CH.fog_lock.when) && CH.fog_lock.room_line) parts.push(CH.fog_lock.room_line);
  say(parts.filter(Boolean).join(' '));
  run(e.do);
}
// "Madeline and the boys are still here." / "Everyone is still where you left them."
function presentLine(ids, where) {
  if (!ids.length) return '';
  // a crowd reads better as one word than as a roll call; `look` names them all
  if (ids.length > 2 && where === 'still here') return 'Everyone is still where you left them.';
  // a common noun ("boys") takes "the"; a name or a description doesn't
  const refs = ids.map(id => (/^(?:[A-Z]|the |a |an )/.test(npcName(id)) ? `[${id}]` : `the [${id}]`));
  const list = refs.length === 1 ? refs[0] : `${refs.slice(0, -1).join(', ')} and ${refs.at(-1)}`;
  const plural = ids.length > 1 || npcDef(ids[0]).plural;
  return `${cap(list)} ${plural ? 'are' : 'is'} ${where}.`;
}
function arrive(id, text) {
  if (text) say(text);
  S.room = id;
  S.turns = 0;
  S.parted = new Set();
  S.spoke = new Set();
  for (const f of [...S.flags]) if (f.startsWith('1830.spooked.')) S.flags.delete(f);
  if (!S.visited.includes(id)) S.visited.push(id);
  say(textOf(room().name), { cls: 'heading' });
  describe(true);
}
// Finds the exit a phrase names: "north", "the stairs", "down the steps to
// the water", "downstairs". Leading direction and filler words are peeled off
// one at a time, and "X to Y" tries both halves.
function findExit(word) {
  const dirs = { n: 'north', s: 'south', e: 'east', w: 'west', u: 'up', d: 'down', downstairs: 'down', upstairs: 'up', downhill: 'down', uphill: 'up' };
  const names = e => L(e.names).map(norm);
  const tryPhrase = phrase => {
    let w = norm(phrase).replace(/[.!?]+$/, '');
    for (let i = 0; i < 6 && w; i++) {
      const t = dirs[w] || w;
      const hit = L(room().exits).find(e => names(e).includes(t));
      if (hit) return hit;
      const next = w.replace(/^(the|a|to|toward|towards|into|through|along|onto|on|over|across|back to|back|up to|down to|up|down|out of|out|in|inside|around)\s+/, '');
      if (next === w) break;
      w = next;
    }
    return null;
  };
  const whole = tryPhrase(word);
  if (whole) return whole;
  const parts = norm(word).split(/\s+(?:to|toward|towards|into)\s+/);
  for (const p of parts.length > 1 ? parts.reverse() : []) { const hit = tryPhrase(p); if (hit) return hit; }
  return null;
}
// Movement-shaped commands: "go down the stairs", "take the path", "climb up".
const MOVE_RE = /^(?:go|walk|head|run|step|travel|climb|descend|ascend|take|use|follow)\s+(.+)$/;
const MOVE_STRICT = /^(?:go|walk|head|run|step|travel)\s/;
function moveExit(t) {
  const m = t.match(MOVE_RE);
  if (m) { const e = findExit(m[1]); if (e) return e; }
  if (/^(descend|ascend)$/.test(t)) return findExit(t === 'descend' ? 'down' : 'up');
  return findExit(t);
}
function fogLocked() {
  return String(room().era) === '1830' && CH.fog_lock && ok(CH.fog_lock.when);
}
function go(exit) {
  if (fogLocked()) return say(CH.fog_lock.blocked);
  // An exit can run an action instead of moving: while `action_when` holds (or `when`, if it has no `to`).
  if (exit.action && ok(exit.action_when !== undefined ? exit.action_when : exit.when)) return doAction({ a: [...L(room().actions), ...L(CH.actions)].find(a => a.id === exit.action), n: null });
  if (!exit.to || !ok(exit.when)) return say(textOf(exit.blocked) || G.cant_go);
  if (exit.farewell !== false) farewell();
  arrive(exit.to, textOf(exit.text));
}
// A parting line for the people you've been talking to this visit (and
// haven't already said goodbye to). Walking past someone needs no ceremony.
function farewell() {
  const here = npcIdsIn(S.room).filter(id => npcDef(id).parting && S.spoke.has(id) && !S.parted.has(id));
  if (!here.length) return;
  if (here.length === 1) say(textOf(npcDef(here[0]).parting));
  else say('You say your goodbyes and take your leave.');
}
const spokeTo = id => { if (id && npcHere(id)) S.spoke.add(id); };

// ----------------------------------------------------------------- actions
function phraseRegex(p) {
  const body = norm(p).replace(/\$/g, '').replace(/\b(the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/[.*+?^()|[\]\\]/g, '\\$&').replace(/\\?\{n\\?\}|\{n\}/g, '(\\d+)');
  return new RegExp(`^${body}$`);
}
function matchAction(input) {
  const t = norm(input).replace(/\$/g, '').replace(/(\d)\s*(dollars?|bucks)\b/g, '$1').replace(/\b(the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
  for (const a of [...L(room().actions), ...L(CH.actions)]) {
    for (const p of L(a.phrases)) {
      const m = t.match(phraseRegex(p));
      if (m) return { a, n: m[1] !== undefined ? Number(m[1]) : null };
    }
  }
  return null;
}
function doAction({ a, n }) {
  S.n = n;
  speaker = a.speaker || null;
  if (speaker && ok(a.when)) spokeTo(speaker);   // asking someone for something is talking to them
  try {
    if (ok(a.when)) return run(a.do);
    for (const e of L(a.else)) {
      if (ok(e.when)) {
        if (e.say) show(e.say, { speaker: e.speaker || speaker });
        run(e.do);
        return;
      }
    }
    say("You can't do that just now.");
  } finally { speaker = null; }
}

// ----------------------------------------------------------------- deaths
function die(id) {
  halted = true;
  say(CH.deaths[id] || 'You have died.');
  say(G.death_screen.title, { cls: 'death', raw: true });
  meta(G.death_screen.prompt);
  pending = { kind: 'death' };
}
function answerPending(input) {
  const t = norm(input);
  if (pending.kind === 'restart') {
    pending = null;
    if (/^(y|yes)$/.test(t)) return restart();
    return meta('Very well. On you go.');
  }
  if (/^retry$/.test(t)) {
    pending = null;
    S = clone(snapshot);
    meta(G.death_screen.retry_note);
    say(textOf(room().name), { cls: 'heading' });
    return describe();
  }
  if (/^(restore|load)$/.test(t)) {
    const saved = store.get(SAVE_KEY);
    if (!saved) return meta('There is no saved game. Retry or Restart?');
    if (!compatible(saved)) return meta(`That save is from ${saved._version ? `version ${saved._version}` : 'an earlier build'}, which this version can't load. Retry or Restart?`);
    pending = null;
    return restore(saved);
  }
  if (/^restart$/.test(t)) { pending = null; return restart(); }
  meta(G.death_screen.prompt);
}
function restart() {
  $('output').innerHTML = '';
  S = freshState();
  say(textOf(room().name), { cls: 'heading' });
  describe();
}
function restore(saved) {
  S = deserialize(saved);
  meta('Game restored.');
  say(textOf(room().name), { cls: 'heading' });
  describe();
}

// ------------------------------------------------------------- conversation
function lastNpc() {
  if (S.lastNpc && npcHere(S.lastNpc)) return S.lastNpc;
  const here = npcIdsIn(S.room);
  return here.length === 1 ? here[0] : null;
}
function talkTo(name) {
  const byPronoun = pronoun(name);
  if (byPronoun) {
    const id = lastNpc();
    const here = npcIdsIn(S.room);
    if (!id && !here.length) return say(G.nobody_here);
    if (!id) return say(`Talk to whom? ${here.map(i => npcName(i)).join(' or ')}?`);
    name = id;
  }
  const res = resolve(name);
  if (!res) return say(npcIdsIn(S.room).length ? "There's no one by that name here." : G.nobody_here);
  if (!res.one) return clarify(res);
  const c = res.one;
  if (c.kind !== 'npc') return say('It doesn\'t answer. You hadn\'t really expected it to.');
  // "him" was swapped for their id above, which is not the player naming them.
  if (!byPronoun) learnName(c, name);
  if (cold(c.id)) return;
  S.lastNpc = c.id;
  spokeTo(c.id);
  const e = pick(c.def.talk);
  if (!e) return say(`${cap(npcName(c.id))} looks at you and says nothing.`);
  speak(c.id, e.text);
  run(e.do);
}
function askAbout(who, topic) {
  let id = null;
  if (who && pronoun(who)) { id = lastNpc(); if (!id) return say('Ask whom?'); who = null; }
  if (who) {
    const res = resolve(who);
    if (res && res.many) return clarify(res);
    if (res && res.one && res.one.kind === 'npc') { id = res.one.id; learnName(res.one, who); }
    else return say("There's no one by that name here.");
  } else if (!id) {
    const here = npcIdsIn(S.room);
    if (!here.length) return say(G.nobody_here);
    if (here.length > 1) return say(`Ask whom? ${here.map(i => npcName(i)).join(' or ')}?`);
    id = here[0];
  }
  S.lastNpc = id;
  if (cold(id)) return;
  spokeTo(id);
  const npc = npcDef(id);
  const t = ` ${cleanNoun(topic)} `;
  const hit = L(npc.topics).find(tp => ok(tp.when) && L(tp.keys).some(k => new RegExp(`\\b${norm(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t)));
  const fallback = () => speak(id, textOf(npc.fallback) || `${cap(npcName(id))} has nothing to say about that.`);
  if (!hit) return fallback();
  const e = pick(hit.say);
  // a topic whose variants all fail still answers, in character
  if (e && e.text) speak(id, e.text); else fallback();
  run(hit.do);
  if (e) run(e.do);
}
const SOCIAL = [
  ['thanks', /^(?:say\s+)?(?:thanks|thank you|thank-you|thx|cheers|thank)(?:\s+(?:so much|very much|a lot))?(?:\s+(?:to\s+)?(.+))?$/],
  ['hello', /^(?:say\s+)?(?:hello|hi|hey|howdy|greetings|good (?:morning|afternoon|evening|day))(?:\s+(?:to\s+)?(.+))?$/],
  ['bye', /^(?:say\s+)?(?:goodbye|good-bye|bye|farewell|see you|see you later|take care|good night)(?:\s+(?:to\s+)?(.+))?$/],
  ['how', /^(?:how are you|how's it going|how are things|how do you do|how have you been)(?:\s+(.+))?$/],
  ['sorry', /^(?:say\s+)?(?:sorry|excuse me|pardon me|apologi[sz]e)(?:\s+(?:to\s+)?(.+))?$/],
];
function social(input) {
  for (const [kind, re] of SOCIAL) {
    const m = norm(input).match(re);
    if (!m) continue;
    let id = null;
    if (m[1]) {
      const res = pronoun(m[1]) ? { one: { kind: 'npc', id: lastNpc() } } : resolve(m[1]);
      if (res && res.one && res.one.kind === 'npc' && res.one.id) { id = res.one.id; if (res.one.def) learnName(res.one, m[1]); }
    }
    if (!id) {
      const here = npcIdsIn(S.room);
      if (!here.length) { say("There's no one here to say that to."); return true; }
      if (here.length > 1) { say(`Say that to whom? ${here.map(i => npcName(i)).join(' or ')}?`); return true; }
      id = here[0];
    }
    const line = textOf((npcDef(id).social || {})[kind]) || `${cap(npcName(id))} nods.`;
    speak(id, line);
    if (kind === 'bye') S.parted.add(id); else spokeTo(id);
    return true;
  }
  return false;
}

// ------------------------------------------------------------ verb + noun
let VERB_LIST = null;
function verbList() {
  if (!VERB_LIST) {
    VERB_LIST = [];
    for (const [canon, syns] of Object.entries(G.verbs)) for (const s of L(syns)) VERB_LIST.push([norm(s), canon]);
    VERB_LIST.sort((a, b) => b[0].length - a[0].length);
  }
  return VERB_LIST;
}
function lookAt(c) {
  const def = c.def;
  let picked = '';
  if (def.pick) {
    const pool = [...L(def.pick.from)];
    for (const extra of L(def.pick.also)) if (ok(extra.when)) pool.push(...L(extra.from));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    picked = pool.slice(0, def.pick.count || 3).join(' ');
  }
  const e = pick(def.look);
  const text = (e && e.text) || G.defaults.look[0];
  say(text, { vars: { picked } });
  if (c.kind === 'noun') {
    L(def.reveals).forEach(n => S.found.add(`${S.room}:${n}`));
    run(def.on_look);
    note(c, text, picked);
  } else if (c.kind === 'npc') note(c, text, '');
  if (e) run(e.do);
}
function note(c, text, picked) {
  const rid = S.room;
  S.notes[rid] = S.notes[rid] || {};
  const key = c.kind === 'npc' ? true : isKey({ kind: 'noun', id: c.id }, rid);
  S.notes[rid][`${c.kind}:${c.id}`] = { title: c.kind === 'npc' ? npcName(c.id, true) : c.name, text: text.replace('{picked}', picked), key };
}
function verbNoun(canon, rest) {
  if (canon === 'look') {
    const exitWord = findExit(rest);
    const res = resolve(rest);
    if (res && res.one) learnName(res.one, rest);
    if (!res && exitWord) return say(textOf(exitWord.peek) || 'That way leads on.');
    if (!res && /^(north|south|east|west|up|down|n|s|e|w|u|d)$/.test(cleanNoun(rest))) return say("There's nothing of note that way.");
    if (!res) return say(G.not_here);
    if (!res.one) {
      if (exitWord && res.maybe) return say(textOf(exitWord.peek) || 'That way leads on.');
      return clarify(res);
    }
    return lookAt(res.one);
  }
  if (canon === 'talk') return talkTo(rest);
  if (canon === 'go') { const e = findExit(rest); return e ? go(e) : say(G.cant_go); }
  if (veil(canon, rest)) return;
  if (!rest && veilVerb(canon)) rest = CH.veil.item;   // "turn on flashlight", "take a picture"
  const target = /^(give|use|show)$/.test(canon) ? rest.split(/\s+(?:to|on|with|at)\s+/)[0] : rest;
  const res = resolve(target);
  if (canon === 'give' && !(res && res.one && res.one.kind === 'item')) return say("You haven't got that to give.");
  if (!res) return say(G.not_here);
  if (!res.one) return clarify(res);
  const c = res.one;
  const v = (c.def.verbs || {})[canon];
  if (v !== undefined) {
    if (show(v, { speaker: c.kind === 'npc' ? c.id : null })) return;
    return say(pickOne(L(G.defaults[canon])));
  }
  if (canon === 'take' && c.kind === 'item') return say('You already have it.');
  if (canon === 'take' && c.kind === 'npc') return say("Somehow you doubt they'd go along with that.");
  if (canon === 'call' && c.kind === 'npc') return talkTo(rest);
  say(pickOne(L(G.defaults[canon])) || pickOne(G.unknown));
}

// ------------------------------------------------------------------ meta
function isMeta(t, kind) { return L(G.meta[kind]).map(norm).includes(t); }
function withArticle(name) {
  if (/^[A-Z]/.test(name) || /'s\b/.test(name)) return name;
  return `${/^[aeiou]/i.test(name) ? 'an' : 'a'} ${name}`;
}
function inventory() {
  const names = S.items.map(i => withArticle(CH.items[i].name));
  let line = names.length ? `You are carrying ${names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`}` : 'You are carrying nothing at all';
  if (S.money > 0) line += `, and $${S.money} in silver`;
  say(`${line}.`, { raw: true });
}
function help() {
  const h = pick(CH.hints);
  if (G.help_lead) say(textOf(G.help_lead), { cls: 'meta' });
  say(h ? h.text : 'Look around, examine things, and talk to people.', { cls: 'meta' });
}

// --------------------------------------------------------------- the turn
function command(raw) {
  const input = raw.trim().slice(0, G.input_limit || 40);
  if (!input) return;
  say(`> ${input}`, { cls: 'echo', raw: true });
  if (pending) { answerPending(input); return finish(false); }
  snapshot = clone(S);
  halted = false;
  untimed = false;
  const before = S.room;
  // trailing punctuation is dropped, unless it is all there is ("?" is help)
  const t = norm(input).replace(/[.!?]+$/, '') || norm(input);
  handle(t);
  finish(!halted && !untimed && S.room === before && !pending);
}
function finish(tick) {
  if (tick) {
    S.turns++;
    for (const e of L(room().on_turn)) if (ok(e.when)) { if (e.say) show(e.say); run(e.do); }
  }
  if (!pending) store.set(AUTO_KEY, serialize(S));
  status();
  renderNotes();
}
// Commands a room's `hold` lets through: they don't act in the world.
const HOLD_FREE = ['help', 'save', 'restore', 'restart', 'version', 'tour', 'score'];
// Commands that take no time, so a room's `on_turn` clock doesn't move.
const UNTIMED = [...HOLD_FREE, 'inventory'];
function handle(t) {
  let m;
  // 0. a room may hold the player still for a turn (dazed, pinned, listening)
  const hold = L(room().hold).find(e => ok(e.when));
  if (hold && !HOLD_FREE.some(k => isMeta(t, k))) { if (hold.say) show(hold.say); run(hold.do); return; }
  // once the chapter has ended, only meta commands still work
  if (CH.ending && ok(CH.ending.when) && !HOLD_FREE.some(k => isMeta(t, k))) return meta(CH.ending.blocked);
  // 1. puzzle actions (room first, then chapter-wide)
  const act = matchAction(t);
  if (act) return doAction(act);
  // 2. meta commands
  if (UNTIMED.some(k => isMeta(t, k))) untimed = true;
  if (isMeta(t, 'look_around')) return describe();
  if (isMeta(t, 'inventory')) return inventory();
  if (isMeta(t, 'score')) return meta(G.score_line.replace('{score}', score()).replace('{max_score}', CH.max_score));
  if (isMeta(t, 'help')) return help();
  if (isMeta(t, 'wait')) return say('You wait. Time passes, slowly.');
  if (isMeta(t, 'listen')) return say(textOf(room().listen) || 'You listen. Nothing stands out.');
  if (isMeta(t, 'save')) { store.set(SAVE_KEY, serialize(S)); return meta('Game saved.'); }
  if (isMeta(t, 'restore')) {
    const s = store.get(SAVE_KEY);
    if (!s) return meta('There is no saved game.');
    if (!compatible(s)) return meta(`That save is from ${s._version ? `version ${s._version}` : 'an earlier build'}, which this version can't load.`);
    return restore(s);
  }
  if (isMeta(t, 'version')) return meta(`Dixon ${G.version}, ${CH.title}.`);
  if (isMeta(t, 'tour')) return startTour();
  if (isMeta(t, 'restart')) { pending = { kind: 'restart' }; return meta('Restart from the beginning? (yes or no)'); }
  // 3. movement
  const exit = moveExit(t);
  if (exit) return go(exit);
  if (MOVE_STRICT.test(t)) return say(G.cant_go);
  if (/^(north|south|east|west|up|down|n|s|e|w|u|d)$/.test(t)) return say(G.cant_go);
  // 4. conversation
  if ((m = t.match(/^(?:talk to|talk with|speak to|speak with|chat with|tell)\s+(.+?)\s+about\s+(.+)$/))) return askAbout(m[1], m[2]);
  if ((m = t.match(/^ask\s+(.+?)\s+(?:about|for|if)\s+(.+)$/))) return askAbout(m[1], m[2]);
  if ((m = t.match(/^ask\s+(\S+)\s+(.+)$/)) && !/^about$/.test(m[1])) {
    const r = pronoun(m[1]) ? { one: { kind: 'npc' } } : resolve(m[1]);
    if (r && r.one && r.one.kind === 'npc') return askAbout(m[1], m[2]);
  }
  if ((m = t.match(/^ask\s+(?:about\s+)?(.+)$/))) return askAbout(null, m[1]);
  if (social(t)) return;
  // 5. verb + noun
  for (const [syn, canon] of verbList()) {
    if (t === syn && veilVerb(canon) && canon !== 'show') return verbNoun(canon, '');
    if (t === syn) return say(canon === 'look' ? 'Look at what?' : `${cap(syn)} what?`);
    if (t.startsWith(`${syn} `)) return verbNoun(canon, t.slice(syn.length + 1));
  }
  // 6. a bare noun is a look
  const res = resolve(t);
  if (res && res.one) return lookAt(res.one);
  untimed = true;                  // nothing the parser could read, so no time passes
  say(pickOne(G.unknown));
}

// ----------------------------------------------------------------- the UI
function status() {
  $('place').textContent = render(textOf(room().name)).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
  $('score').textContent = `Score: ${score()} of ${CH.max_score}`;
}
// The inventory panel: what you carry and any silver; click an item to look at it.
function renderInventory() {
  const panel = $('inventory');
  if (!panel) return;
  const items = S.items.map(i => CH.items[i]).filter(Boolean);
  let html = '<h2 class="panel">Carrying</h2>';
  if (!items.length && !S.money) html += '<div class="empty">Nothing at all.</div>';
  else {
    html += '<ul>' + items.map(it => `<li><button class="item" data-look="${esc(it.name)}">${esc(cap(it.name))}</button></li>`).join('');
    if (S.money) html += `<li class="silver">$${S.money} in silver</li>`;
    html += '</ul>';
  }
  panel.innerHTML = html;
}
function renderNotes() {
  renderInventory();
  const panel = $('notes');
  const open = new Set([...panel.querySelectorAll('details[open]')].map(d => d.dataset.id));
  const order = [S.room, ...S.visited.filter(id => id !== S.room).reverse()];
  let html = '<h2 class="panel">Looked at</h2>';
  for (const rid of order) {
    const entries = Object.entries(S.notes[rid] || {});
    if (!entries.length && rid !== S.room) continue;
    html += `<h3${rid === S.room ? ' class="current"' : ''}>${esc(render(textOf(ROOMS[rid].name), { room: rid }).replace(/<[^>]+>/g, ''))}</h3>`;
    if (!entries.length) html += '<div class="empty">Nothing yet.</div>';
    entries.sort((a, b) => (b[1].key ? 1 : 0) - (a[1].key ? 1 : 0));
    for (const [k, n] of entries) {
      const id = `${rid}:${k}`;
      const title = k.startsWith('npc:') ? npcName(k.slice(4), true) : n.title;
      html += `<details data-id="${esc(id)}"${open.has(id) ? ' open' : ''}><summary>${esc(cap(title))}${n.key ? '<span class="badge" title="Key item">★</span>' : ''}</summary><p>${render(n.text, { room: rid })}</p></details>`;
    }
  }
  panel.innerHTML = html;
  renderHistories();
}
function renderHistories() {
  const box = $('histories');
  if (!settings.histories) { box.innerHTML = ''; return; }
  const r = room();
  let html = '<h2 class="panel">Histories</h2>';
  const ids = L(r.sources);
  if (!ids.length) html += '<div class="empty">No sources for this place yet.</div>';
  for (const id of ids) {
    const s = SRC.sources[id];
    if (!s) continue;
    html += `<div class="source"><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a><div>${esc(s.supports || '')}</div></div>`;
  }
  const claims = Object.entries(SRC.claims || {}).filter(([, c]) => L(c.rooms).includes(S.room));
  if (claims.length) {
    html += '<h3>What here is history</h3><ul class="claims">';
    for (const [, c] of claims) html += `<li><span class="status ${esc(c.status)}">${esc(c.status.replace('-', ' '))}</span> ${esc(c.claim)}</li>`;
    html += '</ul>';
  }
  box.innerHTML = html;
}
function applySettings() {
  document.body.classList.toggle('nosidebar', !settings.sidebar);
  document.body.classList.toggle('noinventory', !settings.inventory);
  $('opt-inventory').checked = settings.inventory;
  document.body.classList.toggle('clickable', settings.clickable);
  document.body.classList.remove('hl-key', 'hl-all');
  if (settings.highlight !== 'off') document.body.classList.add(`hl-${settings.highlight}`);
  $('opt-sidebar').checked = settings.sidebar;
  $('opt-clicks').checked = settings.clickable;
  $('opt-hl').value = settings.highlight;
  $('opt-histories').checked = settings.histories;
  store.set(SETTINGS_KEY, settings);
  if (S) renderHistories();
}
// ------------------------------------------------------------ guided tour
// Walks over the real page, outlining each part with a caption. It never
// touches the game state; it only opens Settings for the steps that need it.
let tour = null;
function tourTarget(step) {
  if (!step.target) return null;
  let el = document.querySelector(step.target);
  if (!el || !el.getClientRects().length) return null;
  if (step.label) el = el.closest('label') || el;
  return el;
}
function startTour() {
  const steps = L(G.tour);
  if (!steps.length) return meta('There is no tour in this version.');
  if (!$('tour-card')) {
    const box = document.createElement('div');
    box.id = 'tour-box';
    const card = document.createElement('div');
    card.id = 'tour-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-live', 'polite');
    card.innerHTML = '<p id="tour-text"></p><div class="row"><span class="count" id="tour-count"></span><button id="tour-back">Back</button><button id="tour-next">Next</button><button id="tour-close" aria-label="Close the tour">Close</button></div>';
    document.body.append(box, card);
    $('tour-back').addEventListener('click', () => tourStep(-1));
    $('tour-next').addEventListener('click', () => tourStep(1));
    $('tour-close').addEventListener('click', endTour);
  }
  tour = { i: 0, settingsWereOpen: $('settings').classList.contains('open') };
  tourStep(0);
}
function tourStep(dir) {
  const steps = L(G.tour);
  tour.i += dir;
  // skip steps whose target isn't on screen (the quick buttons on a desktop)
  for (;;) {
    if (tour.i < 0) { tour.i = 0; dir = 1; }
    if (tour.i >= steps.length) return endTour();
    const st = steps[tour.i];
    $('settings').classList.toggle('open', !!st.settings);
    if (!st.target || tourTarget(st)) break;
    tour.i += dir || 1;
  }
  const st = steps[tour.i];
  $('tour-text').textContent = st.text;
  $('tour-count').textContent = `${tour.i + 1} of ${steps.length}`;
  $('tour-back').disabled = tour.i === 0;
  $('tour-next').textContent = tour.i === steps.length - 1 ? 'Done' : 'Next';
  placeTour();
  $('tour-next').focus();
}
function placeTour() {
  if (!tour) return;
  const st = L(G.tour)[tour.i];
  const el = tourTarget(st);
  const box = $('tour-box');
  const card = $('tour-card');
  if (!el) { box.className = 'off'; card.className = 'bottom'; return; }
  el.scrollIntoView({ block: 'nearest' });
  const r = el.getBoundingClientRect();
  box.className = '';
  Object.assign(box.style, { left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
  card.className = r.top + r.height / 2 > innerHeight / 2 ? 'top' : 'bottom';
}
function endTour() {
  if (!tour) return;
  $('settings').classList.toggle('open', tour.settingsWereOpen);
  $('tour-box').remove();
  $('tour-card').remove();
  tour = null;
  $('cmd').focus();
}

function wireUI() {
  document.addEventListener('keydown', e => {
    if (!tour) return;
    if (e.key === 'Escape') { e.preventDefault(); endTour(); }
    else if (e.key === 'ArrowRight' && e.target.id !== 'cmd') tourStep(1);
    else if (e.key === 'ArrowLeft' && e.target.id !== 'cmd') tourStep(-1);
  });
  addEventListener('resize', placeTour);
  const cmd = $('cmd');
  cmd.maxLength = G.input_limit || 40;
  const submit = () => { const v = cmd.value; cmd.value = ''; command(v); cmd.focus(); };
  cmd.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  $('enter').addEventListener('click', submit);
  $('gear').addEventListener('click', () => {
    const open = $('settings').classList.toggle('open');
    $('gear').setAttribute('aria-expanded', open);
  });
  $('opt-sidebar').addEventListener('change', e => { settings.sidebar = e.target.checked; applySettings(); });
  $('opt-inventory').addEventListener('change', e => { settings.inventory = e.target.checked; applySettings(); });
  $('inventory').addEventListener('click', e => {
    const b = e.target.closest('button[data-look]');
    if (b) { command(`look at ${b.dataset.look}`); $('cmd').focus(); }
  });
  $('opt-clicks').addEventListener('change', e => { settings.clickable = e.target.checked; applySettings(); });
  $('opt-hl').addEventListener('change', e => { settings.highlight = e.target.value; applySettings(); });
  $('opt-histories').addEventListener('change', e => { settings.histories = e.target.checked; applySettings(); });
  $('tour-btn').addEventListener('click', startTour);
  $('output').addEventListener('click', e => {
    const noun = e.target.dataset && e.target.dataset.noun;
    if (!settings.clickable || !noun) return;
    command(findExit(noun) && !resolve(noun) ? `go ${noun}` : `look at ${noun}`);
  });
  $('quick').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.run) command(b.dataset.run);
    else { cmd.value = b.dataset.fill; cmd.focus(); }
  });
}

async function loadYaml(p) {
  const r = await fetch(DATA + p, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Could not load ${p} (${r.status})`);
  return jsyaml.load(await r.text());
}
async function boot() {
  try {
    [G, SRC, CH] = await Promise.all([loadYaml('game.yaml'), loadYaml('sources.yaml'), loadYaml('ch1/chapter.yaml')]);
    ROOMS = {};
    await Promise.all(L(CH.rooms).map(async id => { ROOMS[id] = await loadYaml(`ch1/rooms/${id}.yaml`); }));
  } catch (e) {
    $('output').innerHTML = `<p class="death">${esc(e.message)}</p><p class="meta">The game data didn't load. If you opened this file directly, serve the docs folder over HTTP instead.</p>`;
    return;
  }
  Object.assign(settings, G.settings || {}, store.get(SETTINGS_KEY) || {});
  if (params.has('fresh')) { store.del(AUTO_KEY); store.del(SAVE_KEY); }
  wireUI();
  let auto = !params.has('scene') && store.get(AUTO_KEY);
  if (auto && !compatible(auto)) {
    notice('Updated', `Dixon has been updated to version ${G.version}. Your game in progress came from ${auto._version ? `version ${auto._version}` : 'an earlier build'} and can't be carried over, so this is a fresh start.`);
    store.del(AUTO_KEY);
    auto = null;
  }
  if (auto) {
    S = deserialize(auto);
    notice('Welcome back', `You are where you left off (version ${G.version}). Type restart to begin again.`);
  } else {
    S = freshState();
    if (!store.get('dixon.seen') && G.tour_offer) {
      notice('New here?', G.tour_offer, { text: 'Take the tour', onClick: () => startTour() });
      store.set('dixon.seen', true);
    }
    if (params.has('scene') && ROOMS[params.get('scene')]) { S.room = params.get('scene'); S.visited = [S.room]; }
  }
  $('version').textContent = `v${G.version}`;
  $('about').textContent = `Dixon ${G.version} · ${CH.title} · saves: format ${G.save_compat}`;
  document.title = `Dixon ${G.version}`;
  applySettings();
  say(textOf(room().name), { cls: 'heading' });
  describe();
  if ($('output').querySelector('.notice')) $('output').scrollTop = 0;   // show the banner first
  status();
  renderNotes();
  // Test hooks (used by game-data/tools/test.mjs).
  window.dixon = {
    command,
    score,
    get state() { return S; },
    match: t => { const m = matchAction(norm(t)); return m ? m.a.id : null; },
    tourStep: n => tourStep(n),
    get touring() { return tour ? tour.i : null; },
    exitFor: t => { const e = moveExit(norm(t)); return e ? (e.to || '(blocked)') : null; },
    setup({ room: r, flags = [], items = [], money } = {}) {
      if (r) { S.room = r; S.turns = 0; if (!S.visited.includes(r)) S.visited.push(r); }
      flags.forEach(setFlag);
      items.forEach(i => { if (!S.items.includes(i)) S.items.push(i); });
      if (money !== undefined) S.money = money;
      status();
    },
  };
}
boot();
