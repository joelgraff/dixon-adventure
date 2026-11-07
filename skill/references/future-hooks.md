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

