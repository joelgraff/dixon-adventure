# The Dixon text adventure (docs/)

- The game is docs/play.html + docs/play.js, playing the data in docs/game-data
  (format: docs/game-data/FORMAT.md). docs/index.html sends visitors to play.html;
  docs/prototype.html is the old prototype, kept for reference.
- Every push that changes the game bumps its version:
  `cd docs/game-data/tools && npm run bump -- patch "what changed"` (minor for
  features). No releases or tags. Rules: docs/game-data/CHANGELOG.md.
- Before pushing: `npm run check` and `node test.mjs` in docs/game-data/tools.
- Every new historical claim gets an entry in docs/game-data/sources.yaml.
- Prose: narration in complete, flowing sentences, never strings of fragments. Dialogue follows each character's voice sheet in docs/game-data/VOICES.md. Rules: "Prose" in docs/skill/references/interaction-design.md.
