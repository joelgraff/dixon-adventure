# Changelog

The game (docs/play.html and docs/game-data) gets a new version on every
push. The version shows in the top bar of play.html, in Settings, and with the
`version` command, so you can always tell which build you are playing.

## Versioning rules

- Every push that changes the game bumps the version. No releases or tags.
- **Patch** (0.3.0 to 0.3.1): text, dialogue, fixes, tests.
- **Minor** (0.3.0 to 0.4.0): new features, puzzles, rooms or mechanics.
- **Major** (0.x to 1.0): a whole new chapter, or when you decide it's ready.
- Bump `save_compat` in game.yaml as well when a change would break saved
  games (renamed or removed flags, items or rooms). Older saves are then
  refused with a message instead of loading half-broken.
- To bump: `cd docs/game-data/tools && npm run bump -- patch "what changed"`.
  It updates game.yaml, the `?v=` in play.html and this file together, and the
  checker fails if they ever disagree.

## 0.9.1 (2026-11-06)
- Nothing from 1830 comes back through the fog: the pole, the shoe, the axe, the paddle and Asa's silver dollar stay behind when you take Ogee's arm, and the walk home says so.

## 0.9.0 (2026-11-06)
- Back in the present after the repair, noticing what changed earns 2 points each (the panel, the pole shoe, the token, the engraving, the clock, the crossword, the sign, the bumper sticker, the marker and the statue plaque), and Margaret comments the first time you look at each thing in the museum. Chapter 1 is now out of 120.

## 0.8.6 (2026-11-06)
- Characters' lines follow what has already happened, whatever order you do things in: Ogee on the canoe, the rope, the pole and its shoe, and meeting him after you've tarred the canoe; Dixon when you've already taken his rope; Asa's look, talk and thanks once the brush is down or the wagon is free, including meeting him first at the landing; Madeline once you have the axe. 'thank <name>' now works.

## 0.8.5 (2026-11-06)
- Eli knows when his uncle is free: met for the first time after the rescue, he thanks you for getting Asa out of the slough, and his description, his talk about his uncle and his shrug all follow the wagon being free.

## 0.8.4 (2026-11-06)
- You can give Madeline's father's paddle back (give the paddle back, return paddle, hang it on the pegs); she hangs it under the eaves again, and you can borrow it again if you need it.

## 0.8.3 (2026-11-06)
- Laying the brush accepts the words you'd use for what you just cut: put, lay, pack, wedge or stuff the willow, willows, bundle or branches under the wheels, wagon or axle, in the mud or ruts, and so on.

## 0.8.2 (2026-11-06)
- Madeline no longer offers the axe when you meet her; you have to ask for it. Help points you to her when you need it for the willow brush.

## 0.8.1 (2026-11-06)
- Lines that name their own speaker ("Joseph Ogee," he says) no longer get a second speech tag in front.

## 0.8.0 (2026-11-06)
- The money puzzle is rebuilt around Asa needing the ferry. Freeing his wagon earns a silver dollar, not forty. At the landing Asa explains he has silver but no way across if the agent takes the boat; once you've heard from Dixon what he's short of, tell Asa about Dixon and Asa pays a hundred in advance for a season of crossings, which Dixon hands to the agent before Ogee signs the lease. Dixon's government order is only the reason he has no silver; selling it is gone. The wrong fix is now asking Asa to pay the agent himself. Old saves are refused (save_compat 2).

## 0.7.8 (2026-11-06)
- The money and the lease make sense: Dixon says plainly that he has no silver, only a government order for $72 that nobody at the river will cash, which is why Asa buying it for $60 matters. Dixon leases the ferry from Ogee with the rent going to Rolette's notes; his $100 pays the overdue February installment, and the payment scene and the agent say so.

## 0.7.7 (2026-11-06)
- At the slough, 'take brush', 'get willows', 'gather willow brush' and the like now cut the brush when you have the axe (they used to say you need an axe even when you had one).

## 0.7.6 (2026-11-06)
- The setting pole stays in the landing description after the rope is strung (it leans idle against the post), so you can see it's there to borrow.

## 0.7.5 (2026-11-05)
- The paddle is no longer carved from firewood. Madeline keeps her father's old canoe paddle on pegs under the cabin eaves; Ogee tells you to ask her for it. Chopping wood is just chopping wood, and trying to carve a paddle says the lengths are too short and someone probably has a spare.

## 0.7.4 (2026-11-05)
- Dixon is more guarded at first: he introduces himself, says he came to lease Ogee's ferry and found Rolette's man sitting on it, and points you to the rope. He only admits he's a hundred dollars in silver short when you ask about the lease, the terms or the money; asking about Rolette's man hints at it. Until then he's waiting to see how it comes out.

## 0.7.3 (2026-11-05)
- At the cabin, "chop wood", "split wood", "chop log", "use axe" and similar now work: with the axe in hand they split the oak into a paddle.

## 0.7.2 (2026-11-05)
- People you have not been introduced to are "a man in a buckskin shirt" the first time you see them and "the man in the buckskin shirt" after that, in room descriptions, speech tags and "which do you mean" questions; after the rescue the landing already calls Ogee "the man". Madeline now says whose wife she is ("I am Madeline Ogee. My husband keeps the ferry down below").

## 0.7.1 (2026-11-05)
- Prose pass over the whole chapter: room descriptions, objects, dialogue and narration rewritten in complete, flowing sentences instead of strings of fragments, with each character's voice kept. Added a Prose section to the design rules (skill/references/interaction-design.md) and docs/CLAUDE.md so new text stays that way.

