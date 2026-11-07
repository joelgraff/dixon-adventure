# Scene-card format

The game's content lives here as YAML data. The browser runtime reads it; the
runtime holds no story text of its own. Writing a room's text now also writes
the art brief for the picture that may later replace it.

The game page is `docs/play.html` (engine: `docs/play.js`). It loads these
files over HTTP, so open it through GitHub Pages or a local server, not as a
file. Test URLs: `play.html?fresh` starts over, `?scene=landing` starts in a
room, `?seed=1` makes random picks repeatable.

Run the checker after every change, and the playthrough tests before pushing:

```
cd docs/game-data/tools && npm install && npm run check
npm install playwright && npx playwright install chromium   # once
node test.mjs              # all tests; node test.mjs wrong   runs matching ones
```

Test scripts live in `ch1/tests/`; see the top of `tools/test.mjs` for their
format.

The guided tour players see in the game (`tour`, or Settings > Take the tour)
is data: the `tour` list in game.yaml, one step per part of the screen.

`npm run tour` films a captioned video tour of the page, covering every part of
the screen and every setting, into `tools/out/` (needs ffmpeg). `npm run tour -- preview`
saves one still per scene instead. Re-film it after changing the interface.

Every push bumps the game version (`npm run bump -- patch "what changed"`);
the rules are at the top of `CHANGELOG.md`. To have git refuse a push that
forgets, run `git config core.hooksPath .githooks` once in your clone.

## Files

```
game-data/
  FORMAT.md            this file
  game.yaml            verbs, narrator defaults, meta commands (all chapters)
  sources.yaml         sources (S1, S2...) and the claims ledger (C1, C2...)
  ch1/
    chapter.yaml       flags and score, items, variables, deaths, chapter-wide actions
    rooms/<room>.yaml  one file per room
  tools/check.mjs      validator
```

## Text

A text field is either a plain string or a **variant list**. The runtime shows
the first variant whose `when` holds; a variant with no `when` is the default
and must come last.

```yaml
look:
  - when: [1830.lease_dixon]
    text: The panel is whole.
  - text: The paragraph ends a line short.
```

A variant may carry `do:` effects that run when it is shown (used for the fog,
where looking is what moves things on).

Markup inside text:

| Markup | Meaning |
| --- | --- |
| `[cases]` | A lookable noun, by id or alias, in this room. The checker requires every bracket to resolve. |
| `[emptycase\|empty case]` | Same, showing different words. |
| `[ogee]` | An NPC id shows that NPC's current name: `unknown` until `known.<id>` is set, then `name`. The first time an unknown person is shown they are "a man in a buckskin shirt"; after that the runtime sets `seen.<id>` and says "the man in the buckskin shirt". |
| `{ogee}`, `{ogee's}` | A character in plain narration: their short name once `known.<id>` is set, until then their `ref` ("the ferryman", "the ferryman's"). Capitalized at a sentence start. |
| `{town}` | A chapter variable (see `vars` in chapter.yaml). |
| `{money}`, `{score}`, `{max_score}` | Live values. |
| `{picked}` | Random entries from the noun's `pick` pool (see Nouns). |

The runtime capitalizes a bracket that starts a sentence, so `[ogee] stands
by the river` reads "A man in a buckskin shirt stands by the river" until the
player learns his name.

Every noun the prose mentions should be bracketed and defined, because
everything described is lookable. Highlighting (`key: true`) is separate.

## Conditions: `when`

A list; every entry must hold. (YAML reads a leading `!` as a tag, so negation is the word `not`.)

| Entry | Holds when |
| --- | --- |
| `1830.canoe_tarred` | the flag is set |
| `not 1830.canoe_tarred` | the flag is not set (`not` works before any entry) |
| `has:rope` | the player carries the item |
| `here:ogee` | that NPC is visible in the current room |
| `in:landing` | the player is in that room |
| `era:1830` | the current room belongs to that era |
| `money>=100` | compare `money`, `score`, `turns` (turns in this room) or `n` (a number typed in the command) with `>= <= == > <` |
| `{any: [a, b]}` | at least one of the nested conditions holds |

## Effects: `do`

A list of one-key maps, run in order.

| Effect | Does |
| --- | --- |
| `set: flag` / `clear: flag` | set or clear a flag (or a list of flags) |
| `give: item` / `take: item` | add or remove an inventory item |
| `money: 40` / `money: -n` | change the purse (`n` = the typed number) |
| `reveal: noun` | make a hidden noun in this room findable |
| `say: text` | print a line (text variants allowed) |
| `move: room` | go to a room (no farewell lines) |
| `death: id` | show that death and the Restore / Restart / Retry prompt |
| `end: true` | show the chapter's `ending` screen; from then on only meta commands work |
| `leave_behind: 1830` | drop every 1830 item and all money (the fog lets nothing through) |
| `rewind: 1830` | clear every `1830.` flag and 1830 item, set money to 0, take back their points |
| `if: {when: [...], do: [...], else: [...]}` | conditional effects (`else` optional) |
| `describe: true` | print the room description again, as `look` would |

