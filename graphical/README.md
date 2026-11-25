# Dixon, the graphical version

A Sierra-style graphical adventure built on the text game. Chapter 1 comes
first: the museum, the riverfront, the water's edge and the 1830 rooms.

Nothing here changes the text game, so pushes that touch only this folder
don't bump the game version.

## Decisions so far

- **Look:** pixel art at 320×180, scaled up with sharp pixels. One composed
  background per room, like the Sierra games. The style isn't final;
  `mockup/landing-styles.html` shows the 1830 landing three ways (EGA 16,
  limited 32-color, and modern pixel with smooth light and fog).
- **Art pipeline:** model or block out the scene in Blender, render it, shrink
  it to 320×180, lock it to the palette with an ordered dither, then touch it
  up by hand. Free asset packs are for reference, and placeholder shapes are
  fine while the mechanics come together.
- **Platform:** the browser, a plain `<canvas>`, no library to start (Phaser
  later only if the effects get painful).
- **Brain:** `play.js` and `game-data/` stay the game's logic. This folder is
  a new front end: it draws, walks and takes input, and asks the engine what
  happens.
- **Text:** the picture replaces the room description. Text appears in a box
  when you look at or use something, or when someone talks.
- **Interaction:** walk and look first. Later, a small popup of the verbs that
  make sense for each object, with typing as an optional extra. The popup
  sometimes shows the words you could have typed, and typing earns bonus
  points and richer answers. You can finish the game without typing.

## Milestone 1: walk around one room

1. A canvas at 320×180, scaled up with `image-rendering: pixelated`, and a
   game loop with `requestAnimationFrame` (update, then draw).
2. One background (placeholder shapes are fine) and a walk-area polygon.
3. Click to walk: pull the click inside the polygon, then move toward it at a
   fixed speed each frame.
4. Depth scaling: the character gets smaller toward the back of the room. Add a
   two-frame walk.

The mock-up does all four (look for `WALK`, `clampIn`, `walkTo`, `scaleAt` and
`frame`). Read it if you get stuck, but write your own.

## Open questions

- **Shared data:** keep one `game-data/` for both games and add a "stage" file
  per room (background, walk polygon, hotspot shapes tied to the YAML noun ids,
  where each character stands)? Recommended; decide after milestone 1.
- **The engine's seams:** `play.js` probably mixes "run this command" with
  "print this text". Separating them is what lets both front ends share it.
- **Music and sound:** later.

## Running

The mock-up is a single page, so open it in a browser. Once pushed to the
default branch, GitHub Pages serves it at
`https://joelgraff.github.io/dixon-adventure/graphical/mockup/landing-styles.html`.
