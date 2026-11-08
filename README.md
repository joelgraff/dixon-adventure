# Dixon: a text adventure

A Sierra-style text parser adventure set in Dixon, Illinois. You start in
the present day at the Dixon Historic Center, where the founding panel ends a
line short, and the fog at the river takes you back to put history right.
Chapter 1 is Ogee's ferry in the spring of 1830.

Play it by opening `play.html` (`index.html` redirects there). Everything
runs in the browser; the game is the data in `game-data/`.

## Layout

- `play.html`, `play.js`: the page and the engine.
- `game-data/`: the game itself (rooms, people, puzzles, tests), in YAML.
  The format is in `game-data/FORMAT.md`, the versioning rules and history in
  `game-data/CHANGELOG.md`, how each character talks in
  `game-data/VOICES.md`, and the historical sources in
  `game-data/sources.yaml`.
- `game-data/tools/`: the checker, the playthrough tests, the version bump
  and the video tour.
- `skill/`: design notes: the story spine, the museum, interaction design,
  planted hooks for later chapters (`skill/references/future-hooks.md`),
  research and the chapter 2 outline.
- `archive/sierra-parser/`: early design notes.
- `prototype.html`: the old prototype, kept for reference.

## Working on it

```sh
cd game-data/tools
npm install
npm run check        # validates the data
node test.mjs        # plays every test script in a headless browser
npm run bump -- patch "what changed"   # every push that changes the game
```

See `CLAUDE.md` for the house rules.

## History

The game grew up inside [joelgraff/dixon_dem](https://github.com/joelgraff/dixon_dem),
the 3D model of Dixon, under its `docs/` folder. It moved here with its
history in November 2026. The 3D world, its pipeline and the building
references (including the Lincoln statue and Fort Dixon notes) stay there.
