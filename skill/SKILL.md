---
name: dixon-parser
description: "Play and design the Dixon Sierra-style text parser adventure. Use when starting a scene, examining historical moments, responding to look/examine/go commands, creating or editing scene cards, managing threads, or discussing the 1830s ferry prototype and later Dixon events."
type: workflow
lifecycle: active
---

# Dixon Parser — Sierra-Style Text Adventure

Interactive text-parser playthroughs and design sessions for the Dixon historical adventure, modeled on mid-80s Sierra SCI games (King's Quest 4, Space Quest 3, Gold Rush). Fixed scene spine with verb freedom inside each moment. Threads run to natural exhaustion. One-shot forks with forced reconvergence. Post-scene dossiers. Legacy bloodlines.

## Modes

### Play Mode
Start or continue a scene. Respond to commands in the established style: sensory, period-accurate, no anachronisms, written in full sentences (see "Prose" in references/interaction-design.md). Brevity means saying less, not chopping sentences into fragments. Use the active scene card as the dictionary. Always clarify ambiguity rather than guess. Informational failures ("the rope is too short") not bare "you can't."

**Core commands to support:**
- look around / look [direction] / look at|out|through|in [object]
- examine [object] (aliases via scene card; examining can reveal new nouns)
- go [direction/exit], or just the exit's name
- talk to [npc], ask [npc] about [topic], ask about [topic]
- natural object verbs: sign, read, sit, touch, push, open, climb, smell, search, board, call
- take / use (where defined)
- wait, listen, think (soft in-fiction recap, replaces `goals`), inventory

**Playable web demo:** Starts in the present-day museum. The player is led by curiosity and Margaret's remarks to the river walk, where fog builds over several turns before the 1830 ferry landing opens. The exit from 1830 leads back through the fog and on foot to the museum, where changes are visible. `../index.html` is the GitHub Pages entry point; `dixon-parser.html` redirects to it. `?scene=<id>` starts in any scene for testing. The lighthouse cottage is not part of the demo at present; its card remains in `references/lighthouse-scene.md`.

Feel and pacing rules for the demo are in `references/interaction-design.md`.

**Dixon spine scenes** (to be expanded): 1830 Ogee ferry / Dixon arrival, 1843 Joseph Smith arrest, 1873 Truesdell collapse, etc. Load relevant historical notes from references when a scene is active.

### Design Mode
Create or edit scene cards, define threads, update canon notes, sketch forks and reconvergence points. Scene cards use the six-field format: Location, Era, Sensory Details, Interactive Objects (with aliases), Entry/Exit Points, Planted Hook.

When editing, propose the updated card in full and confirm before treating it as canonical.

## Parser Rules
- Scene card is the runtime dictionary. Nouns resolve against its object list + aliases.
- Fuzzy match with clarification on ambiguity (default).
- Verb softening via synonym table (get/grab → take, check/inspect → examine).
- 40-character input buffer constraint: tolerate truncation.
- Threads: a line of interaction that runs to a clear end, then waits. Multiple open, pull one at a time.
- Abandoned threads leave scars (world slightly colder later) rather than hard blocks.

## Resources
- `references/future-hooks.md` — running ledger of planted details and ideas to reuse; update it whenever a hook is added
- `references/interaction-design.md` — pacing, progressive discovery, natural verbs, conversation, future hooks
- `references/lighthouse-scene.md` — active prototype scene card
- `references/parser-rules.md` — full matching layers and failure categories
- `references/design-principles.md` — forks, dossiers, bloodlines, load-bearing events
- `references/dixon-spine.md` — proposed historical scene list
- `museum-gauge.md` — present-day start, return, and visible historical changes
- `story-spine.md` — intended scene sequence and player role

Load the relevant reference when entering a mode or starting a specific scene.
