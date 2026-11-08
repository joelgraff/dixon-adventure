# Sierra Parser Renderer — Planning

Branch: sierra-parser (forked from spec, 2026-10-20).
Goal: a Sierra-style 2.5D parser implementation of the Dixon model, drawing on the dated canon layer in docs/spec.

## Design principles (from conversation)

- The 3D model is the compiler, not the runtime. One structured export — buildings, roads, terrain, landmarks, interiors — feeds multiple front ends.
- Fixed scene sequence (Gold Rush / King's Quest 4 model), but inside each scene the player can try any verb against any canon object and get a real response, including failure that costs something.
- Verb freedom is the replay lever inside a linear spine. Not Mad Libs — consequences compound across scenes via the dated canon.
- Forks are one-shot: diverge at a decision point, play the branch, forced reconvergence at a load-bearing event. Tree never grows past depth one.
- Load-bearing events happen not because causally inevitable but because the game needs them (e.g., Billy Sunday revival as reconvergence even in a Smith-goes-to-Missouri fork).
- Post-scene dossier: period newspaper or historian's note summarizing what shifted. Doubles as canon documentation.
- Legacy/bloodline system: a saved life in one scene (e.g., Truesdell survivor) reappears as descendants across later scenes.
- Crisis states (active / resolved / aftermath) as a schema field alongside from-year / to-year.

## Proposed architecture

### 1. Data layer

- Read canon JSON (buildings, roads, landmarks, interiors) filtered by scene date and crisis state.
- Each scene gets a manifest: which canon entries are live, which NPCs are present, which objects are interactive, transient state overrides (bridge broken, river rising).
- Style vocabulary from docs/spec/style_vocabulary.md drives how buildings are drawn at 320x200.

### 2. Parser core

- Verb-noun grammar over the scene's interactive object set.
- Out-of-world verbs (look, inventory, save) vs in-world verbs (take, use, open, tie, examine).
- Failure responses are authored per object-verb pair; success responses may mutate scene state (which feeds the dossier).
- Text-first prototype: no rendering, just the parser answering questions about one moment. Prove the mechanic before visuals.

### 3. Rendering layer (later)

- Fixed camera per room/location, rendered from the 3D model at SCI resolution with dithered palette.
- Priority buffer and walk mask derived automatically from depth and ground data.
- 2.5D sprites for NPCs and interactive objects composited over the background.

### 4. Scene list (spine)

1. John Dixon settling (founding era)
2. Truesdell Bridge collapse, May 4 1873 (crisis state test)
3. Joseph Smith arrest, June 1843 (agency test — side with officers or warn Smith)
4. Reagan lifeguard years (coming-of-age)
5. Walgreens founding (civic growth)
6. Druggist murder, July 24 1968 (aftermath test)
7. Billy Sunday revival, 1905 (load-bearing reconvergence)
8. Sterling-Dixon Interurban (transport/entry test)

### 5. Open questions

- How deep should verb vocabulary go before it becomes unmanageable?
- Should the dossier be optional (player can skip) or mandatory?
- How to represent quiet absences in alternate-history forks (a surname that shouldn't be there)?
- Crisis-state schema: extend canon.schema.json or separate file?

## Next steps

- [ ] Lock the scene manifest format
- [ ] Write the Truesdell scene as pure text prototype
- [ ] Define the verb list for scene 1
- [ ] Decide crisis-state schema placement
