// Plays the test scripts in ch*/tests/*.yaml against play.html in a
// headless browser. Run from this folder:  node test.mjs  [filter]
//
// Needs Playwright with Chromium:  npm install playwright && npx playwright install chromium
//
// Test file format:
//   tests:
//     - name: winning path
//       url: "?scene=landing"          # optional, added to play.html?fresh&seed=1
//       steps:
//         - setup: {room: landing, flags: [...], items: [...], money: 100}
//         - cmd: look
//           expect: "some words"       # or a list; case-insensitive, in the reply
//           not: "words"               # or a list; must not appear in the reply
//           score: 18                  # optional checks after the command
//           room: landing
//           money: 0
//           turns: 2                    # turns spent in this room (on_turn's clock)
//         - click: "#tour-next"         # click a page element (times: 3 repeats it)
//           visible: "#tour-card"       # also hidden:, and shows: {selector: words}
//   phrases: true                      # instead of steps: every room action's
//                                      # phrasings must reach that action
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('Playwright is not installed. Run: npm install playwright && npx playwright install chromium');
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const dataRoot = path.resolve(here, '..');
const docs = path.resolve(dataRoot, '..');
const filter = process.argv[2] || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.yaml': 'text/yaml', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  let p = path.join(docs, decodeURIComponent(req.url.split('?')[0]));
  if (!p.startsWith(docs)) { res.writeHead(403); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(d);
  });
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}/play.html`;
const browser = await chromium.launch();

const asList = v => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);
let passed = 0;
let failed = 0;

async function openGame(extra = '') {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${base}?fresh&seed=1${extra ? `&${extra.replace(/^\?/, '')}` : ''}`);
  await page.waitForFunction(() => window.dixon, null, { timeout: 10000 });
  return { page, context, errors };
}
const outputCount = page => page.evaluate(() => document.querySelectorAll('#output p').length);
const outputSince = (page, n) => page.evaluate(k => [...document.querySelectorAll('#output p')].slice(k).map(p => p.innerText).join('\n'), n);

async function runSteps(t, file) {
  const { page, context, errors } = await openGame(t.url);
  const label = `${file} › ${t.name}`;
  try {
    for (const [i, step] of asList(t.steps).entries()) {
      if (step.setup) await page.evaluate(s => window.dixon.setup(s), step.setup);
      for (let k = 0; k < (step.times || 1) && step.click; k++) await page.click(step.click);
      const domChecks = async () => {
        for (const sel of asList(step.visible)) if (!(await page.isVisible(sel))) throw new Error(`step ${i + 1}: expected ${sel} to be visible`);
        for (const sel of asList(step.hidden)) if (await page.isVisible(sel)) throw new Error(`step ${i + 1}: expected ${sel} to be hidden`);
        if (step.shows) for (const [sel, words] of Object.entries(step.shows)) {
          const got = (await page.textContent(sel)) || '';
          if (!got.toLowerCase().includes(String(words).toLowerCase())) throw new Error(`step ${i + 1}: ${sel} shows "${got.slice(0, 120)}", expected "${words}"`);
        }
      };
      if (step.cmd === undefined) { await domChecks(); continue; }
      let before = await outputCount(page);
      await page.evaluate(c => window.dixon.command(c), String(step.cmd));
      if ((await outputCount(page)) < before) before = 0;   // restart clears the screen
      const reply = await outputSince(page, before);
      const low = reply.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"');
      const fail = msg => { throw new Error(`step ${i + 1} "${step.cmd}": ${msg}\n    reply: ${reply.split('\n').slice(1).join(' | ').slice(0, 400)}`); };
      for (const e of asList(step.expect)) if (!low.includes(String(e).toLowerCase())) fail(`expected "${e}"`);
      for (const e of asList(step.not)) if (low.includes(String(e).toLowerCase())) fail(`did not expect "${e}"`);
      const st = await page.evaluate(() => ({ score: window.dixon.score(), room: window.dixon.state.room, money: window.dixon.state.money, turns: window.dixon.state.turns }));
      if (step.score !== undefined && st.score !== step.score) fail(`score ${st.score}, expected ${step.score}`);
      if (step.room !== undefined && st.room !== step.room) fail(`room ${st.room}, expected ${step.room}`);
      if (step.money !== undefined && st.money !== step.money) fail(`money ${st.money}, expected ${step.money}`);
      if (step.turns !== undefined && st.turns !== step.turns) fail(`turns ${st.turns}, expected ${step.turns}`);
      if (errors.length) fail(`page error: ${errors[0]}`);
      await domChecks();
    }
    passed++;
    console.log(`  pass  ${label}`);
  } catch (e) {
    failed++;
    console.log(`  FAIL  ${label}\n    ${e.message}`);
  } finally {
    await context.close();
  }
}

