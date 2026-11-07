// Films a captioned tour of docs/play.html: every part of the screen and every
// setting, with a gold outline on whatever the caption describes.
//   npm run tour             full video  -> tools/out/dixon-ui-tour-v<version>.mp4
//   npm run tour -- preview  one still per scene (quick check of the look)
//
// Needs Playwright with Chromium (see test.mjs) and ffmpeg on the PATH. Without
// ffmpeg it keeps the frames in tools/out/tour-frames and says so.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const require = createRequire(import.meta.url);
let chromium, devices;
try { ({ chromium, devices } = require('playwright')); } catch (e) {
  console.error('Playwright is not installed. Run: npm install playwright && npx playwright install chromium');
  process.exit(2);
}

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, '..', '..');
const out = path.join(here, 'out');
const framesDir = path.join(out, 'tour-frames');
const PREVIEW = process.argv.includes('preview');
const version = yaml.load(fs.readFileSync(path.join(docs, 'game-data', 'game.yaml'), 'utf8')).version;
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.yaml': 'text/yaml', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const p = url.startsWith('/__tour/') ? path.join(framesDir, url.slice(8)) : path.join(docs, url);
  fs.readFile(p, (e, d) => {
    if (e) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    res.end(d);
  });
});
await new Promise(r => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;
const base = `${origin}/play.html`;

// The caption bar and outline drawn over the page. The page's panels are
// shortened a little so the captions sit in clear space below them.
const CSS = `
#tour-cap { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); max-width: 1040px;
  background: rgba(10,12,14,.92); color: #f3efe4; font: 500 23px/1.35 system-ui, -apple-system, "Segoe UI", sans-serif;
  padding: 14px 22px; border-radius: 10px; border: 1px solid #f0c060; z-index: 99; text-align: center;
  box-shadow: 0 6px 24px rgba(0,0,0,.5); }
#tour-cap:empty { display: none; }
#tour-box { position: fixed; border: 3px solid #f0c060; border-radius: 10px; z-index: 98; pointer-events: none;
  box-shadow: 0 0 0 9999px rgba(0,0,0,.28); }
#tour-box.off { display: none; }
#output { height: 390px !important; } #notes { height: 220px !important; }
#histories:not(:empty) { max-height: 185px !important; }`;

const scenes = [];
let page;
let n = 0;
const scene = () => scenes.push([]);
async function prep() {
  await page.addStyleTag({ content: CSS });
  await page.evaluate(() => {
    for (const id of ['tour-cap', 'tour-box']) {
      if (!document.getElementById(id)) { const d = document.createElement('div'); d.id = id; document.body.appendChild(d); }
    }
  });
}
async function open(query) {
  await page.goto(`${base}?${query}`);
  await page.waitForFunction(() => window.dixon);
  await prep();
}
async function cap(text, sel, { label = false } = {}) {
  await page.evaluate(([t, s, lab]) => {
    document.getElementById('tour-cap').textContent = t;
    const box = document.getElementById('tour-box');
    let el = s && document.querySelector(s);
    if (el && lab) el = el.closest('label');
    if (!el) { box.className = 'off'; return; }
    const r = el.getBoundingClientRect();
    box.className = '';
    Object.assign(box.style, { left: `${r.left - 6}px`, top: `${r.top - 6}px`, width: `${r.width + 12}px`, height: `${r.height + 12}px` });
  }, [text, sel, label]);
}
async function snap(seconds) {
  const s = scenes.length - 1;
  if (PREVIEW && scenes[s].length) return;
  const file = path.join(framesDir, `s${String(s).padStart(2, '0')}-${String(n++).padStart(4, '0')}.jpg`);
  await page.screenshot({ path: file, type: 'jpeg', quality: 92 });
  scenes[s].push({ file, seconds });
}
async function type(cmd, hold) {
  await page.click('#cmd');
  for (const ch of cmd) { await page.keyboard.type(ch); if (!PREVIEW) await snap(0.055); }
  await snap(0.35);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(60);
  await snap(hold);
}
const settingsOpen = () => page.click('#gear');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page = await context.newPage();
await open('fresh&seed=3');

scene(); await cap(`Dixon ${version}: a quick tour of the game page, play.html`); await snap(3.5);
scene(); await cap('The top bar: the game, its version, where you are, and your score.', '#bar-top'); await snap(4.5);
scene(); await cap('The story. Every reply is added to this log; nothing is cleared, so you can scroll back.', '#output'); await snap(4.5);
scene(); await cap('Type commands here, Sierra-style, up to 40 characters. Enter or the button sends them.', '#bar'); await type('look at the panel', 3.2);
scene(); await cap('People go by a description until they introduce themselves.', '#output'); await type('talk to volunteer', 4.5);
scene(); await cap('The inventory panel lists what you are carrying, and any silver. Click an item to look at it.', '#inventory'); await snap(4.2);
scene(); await page.click('#notes summary');
await cap('The looked-at sidebar lists what you have examined, by place. Click an entry to reread it.', '#notes'); await snap(4.8);
scene(); await cap('Settings are behind this button. Your browser remembers them.', '#gear'); await snap(3);
await settingsOpen(); await cap('Settings are behind this button. Your browser remembers them.', '#settings'); await snap(3.2);
scene(); await page.selectOption('#opt-hl', 'key');
await cap('Highlighted words: Off by default. "Key items only" marks what moves the story, in blue.', '#opt-hl', { label: true }); await snap(4.5);
scene(); await page.selectOption('#opt-hl', 'all'); await settingsOpen();
await cap('"All" adds minor, look-at-only things in tan.', '#output'); await snap(4.2);
scene(); await settingsOpen(); await page.check('#opt-clicks');
await cap('Clickable words, off by default: click a highlighted word to look at it.', '#opt-clicks', { label: true }); await snap(3.5);
await settingsOpen(); await cap('Clickable words, off by default: click a highlighted word to look at it.', '#output'); await snap(1.5);
await page.click('#output .noun[data-noun="crossword"] >> nth=-1'); await page.waitForTimeout(60); await snap(3.6);
scene(); await settingsOpen(); await page.check('#opt-histories'); await settingsOpen();
await cap('The histories panel, off by default, lists the sources behind this place.', '#histories'); await snap(4.2);
await page.evaluate(() => { const h = document.getElementById('histories'); h.scrollTop = h.scrollHeight; });
await cap('Below the sources, each detail here is marked as record, disputed, a guess, or invented.', '#histories'); await snap(4.8);
scene(); await settingsOpen(); await page.uncheck('#opt-sidebar'); await settingsOpen();
await cap('The looked-at sidebar can be switched off. The histories panel stays while it is on.', 'aside'); await snap(3.8);
await settingsOpen(); await page.check('#opt-sidebar'); await settingsOpen();
scene(); await cap('Stuck? "help" gives a hint for where you are. "score" and "version" work anywhere.', '#output');
await type('help', 3); await type('score', 2.6);
scene(); await open('scene=riverwalk&seed=3');
await cap('Reckless acts can kill you, Sierra-style.', '#output'); await type('jump over railing', 3.8);
await cap('Retry puts you back one move earlier. Restore loads your saved game; Restart begins again.', '#output'); await type('retry', 3.8);

// The phone layout, shown as a phone-sized screenshot beside a caption.
scene();
const phone = await browser.newContext({ ...devices['iPhone 13'] });
const pp = await phone.newPage();
await pp.goto(`${base}?scene=landing&seed=3`);
await pp.waitForFunction(() => window.dixon);
for (const c of ['talk to man in buckskin', 'look at canoe']) await pp.evaluate(cmd => window.dixon.command(cmd), c);
await pp.screenshot({ path: path.join(framesDir, 'phone.png') });
await phone.close();
fs.writeFileSync(path.join(framesDir, 'phone.html'), `<!doctype html><html><body style="margin:0;background:#0d0f10;width:1280px;height:720px;display:flex;align-items:center;justify-content:center;gap:60px;font-family:system-ui,sans-serif"><img src="phone.png" style="height:660px;border-radius:28px;border:6px solid #2a2e30"><div style="color:#f3efe4;font-size:30px;line-height:1.4;max-width:560px">On a phone the layout stacks: story first, then the command line, a row of quick-command buttons, and the panels.</div></body></html>`);
await page.goto(`${origin}/__tour/phone.html`); await snap(5.5);

scene(); await open('seed=3');
await cap('Progress and settings stay in your browser. Add ?fresh to the address to start over.'); await snap(4.5);

await browser.close();
server.close();
const total = scenes.flat().reduce((a, f) => a + f.seconds, 0);
console.log(`${scenes.length} scenes, ${scenes.flat().length} frames, ${total.toFixed(1)} s`);
if (PREVIEW) { console.log(`Preview stills: ${framesDir}`); process.exit(0); }

// Encode: one file per scene with identical settings, then join them losslessly.
if (spawnSync('ffmpeg', ['-version']).status !== 0) {
  console.log(`ffmpeg not found; the frames are in ${framesDir}`);
  process.exit(0);
}
const work = path.join(out, 'tour-scenes');
fs.rmSync(work, { recursive: true, force: true });
fs.mkdirSync(work, { recursive: true });
const ff = args => {
  const r = spawnSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
  if (r.status !== 0) { console.error('ffmpeg failed'); process.exit(1); }
};
const parts = [];
scenes.forEach((frames, i) => {
  const list = path.join(work, `list${i}.txt`);
  fs.writeFileSync(list, frames.map(f => `file '${f.file}'\nduration ${f.seconds.toFixed(3)}\n`).join('') + `file '${frames.at(-1).file}'\n`);
  const tmp = path.join(work, `tmp_${i}.mp4`);
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-vf', 'fps=30,format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', '30', tmp]);
  const done = path.join(work, `scene_${String(i).padStart(2, '0')}.mp4`);
  fs.renameSync(tmp, done);
  parts.push(done);
});
const all = path.join(work, 'all.txt');
fs.writeFileSync(all, parts.map(p => `file '${p}'\n`).join(''));
const video = path.join(out, `dixon-ui-tour-v${version}.mp4`);
const tmpVideo = path.join(out, 'tmp_tour.mp4');
ff(['-f', 'concat', '-safe', '0', '-i', all, '-c', 'copy', '-movflags', '+faststart', tmpVideo]);
fs.renameSync(tmpVideo, video);
fs.rmSync(work, { recursive: true, force: true });
console.log(`Tour: ${video}`);
