# Future Hooks and Planted Details

A running ledger of ideas and planted details to reuse as new scenes and the present-day/past travel are built. Add to it whenever the user suggests something for later or a scene plants a detail. Each entry says where it lives now and what it could become. Nothing here is committed canon until it is built.

## From user suggestions
- **Locked middle drawer in the museum desk** (Dixon Historic Center, 205 W 5th St). The desk came from the old county clerk's office. Margaret mentions it only in passing, as the one drawer that doesn't open, and says she's always wondered what's in it. User idea: something hidden in it, to be found later when no one is around. Candidates: a key that fits the empty case or another lock, a clerk's record that reflects the player's changes, a document that only exists after a certain era is altered. Needs a key or another way in, and a time when Margaret isn't at the desk.
- **Guestbook**: random entries on each read, more after 1830. Later: entries that change between visits, entries from people the player met in the past (bloodlines), the player's own signature persisting and being referenced by Margaret or later scenes.
- **Local geography** (fixed): residential blocks around the Center, then police station and courthouse at the end of the next block north, then three blocks of downtown, then the river four blocks north. Downtown storefronts, the courthouse and the police station are available for later present-day scenes and for era changes.
- **Window** is deliberately dull. Do not use it to show the river. It may later show the street changing if historical changes alter the town.

## Planted in the museum (present day)
- **Empty case at the end of the row**: dusted weekly by Margaret, no card. A future change could fill it. Key to the case locks is with the board.
- **Pedestal ring**: a perfect ring pressed into the velvet. The 1830 ferry pole shoe is the object it waits for. Currently placed when both land and ferry are acquired; could be earned differently.
- **Pedestal card**: "ask Margaret", half erased in pencil. Someone, perhaps Margaret herself, once wondered.
- **Empty photo frames (last two)**: filled after the return from 1830 depending on what the player did. Later eras can fill other frames.
- **Exhibit panel**: paragraph that ends one line short. Rewritten by changes; the missing sentence is the long-term mystery.
- **Margaret**: continuity character, aware that labels have changed but not why. Her knowledge, tone and topics should grow with the player's changes. Thirty-one years of Saturdays.
- **Hand-lettered sign "ask about the latest labels"** appears after the first return.
- **Phone**: loses signal and clock in the past; safe in the museum.

## Planted on the way to the river
- **Pickup bumper stickers**: a RIVER DAYS COMMITTEE sticker with an older one peeling underneath. Could be a thread about the town's own festival, or about an older version of the town.
- **Bench plate**: "FOR HARRY, WHO KNEW THE RIVER. 1931–2009. it remembers." Harry could be a bloodline figure or a local who knows about the fog.
- **Ringbolt in the river wall**: older than the walk, groove worn by rope. Ties to the ferry; could anchor a later river event or a place to tie a boat.
- **Historical marker with a sanded-off line** ("…ever re…"). Something removed from the public record. Could recover the line from the 1830 side or the museum drawer.
- **Drag-mark ridges at the water's edge**: boat-width grooves that feel both recent and old. Linked to the ferry crossing and the fog.
- **Fog**: the sign that history is near. It appears at the river and thickens over turns. Reusable at other river events and at other thresholds.

## Planted in 1830
- **Pole shoe** on Ogee's ferry pole: the pedestal object.
- **Flood lines** on the dock pilings: four, so Ogee has rebuilt after floods. A later scene can show the dock after a flood.
- **Canoe** with a cracked hull, no paddle. Could be repaired, or turn up in a later scene.
- **Surveyor's map and field book**: the surveyor (in 1830 to lay out the Galena road, replacing Kellogg's trail) writes up claims; there was no land office until the 1830s migration. The map has a question mark at Ogee's landing, "not for sale, not on my map." The field book's last line is dated for a day that hasn't come yet.
- **Wagons at Ogee's landing and the mail pouch at Dixon's post**: Galena lead teams waiting to cross (the only crossing for fifty miles) and an OGEE'S FERRY, ILL. mail pouch. History: Dixon bought Ogee's claim and ferry, moved his family in April 11, 1830, and was commissioned postmaster Sept 29, 1830; the family of seven was nearly the whole population.
- **Dixon**: wants to buy the ferry if Ogee will sell. The player buying it first is the key divergence.
- **Eli**: a young teamster bound for the Galena diggings; his father died on the 1827 Winnebago militia march. A thread for 1832, when Eli could return as a soldier or refugee.
- **Cabin loft**: slept in recently, a grey hair on the pillow. Someone else has been staying in Ogee's cabin. Unresolved.

