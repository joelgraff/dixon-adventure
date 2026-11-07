// Validates the scene-card data. Run from this folder: node check.mjs
// Exits non-zero if there are errors. Warnings do not fail the run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const errors = [];
const warnings = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

function load(file) {
  try {
    return yaml.load(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(path.relative(root, file), `YAML error: ${e.message.split('\n')[0]}`);
    return null;
  }
}

const game = load(path.join(root, 'game.yaml')) || {};
const src = load(path.join(root, 'sources.yaml')) || {};
const chapterDirs = fs.readdirSync(root).filter(d => /^ch\d+$/.test(d));

const COND_RE = /^(money|score|turns|n)\s*(>=|<=|==|>|<)\s*(-?\d+)$/;
const EFFECTS = new Set(['set', 'clear', 'give', 'take', 'money', 'reveal', 'say', 'move', 'death', 'rewind', 'leave_behind', 'describe', 'end', 'if']);
const BUILTIN_VARS = new Set(['money', 'score', 'max_score', 'picked', 'n']);
const asList = v => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

for (const ch of chapterDirs) {
  const chDir = path.join(root, ch);
  const chapter = load(path.join(chDir, 'chapter.yaml')) || {};
  const roomDir = path.join(chDir, 'rooms');
  const rooms = {};
  for (const f of fs.readdirSync(roomDir).filter(f => f.endsWith('.yaml')).sort()) {
    const r = load(path.join(roomDir, f));
    if (!r) continue;
    const id = path.basename(f, '.yaml');
    if (r.id !== id) err(`${ch}/rooms/${f}`, `id "${r.id}" does not match the file name`);
    rooms[id] = r;
  }

  const manifest = asList(chapter.rooms);
  for (const id of Object.keys(rooms)) if (!manifest.includes(id)) err(`${ch}/chapter.yaml`, `room file ${id}.yaml is missing from the rooms list`);
  for (const id of manifest) if (!rooms[id]) err(`${ch}/chapter.yaml`, `rooms lists ${id}, but there is no ${id}.yaml`);
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
    if (kind === 'era') { if (!['present', '1830'].includes(val)) err(where, `era: unknown era "${val}"`); return; }
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
    if ((k === 'rewind' || k === 'leave_behind') && String(v) !== '1830') err(where, `${k}: unknown era ${v}`);
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
      for (const [k, v] of Object.entries(node)) {
        const w = `${where}.${k}`;
        if (k === 'when') asList(v).forEach(c => checkCond(c, w));
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
    const where = `${ch}/rooms/${rid}.yaml`;
    counts.rooms++;
    for (const f of ['era', 'name', 'look', 'picture', 'exits']) if (r[f] === undefined) err(where, `missing ${f}`);
    if (r.brief === undefined) warn(where, `no brief: return visits will repeat the whole description`);
    if (!['present', '1830'].includes(String(r.era))) err(where, `era must be present or 1830`);
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
    const seen = new Map();
    const addLabel = (l, owner) => {
      l = String(l).toLowerCase();
      if (seen.has(l) && seen.get(l) !== owner) warn(where, `"${l}" names both ${seen.get(l)} and ${owner} (the parser will ask which)`);
      seen.set(l, owner);
    };
    for (const [id, n] of Object.entries(nouns)) [id, n.name, ...(n.aliases || [])].forEach(l => addLabel(l, `noun ${id}`));
    for (const [id, n] of Object.entries(r.npcs || {})) [id, ...(n.aliases || [])].forEach(l => addLabel(l, `npc ${id}`));

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
  walk({ vars: chapter.vars, items: chapter.items, fog_lock: chapter.fog_lock, actions: chapter.actions, hints: chapter.hints }, chWhere, null, (s, w) => checkMarkup(s, w, null));
  lintNames({ items: chapter.items, actions: chapter.actions, fog_lock: chapter.fog_lock, deaths: chapter.deaths, veil: chapter.veil, npcs: chapterNpcs }, chWhere, []);
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
      if (roomPhrases[key]) warn(`${ch}/rooms/${rid}.yaml`, `phrase "${p}" used by both ${roomPhrases[key]} and ${a.id}`);
      roomPhrases[key] = a.id;
    }
  }

  // score
  const scored = Object.entries(chapter.flags || {}).filter(([, f]) => f && f.score);
  const total = scored.reduce((s, [, f]) => s + f.score, 0);
  if (total !== chapter.max_score) err(chWhere, `scoring flags add up to ${total}, but max_score is ${chapter.max_score}`);
  for (const [f] of scored) if (!flagsSet.has(f)) err(chWhere, `scoring flag ${f} is never set`);

  // flags read but never set (known.* names are set by talk; they still need a set)
  for (const [f, w] of flagsRead) if (!flagsSet.has(f)) err(w, `flag ${f} is read but never set anywhere`);
  // seen.* and known.* are read by the runtime (names and "a" / "the"), not by the data
  for (const [f, w] of flagsSet) if (!flagsRead.has(f) && !/^(seen|known)\./.test(f) && !(chapter.flags || {})[f]) warn(w, `flag ${f} is set but never read and not declared in chapter.yaml`);

  // sources and claims
  for (const [cid, c] of Object.entries(src.claims || {})) {
    for (const s of asList(c.sources)) if (!(src.sources || {})[s]) err(`sources.yaml ${cid}`, `unknown source ${s}`);
    for (const rid of asList(c.rooms)) {
      if (!rooms[rid]) { err(`sources.yaml ${cid}`, `unknown room ${rid}`); continue; }
      const listed = new Set(asList(rooms[rid].sources));
      for (const s of asList(c.sources)) if (!listed.has(s)) warn(`${ch}/rooms/${rid}.yaml`, `claim ${cid} cites ${s}, which is missing from this room's sources`);
    }
    if (!['record', 'disputed', 'guess', 'invented', 'needs-source'].includes(c.status)) err(`sources.yaml ${cid}`, `unknown status ${c.status}`);
  }

  const st = Object.values(src.claims || {}).reduce((m, c) => ((m[c.status] = (m[c.status] || 0) + 1), m), {});
  console.log(`${ch}: ${counts.rooms} rooms, ${counts.nouns} nouns, ${counts.npcs} NPCs, ${counts.topics} topics, ${counts.actions} actions, ${counts.phrases} phrasings`);
  console.log(`${ch}: score ${total}/${chapter.max_score} across ${scored.length} scoring flags; ${flagsSet.size} flags set in all`);
  console.log(`claims: ${Object.entries(st).map(([k, v]) => `${v} ${k}`).join(', ')}`);
  if (todos.length) console.log(`${ch}: ${todos.length} TODO lines:\n  ${todos.join('\n  ')}`);
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

if (warnings.length) console.log(`\n${warnings.length} warning(s):\n  ${warnings.join('\n  ')}`);
if (errors.length) {
  console.log(`\n${errors.length} error(s):\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('\nOK');
