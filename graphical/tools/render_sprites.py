"""Render a rigged, animated character into sprite frames.

Open a .blend that holds one character and its animation (for example a
Mixamo walk imported as FBX), then run from a terminal:

    blender walk.blend --background --python graphical/tools/render_sprites.py -- --out sprites/player

Everything after the lone "--" belongs to this script:

    --out DIR          where to write the frames (default: sprites)
    --name NAME        folder name for this animation (default: the action's name)
    --action NAME      which action to render (default: the one on the armature)
    --directions LIST  any of front,back,left,right (default: right,front,back;
                       the game mirrors right to get left)
    --frames N         frames to sample from one cycle (default: 8)
    --elevation DEG    how far the camera looks down, in degrees (default: 20)
    --size PX          size of each rendered frame (default: 512)
    --light studio|flat   soft shading or none at all (default: studio)
    --color material|texture  flat material colors, or image textures (default: material)
    --turn DEG         extra turn, in degrees, if a character still isn't square
                       to the camera (positive turns it to its left)

The frames come out big and smooth. pixelate.py shrinks them to the game's
size. Each material renders as one flat color: its Base Color (Material
properties > Surface), or the average color of the image plugged into Base
Color. Use --color texture to keep the textures instead.

Output: DIR/NAME/<direction>/<direction>_00.png ... and DIR/NAME/meta.json,
which records the frame size, the point between the feet (the anchor the
game positions the sprite by) and how tall the character is in the render.
"""
import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

FACING = {"right": 0.0, "back": math.pi / 2, "left": math.pi, "front": -math.pi / 2}
RENDERABLE = {"MESH", "CURVE", "CURVES", "SURFACE", "META", "FONT", "VOLUME",
              "GPENCIL", "GREASEPENCIL", "POINTCLOUD"}


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser(prog="render_sprites.py")
    p.add_argument("--out", default="sprites")
    p.add_argument("--name")
    p.add_argument("--action")
    p.add_argument("--directions", default="right,front,back")
    p.add_argument("--frames", type=int, default=8)
    p.add_argument("--elevation", type=float, default=20.0)
    p.add_argument("--size", type=int, default=512)
    p.add_argument("--light", choices=["studio", "flat"], default="studio")
    p.add_argument("--color", choices=["material", "texture"], default="material")
    p.add_argument("--turn", type=float, default=0.0)
    a = p.parse_args(argv)
    a.directions = [d.strip() for d in a.directions.split(",") if d.strip()]
    for d in a.directions:
        if d not in FACING:
            p.error(f"unknown direction {d!r}; use front, back, left or right")
    return a


def fail(msg):
    print(f"render_sprites: {msg}", file=sys.stderr)
    sys.exit(1)


def find_armature(scene, action_name):
    arms = [o for o in scene.objects if o.type == "ARMATURE"]
    if not arms:
        fail("no armature in this file. Import the character from Mixamo first.")
    if action_name:
        act = bpy.data.actions.get(action_name)
        if not act:
            names = ", ".join(a.name for a in bpy.data.actions) or "none"
            fail(f"no action named {action_name!r}. Actions in this file: {names}")
        arm = arms[0]
        if arm.animation_data is None:
            arm.animation_data_create()
        arm.animation_data.action = act
        slots = getattr(act, "slots", None)
        if slots and hasattr(arm.animation_data, "action_slot"):
            arm.animation_data.action_slot = slots[0]
        return arm, act
    for arm in arms:
        ad = arm.animation_data
        if ad and ad.action:
            return arm, ad.action
    fail("the armature has no animation. Import a Mixamo animation, or pass --action NAME.")


def character_meshes(scene, arm):
    found = set(arm.children_recursive)
    for o in scene.objects:
        for m in getattr(o, "modifiers", []):
            if m.type == "ARMATURE" and m.object == arm:
                found.add(o)
    return [o for o in found if o.type in RENDERABLE]


def facing_angle(arm):
    """Which way the character faces, from where its left and right bones sit.

    It reads the rest pose (the symmetric pose the skeleton was built in), not
    the animation: mid-stride, one arm and leg are forward, which would skew
    the answer by several degrees."""
    left, right = [], []
    for bone in arm.data.bones:
        n = bone.name
        side = None
        if "Left" in n or n.endswith((".L", "_L", ".l", "_l")):
            side = left
        elif "Right" in n or n.endswith((".R", "_R", ".r", "_r")):
            side = right
        if side is not None:
            side.append(arm.matrix_world @ bone.head_local)
    if not left or not right:
        print("render_sprites: can't tell left from right on this rig; assuming it faces the camera")
        return FACING["front"]
    lv = sum(left, Vector()) / len(left) - sum(right, Vector()) / len(right)
    lv.z = 0
    if lv.length < 1e-6:
        return FACING["front"]
    fwd = lv.normalized().cross(Vector((0, 0, 1)))  # facing = left x up
    return math.atan2(fwd.y, fwd.x)


def world_corners(depsgraph, objs):
    pts = []
    for o in objs:
        ev = o.evaluated_get(depsgraph)
        pts += [ev.matrix_world @ Vector(c) for c in ev.bound_box]
    return pts


def texture_average(img):
    """The average color of an image texture, as one flat color."""
    import numpy as np
    px = np.empty(len(img.pixels), dtype=np.float32)
    img.pixels.foreach_get(px)
    px = px.reshape(-1, 4)
    w = px[:, 3:4]
    rgb = (px[:, :3] * w).sum(0) / max(float(w.sum()), 1e-6)
    if img.colorspace_settings.name.lower().startswith("srgb"):
        rgb = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return (float(rgb[0]), float(rgb[1]), float(rgb[2]), 1.0)


