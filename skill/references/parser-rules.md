# Parser Rules

## Grammar
Verb optionally followed by a noun phrase. Core verbs: look, examine, go, take, open, talk. Nouns resolved at runtime from the active scene card.

## Matching Layers
1. Synonym expansion — objects carry aliases from the scene card. "Look at the light" hits lantern.
2. Fuzzy matching with confidence bands — exact matches resolve immediately. A unique match one edit away resolves silently; a tie asks which object the player means. Names two edits away offer the two closest candidates. Short names under four characters are not fuzzy-matched.
3. Verb softening — get/grab/pick up → take; check/inspect/study → examine. Small synonym table per verb.

4. Discovery gating — objects marked `hidden` are not valid targets until another object's `reveals` list (or an NPC topic) exposes them.
5. Object verbs — a verb table (sign, read, sit, touch, push, open, close, climb, smell, taste, search, drink, board, call, use, take) maps synonyms to a canonical verb. An object's own `verbs` entry wins; otherwise a mild default reply is used.
6. Leading prepositions — "look out/through/in/under/behind the window" strip to the noun.
7. Conversation — `ask <npc> about <topic>` matches keywords in the NPC's topic list; with one NPC present the name may be omitted. Unmatched topics get that NPC's own fallback line.
8. Pleasantries — thanks/hello/goodbye/how are you/sorry/well-wishes route to the named NPC, or the only NPC present, and use that NPC's `SOCIAL` lines. Spoken lines are prefixed with the speaker's name.

## Failure Categories
- Unknown verb: "you don't know how to do that" + nudge toward available verbs
- Unknown noun in known verb context: "you don't see that here"
- Ambiguous noun: "which one?" — always clarify rather than guess

## Vocabulary Format
- Verb entry: canonical name, synonym list, handler
- Noun entry: canonical name, aliases, which scene cards reference it
- Both are data; growing vocabulary is editing data, not code
- Ignore a leading article when resolving a noun ("the lantern" resolves as "lantern").
- Supported verb softening in the demo: get/grab/pick up → take; check/inspect/study → examine.

## Constraints
SCI input buffer caps at 40 characters. Matcher must tolerate truncated phrases. Pushes toward short, punchy commands.