## 0.7.0 (2026-11-04)
- After you're pulled from the river, your first action is held: you're still in shock, Ogee pushes you back down ("Sit a moment. Get the river out of you first."), you find the clothes and the tin case, and the landing comes back into view with its full description. Nothing on the landing can be used before it has been described. New engine feature: a room's hold answers the next command while a flag holds (help, save and the other meta commands still work), and a describe effect reprints the room.

## 0.6.7 (2026-11-04)
- Playtest fixes: help on the street and riverfront now points at the next step instead of back up Hennepin; in 1830 help is checked discreetly (you turn your back and open the tin case), in keeping with the veil; the slough hint moves on step by step (pole, brush, wheels, lever); offering Dixon's order to Rolette's agent gets an in-character refusal instead of a parser shrug.

## 0.6.6 (2026-11-04)
- The arrival in 1830 comes in three beats instead of one wall of text: answering the voice gives the fall and the rescue, your next move gives the clothes and the tin case, and the one after brings the rest of the landing (tar pot, wagons, the man in the good coat, the young man with the rifle) into focus. Until then the room description leaves them out.

## 0.6.5 (2026-11-04)
- Leaving the museum before meeting Margaret now says "You thank the volunteer", not "a volunteer": the exit lines use the narration form of her name.

## 0.6.4 (2026-11-03)
- Puzzle review: asking Madeline for the axe now earns it (taking it first gets a hint to ask); Ogee points you at the canoe when it's ready and you try the ferry; you can give the pole back, and Ogee notices a missing shoe; Dixon is seen turning his government order over in his hands; and every puzzle action takes many more phrasings.

## 0.6.3 (2026-11-03)
- The tools for tarring are now in the scene: a swab standing in the tar pot and a hank of oakum beside it, both in the room description. Ogee says to pack the split with oakum and swab tar over it, and 'use swab on canoe', 'pack the split' and the like all work.

## 0.6.2 (2026-11-03)
- Tarring the canoe accepts the words Ogee uses (tar the split) and many more: patch, seal, caulk, fix or fill the split, crack, seam or canoe, use tar on it, and so on.

## 0.6.1 (2026-11-03)
- The crossing to 1830 is quicker and forgiving: the fog builds for two moves and takes you on the third whatever you do (sooner if you look at the water), the planks and the voice arrive together, and walking toward the voice (north, forward, into the fog, out along the planks, follow the voice) answers it.

## 0.6.0 (2026-11-03)
- The veil: in 1830 the fog dresses you in homespun, and your phone looks like a tin case to everyone else. Show it to someone, light it or take pictures where people can see, and whoever saw goes cold until you leave; do it again and the fog takes you back to the present and 1830 starts over. Ogee has seen it before and doesn't mind. People can now be called by what the narration calls them ("the tall man").

## 0.5.0 (2026-11-03)
- A new arrival: you walk off the end of the dock in the fog, and Ogee fishes you out with his canoe, splitting it on a piling and losing his paddle. That is why the canoe needs tar and a paddle, and why the job falls to you: Ogee can't leave the ferry's lines or the dock while the agent watches, and you owe him. Ask him why if you wonder. Help now comes from the assistant on your phone (help, use phone, ask phone), offline in 1830.

## 0.4.2 (2026-11-03)
- Narration no longer names people before you meet them: Ogee is "the ferryman" (his flatboat, his cabin) until he introduces himself, and likewise for Dixon, Madeline, Asa, Eli, James, Rebecca and Margaret. The camp is "A wagon camp" until someone mentions Dixon. The checker now flags any name in narration that the player may not know yet.

## 0.4.1 (2026-11-03)
- Start-of-game notices (the tour offer, Welcome back, Updated) are now gold-edged banners instead of muted italic text; the tour offer has a Take the tour button, and the log opens scrolled to the banner.

## 0.4.0 (2026-11-03)
- In-game guided tour: type tour (or tutorial), or Settings > Take the tour. It outlines each part of the real screen with a caption, with Next, Back and Close (Esc closes); it never touches the game state. New players are offered it once. The steps live in game.yaml. Tests can now click page elements and check what is shown.

## 0.3.2 (2026-11-03)
- Movement accepts more natural phrasings: "go down stairs", "go down the stairs", "take the stairs", "climb down the steps", "downstairs", "walk down to the water". A new test tries every exit by every name in several shapes.

## 0.3.1 (2026-11-03)
- npm run tour films a captioned video tour of play.html (every part of the screen and every setting) into tools/out/.

## 0.3.0 (2026-11-03)
- Version number in the top bar, in Settings, and from the `version` command.
- Saves record their version; a save from an incompatible version is refused
  with a message instead of being loaded.
- play.js is loaded with `?v=` so browsers fetch the new engine after a push.
- `npm run bump`, a version check in the checker, and an optional pre-push hook.
- The old prototype (index.html) links to play.html.

## 0.2.0 (2026-11-03)
- docs/play.html and docs/play.js: a browser engine that plays chapter 1 from
  the scene-card data. index.html is unchanged.
- Headless playthrough tests (tools/test.mjs, ch1/tests): the winning path to
  100 points, the wrong fix and rewind, each death, save and restore, and every
  declared phrasing.
- Fixes from playtesting: names learned from name tags and by addressing
  people by name, pronouns, `look north`, articles in the inventory, shorter
  speech tags, room text that no longer repeats unknown names.

## 0.1.0 (2026-11-03)
- Chapter 1 as scene-card data: FORMAT.md, game.yaml, sources.yaml,
  ch1/chapter.yaml and one file per room.
- tools/check.mjs validates references, flags, score and citations.
