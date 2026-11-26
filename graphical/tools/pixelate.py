"""Turn the big frames from render_sprites.py into game-size pixel sprites.

    python3 graphical/tools/pixelate.py sprites/player/walk --heights 26,36,50

It also writes index.json, listing every size in the folder.

For each height (the character's height in game pixels) it writes
sprites/player/walk/h26/sheet.png, a 4x enlarged preview.png to look at
(when you ask for five sizes or fewer, or pass --preview), and
sheet.json, which tells the game the frame size, the anchor (the point
between the feet that gets placed on the ground) and which row holds which
direction.

Options:
    --heights LIST     character heights in pixels (default: 26,36,50). Ranges
                       work too: 12-52 is every size from 12 to 52, and
                       12-52:2 is every second one
    --palette FILE     snap to these colors (one #rrggbb per line); without it,
                       the script picks the best --colors colors for this character
    --colors N         how many colors to pick when there's no palette (default: 16)
    --outline COLOR    a 1-pixel outline, as #rrggbb, or "none" (default: #1b1612)
    --alpha N          how solid a pixel must be to stay, 0-255 (default: 128)
    --preview          write preview.png for every size (it's written anyway
                       when you ask for five sizes or fewer)

Needs Pillow: pip install pillow
"""
import argparse
import json
import os
import re
import sys

from PIL import Image, ImageChops


def parse_args():
    p = argparse.ArgumentParser(prog="pixelate.py")
    p.add_argument("folder", help="a folder written by render_sprites.py (it holds meta.json)")
    p.add_argument("--heights", default="26,36,50")
    p.add_argument("--palette")
    p.add_argument("--colors", type=int, default=16)
    p.add_argument("--outline", default="#1b1612")
    p.add_argument("--alpha", type=int, default=128)
    p.add_argument("--preview", action="store_true")
    a = p.parse_args()
    heights = set()
    for part in a.heights.split(","):
        part = part.strip()
        m = re.fullmatch(r"(\d+)-(\d+)(?::(\d+))?", part)
        if m:  # a range: 12-52 (every size) or 12-52:2 (every second size)
            lo, hi, step = int(m.group(1)), int(m.group(2)), int(m.group(3) or 1)
            heights.update(range(lo, hi + 1, step))
        elif part:
            heights.add(int(part))
    a.heights = sorted(heights)
    return a


def hex_rgb(h):
    h = h.strip().lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def palette_image(colors):
    flat = [c for rgb in colors for c in rgb]
    flat += flat[:3] * (256 - len(colors))  # pad with a repeat of the first color
    img = Image.new("P", (1, 1))
    img.putpalette(flat)
    return img


def d2(a, b):
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2


def pick_colors(pts, k):
    """Choose k colors that cover every distinct color in pts.

    It starts from the darkest color and keeps adding whichever color is
    furthest from everything chosen so far, so a small light face or a dark
    hat always gets a color of its own. A few rounds of averaging (k-means)
    then settle each choice into the middle of its group."""
    pts = list(pts)
    if len(pts) <= k:
        return pts
    centers = [min(pts, key=sum)]
    dist = [d2(p, centers[0]) for p in pts]
    while len(centers) < k:
        i = max(range(len(pts)), key=dist.__getitem__)
        centers.append(pts[i])
        dist = [min(dist[j], d2(pts[j], pts[i])) for j in range(len(pts))]
    for _ in range(6):
        groups = [[] for _ in centers]
        for p in pts:
            groups[min(range(len(centers)), key=lambda c: d2(p, centers[c]))].append(p)
        centers = [tuple(round(sum(ch) / len(g)) for ch in zip(*g)) if g else c
                   for g, c in zip(groups, centers)]
    return centers


def shrink(frame, size):
    # Average in premultiplied alpha so edges don't pick up dark fringes.
    return frame.convert("RGBa").resize((size, size), Image.BOX).convert("RGBA")


def solid(alpha, threshold):
    return alpha.point(lambda v: 255 if v >= threshold else 0)


def grow(mask):
    """The mask plus one pixel up, down, left and right."""
    w, h = mask.size
    out = mask.copy()
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        shifted = Image.new("L", (w, h), 0)
        shifted.paste(mask, (dx, dy))
        out = ImageChops.lighter(out, shifted)
    return out