## Mechanics worth reusing
- `hidden`/`reveals`: things only become targets once discovered.
- Per-object `verbs`: custom replies for natural verbs.
- NPC `topics` with state-dependent answers; topic hits can `reveals` new objects.
- Random-but-persistent entries (guestbook) as a lightweight way to show change.
- Gradual fog threshold: turns spent in a place drive the transition.
- **The riverfront** is a well-developed public campus used for community events: the farmers market, Petunia Festival concerts over the Fourth of July weekend, and smaller gatherings. Tonight it is empty. Useful for later present-day scenes (crowds, stages, booths) and as a contrast with the 1830 bank.
- **Riverfront layout (from user photos):** south bank of the Rock River along River Street, between Peoria Ave (west) and Galena Ave (east). Limestone retaining walls and block seawall, green iron railings, wide curved steps down to the water, a stone-pier pavilion with a shingled roof, cupola and weathervane, a brick-paver plaza with benches and lamp posts, a bronze equestrian statue on a dark granite pedestal with flagpoles and low fountains, a bridge to the west, and a steel transmission tower. Downtown brick buildings face the river. Each is a candidate for era changes (what stood here in 1830) and for later scenes.
- **"Begins the Trail" statue** (195 W River St, Heritage Crossing Riverfront Plaza): bronze Ronald Reagan on a palomino ("Dutch"), by Donald L. Reed, dedicated Aug 14, 2009, commemorating the 1950 Injun Summer Days parade. Reagan lived in Dixon 1920-1933 and lifeguarded on the Rock River at Lowell Park, several miles from the plaza (77 rescues; a plaque is also at Lowell Park). The plaza is not the lifeguard site. Thirteen local donors. In the demo it is a plaque discoverable by examining the statue. Era-change hook: what the statue shows if history shifts.
- **Lower riverwalk (from user photos):** below the stairs is a broad concrete walkway along the water, with a curved limestone retaining wall under the upper railing on one side and a low concrete seawall with a green railing on the other. A bridge crosses upstream, with a steel transmission tower on the bank, and wide stepped terraces run down into the water. In the demo the 1830 bank is the same spot: the concrete becomes planking at the transition, and the drag marks are in silt on the lowest step.

