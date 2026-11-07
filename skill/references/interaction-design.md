# Interaction Design

How the demo should feel. These rules come from playtest feedback and are meant to be applied to every new scene.

## Pacing and Presentation
- No screen clearing. Every scene and response appends to a scrollable log; a scene heading marks each arrival.
- Rooms are described in prose. There is no "You see:" or "Exits:" list. Examinable nouns are highlighted inline and exits are woven into the description.
- No explicit instructions to the player in the story itself ("Type look around", "Try haul"). Next steps are exposed through curiosity, never stated. The exceptions are the ones the player asks for: `help` (the assistant on their phone), the guided tour, and banners about the game itself, which may name commands outright.
- Use real geography. The river is four blocks north of the Center, past the courthouse and downtown, and is never visible from the museum or its street. Check any new place detail against the real town.
- Transitions are gradual. The museum to 1830 shift takes four scenes (museum, street, river walk, water's edge) and the fog builds over turns spent at the water's edge. No scene jumps, no dropdown. `?scene=<id>` in the URL starts in any scene for testing.
- The water's edge transition is quick and forgiving. The fog builds for two moves at the water's edge and takes you on the third, whatever you type; looking at the water after the first move brings it at once. The planks, the 1830 bank and Ogee's voice arrive together. Answering the voice, or heading toward it (north, into the fog, out along the planks), completes the crossing: you step off the end of the planks, Ogee hauls you into his canoe, which splits on a piling, and your first action on the bank is held while he sits you down. Climbing back up is blocked once the planks appear. The player stays in 1830 until the lease is signed in Dixon's name (or, as the wrong fix, in theirs); then fog rolls in wherever the player is, every move is "too thick to go anywhere", and `take ogee's arm` (or `follow ogee`, `stay close`) walks them back to the present-day water's edge. Nothing carried in 1830 comes back through the fog. The stairs from the riverfront run north down to the water, and south back up.

## Prose
- Write in complete sentences. Each sentence carries a whole thought, image or feeling; never a list of noun-phrase fragments ("A clearing above the landing. One long log cabin. A woodpecker.").
- Join what belongs together. A place, what stands in it and how it feels can share a sentence or two; vary sentence length so the text reads like a person describing something, not a teletype.
- Characters keep their voices. A laconic man still speaks in natural sentences, with the rhythm of real speech; terseness comes from what he chooses not to say, not from clipped telegraph phrasing.
- Short replies are fine when the moment is small, but they are still sentences.
- The 1980s brevity we borrow is about how much a room tells you at once, not about the shape of the sentences.

## Progressive Discovery
- The top-level room description lists only what a visitor would notice first. Further detail is found by examining things.
- Objects carry `reveals`: examining one makes new nouns visible. Revealed nouns are added to the room description (`extras`) and become valid targets. Until then they are "not here" to the parser.
- Every prose cue must have a target or a natural reading. Do not tell the player something "looks wrong in a way you can't place". If a thing is not examinable, describe it plainly and let an NPC explain it (the empty photo frames are described by Margaret, not examined).
- Reveal character names when the player learns them in the scene. Before an introduction or other in-world identification, describe an unfamiliar person by appearance or role rather than using a name the player cannot yet know.
- Accessories are folded into their parent description rather than made separate nouns. The pen is described at the end of the guestbook entry, cueing `sign guestbook`; it is not an object.
- Narration may include details outside the player's direct perception when they add atmosphere or meaning. But if a detail is meant to work as a visual cue, make sure the player can see it; an invisible phone flicker, for example, doesn't work as a visual cue.
- Do not invent views that real places would not give. The museum window shows a parking lot and wires, not the river. Place-appropriate dullness is fine; the hint to go outside comes from people.
- When something is intriguing, end the description on the intriguing detail (the exhibit panel that ends one line short). Do not explain it.

## Social Flow of Actions
- Conversation and interaction should follow what people commonly do in reality, even within the fantastic premise: greet people naturally, acknowledge them when appropriate, and say goodbye when leaving.
- Scene changes should read like real life. Leaving a room with people in it produces a courteous parting first (a thanks, a nod), then the move. If the player has already said goodbye this visit, it is skipped. With several people present, a general "you nod to the others".
- Re-entering a room acknowledges the people there. Crossing the river with Ogee is part of the crossing text and has no separate farewell (`noFarewell` on the exit).
- Parting lines are per NPC and can depend on state (`PARTING`).

## Looked-At Sidebar
- A sidebar lists what the player has examined, grouped by scene with the current scene first. Entries expand on click to show the description as last read. It only records things the player has examined, so it never gives away unexamined nouns, and it stands in for scrolling back up or retyping `look`.
- Notes persist when the player leaves and re-enters a scene. Items an examined object revealed appear in the prose of the room, not in the sidebar, until examined.
- On narrow screens the sidebar moves below the play area.

## Settings
- A Settings panel (button at the top right) holds optional play aids, saved in the browser's localStorage. Current options: the looked-at sidebar (on by default) and clickable highlighted words (off by default).
- Design stance: typing is the game. Click-to-examine would turn play into clicking highlights and skimming the prose, so it stays opt-in. Future aids (text size, reduced motion, hints) belong here, and default to the immersive setting.

## Natural Verbs
- Objects respond to the verbs a real person would try: sign, read, sit, touch, push, open, climb, smell, search, board, call. Each object may supply its own reply; unhandled verbs get a mild default.
- `look out/through/in/under/behind <thing>` examines the thing.
- Any verb that obviously suits a described object (a guestbook can be signed) should be supported. When adding an object, ask what a curious person would do to it.

## Conversation
- `talk to <npc>` opens; `ask <npc> about <topic>` and `ask about <topic>` (when one person is present) answer from a topic list.
- Topics are keyword lists. Answers can change with state (before and after 1830).
- Every spoken line is attributed ("Margaret says, “…”") so the player always knows who is talking, even when using `ask about` without greeting first.
- Pleasantries work with whoever is present or a named NPC: thanks, hello, goodbye and well-wishes, how are you, sorry. Each NPC has its own in-character reply. Free-form small talk beyond these is optional, not required.
- NPCs should answer questions a person would actually ask. Do not add topics for things nobody would ask about (the window); an NPC fallback should sound like that person, not a parser.
- Keep NPC dialogue natural and context-appropriate, even when the story is fantastic. Avoid formulaic introductions and other lines that sound written for the player's benefit rather than spoken by a person.
- NPCs should feel like people with broader knowledge than the currently implemented topic list: answers can offer natural follow-up hooks, and unknown-topic replies should stay in character rather than redirecting the player to parser commands. Keep historical details period-accurate where documented; research before presenting uncertain history as fact.
- NPCs may reveal opportunities and goals in conversation, but shouldn't append parser commands or parenthetical instructions. Explicit next-step prompts belong in help when the player asks for it; optional cheat/hint settings can be considered separately.
- Tone must match content. An NPC lowers her voice only for something conspiratorial; otherwise let her be dry or humorous.
- NPCs are the primary source of nudges. Margaret mentions the river walk when asked about the exhibit or the river; the fog is an in-world reason to go out.

## Noticed details
- Don't conspicuously mention a hidden or covered detail unless the player can act on it and it pays off. If it's only set dressing, describe the surface (e.g. a bumper layered with old stickers). If it's a clue, give a clear way to reach it (e.g. peel the sticker back).

## Repeatable Reading
- Things a player reads more than once (the guestbook) give a different small selection of entries each time and gain entries after the player has visited 1830.

## Reusable Elements and Future Hooks
Ideas for later scenes, and details already planted in the demo, are kept in `future-hooks.md`. Whenever the user suggests something for later, or a scene plants a detail, add it there with where it lives now and what it could become.

- River geography: the Rock River has a north and south bank, never an east or west one. The plaza and the 1830 ferry landing are on the south bank; the far bank is the north bank, and the cabins path climbs south, away from the water.

## Highlighted words
- A setting controls highlighting: Key items only (default), All (key in blue, minor in tan) or Off. Settings are saved in localStorage.
- Key means it moves the story along: NPCs, things that lead somewhere (exits), objects that the player must act on, and things a character deliberately points at (the guestbook, the riverwalk). Set `key: true/false` on an object to override the automatic rule (NPC, or reveals another object).
- Everything else examinable is minor. Minor things stay askable and examinable but are only highlighted in All mode.
- The looked-at sidebar records everything examined, with key items listed first and marked with a star.
- In NPC speech, only highlight a word when the speaker is steering the player to it.