**Score** is never awarded by an effect. chapter.yaml lists the flags that
score; the points are given the first time the flag is set, and taken back if
a rewind clears it.

Flag prefixes: `present.` (the present day), `1830.` (cleared by a rewind),
`known.` (names the player has learned; never cleared), `met.` (the person
has introduced themselves; never cleared), `heard.` (a name the
player has been told but whose owner they haven't met, e.g. `heard.dixon` once
Ogee mentions him; never cleared), `seen.` (an unnamed person the player has
already been shown, so later mentions use "the"; set by the runtime, or by an
effect when narration has already introduced them; never cleared),
`chapter1.`.

**Names before introductions.** Narration never names a character the player
hasn't been introduced to. Write `{dixon}` / `{dixon's}` instead of "Dixon",
or put the name in a variant whose `when` includes `known.dixon` or
`heard.dixon`. Speech in quotation marks is exempt (characters know each
other), and so is written text the player reads, which should be quoted. The
checker flags every name in narration that breaks this rule.

**Knowing a name is not meeting someone.** `known.<id>` only decides what the
person is called. The player can learn a name before any introduction: by
typing it ("talk to dixon"), or from a name tag the look text reads out. So a
first meeting is keyed on `met.<id>`, never on `known.<id>`: the introduction is
the first `talk` variant, `when: [not met.<id>]`, and its `do` sets both
`known.<id>` and `met.<id>`. The checker refuses a `talk` variant keyed on
`not known.<id>`.

## Rooms

```yaml
id: landing
era: 1830                  # present | 1830
name: The ferry landing, 1830
sources: [S1, S2, S4]      # ids from sources.yaml, for the histories panel
picture: >-                # art brief for the later picture
  ...
look: ...                  # text or variants; the room's fixed description
brief: ...                 # text or variants; one sentence for return visits
listen: ...                # optional
nouns:   {id: noun, ...}
npcs:    {id: npc, ...}
exits:   [exit, ...]
actions: [action, ...]     # puzzle actions that belong to this room
on_turn: [{when: [...], say: ..., do: [...]}]   # checked after each turn spent here (see Turns)
hold: [{when: [...], say: ..., do: [...]}]      # while one holds, it answers the next command instead
```

The room description the player sees is `look`, then the `room_line` of each
visible noun and NPC that has one, in file order. Objects that change between
states (the pedestal, the clock) put their changing sentence in `room_line`,
so the description always matches the state.

**Return visits.** Walking back into a room the player has seen prints its
`brief` instead, then only the room lines that are new or changed since the
player was last there, then who is still about ("Madeline and the boys are
still here", or "Everyone is still where you left them" for three or more).
If the room's own `look` reads differently from last time, the whole
description is printed instead. `look` always prints the whole thing. A
`brief` should be one sentence that sets the scene; the checker warns when a
room has none. An NPC whose name is plural (the boys) takes `plural: true`.
A noun the player must be able to find again (the pole, once it's needed)
takes `always`, and its room line is printed on return visits even when it
hasn't changed.

A room's `hold` stops the player acting for a moment: while an entry's `when`
holds, any command except help, save, restore, restart, version, tour and
score is answered by that entry's `say` and `do` instead, and still counts as a
turn. Clear the flag in its `do` to let the player go (the landing uses this
for the moment after you're pulled from the river).

**Turns.** A command that acts in the world (looking, talking, waiting,
moving, a puzzle action, even one that fails) is a turn, which adds one to
`turns` and runs the room's `on_turn`. Help, save, restore, restart,
version, tour, score and inventory take no time, and neither does a command
the parser can't read at all, so they never move a room's clock.

### Nouns

```yaml
pedestal:
  name: pedestal                # shown in clarifications and the sidebar
  aliases: [plinth, stand]
  key: true                     # highlighted in Key-items mode
  hidden: true                  # not a target until revealed
  when: [not 1830.shoe_returned]   # visible only while this holds
  look: ...                     # text or variants
  room_line: ...                # optional sentence added to the room text
  always: [1830.rope_strung]    # optional: keep room_line in return visits while this holds (or true)
  reveals: [card]               # looking at it reveals these nouns
  on_look: [{set: present.panel_read}]   # effects run every time it is looked at
  pick:                         # random entries for {picked} in its text
    count: 3
    from: [...]
    also: [{when: [...], from: [...]}]   # extra entries once a condition holds
  verbs:
    touch: The velvet is cool.  # a natural verb: text, or {when, say, do}, or a variant list