async function runPhrases(ch, file) {
  const chapter = yaml.load(fs.readFileSync(path.join(dataRoot, ch, 'chapter.yaml'), 'utf8'));
  const { page, context } = await openGame();
  const problems = [];
  let count = 0;
  for (const rid of asList(chapter.rooms)) {
    const room = yaml.load(fs.readFileSync(path.join(dataRoot, ch, 'rooms', `${rid}.yaml`), 'utf8'));
    await page.evaluate(r => window.dixon.setup({ room: r }), rid);
    for (const a of asList(room.actions)) {
      for (const p of asList(a.phrases)) {
        const phrase = String(p).replace('{n}', '100');
        const got = await page.evaluate(t => window.dixon.match(t), phrase);
        count++;
        if (got !== a.id) problems.push(`${rid}: "${phrase}" reaches ${got || 'nothing'}, not ${a.id}`);
      }
    }
  }
  // Every exit, by every one of its names, in several common shapes.
  let exits = 0;
  for (const rid of asList(chapter.rooms)) {
    const room = yaml.load(fs.readFileSync(path.join(dataRoot, ch, 'rooms', `${rid}.yaml`), 'utf8'));
    await page.evaluate(r => window.dixon.setup({ room: r }), rid);
    const actionPhrases = new Set(asList(room.actions).flatMap(a => asList(a.phrases)).map(p => String(p).toLowerCase()));
    for (const e of asList(room.exits)) {
      if (!e.to) continue;
      const names = asList(e.names).map(String);
      const dir = names.includes('down') ? 'down' : names.includes('up') ? 'up' : null;
      const tries = [];
      for (const nm of names) {
        tries.push(`go ${nm}`, nm, `go to the ${nm}`, `walk ${nm}`);
        if (dir && /stair|step/.test(nm)) tries.push(`go ${dir} ${nm}`, `go ${dir} the ${nm}`, `climb ${dir} the ${nm}`, `take the ${nm}`, `walk ${dir} the ${nm}`);
      }
      if (dir) tries.push(`${dir}stairs`, `go ${dir}stairs`, `go ${dir}`);
      for (const t of tries) {
        if (actionPhrases.has(t)) continue;   // a puzzle action owns this phrasing here
        const got = await page.evaluate(x => window.dixon.exitFor(x), t);
        exits++;
        if (got !== e.to) problems.push(`${rid}: "${t}" leads to ${got || 'nothing'}, not ${e.to}`);
      }
    }
  }
  count += exits;
  await context.close();
  const label = `${file} › every phrasing reaches its action or exit (${count})`;
  if (problems.length) { failed++; console.log(`  FAIL  ${label}\n    ${problems.join('\n    ')}`); }
  else { passed++; console.log(`  pass  ${label}`); }
}

for (const ch of fs.readdirSync(dataRoot).filter(d => /^ch\d+$/.test(d))) {
  const dir = path.join(dataRoot, ch, 'tests');
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.yaml')).sort()) {
    const doc = yaml.load(fs.readFileSync(path.join(dir, f), 'utf8'));
    const file = `${ch}/tests/${f}`;
    if (doc.phrases && file.includes(filter)) await runPhrases(ch, file);
    for (const t of asList(doc.tests)) if (`${file} ${t.name}`.includes(filter)) await runSteps(t, file);
  }
}

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
