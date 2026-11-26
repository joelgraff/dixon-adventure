# Sprite tools

Two scripts turn a 3D character from Blender into game sprites.

1. `render_sprites.py` runs inside Blender. It renders one animation from a
   fixed camera, facing right, toward you and away, as large smooth frames.
2. `pixelate.py` runs in plain Python. It shrinks those frames to game size,
   gives every frame the same small set of colors, adds a 1-pixel outline and
   lays them out on a sprite sheet with a JSON file for the game.

Rendering once and pixelating separately means you can try different sizes,
palettes and outlines in seconds without rendering again.

## Before you start

- Use the official Blender from blender.org (5.x). A distro-packaged Blender
  may have a broken FBX importer.
- `pip install pillow` for `pixelate.py`.

## 1. Make the .blend

1. In a new file, delete the default cube, camera and light.
2. File → Import → FBX: the Mixamo download (walk, downloaded **with skin**,
   with **In Place** ticked).
3. Give each material its color: Material properties → Surface → **Base
   Color**. Each material renders as one flat color. If Base Color has an
   image plugged in, the script uses that image's average color.
4. Press Space to check that it walks, then save it, for example as
   `player-walk.blend`.

One animation per file keeps things simple. For the idle, import the idle FBX
into a new file and save it as `player-idle.blend`.

## 2. Render

From the repository root:

```bash
~/apps/blender-5.3/blender player-walk.blend --background --python graphical/tools/render_sprites.py -- --out graphical/sprites/player --name walk
```

This writes `graphical/sprites/player/walk/right/`, `front/`, `back/` (eight
512×512 frames each) and `meta.json`. It takes a few seconds.

Useful options (after the `--`):

| Option | Default | What it does |
|---|---|---|
| `--frames 8` | 8 | How many frames to take from one walk cycle |
| `--elevation 20` | 20 | How far the camera looks down, in degrees; match the backgrounds |
| `--directions right,front,back` | those three | The game mirrors `right` to get `left` |
| `--light flat` | `studio` | No shading at all, only flat color |
| `--action NAME` | the armature's | Pick an action when the file has several |
| `--turn 3` | 0 | Turn the character a few more degrees if it still isn't square to the camera |

## 3. Pixelate

```bash
python3 graphical/tools/pixelate.py graphical/sprites/player/walk --heights 26,36,50
```

For each height it writes `h26/sheet.png` (the sprite sheet: one row per
direction), `h26/preview.png` (the same, 4× bigger, to look at) and
`h26/sheet.json`:

```json
{ "frame_width": 31, "frame_height": 41, "anchor": [15, 38],
  "rows": { "right": 0, "front": 1, "back": 2 }, "frames": 8, "fps": 6 }
```

For the game, make every size the character can appear at, so there is
always one within a pixel of the right height as it walks toward or away from
you: `--heights 12-52`. It takes a few seconds and each sheet is small.

The `anchor` is the point between the feet: the game puts that pixel on the
spot where the character stands.

Options: `--palette graphical/tools/palettes/dusk32.txt` snaps to the
mock-up's 32 colors instead of picking 16 for this character; `--colors 12`
picks fewer; `--outline none` drops the outline; `--outline #3d2b20` changes
its color.

## Git

The large raw frames (the `right/`, `front/`, `back/`, `left/` folders) are
ignored by `graphical/sprites/.gitignore`. The sheets, previews and JSON files
are small and get committed, because the game loads them.
