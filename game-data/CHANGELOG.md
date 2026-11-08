# Changelog

The game (play.html and game-data) gets a new version on every
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
- To bump: `cd game-data/tools && npm run bump -- patch "what changed"`.
  It updates game.yaml, the `?v=` in play.html and this file together, and the
  checker fails if they ever disagree.

## 0.17.0 (2026-11-08)
- The engine now plays chapters. The present-day rooms (the museum, the street, the river walk and the water's edge) are shared by every chapter, and when a chapter ends and another follows, typing continue goes on to it with everything you did carried over. Saves remember their chapter; saves from earlier versions still load. Nothing changes in play yet: chapter 2 is a draft that only the developer address reaches.

## 0.16.0 (2026-11-07)
- Earlier text fades back: when you type a command, everything already on screen dims, so the newest reply is the only bright text, even when one command sets off two replies. On by default; Settings > Dim earlier text turns it off.

## 0.15.0 (2026-11-07)
- Rolette's agent watches the sun once the rope is across: he gets up off his crate, gives Ogee until sundown, and is standing on the ferry with his hand on the rope when Dixon comes down with the silver. Asa won't pay a season of crossings to a mail man whose mail sits, so the deal now waits on James's key: once he has it back, the mail goes north over your rope, Asa sees it go, and he pays. James's secret stays his. Ogee says goodbye in the fog, and the last thing you see as Margaret locks up is his token.

## 0.14.27 (2026-11-07)
- Margaret sounds like herself: no "You've a familiar face" or "mind the fog", shorter lines at the chapter's end, and she trails off when the labels unsettle her. A last sweep removed the remaining bookish turns from everyone's dialogue.

## 0.14.26 (2026-11-07)
- Madeline, the boys and Eli get their own voices: Madeline says as little as will do and answers a question she doesn't trust with one of her own; Ogee's boys interrupt each other; Eli runs his sentences together with "and", quotes his pa and his uncle, and stops himself mid-thought.

## 0.14.25 (2026-11-07)
- The Dixons each sound like themselves: John measured and polite ("Mr. Ogee", "as it happens", "obliged"), understating his trouble; Rebecca short and dry, pointing her spoon at the room Rolette's man is sleeping in; James stiff and worried, saying more than he means about the lost key and then stopping himself.

## 0.14.24 (2026-11-07)
- Ogee talks like a ferryman now: short, practical lines, French-leaning word order ("That one, he holds my paper for Rolette"), dry jokes at his own expense, and the odd bon or mon Dieu. Gone are the bookish turns ("I'll not", "mind", "I've no use for her", "obliged"); his first meeting is a few short lines and gestures instead of a speech.

## 0.14.23 (2026-11-07)
- Rolette's agent talks in terms now: clipped, exact, no contractions, no opinions. He taps his papers and names the figures (a thousand and sixty on the Schellenger note, a hundred of it due in February) instead of explaining himself, and closes every conversation politely: "That is not on the note, friend."

## 0.14.22 (2026-11-07)
- Asa says less and shows more: he nods at his broken bar instead of explaining it, points at his flour and pats the silver in his coat, and speaks in plain, short lines. The voice sheets now say how dialogue works in this game: short, one idea at a time, facts shown rather than told.

## 0.14.21 (2026-11-07)
- Asa talks like a teamster now: short and blunt, loose grammar, frontier words (fella, fixing to, yonder, ain't), and none of the bookish turns everyone shared. New voice sheets for every character set out how each of them should sound. Fixed: a year like '27 shows an apostrophe, not an opening quote.

## 0.14.20 (2026-11-07)
- When the crow trades, it leaves James's key on the chopping block, and you have to pick it up yourself; until you do, it stays in view on the block and help reminds you. Before the trade, the glint at the crow's feet is something you can look at, though you can't make out what it is.

## 0.14.19 (2026-11-07)
- The silver dollar in your pocket is something you can look at anywhere (look at dollar, x coin), and the silver in the inventory panel can be clicked like any other item.

## 0.14.18 (2026-11-07)
- More ways to show the crow the silver dollar: use it, put or set it down or out, shine or polish it, hold it in the light, put it where the crow can see it, and 'bird' works wherever 'crow' does. The dollar now catches the light on the chopping block.

## 0.14.17 (2026-11-07)
- Ogee no longer hints at where the silver is: he says Dixon would have his lease if he could find a hundred in silver, and that if the agent takes the boat Asa is as stuck as he is. The crow can now be tempted with the silver dollar in many more ways (entice, lure, tempt or bait it, wave or hold up the dollar, drop or place it on the block, and so on).

## 0.14.16 (2026-11-07)
- The agent no longer cares who leases the ferry. Instead Ogee raises it himself once Asa's wagon is free: one train out of the mud, the agent still on his boat, and Dixon would have his lease if he could find a hundred in silver, and there's silver in this landing somewhere.

## 0.14.15 (2026-11-07)
- Asa, Ogee and the agent now point you to Dixon. Asa will pay, but only to the man who means to run the ferry; Ogee says that's Dixon, and that Dixon is a hundred in silver short; the agent names Dixon as the man who'd lease her. Help follows the main story instead of sending you after James's key, which it mentions only at the camp and the cabin.

## 0.14.14 (2026-11-07)
- The axe is back in sight, sunk in the chopping block, and stays in view on return visits until you take it. Madeline wants a reason for whichever she lends first, the paddle or the axe: she asks what you want it for and lends it to keep Rolette's man off the ferry; the second she lends without fuss.

## 0.14.13 (2026-11-07)
- When the lever fails, the narration says the whole load settles back, rather than calling the wagon 'she'; Asa still does.

## 0.14.12 (2026-11-07)
- The willow for Asa's wheels is called willow branches instead of brush, in what you read and what Asa says; 'brush' still works as a word you type, and 'branches' now works too.

## 0.14.11 (2026-11-07)
- Asa no longer suggests Ogee's setting pole as the lever; finding something long enough is up to you.

## 0.14.10 (2026-11-07)
- Trying to lever Asa's wagon out before there's anything under the wheels now shows you what's wrong: the wheels spin in the mud with nothing to bite on, and Asa suggests an armful of willow might give her a grip. Pushing the wagon shows the same, and 'free wagon' and 'pull wagon out' now work. Asked about the wagon, Asa describes the trouble rather than the fix.

## 0.14.9 (2026-11-07)
- Fixed: Ogee's setting pole had dropped out of the landing's description. It now leans against the post at the end of the dock (useless in this water, then forgotten once the rope is across), and once the rope is across it stays in view every time you come back until you borrow it.

## 0.14.8 (2026-11-07)
- Rebecca says why her family expected to be in Ogee's cabin by now: the lease comes with its east room, where Rolette's man is sleeping instead. The histories panel marks this as invented.

## 0.14.7 (2026-11-07)
- Madeline wants to know what you want her father's paddle for before she lends it, and lends it because it may keep Rolette's man off the ferry.

## 0.14.6 (2026-11-07)
- Ogee offers to lend his pole once the rope is across, without saying what it might be good for.

## 0.14.5 (2026-11-07)
- Eli tells you where his uncle is stuck and that his bar broke, but no longer what the wagon needs to get out.

## 0.14.4 (2026-11-07)
- The tar pot sits on the dock beside the ferry, where Ogee was doing her seams, and the ferry's description shows it; the canoe points you there too.

## 0.14.3 (2026-11-07)
- At the start of the game the museum desk no longer points out its locked middle drawer; you can still find it by trying the drawers, and it's in the desk's description once the key turns up.

## 0.14.2 (2026-11-07)
- The present-day rooms show their major features too (the porch light, the pavilion and bench, the driftwood and the museum window turn up when you look closer), the landing reads lighter, and every room's prose has had a sentence-by-sentence pass: about a fifth of sentences now join two clauses with ', and', down from a third. Fixed: the boys are 'the boys' again after you've talked to them.

## 0.14.1 (2026-11-07)
- The cabin, the camp, the slough and the north landing show their major features: the cabin shows the cabin, the crow and the people (the paddle is on the cabin and the axe is in the block when you look); the camp loses its picket line and kettle to closer looks. Asa no longer tells you what his wagon needs, and Dixon explains the lease more simply. Their prose, and the chapter's shared text, is rewritten sentence by sentence.

## 0.14.0 (2026-11-07)
- The deal is now yours to carry. Tell Asa about Dixon and he counts a hundred in silver into a bag and puts it in your hands; take it up to Dixon at the camp, and he walks down to the landing with you, pays the agent and takes the lease while you watch. Pay the agent yourself and the lease is in your name. The landing shows its major features (the river, the dock, the ferry, the canoe, the wagons and the people), and smaller things like the tar pot turn up when you look closer. Ogee no longer lays out the whole plan: he tells you what's wrong and where the rope is, and leaves the rest to you. Its prose is rewritten sentence by sentence.

## 0.13.6 (2026-11-07)
- Margaret is choosing not to think about the clock again, and when you ask, she's still choosing not to. It's a refrain she shares with you (waking in 1830, walking out of the fog), and it stays.

## 0.13.5 (2026-11-07)
- The present-day rooms get the prose pass. The riverfront no longer sounds like a brochure (it was built for crowds, and tonight you nearly have it to yourself), the statue plaque says the same things in fewer words, and the street gathers itself into three sentences. At the water's edge the bridge and the tower go soft in the mist, and the river is no longer 'unhurried' four times over. In the museum, the late light no longer sounds like the color of the window, the exhibits drop their 'It's a' openings, and Margaret has decided the clock is the humidity instead of choosing not to think about it.

## 0.13.4 (2026-11-07)
- The camp and the slough get the same prose pass. The camp opens on a family making a home around a wagon; Dixon taps his paper instead of turning it over yet again, says the mist is odd enough that he's stopped mentioning it to Rebecca, and looks at a wagon that is not a roof; his rope line isn't said twice. Rebecca expects to cook on a great many more fires. The slough no longer repeats the wet ground you've just walked into, and Asa introduces himself by his fretting nephew instead of assuming you've met him. Partings with Dixon and Asa no longer start 'You nod'.

## 0.13.3 (2026-11-07)
- The cabin's prose gets the same pass as the landing. The room no longer repeats the clearing you've just walked into, and its lines vary their shape. Madeline has mending to go back to and watches you to the edge of the clearing; her look, her ferry line and the paddle no longer all use 'the way you'd'. Giving back the axe is plain business, so the softening is saved for her father's paddle. The paddle, the crow and the axe no longer open with 'It's a'.

## 0.13.2 (2026-11-07)
- Two landing lines said plainly: the agent watches the ferry as if it were already his, and Ogee is sorry to ask the work of somebody he's only just pulled out of the river.

## 0.13.1 (2026-11-07)
- A rewrite of the ferry landing's prose, as a sample of a fuller pass. The room opens on the river instead of a list of objects, and its lines vary their shape and hold on to each other. The agent watches the ferry as though he'd already counted it, and Eli keeps an eye on the trail. Ogee no longer looks at the canoe and then at you, apologizes for putting a half-drowned stranger to work, and coaches you through the tarring. Eli mentions his Pa, and his uncle whistling alarms him. Fewer 'It's a ...' openings, and no more 'the way a man' three times in one room.

## 0.13.0 (2026-11-07)
- Return visits are brief: walking back into a room gives one line for the place, then only what has changed since you were last there and who is still about, so the cabin and the camp no longer reprint in full every time (type look for the whole description). On your return to the museum, that makes the changed room read as a list of what's different. You only take your leave of people you've actually been talking to, so walking past someone no longer costs a nod. Fixes: Margaret offers next Saturday and the key once, in her closing talk, instead of four times; Asa no longer repeats his four or five runs, and calls them a season, not a year; the agent goes home with silver instead of a horse; Eli sits at the head of the landing; the boys' crow line is no longer tagged twice; names like Rolette's take the same curly apostrophe as the rest of the text.

## 0.12.2 (2026-11-07)
- Fixes from a review. Saying someone's name before you've met them (talk to ogee, talk to james, talk to dixon), or reading Margaret's name tag first, no longer skips their introduction, so Ogee doesn't say "Back again" to a stranger and James still tells you about the mail key. talk to him asks whom when several people are here and no longer gives away a name. In the museum, case means the glass cases and light the window, not your phone. Score, inventory, version, help, save and anything the parser can't read take no time, so they no longer bring the fog on at the water's edge. A bare ? asks for help. The Looked at sidebar uses a person's name once you've learned it. Saved games carry over.
- For authors: introductions are keyed on a new `met.<id>` flag instead of `known.<id>`, and the checker refuses the old form. A topic's `when` is now honoured, a topic whose variants all fail answers with the character's fallback line, and tests can check `turns`.

## 0.12.1 (2026-11-06)
- Housekeeping: the site's front page (index.html) now opens the game; the old prototype moved to prototype.html. The filmed tour covers the inventory panel, and the design notes match the current game (the town's broken name, the crossing, and help as the one place commands are named).

## 0.12.0 (2026-11-06)
- An inventory panel at the top of the side panel shows what you're carrying and any silver; click an item to look at it. It's on by default and can be switched off in Settings, and the tour covers it. Also, learning what Dixon is short of is worth 4 points (was 8) and the lease 19 (was 15): the points sit on the deed, not the question.

## 0.11.2 (2026-11-06)
- Giving back what you borrowed is worth 2 points each: Madeline's axe, her father's paddle and Ogee's setting pole. Chapter 1 is out of 127.

## 0.11.1 (2026-11-06)
- Noticing a change after the repair is worth 1 point instead of 2; chapter 1 is out of 121.

## 0.11.0 (2026-11-06)
- The game now ends: after Margaret's closing talk she says to take your time, and when you leave the museum she locks up, says goodnight and heads home, and the chapter ends with your final score. After that only restart, restore and the other meta commands work.

## 0.10.3 (2026-11-06)
- Chapter 1 ends with Margaret closing up for the night: she asks you to come back next Saturday, and she'll wait for you to try the old key in the drawer together.

## 0.10.2 (2026-11-06)
- After the repair an old brass key always turns up on Margaret's blotter, and she'll try it in the drawer later; it carries the DIXON'S FERRY P.O. tag only if you got James's key back to him. James no longer mentions the crow, and Margaret no longer tells a story about it or talks about Saturday.

## 0.10.1 (2026-11-06)
- The boys' hint about the crow is gentler: just that he's a thief who's always finding something shiny. Asking them about the crow still gets 'He'll trade, but only up.'

## 0.10.0 (2026-11-06)
- The mail key: James has lost the post office mail key at Ogee's chopping block, and a crow on the cabin roof has it. The boys say it only trades up, for something shinier; set Asa's silver dollar on the chopping block and the crow swaps. Give the key back to James (10 points in all). In the present, the key turns up on Margaret's desk tagged DIXON'S FERRY P.O. and fits the locked drawer, which she'll open with you on Saturday (chapter 2). Without it, she tells the family story of the crow. Chapter 1 is out of 132. 'Dollar' is no longer dropped from what you type.

## 0.9.2 (2026-11-06)
- The museum desk has a provenance that history can lose: before the repair its brass plate is scratched blank and nobody's sure where it came from; after, the plate reads POST OFFICE, DIXON'S FERRY, 1831. J. DIXON, P.M., and Margaret calls it Dixon's post office desk. Noticing the plate is 2 more points (122 in all).

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
