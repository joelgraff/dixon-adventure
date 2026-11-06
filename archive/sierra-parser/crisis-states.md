# Crisis States

Open question from sierra-parser README: do crisis states extend the existing canon schema or get their own file? Current lean: own file, referenced by canon entries.

## Schema sketch

```json
{
  "crisis_id": "truesdell_1873",
  "canon_ref": "canon://events/truesdell_collapse_1873",
  "phase": "active | resolved | aftermath",
  "trigger": "player action or time threshold",
  "effects": [
    {"target": "bridge_north_span", "state": "collapsed"},
    {"target": "river", "state": "debris_field"}
  ],
  "npcs": ["christan_goble", "henry_noble", "katie_sterling"],
  "time_pressure": "minutes_until_condition_worsens"
}
```

## Design rules

- A crisis is a dated canon event with a mutable phase. The phase is what renderers consume — Sierra shows the bridge intact in "resolved," broken in "active."
- Time pressure is the mechanic that makes a crisis feel like one. Each tick worsens survivor condition or expands the hazard.
- Aftermath is where the legacy system reads: which NPCs survived, which bloodlines carry forward.
- One crisis per scene maximum in v1. Stacking crises without reconvergence points breaks the fixed-spine promise.

## Open questions

- Does a crisis persist across scene boundaries or reset at each reconvergence?
- Can the player trigger a crisis deliberately (e.g., provoke the 1846 kidnapping) or only inherit ones the record gives?