def material_colors(objs, mode):
    """In material mode each material renders as one flat color: its Base Color,
    or the average of the image plugged into Base Color. A material without
    either keeps its Viewport Display color."""
    if mode != "material":
        return
    done = set()
    for o in objs:
        for slot in getattr(o, "material_slots", []):
            mat = slot.material
            if not mat or mat.name in done:
                continue
            done.add(mat.name)
            tree = getattr(mat, "node_tree", None)
            for node in (tree.nodes if tree else []):
                base = node.inputs.get("Base Color") if hasattr(node, "inputs") else None
                if base is None:
                    continue
                if not base.is_linked:
                    mat.diffuse_color = tuple(base.default_value)
                else:
                    src = base.links[0].from_node
                    img = getattr(src, "image", None)
                    if img is not None and img.size[0] > 0:
                        mat.diffuse_color = texture_average(img)
                break


def main():
    a = parse_args()
    scene = bpy.context.scene
    arm, act = find_armature(scene, a.action)
    meshes = character_meshes(scene, arm)
    if not meshes:
        fail(f"nothing is attached to the armature {arm.name!r}, so there is nothing to render.")
    name = a.name or "".join(c if c.isalnum() or c in "-_" else "_" for c in act.name)
    out = os.path.abspath(os.path.join(a.out, name))

    # Only the character renders.
    for o in scene.objects:
        if o.type in RENDERABLE and o not in meshes:
            o.hide_render = True
    material_colors(meshes, a.color)

    # Workbench: fast, flat, and the colors come straight from the materials.
    scene.render.engine = "BLENDER_WORKBENCH"
    shading = scene.display.shading
    shading.light = "STUDIO" if a.light == "studio" else "FLAT"
    shading.color_type = "MATERIAL" if a.color == "material" else "TEXTURE"
    # Blender renames these between versions, so set whichever exists.
    for names in (("show_shadow", "show_shadows"), ("show_cavity",), ("show_object_outline",)):
        for n in names:
            if hasattr(shading, n):
                setattr(shading, n, False)
    if hasattr(scene.display, "render_aa"):
        scene.display.render_aa = "8"
    scene.view_settings.view_transform = "Standard"
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = a.size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"

    # One cycle of the action, sampled evenly (the last frame of a loop is
    # usually the same pose as the first, so it is left out).
    start, end = act.frame_range
    span = max(end - start, 1.0)
    samples = [start + span * i / a.frames for i in range(a.frames)]

    def go(f):
        scene.frame_set(int(math.floor(f)), subframe=f - math.floor(f))

    go(start)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    pts = world_corners(depsgraph, meshes)
    pivot = Vector(((min(p.x for p in pts) + max(p.x for p in pts)) / 2,
                    (min(p.y for p in pts) + max(p.y for p in pts)) / 2,
                    min(p.z for p in pts)))
    base_matrix = arm.matrix_world.copy()
    base_facing = facing_angle(arm)

    def turn(direction):
        rz = Matrix.Rotation(FACING[direction] - base_facing + math.radians(a.turn), 4, "Z")
        arm.matrix_world = Matrix.Translation(pivot) @ rz @ Matrix.Translation(-pivot) @ base_matrix

    # The camera looks north (+Y) and down by the elevation angle.
    e = math.radians(a.elevation)
    look = Vector((0, math.cos(e), -math.sin(e)))
    up = Vector((0, math.sin(e), math.cos(e)))
    right = Vector((1, 0, 0))

    # One scale for every direction, so a pixel is the same size in all of them.
    xs, ys, front_ys = [], [], []
    for d in a.directions:
        turn(d)
        for f in samples:
            go(f)
            for p in world_corners(bpy.context.evaluated_depsgraph_get(), meshes):
                xs.append((p - pivot).dot(right))
                ys.append((p - pivot).dot(up))
    turn("front")
    go(start)
    for p in world_corners(bpy.context.evaluated_depsgraph_get(), meshes):
        front_ys.append((p - pivot).dot(up))
    cx, cy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2
    view = max(max(xs) - min(xs), max(ys) - min(ys)) * 1.1

    cam_data = bpy.data.cameras.new("SpriteCamera")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = view
    cam = bpy.data.objects.new("SpriteCamera", cam_data)
    scene.collection.objects.link(cam)
    dist = view * 4 + 10
    cam.location = pivot + right * cx + up * cy - look * dist
    cam.rotation_euler = (math.pi / 2 - e, 0, 0)
    cam_data.clip_end = dist * 3
    scene.camera = cam

    to_px = a.size / view
    anchor = [(0 - (cx - view / 2)) * to_px, ((cy + view / 2) - 0) * to_px]
    height_px = (max(front_ys) - min(front_ys)) * to_px

    for d in a.directions:
        turn(d)
        os.makedirs(os.path.join(out, d), exist_ok=True)
        for i, f in enumerate(samples):
            go(f)
            scene.render.filepath = os.path.join(out, d, f"{d}_{i:02d}.png")
            bpy.ops.render.render(write_still=True)
        print(f"render_sprites: {d}: {len(samples)} frames")
    arm.matrix_world = base_matrix

    meta = {
        "name": name,
        "action": act.name,
        "directions": a.directions,
        "frames": a.frames,
        "size": a.size,
        "elevation": a.elevation,
        "anchor": [round(anchor[0], 2), round(anchor[1], 2)],
        "character_height_px": round(height_px, 2),
        "cycle_seconds": round(span / (scene.render.fps / scene.render.fps_base), 4),
    }
    with open(os.path.join(out, "meta.json"), "w") as fh:
        json.dump(meta, fh, indent=2)
    print(f"render_sprites: wrote {out}")


main()
