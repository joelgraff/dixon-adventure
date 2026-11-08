// Validates the scene-card data. Run from this folder: node check.mjs
// Exits non-zero if there are errors. Warnings do not fail the run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
// The shared present-day rooms are checked once per chapter, so the same
// message can come up more than once: keep each one once.
const errors = new Set();
const warnings = new Set();
const err = (where, msg) => errors.add(`${where}: ${msg}`);
const warn = (where, msg) => warnings.add(`${where}: ${msg}`);

function load(file) {
  try {
    return yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(path.relative(root, file), `YAML error: ${e.message.split('\n')[0]}`);
    return null;
  }
}

const asList = v => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
const game = load(path.join(root, 'game.yaml')) || {};
const src = load(path.join(root, 'sources.yaml')) || {};
const world = load(path.join(root, 'world', 'world.yaml')) || {};
// The listed chapters in order, then any drafts (chapter folders not listed yet).
const allDirs = fs.readdirSync(root).filter(d => /^ch\d+$/.test(d)).sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
const listed = (game.chapters || []).map(String);
for (const c of listed) if (!allDirs.includes(c)) err('game.yaml', `chapters lists ${c}, but there is no ${c}/ folder`);
const chapterDirs = [...listed.filter(c => allDirs.includes(c)), ...allDirs.filter(c => !listed.includes(c))];
const ERA_RE = /^(present|\d{4})$/;
const allRooms = {};             // every room in the game, shared and per chapter
const flagUse = [];              // per chapter, in order: {ch, set, read, declared, assumes}

// What every chapter shares (see FORMAT.md, Chapters): maps merged with the
// chapter winning, lists joined with the chapter's first.
function mergeChapter(w, ch) {
  const out = { ...w, ...ch };
  for (const k of ['items', 'deaths', 'vars', 'npcs', 'flags']) out[k] = { ...(w[k] || {}), ...(ch[k] || {}) };
  for (const k of ['actions', 'hints']) out[k] = [...asList(ch[k]), ...asList(w[k])];
  return out;
}
function loadRooms(dir, label, manifest, owner) {
  const rooms = {};
  if (!fs.existsSync(dir)) return rooms;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.yaml')).sort()) {
    const r = load(path.join(dir, f));
    if (!r) continue;
    const id = path.basename(f, '.yaml');
    if (r.id !== id) err(`${label}/${f}`, `id "${r.id}" does not match the file name`);
    rooms[id] = r;
  }
  for (const id of Object.keys(rooms)) if (!manifest.includes(id)) err(owner, `room file ${id}.yaml is missing from the rooms list`);
  for (const id of manifest) if (!rooms[id]) err(owner, `rooms lists ${id}, but there is no ${id}.yaml in ${label}`);
  return rooms;
}
const worldRooms = loadRooms(path.join(root, 'world', 'rooms'), 'world/rooms', asList(world.rooms), 'world/world.yaml');
const roomFile = {};             // room id -> its file, for messages
for (const id of Object.keys(worldRooms)) roomFile[id] = `world/rooms/${id}.yaml`;

const COND_RE = /^(money|score|turns|n)\s*(>=|<=|==|>|<)\s*(-?\d+)$/;
const EFFECTS = new Set(['set', 'clear', 'give', 'take', 'money', 'reveal', 'say', 'move', 'death', 'rewind', 'leave_behind', 'describe', 'end', 'if']);
const BUILTIN_VARS = new Set(['money', 'score', 'max_score', 'picked', 'n']);