```

When a word names both something in the room and something the player
carries, the one whose own id or name it is wins ("key" is the brass key, not
the crow with `key` among its aliases); if it is only an alias for both, the
thing in the room wins ("case" in the museum is a glass case, not the phone).

### NPCs

```yaml
ogee:
  name: Joseph Ogee
  unknown: the man in buckskin  # used until known.ogee is set
  ref: the ferryman             # {ogee} in narration until known.ogee
  short: Ogee                   # optional: used in speech tags and room text once known
  aliases: [ferryman, man in buckskin, joseph]
  when: [not 1830.fog]
  look: ...
  room_line: ...
  talk:                         # variants; the first is the introduction
    - when: [not met.ogee]      # never `not known.ogee` (see Flag prefixes)
      text: ...
      do: [{set: [known.ogee, met.ogee, 1830.met_ogee]}]
    - text: ...
  topics:
    - keys: [rope, river, high water]    # whole words
      when: [...]                        # optional: the topic only counts while this holds
      say: ...
      do: [...]
  fallback: ...                 # unknown topics, in character; also said when a
                                #   topic's say variants all fail
  social: {hello: ..., thanks: ..., bye: ..., how: ..., sorry: ...}
  parting: ...                  # said when the player leaves, if they spoke this visit
```

Speaker attribution ("Ogee says, ...") is added by the runtime when a spoken
line starts with a quotation mark. Never write the speaker into the line
itself.

### Exits

```yaml
- names: [south, path, cabin]
  to: cabin
  when: [...]                   # otherwise `blocked` is printed
  blocked: ...
  text: You walk up the path.
  peek: The path climbs toward woodsmoke.   # answer to "look south"
  farewell: false               # skip the parting line
```

An exit with no `to` is a direction that is always blocked; its `blocked`
text explains why. `blocked` may be a variant list.

### Actions

Puzzle actions are declared where they happen, with every phrasing the parser
must accept. Phrasings are matched whole, after lower-casing, trimming and
dropping `the`, `a`, `an`. `{n}` matches a number; quote any phrase that contains it (`"give dixon {n}"`), because YAML reads bare braces as a map.

```yaml
- id: tar_canoe
  speaker: ogee                 # optional: quoted say lines are attributed to this NPC
  phrases: [tar canoe, tar the seam, patch canoe, fix canoe, use tar on canoe]
  when: [not 1830.canoe_tarred]
  do:
    - set: 1830.canoe_tarred
    - say: You work the hot tar into the split...
  else:                         # first matching entry when `when` fails
    - when: [1830.canoe_tarred]
      say: The seam is already tarred.
    - do: [{death: canoe_sinks}]  # an else entry may run effects instead of, or as well as, saying something
```

Order of matching: room actions, then chapter actions, then NPC
conversation, then verb + noun, then meta commands.

chapter.yaml has an `actions` list in the same shape for actions that work in
several rooms (following Ogee home, swimming).

## Chapter

`chapter.yaml` holds the chapter's id and title, the start room, `max_score`,
`money_item` (how the silver in your pocket looks and answers to verbs; it is
something you carry whenever `money` is above 0),
the scoring flags, `vars`, `items` (an item with `era: 1830` is removed by a
rewind), `deaths`, the fog lock (exits blocked and a line added to every 1830
room while it holds), chapter-wide actions, and `npcs` who move between rooms.
A moving NPC has an `at` variant list instead of living in one room file:

```yaml
npcs:
  asa:
    at:
      - when: [1830.wagon_free]
        room: landing
      - room: slough
```

## Sources

`sources.yaml` lists each source once with an id, a title, a URL and what it
supports, and the claims ledger: each claim with its status (`record`,
`disputed`, `guess`, `invented`, `needs-source`), the rooms it appears in and
its source ids. A room's `sources` list is what the optional histories panel
shows. Any new historical claim gets a ledger entry in the same change.

## The veil (chapter.yaml `veil`)

In the past the fog makes the player look as if they belong, and the phone
looks like a tin case to anyone else. Using it openly breaks that.

```yaml
veil:
  item: phone                       # the giveaway object
  verbs: [show, photograph, light]  # what counts as using it openly
  warned: 1830.veil_warned          # set the first time; cleared by a rewind
  exempt: [ogee]                    # people who don't mind
  exempt_text: ...                  # shown when only exempt people saw
  react: {dixon: ..., default: ...} # the first time, said by whoever saw
  warning: ...                      # narrator line after the first time
  cold: {dixon: ..., default: ...}  # while spooked, instead of talk or ask
  again: [effects]                  # the second time (here: the fog takes you back)
```

`show phone to X` is discreet: only X sees. Lighting it or taking pictures,
everyone in the room sees. Anyone who saw is spooked (`1830.spooked.<id>`, set
by the engine) until the player leaves the room. Alone, or in the present, the
phone's own `verbs` answer instead. `help` is a private glance and never
counts.

NPCs can be typed by their `ref` as well as their `unknown` description, since
narration uses it.

## The end of a chapter (chapter.yaml `ending`)

```yaml
ending:
  when: [chapter1.ended]      # once this holds, the chapter is over
  title: "The end of Chapter 1"
  blocked: "...Type restart to play again, or restore to load a saved game."
```

An action with `end: true` shows the title and the final score. After that,
every command except help, save, restore, restart, version, tour and score gets
`blocked`. In chapter 1, leaving the museum after Margaret's closing talk runs
`close_up`, which ends the game.

An exit can run an action instead of moving: `action: <id>` runs while
`action_when` holds (or the exit's `when`, if the exit has no `to`), and
otherwise the exit moves as usual.

