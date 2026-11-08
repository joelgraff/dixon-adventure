# Legacy Bloodline System

One saved life becomes a bloodline the player keeps encountering across scenes. A kid pulled from the river in 1873 shows up as a young adult during the 1905 Billy Sunday revival, maybe runs the trolley in the interurban years, and their grandchild is in the drugstore in 1968.

## Real-world prototype: the Wadsworth–Goble line

Tom Wadsworth is a direct descendant of Christan Goble — the grandmother who threw three-year-old Gertie to safety before drowning in the 1873 collapse. Gertie survived, stayed in Dixon, died in 1944. Wadsworth gave the Founders Day talk on the collapse AND posted the firsthand 1968 Villiger shooting account. One family thread spanning 95 years. The legacy system you were describing is already real in Dixon's record.

## Other cross-decade threads

- Henry Noble: lost wife Jane in 1873, became Dixon mayor in 1890.
- Eustace Shaw: 16 when he rescued victims, grew up to be associate editor of the Dixon Telegraph.
- John Thiel: great-nephew of Bloody Gulch victim Frank Thiel, presenting at Founders Day 2016 wearing the confiscated watch chain.
- Villiger name: Joe Senior arrived with George Page's Swiss milk workers in the 1880s, through Joe Junior's drugstore, to Tom Villiger buried in Dixon as recently as 2023.

## Implementation notes

- Each canon entry gets optional `bloodline_id` and `generation` fields.
- The legacy graph is a separate small schema: ancestor → descendant edges with scene appearances.
- A saved NPC in a crisis scene writes a `survived: true` flag that downstream scenes read.
- Unsaved NPCs get `survived: false` — their absence is the quiet storytelling.

## Open questions

- Cap on active bloodlines per playthrough to keep the tree readable?
- Do unsaved bloodlines ever reappear as NPCs in later scenes, or only as absences?
