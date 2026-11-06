# Changelog
## 2026-11-03
- Ogee now remembers the player's first conversation; speaking to him again acknowledges their return instead of repeating his introduction.
- Ogee's landing prose no longer repeats "man"; unknown-topic replies no longer direct the player to parser categories, and his ferry-price answer is more conversational. Added NPC knowledge-depth and historical-accuracy design guidance.
- Rephrased Ogee's work offer as conversational speech while keeping the freight, pay, and likely workload clear.
- Removed parenthetical parser instructions from Ogee's and Dixon's dialogue; their work and ferry offer remain discoverable from the conversation, while explicit commands remain available through requested help.
- Social-flow guidance now states the general principle: conversation and interaction should follow common real-life behavior, including natural greetings and leave-taking.
- Ogee's introduction is now a single natural exchange ("I'm Joseph Ogee. I run this ferry"), avoiding the repetitive scripted "Name's Ogee. Joseph Ogee" and preventing premature name attribution before the introduction.
- Ogee's first appearance now identifies him only as a man/the ferryman; his name becomes known through his introduction or first conversation.
- Riverfront transition: the grooves are described as impressions pressed into the silt, with weathered edges but freshly disturbed earth; replaced the invisible phone flicker with an environmental sound cue. Narration can still describe offscreen details when they serve the scene.
## 2026-11-02
- Riverside marker: the sanded line is a repair clue. After Dixon buys the ferry the marker is headed DIXON'S FERRY and the line reads whole ("the crossing that named a town"); this also pays off Margaret's "the marker's missing a line". "smaller type" and similar words now resolve to the patch.
- Pickup bumper sticker: the older sticker underneath (DIXON'S FERRY DAYS) can now be peeled back and read, so the hint is actionable; added the "noticed details" rule to interaction-design.md.
- `examine path` / `north` / `south` on highlighted exit words now gives a short description of that way; the locked desk drawer is available from the start (`open drawer` works without examining the desk first).
- 4:17 easter egg: a schoolhouse clock in the museum (stopped at 4:17 in the broken present, running after the repair) and a live phone clock after the repair.
- Polish: the guestbook is always available (named in the room text, no need to examine the desk first); `think` shows money only in 1830; after the repair, Margaret closes the first chapter ("I've a feeling the next puzzle won't be so easy") and `help` says so.
- New-player playtest fixes: Dixon and Ogee now state the goal and teach `haul` / `give` in their greetings; `work`, `carry kegs`, `take the job` and `yes` (at the landing) all haul; `look at water` and `listen` advance the fog sequence; `swim`/`wade` at the water's edge use the wade line; full direction words (north, down...) work and say "You can't go that way" when blocked; new contextual `help` / `hint` command; quick buttons gain wait, listen and help.
- After the first return from 1830, "go to museum" (also "back to the museum", "museum") takes you straight back from the water's edge or the riverfront; the return text mentions it.
- Revisiting 1830 after Dixon buys the ferry: Ogee is gone, a hired hand runs the landing, the landing is renamed Dixon's, the ferry is no longer for sale; `give Dixon` without an amount prompts; `listen` accepts state-dependent text.
- Broken-present premise implemented: the opening town is "Ogee's Landing" (museum name, panel, marker and Reagan plaque change to Dixon once fixed); Margaret's crossword (seven down: "Founder of the ferry town") is her tell and mission; she points you to the river.
- 1830 reworked: Dixon has $260 but a downriver speculator pushed Ogee's price to $360, so Dixon is $100 short. Earn it by hauling and `give Dixon $N` (or `give Dixon all`); buying the ferry yourself ($360) is the failed fix, which leaves the present worse and rewinds 1830 on the next visit. The ridge claim is optional (Dixon warns once before the deal ends the chapter). No deadline, no timer.
- Design docs only (no game changes yet): broken-present premise, Margaret as mission-giver, fog as the only travel mechanism, wrongness ledger. Updated `story-spine.md` and `references/future-hooks.md`.
- History alignment: the land office clerk is now a surveyor laying out the Galena road who writes up claims (no government land sales until the 1830s migration); the museum shows a surveyor's claim receipt; Eli is a young teamster bound for the Galena diggings; added lead wagons at Ogee's landing, an Ogee's Ferry mail pouch at Dixon's post, and a topic on Dixon's family of seven; NPC prompts use display names.
- Ogee, Dixon, the clerk and `price` now acknowledge what you have already bought (ferry or ridge plot) instead of repeating the sales pitch.
- 1830 anachronisms removed (chapter stays in 1830, since the panel, marker and ferry sale all depend on it): Dixon now talks about the Sauk and Fox and Saukenuk, and treats 1832 as two years off; Eli's father died in the 1827 Winnebago trouble, and his rifle is a flintlock; Dixon "came up this spring".
- Land price matches the government rate: thirty-two acres for forty dollars at $1.25 an acre.
- Hauling names whoever is present (Ogee at his landing, Dixon on the far bank) and is blocked in the chapter-end fog.
- Clicking a highlighted exit word ([path], [north], [south]) now walks that way instead of failing to examine it (only with click-to-examine on).
- Playtest fixes: the empty museum case now matches the changed exhibit panel (brass ferry token) after the chapter; inventory shows 1830 money only while in 1830; `haul` has varied lines and accepts `haul week` / `haul N` (max 6); the ferry price message mentions hauling; `go water` gives a nudge during the fog build-up and after the planks appear. Re-entering 1830 after the ending stays allowed.
## 2026-11-01
- Demo redesign: scrollback instead of clearing, prose rooms, gradual museum-to-1830 transition with fog, `?scene=` test param, lighthouse removed from the demo
- Progressive discovery (`hidden`/`reveals`), per-object verbs, topic-based `ask` for every NPC, Margaret present from the start
- Added `references/interaction-design.md`; updated parser rules and evals
- Playtest feedback applied: removed vague cues, folded the pen into the guestbook, window no longer shows the river, randomized guestbook entries, desk with a locked drawer
## 2026-10-31
- Initial skill creation: play and design modes for Dixon Sierra-style text parser adventure
- Added lighthouse prototype scene card, parser rules, design principles, and Dixon scene spine as references
- Spoken lines are attributed to the speaker; added pleasantries (thanks, hello, goodbye, how are you, sorry)
- Museum renamed Dixon Historic Center (205 W 5th St); added `references/future-hooks.md`
- Real geography: residential street, courthouse and police station, three downtown blocks, river four blocks north; Margaret introduces herself naturally and suggests signing the guestbook
- Added a looked-at sidebar (per-scene, expandable notes of examined things)
- Added a Settings panel: sidebar toggle and optional click-to-examine highlights, saved in localStorage
- Leaving or re-entering a room now includes in-character farewells and greetings
- Mobile layout: full-height flex layout on narrow screens, 16px input (no iOS zoom), safe-area padding, and a touch-only quick-command row (look, compass, up/down, examine/talk/ask prefixes, inventory)
- Water's edge transition reworked: fog builds from examining, looking at the water shifts concrete to planks, the next look around shows 1830 and Ogee's voice, answering it crosses over
- Return from 1830 is gated: the east fog only returns once both land and ferry are bought; stairs run north/south
- 1830 geography fixed: ferry landing on the south bank, far bank is north, cabins path south. Chapter end (land and ferry bought) rolls fog in anywhere; moves are blocked and Ogee guides the player back
- Highlight setting (Key only / All with two colors / Off); key items listed first with a star in the sidebar
