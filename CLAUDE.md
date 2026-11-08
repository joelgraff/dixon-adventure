# The Dixon text adventure

- The game is play.html + play.js, playing the data in game-data
  (format: game-data/FORMAT.md). index.html sends visitors to play.html;
  prototype.html is the old prototype, kept for reference.
- Every push that changes the game bumps its version:
  `cd game-data/tools && npm run bump -- patch "what changed"` (minor for
  features). No releases or tags. Rules: game-data/CHANGELOG.md.
- Before pushing: `npm run check` and `node test.mjs` in game-data/tools.
- Every new historical claim gets an entry in game-data/sources.yaml.
- Prose: narration in complete, flowing sentences, never strings of fragments. Dialogue follows each character's voice sheet in game-data/VOICES.md. Rules: "Prose" in skill/references/interaction-design.md.