for (const ch of chapterDirs) {
  const chDir = path.join(root, ch);
  const own = load(path.join(chDir, 'chapter.yaml')) || {};
  const chapter = mergeChapter(world, own);
  const ownRooms = loadRooms(path.join(chDir, 'rooms'), `${ch}/rooms`, asList(own.rooms), `${ch}/chapter.yaml`);
  for (const id of Object.keys(ownRooms)) {
    if (worldRooms[id]) err(`${ch}/rooms/${id}.yaml`, `has the same id as a shared room in world/rooms`);
    roomFile[id] = roomFile[id] && !roomFile[id].startsWith('world/') ? roomFile[id] : `${ch}/rooms/${id}.yaml`;
    allRooms[id] = allRooms[id] || ownRooms[id];
  }
  const rooms = { ...worldRooms, ...ownRooms };
  const fileOf = rid => (worldRooms[rid] ? `world/rooms/${rid}.yaml` : `${ch}/rooms/${rid}.yaml`);
  const items = chapter.items || {};
  const deaths = chapter.deaths || {};
  const chapterNpcs = chapter.npcs || {};
  const vars = new Set([...Object.keys(chapter.vars || {}), ...BUILTIN_VARS]);
  const flagsSet = new Map();     // flag -> first place it is set
  const flagsRead = new Map();    // flag -> first place it is read
  const todos = [];
  const counts = { rooms: 0, nouns: 0, npcs: 0, topics: 0, actions: 0, phrases: 0 };

  // Which NPC ids can appear in each room (room npcs + moving chapter npcs).
  const npcsIn = {};
  for (const [rid, r] of Object.entries(rooms)) npcsIn[rid] = new Set(Object.keys(r.npcs || {}));
  for (const [nid, npc] of Object.entries(chapterNpcs)) {
    for (const v of asList(npc.at)) {
      if (!rooms[v.room]) err(`${ch}/chapter.yaml npcs.${nid}`, `at: unknown room "${v.room}"`);
      else npcsIn[v.room].add(nid);
    }
  }
  const allNpcIds = new Set([...Object.values(rooms).flatMap(r => Object.keys(r.npcs || {})), ...Object.keys(chapterNpcs)]);

  // ---- conditions and effects -------------------------------------------
  function checkCond(c, where) {
    if (c && typeof c === 'object') {
      if (!Array.isArray(c.any)) return err(where, `condition object must be {any: [...]}`);
      return c.any.forEach(x => checkCond(x, where));
    }
    if (typeof c !== 'string') return err(where, `condition is not a string: ${JSON.stringify(c)}`);
    let t = c.trim();
    if (t.startsWith('!')) return err(where, `use "not", not "!": ${t}`);
    if (t.startsWith('not ')) t = t.slice(4).trim();
    if (COND_RE.test(t)) return;
    const [kind, val] = t.includes(':') ? t.split(':') : [null, t];
    if (kind === 'has') { if (!items[val]) err(where, `has: unknown item "${val}"`); return; }
    if (kind === 'here') { if (!allNpcIds.has(val)) err(where, `here: unknown NPC "${val}"`); return; }
    if (kind === 'in') { if (!rooms[val]) err(where, `in: unknown room "${val}"`); return; }
    if (kind === 'era') { if (val !== 'past' && !ERA_RE.test(val)) err(where, `era: should be present, past or a year, not "${val}"`); return; }
    if (kind === 'chapter') { if (!allDirs.includes(val)) err(where, `chapter: unknown chapter "${val}"`); return; }
    if (kind) return err(where, `unknown condition "${t}"`);
    if (!/^[a-z0-9_]+\.[a-z0-9_]+$/.test(t)) return err(where, `flag name "${t}" should look like prefix.name`);
    if (!flagsRead.has(t)) flagsRead.set(t, where);
  }

  function checkEffect(e, where, rid) {
    if (!e || typeof e !== 'object' || Array.isArray(e)) return err(where, `effect is not a one-key map: ${JSON.stringify(e)}`);
    const keys = Object.keys(e).filter(k => k !== 'when' && k !== 'text' && k !== 'do');
    if (keys.length !== 1) return err(where, `effect needs exactly one key, got ${Object.keys(e).join(', ')}`);
    const k = keys[0], v = e[k];
    if (!EFFECTS.has(k)) return err(where, `unknown effect "${k}"`);
    if (k === 'set') asList(v).forEach(f => { if (!flagsSet.has(f)) flagsSet.set(f, where); });
    if (k === 'clear') asList(v).forEach(f => checkCond(f, where));
    if ((k === 'give' || k === 'take') && !items[v]) err(where, `${k}: unknown item "${v}"`);
    if (k === 'move' && !rooms[v]) err(where, `move: unknown room "${v}"`);
    if (k === 'death' && !deaths[v]) err(where, `death: unknown death "${v}"`);
    if (k === 'money' && !(typeof v === 'number' || /^-?n$/.test(String(v)))) err(where, `money: expected a number or n/-n, got ${v}`);
    if (k === 'reveal') {
      const r = rooms[rid];
      asList(v).forEach(n => { if (!r || !(r.nouns || {})[n]) err(where, `reveal: no noun "${n}" in room ${rid}`); });
    }
    if ((k === 'rewind' || k === 'leave_behind') && !/^\d{4}$/.test(String(v))) err(where, `${k}: expected a year, got ${v}`);
    if (k === 'if') {
      asList(v.when).forEach(c => checkCond(c, where));
      asList(v.do).forEach(x => checkEffect(x, where, rid));
    }
  }

  // Generic walk: every `when` is a condition list, every `do`/`on_look` an
  // effect list, every string is checked for markup.
  const VARIANT_KEYS = new Set(['hints', 'look', 'brief', 'room_line', 'talk', 'listen', 'say', 'blocked', 'parting', 'peek', 'fallback', 'text', 'else', 'at', 'take', 'touch', 'push', 'open', 'close', 'sit', 'climb', 'smell', 'taste', 'search', 'sign', 'drink', 'board', 'call', 'use', 'give', 'read']);
  function walk(node, where, rid, onString, parentKey) {
    if (Array.isArray(node)) {
      node.forEach((x, i) => walk(x, `${where}[${i}]`, rid, onString));
      // variant lists: a default must be last, and only one
      if (VARIANT_KEYS.has(parentKey) && node.length && node.every(x => x && typeof x === 'object' && !Array.isArray(x) && ('text' in x || 'say' in x || 'room' in x || 'do' in x))) {
        const defaults = node.map((x, i) => (!('when' in x) ? i : -1)).filter(i => i >= 0);
        if (defaults.length > 1) err(where, `variant list has ${defaults.length} defaults (entries with no when)`);
        if (defaults.length === 1 && defaults[0] !== node.length - 1) err(where, `variant default (no when) must be last`);
      }
      return;
    }
    if (node && typeof node === 'object') {
      // something only another chapter can reach (`chapter:ch1`) is checked with that chapter
      if (asList(node.when).some(c => typeof c === 'string' && /^chapter:/.test(c.trim()) && c.trim().slice(8) !== ch)) return;
      for (const [k, v] of Object.entries(node)) {
        const w = `${where}.${k}`;
        if (k === 'when') asList(v).forEach(c => checkCond(c, w));
        else if (k === 'always') asList(v).filter(c => c !== true).forEach(c => checkCond(c, w));
        else if (k === 'do' || k === 'on_look') asList(v).forEach(e => checkEffect(e, w, rid));
        else if (k === 'aliases' || k === 'phrases' || k === 'names' || k === 'keys' || k === 'sources') continue;
        else walk(v, w, rid, onString, k);
      }
      return;
    }
    if (typeof node === 'string') onString(node, where);
  }

  // ---- text markup ---------------------------------------------------------
  function labelsFor(rid) {
    const r = rooms[rid];
    const labels = new Map();
    const add = (id, obj, kind) => {
      for (const l of [id, obj.name, ...(obj.aliases || [])].filter(Boolean)) labels.set(String(l).toLowerCase(), `${kind}:${id}`);
    };
    for (const [id, n] of Object.entries(r.nouns || {})) add(id, n, 'noun');
    for (const id of npcsIn[rid]) add(id, (r.npcs || {})[id] || chapterNpcs[id], 'npc');
    return labels;
  }

  function checkMarkup(s, where, labels) {
    if (/\bTODO\b/.test(s)) todos.push(where);
    for (const m of s.matchAll(/\[([^\]|]+)(?:\|[^\]]*)?\]/g)) {
      const key = m[1].trim().toLowerCase();
      if (labels && !labels.has(key)) err(where, `[${m[1]}] does not name a noun or NPC in this room`);
    }
    for (const m of s.matchAll(/\{([a-z_]+)(?:'s)?\}/g)) if (!vars.has(m[1]) && !allNpcIds.has(m[1])) err(where, `{${m[1]}} is not a known variable or character`);
  }

  // ---- names before introductions -----------------------------------------
  // Narration may not use a character's name unless the text only shows once
  // the player knows it (a `known.<id>` or `heard.<id>` condition), or it uses
  // {id} / {id's}, which the runtime turns into the name or a description.
  // Speech inside quotation marks is exempt: characters know each other.
  // A word belongs to one person: a family surname ("Dixon" in Rebecca Dixon)
  // counts only for the character whose short name it is.
  const npcList = [...Object.values(rooms).flatMap(r => Object.entries(r.npcs || {})), ...Object.entries(chapterNpcs)];
  const shortOf = new Map(npcList.filter(([, n]) => n.short).map(([id, n]) => [n.short, id]));
  const people = [];
  for (const [id, n] of npcList) {
    const words = new Set([n.short, ...String(n.name || '').split(/\s+/)].filter(w => w && /^[A-Z][a-z]{2,}$/.test(w)));
    for (const w of words) if (!shortOf.has(w) || shortOf.get(w) === id) people.push({ id, word: w });
  }
  const SKIP = new Set(['id', 'name', 'short', 'unknown', 'ref', 'aliases', 'phrases', 'keys', 'names', 'sources', 'picture', 'when', 'do', 'speaker', 'at', 'era', 'reveals']);
  function lintNames(node, where, guards) {
    if (Array.isArray(node)) return node.forEach((x, i) => lintNames(x, `${where}[${i}]`, guards));
    if (node && typeof node === 'object') {
      const g = node.when ? [...guards, ...asList(node.when).map(String)] : guards;
      for (const [k, v] of Object.entries(node)) {
        if (SKIP.has(k) && !(k === 'name' && where.endsWith('.yaml'))) continue;
        lintNames(v, `${where}.${k}`, g);
      }
      return;
    }
    if (typeof node !== 'string') return;
    const narration = node.replace(/"[^"]*"/g, ' ').replace(/\u201c[^\u201d]*\u201d/g, ' ');
    for (const p of people) {
      if (!new RegExp(`\\b${p.word}s?\\b`).test(narration)) continue;
      if (guards.some(c => c === `known.${p.id}` || c === `heard.${p.id}`)) continue;
      err(where, `narration names ${p.word} before the player may know it (use {${p.id}} / {${p.id}'s}, or a known.${p.id} variant)`);
    }
  }

  // ---- introductions -------------------------------------------------------
  // A first meeting is keyed on `not met.<id>`, never `not known.<id>`: the
  // player can learn a name before meeting someone (typing it, reading a name
  // tag), and that must not skip the introduction.
  function checkIntro(npc, where) {
    for (const [i, v] of asList(npc.talk).entries()) {
      for (const c of asList(v && v.when)) {
        if (typeof c === 'string' && /^not\s+known\./.test(c.trim())) err(`${where}.talk[${i}]`, `introductions use "not met.<id>", not "${c}" (see FORMAT.md, Flag prefixes)`);
      }
    }
  }

  // ---- rooms ---------------------------------------------------------------
  for (const [rid, r] of Object.entries(rooms)) {
    const where = fileOf(rid);
    counts.rooms++;
    for (const f of ['era', 'name', 'look', 'picture', 'exits']) if (r[f] === undefined) err(where, `missing ${f}`);
    if (r.brief === undefined) warn(where, `no brief: return visits will repeat the whole description`);
    if (!ERA_RE.test(String(r.era))) err(where, `era must be present or a year (1830)`);
    for (const s of asList(r.sources)) if (!(src.sources || {})[s]) err(where, `unknown source ${s}`);
    const labels = labelsFor(rid);
    walk(r, where, rid, (s, w) => checkMarkup(s, w, labels));
    lintNames(r, where, []);

    const nouns = r.nouns || {};
    for (const [nid, n] of Object.entries(nouns)) {
      counts.nouns++;
      if (!n.name) err(`${where} nouns.${nid}`, `missing name`);
      if (n.look === undefined) err(`${where} nouns.${nid}`, `missing look`);
      for (const rv of asList(n.reveals)) {
        if (!nouns[rv]) err(`${where} nouns.${nid}`, `reveals unknown noun "${rv}"`);
        else if (!nouns[rv].hidden) warn(`${where} nouns.${nid}`, `reveals "${rv}", which is not hidden`);
      }
    }
    for (const [nid, npc] of Object.entries(r.npcs || {})) {
      checkIntro(npc, `${where} npcs.${nid}`);
      counts.npcs++;
      counts.topics += asList(npc.topics).length;
      if (!npc.name) err(`${where} npcs.${nid}`, `missing name`);
      if (!npc.fallback) warn(`${where} npcs.${nid}`, `no fallback line for unknown topics`);
    }
    // labels used twice in one room are ambiguous to the parser
    // Two things that are never here at once (one needs X, the other "not X")
    // may share a word.
    const seen = new Map();
    const exclusive = (a, b) => {
      const wa = asList(a.when).map(String), wb = asList(b.when).map(String);
      return wa.some(c => wb.includes(`not ${c}`)) || wb.some(c => wa.includes(`not ${c}`));
    };
    const addLabel = (l, owner, def) => {
      l = String(l).toLowerCase();
      const prev = seen.get(l);
      if (prev && prev.owner !== owner && !exclusive(prev.def, def)) warn(where, `"${l}" names both ${prev.owner} and ${owner} (the parser will ask which)`);
      seen.set(l, { owner, def });
    };
    for (const [id, n] of Object.entries(nouns)) [id, n.name, ...(n.aliases || [])].forEach(l => addLabel(l, `noun ${id}`, n));
    for (const [id, n] of Object.entries(r.npcs || {})) [id, ...(n.aliases || [])].forEach(l => addLabel(l, `npc ${id}`, n));

    for (const [i, e] of asList(r.exits).entries()) {
      if (!e.names || !e.names.length) err(`${where} exits[${i}]`, `exit has no names`);
      if (e.to && !rooms[e.to]) err(`${where} exits[${i}]`, `unknown room "${e.to}"`);
      if (!e.to && !e.blocked) err(`${where} exits[${i}]`, `exit with no "to" needs "blocked" text`);
      if (e.action && ![...asList(r.actions), ...asList(chapter.actions)].some(a => a.id === e.action)) err(`${where} exits[${i}]`, `unknown action "${e.action}"`);
    }
    for (const a of asList(r.actions)) {
      counts.actions++;
      counts.phrases += asList(a.phrases).length;
      if (!a.id || !asList(a.phrases).length) err(`${where} actions`, `action needs an id and phrases`);
    }
  }

  // ---- chapter -------------------------------------------------------------
  const chWhere = `${ch}/chapter.yaml`;
  if (!rooms[chapter.start]) err(chWhere, `start room "${chapter.start}" not found`);
  for (const i of asList(chapter.start_items)) if (!items[i]) err(chWhere, `start item "${i}" not defined`);
  walk({ vars: chapter.vars, items: chapter.items, money_item: chapter.money_item, fog_lock: chapter.fog_lock, actions: chapter.actions, hints: chapter.hints }, chWhere, null, (s, w) => checkMarkup(s, w, null));
  lintNames({ items: chapter.items, money_item: chapter.money_item, actions: chapter.actions, fog_lock: chapter.fog_lock, deaths: chapter.deaths, veil: chapter.veil, npcs: chapterNpcs }, chWhere, []);
  for (const [nid, npc] of Object.entries(chapterNpcs)) {
    checkIntro(npc, `${chWhere} npcs.${nid}`);
    counts.npcs++;
    counts.topics += asList(npc.topics).length;
    // check the moving NPC's markup against each room it can stand in
    for (const v of asList(npc.at)) if (rooms[v.room]) {
      const labels = labelsFor(v.room);
      walk(npc, `${chWhere} npcs.${nid}@${v.room}`, v.room, (s, w) => checkMarkup(s, w, labels));
    }
  }
  for (const a of asList(chapter.actions)) { counts.actions++; counts.phrases += asList(a.phrases).length; }

  // phrases claimed twice in the same place
  const roomPhrases = {};
  for (const [rid, r] of Object.entries(rooms)) {
    for (const a of asList(r.actions)) for (const p of asList(a.phrases)) {
      const key = `${rid}|${p}`;
      if (roomPhrases[key]) warn(fileOf(rid), `phrase "${p}" used by both ${roomPhrases[key]} and ${a.id}`);
      roomPhrases[key] = a.id;
    }
  }

  // score
  const scored = Object.entries(chapter.flags || {}).filter(([, f]) => f && f.score);
  const total = scored.reduce((s, [, f]) => s + f.score, 0);
  if (total !== chapter.max_score) err(chWhere, `scoring flags add up to ${total}, but max_score is ${chapter.max_score}`);
  // `assumes`: the flags a chapter takes for granted when started directly
  // (?chapter=ch2), as if the chapters before it had been played.
  for (const f of asList(own.assumes)) {
    checkCond(f, `${chWhere} assumes`);
    if (!flagsSet.has(f)) flagsSet.set(f, `${chWhere} assumes`);
  }
  if (own.intro !== undefined) walk({ intro: own.intro }, chWhere, null, (s, w) => checkMarkup(s, w, null));

  // Flags carry over from one chapter to the next, so whether a flag is ever
  // set or read is worked out across chapters below.
  flagUse.push({ ch, chWhere, set: flagsSet, read: flagsRead, declared: chapter.flags || {}, scored });
  console.log(`${ch}${listed.includes(ch) ? '' : ' (draft)'}: ${counts.rooms} rooms, ${counts.nouns} nouns, ${counts.npcs} NPCs, ${counts.topics} topics, ${counts.actions} actions, ${counts.phrases} phrasings`);
  console.log(`${ch}: score ${total}/${chapter.max_score} across ${scored.length} scoring flags; ${flagsSet.size} flags set in all`);
  if (todos.length) console.log(`${ch}: ${todos.length} TODO lines:\n  ${todos.join('\n  ')}`);
}

// ---- flags across chapters ---------------------------------------------------
// A flag a chapter reads must be set in that chapter or an earlier one (or
// assumed). A flag set anywhere should be read somewhere or declared.
{
  const setSoFar = new Set();
  const readAnywhere = new Set(flagUse.flatMap(u => [...u.read.keys()]));
  const declaredAnywhere = new Set(flagUse.flatMap(u => Object.keys(u.declared)));
  for (const u of flagUse) {
    for (const f of u.set.keys()) setSoFar.add(f);
    for (const [f] of u.scored) if (!u.set.has(f)) err(u.chWhere, `scoring flag ${f} is never set`);
    // known.* names are set by talk; they still need a set
    for (const [f, w] of u.read) if (!setSoFar.has(f)) err(w, `flag ${f} is read but never set in this chapter or an earlier one`);
  }
  // seen.* and known.* are read by the runtime (names and "a" / "the"), not by the data
  for (const u of flagUse) for (const [f, w] of u.set) if (!readAnywhere.has(f) && !/^(seen|known)\./.test(f) && !declaredAnywhere.has(f)) warn(w, `flag ${f} is set but never read and not declared in a chapter.yaml`);
}

// ---- sources and claims, against every room in the game ---------------------
{
  const every = { ...allRooms, ...worldRooms };
  for (const [cid, c] of Object.entries(src.claims || {})) {
    for (const s of asList(c.sources)) if (!(src.sources || {})[s]) err(`sources.yaml ${cid}`, `unknown source ${s}`);
    for (const rid of asList(c.rooms)) {
      if (!every[rid]) { err(`sources.yaml ${cid}`, `unknown room ${rid}`); continue; }
      const roomSources = new Set(asList(every[rid].sources));
      for (const s of asList(c.sources)) if (!roomSources.has(s)) warn(roomFile[rid], `claim ${cid} cites ${s}, which is missing from this room's sources`);
    }
    if (!['record', 'disputed', 'guess', 'invented', 'needs-source'].includes(c.status)) err(`sources.yaml ${cid}`, `unknown status ${c.status}`);
  }
  const st = Object.values(src.claims || {}).reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
  console.log(`claims: ${Object.entries(st).map(([k, v]) => `${v} ${k}`).join(', ')}`);
}

// Version: game.yaml, play.html's ?v= and the newest changelog entry must agree.
{
  const page = fs.readFileSync(path.resolve(root, '..', 'play.html'), 'utf8');
  const pv = (page.match(/play\.js\?v=([\d.]+)/) || [])[1];
  const log = fs.existsSync(path.join(root, 'CHANGELOG.md')) ? fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8') : '';
  const lv = (log.match(/^## (\d+\.\d+\.\d+)/m) || [])[1];
  const gv = String(game.version || '');
  if (!/^\d+\.\d+\.\d+$/.test(gv)) err('game.yaml', `version "${gv}" should look like 1.2.3`);
  if (pv !== gv) err('play.html', `loads play.js?v=${pv}, but game.yaml says ${gv} (run npm run bump)`);
  if (lv !== gv) err('CHANGELOG.md', `newest entry is ${lv}, but game.yaml says ${gv}`);
  if (!Number.isInteger(game.save_compat)) err('game.yaml', 'save_compat should be a whole number');
  console.log(`version ${gv}, save_compat ${game.save_compat}`);
}

if (warnings.size) console.log(`\n${warnings.size} warning(s):\n  ${[...warnings].join('\n  ')}`);
if (errors.size) {
  console.log(`\n${errors.size} error(s):\n  ${[...errors].join('\n  ')}`);
  process.exit(1);
}
console.log('\nOK');
