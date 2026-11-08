// Bumps the game version everywhere it appears, and starts a changelog entry.
//   npm run bump -- patch "what changed"      (or minor / major)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = path.resolve(here, '..');
const files = {
  game: path.join(data, 'game.yaml'),
  page: path.resolve(data, '..', 'play.html'),
  log: path.join(data, 'CHANGELOG.md'),
};
const [level = 'patch', ...noteWords] = process.argv.slice(2);
const note = noteWords.join(' ').trim();
if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('Usage: npm run bump -- patch|minor|major "what changed"');
  process.exit(1);
}
const game = fs.readFileSync(files.game, 'utf8');
const m = game.match(/^version:\s*(\d+)\.(\d+)\.(\d+)\s*$/m);
if (!m) { console.error('No version: line in game.yaml'); process.exit(1); }
let [maj, min, pat] = m.slice(1).map(Number);
if (level === 'major') { maj++; min = 0; pat = 0; } else if (level === 'minor') { min++; pat = 0; } else pat++;
const old = `${m[1]}.${m[2]}.${m[3]}`;
const next = `${maj}.${min}.${pat}`;

fs.writeFileSync(files.game, game.replace(/^version:.*$/m, `version: ${next}`));
const page = fs.readFileSync(files.page, 'utf8');
fs.writeFileSync(files.page, page.replace(/play\.js\?v=[\d.]+/, `play.js?v=${next}`));
const log = fs.readFileSync(files.log, 'utf8');
const today = new Date().toLocaleDateString('en-CA');   // local date, YYYY-MM-DD
const entry = `## ${next} (${today})\n- ${note || 'Describe this change.'}\n\n`;
fs.writeFileSync(files.log, log.replace(/^## \d+\.\d+\.\d+/m, h => entry + h));
console.log(`${old} -> ${next}. Updated game.yaml, play.html and CHANGELOG.md.`);