def main():
    a = parse_args()
    meta_path = os.path.join(a.folder, "meta.json")
    if not os.path.exists(meta_path):
        sys.exit(f"pixelate: no meta.json in {a.folder}. Point this at a folder made by render_sprites.py.")
    meta = json.load(open(meta_path))
    dirs, n, size = meta["directions"], meta["frames"], meta["size"]
    frames = {d: [Image.open(os.path.join(a.folder, d, f"{d}_{i:02d}.png")).convert("RGBA")
                  for i in range(n)] for d in dirs}
    # How tall the character really is in the render: the solid pixels of the
    # first front-facing frame (or the first frame there is).
    first = frames["front"][0] if "front" in frames else frames[dirs[0]][0]
    bb = solid(first.getchannel("A"), a.alpha).getbbox()
    char_px = (bb[3] - bb[1]) if bb else meta["character_height_px"]
    outline = None if a.outline.lower() == "none" else hex_rgb(a.outline)
    fixed = None
    if a.palette:
        fixed = [hex_rgb(m) for line in open(a.palette) if not line.lstrip().startswith(";")
                 for m in re.findall(r"#?\b[0-9a-fA-F]{6}\b", line)]
        if not fixed:
            sys.exit(f"pixelate: no #rrggbb colors found in {a.palette}")

    for height in a.heights:
        scale = height / char_px
        small = max(1, round(size * scale))
        pad = 2
        shrunk = {}
        for d in dirs:
            shrunk[d] = []
            for f in frames[d]:
                s = shrink(f, small)
                canvas = Image.new("RGBA", (small + pad * 2, small + pad * 2), (0, 0, 0, 0))
                canvas.paste(s, (pad, pad))
                shrunk[d].append(canvas)

        # One palette for every frame, so colors don't flicker between frames.
        if fixed:
            colors = fixed
        else:
            # Count each distinct color once, so a small face or hat gets its
            # own colors instead of being outvoted by a big coat.
            seen = set()
            for d in dirs:
                for f in shrunk[d]:
                    data = f.get_flattened_data() if hasattr(f, "get_flattened_data") else f.getdata()
                    seen.update(p[:3] for p in data if p[3] >= a.alpha)
            colors = pick_colors(sorted(seen), a.colors) or [(0, 0, 0)]
        pal_img = palette_image(colors)

        done = {}
        box = None
        for d in dirs:
            done[d] = []
            for f in shrunk[d]:
                mask = solid(f.getchannel("A"), a.alpha)
                rgb = f.convert("RGB").quantize(palette=pal_img, dither=Image.Dither.NONE).convert("RGB")
                out = Image.new("RGBA", f.size, (0, 0, 0, 0))
                out.paste(rgb, (0, 0), mask)
                if outline:
                    ring = ImageChops.subtract(grow(mask), mask)
                    out.paste(outline + (255,), (0, 0), ring)
                done[d].append(out)
                bb = out.getchannel("A").getbbox()
                if bb:
                    box = bb if box is None else (min(box[0], bb[0]), min(box[1], bb[1]),
                                                  max(box[2], bb[2]), max(box[3], bb[3]))
        if box is None:
            sys.exit("pixelate: every frame came out empty. Is the character in the renders?")

        # Crop every frame to the same box and lay them out: one row per direction.
        fw, fh = box[2] - box[0], box[3] - box[1]
        sheet = Image.new("RGBA", (fw * n, fh * len(dirs)), (0, 0, 0, 0))
        for r, d in enumerate(dirs):
            for i, f in enumerate(done[d]):
                sheet.paste(f.crop(box), (i * fw, r * fh))
        ax = meta["anchor"][0] * small / size + pad - box[0]
        ay = meta["anchor"][1] * small / size + pad - box[1]

        out_dir = os.path.join(a.folder, f"h{height}")
        os.makedirs(out_dir, exist_ok=True)
        sheet.save(os.path.join(out_dir, "sheet.png"))
        if a.preview or len(a.heights) <= 5:
            sheet.resize((sheet.width * 4, sheet.height * 4), Image.NEAREST).save(os.path.join(out_dir, "preview.png"))
        info = {
            "image": "sheet.png",
            "frame_width": fw,
            "frame_height": fh,
            "anchor": [round(ax), round(ay)],
            "rows": {d: r for r, d in enumerate(dirs)},
            "frames": n,
            "fps": round(n / meta["cycle_seconds"], 2) if meta.get("cycle_seconds") else 8,
            "character_height": height,
            "colors": ["#%02x%02x%02x" % c for c in colors],
        }
        with open(os.path.join(out_dir, "sheet.json"), "w") as fh_:
            json.dump(info, fh_, indent=2)
        print(f"pixelate: {height}px tall -> {out_dir} ({fw}x{fh} frames, {len(colors)} colors)")

    # List every size that exists in this folder, so the game knows what it can load.
    heights = sorted(int(n[1:]) for n in os.listdir(a.folder)
                     if re.fullmatch(r"h\d+", n) and os.path.exists(os.path.join(a.folder, n, "sheet.json")))
    with open(os.path.join(a.folder, "index.json"), "w") as fh_:
        json.dump({"heights": heights}, fh_)


main()
