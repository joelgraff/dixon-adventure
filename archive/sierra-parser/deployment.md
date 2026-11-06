# Deployment: SCICompanion → ScummVM Web (HTML5)

## Authoring

SCICompanion is the IDE: open-source, Windows, writes SCI syntax, builds rooms, defines objects and verbs, compiles to Sierra-compatible game volumes. Covers AGI and SCI 0 through SCI 1.1 — the Gold Rush through Space Quest 3 era. Alternative is a custom interpreter in Python or C#, but that's months replicating verb-noun dispatch, resource management, and the script compiler SCICompanion gives for free.

## HTML5 shipping

SCICompanion only ships Windows executables needing DOSBox or ScummVM. For HTML deployment: ScummVM's Emscripten build compiles the SCI engine to WebAssembly as a single browser page — proven with existing demos. AGILE (agi.sierra.games) is a from-scratch AGI interpreter in native JavaScript but AGI-only, not SCI.

So: author in SCICompanion, ship through the ScummVM web target. Do not try to make SCICompanion itself web-aware.

## Export contract from the 3D model

SCI doesn't ingest meshes. It uses bitmaps: a background picture, a priority screen (layering and walkability), and a control screen (triggers). The export step is a rendering pass:

1. Fixed camera from the 3D world at SCI resolution with the right palette.
2. Derive the priority map automatically from depth and elevation buffers.
3. Walk mask from ground geometry.
4. Hotspots for interactive objects placed from the canon index using screen-space coordinates from that same render.

One camera angle per room, one background per angle. That's the whole contract between the 3D model and the Sierra renderer.

## Open questions

- Palette: fixed 256-color SCI palette per era, or dynamic?
- Does the web target need save-game support in v1?