## Broken-present premise (2026-11-02)
The starting present is a timeline where history went wrong. Open decisions are marked **OPEN**.
- **The name:** in the broken present the town is Rolette: Rolette's agent seized the ferry for Ogee's debts, so the crossing took the creditor's name. The wrong fix (your name on the lease) leaves a town with nobody's name, "the Landing". The repair restores Dixon. The variable is `town` in ch1/chapter.yaml.
- **Dixon's alias:** he goes by a different name until the deal is done. **OPEN:** the alias (a different surname, or a nickname).
- **Wrongness ledger** (each item is a clue now and a repair later): the Walgreens pharmacy chain never started (Charles Walgreen's Dixon boyhood, Hazelwood 1929); the Reagan "Begins the Trail" statue missing or different; the arch, theatre and courthouse with wrong names or details; the panel's missing sentence; the sanded line on the marker; the empty frames and case.
- **Margaret as guide:** she knows "things" without knowing why and gives the missions each time the player returns. Her topics track what has been repaired. Everyone else has no memory.
- **Travel:** always the fog at the river. Each era needs its own entry cue. Margaret names the place and the object to look for, not the portal.
- **Guestbook:** signing it is the leaper hook. Later entries from people met in the past (bloodlines) make repairs visible.
- **Player's backstory:** deliberately unexplained (Quantum Leap).
- **Walgreens (decided 2026-11-02, not built):** its own rupture, in the 1890s, separate from the 1830 fix. Charles Walgreen clerked at a Dixon drugstore (Horton's on West First Street, about $4 a week, steered there by a physician) before moving to Chicago in 1893; the break is that the physician's referral never happens, and the repair is one small nudge. Present-day clue: a **ghost sign** (faded painted advertisement, `...ORTON'S DRUG STORE`) on a downtown brick wall, with a stranger, newer layer showing through. Sources disagree on details; verify before using.
- **Scope note:** for now, only the trip to 1830 and the return are built and polished. The rest are plans.
- **4:17 (decided 2026-11-02):** an unexplained easter egg, the minute things broke. Stopped clocks in the broken present read 4:17 (phone in the fog, the museum's schoolhouse clock); each fixed era sets one running again. Never a puzzle, never tied to a specific historical event (no verified times). Built so far: the museum clock (stopped, then running) and the phone, which shows a live time after the repair. Later: a stopped courthouse, theatre or bridge clock per era.


## Travelers, the fog and the desk (planning, 2026-11-08)
Worked out in conversation after chapter 1's story review. **Decided** items are canon for later chapters; **OPEN** items still need a decision. Nothing here is built unless it says so.

### Rules of time (keep these few and fixed)
- **Decided: "not thinking about it" is what travelers say.** Crossing leaves you holding two histories, and the mind copes by not looking. The player already says it ("You decide not to think about that just yet", "…either"); Margaret has thirty-one years of it. Only people who have crossed notice changes; everyone else has only the current history.
- **Decided: nothing comes back.** Clothes, possessions and money stay in the era. What you leave there becomes part of history.
- **Decided: history is the only courier.** An object reaches a later era or the present only by surviving in the past. If something from one era is useful in another, it is brought forward through the museum (or the desk, below), never in your pocket.
- **Proposed: the clue picks the era.** The fog takes you to wherever the thing you bring to the water came from (a ticket; it stays on the bank). This answers why Margaret never got back: what would take her was locked in the drawer, and the key was lost.
- **Guard against sprawl:** each chapter has one break, one ticket, one desk scene and one step on the third traveler's trail.

### The travelers
- **Ogee's count (built):** "You're the third this year." Three travelers reached Ogee's spring of 1830, from different presents: Margaret (1995), a third traveler, and the player (2026).
- **The third traveler (decided to exist; details OPEN):** "The last one had a thing like that" (the phone) means the most recent traveler before the player carried a smartphone, so they crossed between about 2010 and weeks ago. Not Margaret. Could be stuck in another era or chapter; an arc that can surface anywhere. Margaret may have met them and already forgotten. A candidate trace: the guestbook line "'Ask Margaret about the labels.' Nobody has signed it." **Note:** Ogee's goodbye (0.15.0) says "The last one walked out this way too… She held on tighter", so as built the third traveler is a woman; change the pronoun if not.
- **Margaret (OPEN):** two shapes on the table.
  - A (proposed): **one error in 1830** that reverberated. She was a traveler Ogee called for and couldn't carry the rope across; the town became Rolette. She could never get back (see "the clue picks the era"), took up volunteering, and has waited thirty-one years. The third traveler, trying to fix things, caused the later breaks.
  - B: she was correcting someone else's mistakes (possibly the third traveler's). Harder to make work with a smartphone traveler, since their errors would have to predate 1995 in the town's history while their own present is later.
  - Planted clues that fit either: the clock "stopped since before I started here"; DO NOT WIND "in someone's careful hand" and the sign "in Margaret's handwriting"; "ask Margaret" erased on the pedestal card; "john" in the crossword margin; "You have a familiar face."

### The desk
- **Decided: the desk appears in 1832** (Dixon's post office, from 1831), for continuity, and it must give something to the next chapter.
- **Proposed: the desk is in every chapter.** Its history already runs post office (1831) → "the old county clerk's office" (the broken-present provenance) → museum. Its locked middle drawer is the one reliable courier between eras: what's locked in it in one era is there in the next. James's mail key opens it; in the broken present the key was never found, so the drawer stayed shut for thirty-one years. Who holds the key in each era is a thread of its own.
- **OPEN: what's in the drawer after chapter 1.** Earlier idea: a letter held "until called for" at the post office, in Margaret's handwriting, pointing at the next era. Revisit once Margaret's shape is chosen.

### Chapter 2
- **Decided: 1832**, the Black Hawk War, with Dixon's Ferry as the army's staging point. Close enough to 1830 to carry its arcs on coherently.
- **Carries over from 1830:** Dixon (postmaster; owns the ferry by Jan 1832, C8), James (the key on his buttonhole), Eli (militia age; "the war's coming back"), Asa (season of crossings), Ogee (pulls the rope), Madeline, the boys and the crow (still with Asa's silver dollar), the rope, the paddle, the canoe on the far bank, and the player as "the stranger the river sent", unchanged two years on.
- **OPEN: the break.** Research Dixon's Ferry in May–June 1832 first (real Sauk and Potawatomi people and real violence are involved), then choose from two or three candidates grounded in the record.
