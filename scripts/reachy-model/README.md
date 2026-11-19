# Reachy Mini, web GLB

`reachy-mini.glb`: Reachy Mini in its rest pose (head upright, antennas up), for three.js. It is a plain GLB with no extensions (no Draco, no meshopt), so `GLTFLoader` loads it without any decoder.

## Source and licence

- Source: `pollen-robotics/reachy_mini`, commit `44ef44873ed3e8cb8052801771b799dd85522b6a`, folder `src/reachy_mini/descriptions/reachy_mini/mjcf/` (`reachy_mini.xml` and `assets/*.stl`, served through Git LFS). The MJCF was generated from Pollen's Onshape assembly by onshape-to-robot.
- The repository is Apache-2.0. Pollen's Hugging Face docs say the hardware designs are CC BY-SA-NC. This model is derived from those designs, so treat it as CC BY-SA-NC: credit Pollen, no commercial use, share derivatives under the same terms. Attribution text (also stored in the root node's `extras.attribution`):

  > Reachy Mini model © Pollen Robotics, CC BY-SA-NC, from pollen-robotics/reachy_mini

## File

|              |                                                                          |
| ------------ | ------------------------------------------------------------------------ |
| Size         | 1,716,104 bytes (1.64 MiB)                                               |
| Triangles    | 68,933                                                                   |
| Draw calls   | 9 (one mesh per node, one primitive per material)                        |
| Units / axes | metres, Y up, front of the robot towards +Z, the robot's left towards +X |
| Bounds       | x ±0.0775, y 0 → 0.3906 (antenna tips), z ±0.0775                        |
| Vertex data  | POSITION, NORMAL (smooth, split at creases over 40°)                     |

## Nodes

All translations are relative to the parent, with no rotation and unit scale, so each node's local axes match the world axes at rest. To animate, rotate a node about its `extras.axis` (for example `node.quaternion.setFromAxisAngle(new Vector3(...extras.axis), angle)`; `GLTFLoader` puts glTF extras in `object.userData`).

```
reachy_mini            root, extras.attribution
├── base               pivot (0, 0, 0): foot and the fixed turntable ring
└── turn               pivot (0, 0.035, 0), extras.axis [0, 1, 0]
    └── head           pivot (0, 0.19752, -0.00502) in world
        ├── antenna_left   pivot (0.05219, 0.22179, -0.03676) in world, extras.axis [-0.49726, -0.10453, 0.86128]
        └── antenna_right  pivot (-0.05219, 0.22179, -0.03676) in world, extras.axis [0.49726, -0.10453, 0.86128]
```

- `turn`: MuJoCo joint `yaw_body` (body `body_down_3dprint`). Contains the body shells, speaker, Stewart platform plate, tricap, arms and rods. Its axis is the vertical yaw axis at x = z = 0; the model is centred on it.
- `head`: MuJoCo body `xl_330` minus the antennas: head front/back shells, microphone top, glasses holder, both lenses, camera, neck reference, the Stewart ball ends on the head. Pivot = centre of the bounding box of the head shells. On the real robot the head moves with six degrees of freedom through the Stewart platform. Pollen's kinematic head frame (MuJoCo site `head`, at the platform's ball joints, under the head) is in `head.extras.stewart_head_frame`, relative to the head pivot: (0, -0.04775, 0.00502). No axis is given: nod about X, tilt about Z, turn about Y.
- `antenna_left` / `antenna_right`: MuJoCo joints `left_antenna` / `right_antenna` (bodies `dc15_a01_horn_dummy_8` / `_7`). Pivot = the joint anchor, axis = the joint axis converted to glTF. The axes are mirrored, so the same angle on both swings them in mirror image (+40° on the left and -40° on the right cross them over the head; see `check-posed.png`). MuJoCo joint range is unbounded for the antennas.
- The Stewart rods stay in `turn` (rigid at rest). If the head moves far from rest, they no longer meet the head; they sit inside the body and are only seen through the neck gap.

## Materials

Three PBR materials, chosen by STL name:

| Material  | Colour     | STL parts                                                                                                                                                                                                                                                                                   |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `shell`   | warm white | `body_down_3dprint`, `body_top_3dprint`, `head_front_3dprint`, `head_back_3dprint`, `head_mic_3dprint`, `neck_reference_3dprint`, `antenna_body_3dprint`                                                                                                                                    |
| `antenna` | black      | `antenna` (rod, spring and tip)                                                                                                                                                                                                                                                             |
| `dark`    | near-black | everything else that is kept: `body_foot_3dprint`, `body_turning_3dprint`, `stewart_main_plate_3dprint`, `stewart_tricap_3dprint`, `mp01062_stewart_arm_3`, `stewart_link_rod`, `stewart_link_ball__2`, `5w_speaker`, `glasses_dolder_3dprint`, `big_lens_d40`, `small_lens_d30`, `arducam` |

The foot is `dark` because the MJCF colours it dark grey (0.30). The real lenses are glass; here they are opaque dark discs, so the parts behind them (fisheye lenses, lens caps) are dropped.

## How it is built

`build.py` (run from a directory other than `src/`, Python in isolated mode):

```bash
uv run --with mujoco --with trimesh --with numpy --with pygltflib \
       --with fast_simplification --with embreex --with scipy --with networkx \
       python -I build.py src/reachy_mini.xml reachy-mini.glb
```

1. MuJoCo loads the MJCF and runs `mj_forward` at `qpos0`. The model has no keyframe. Its `qpos0` is the Onshape assembly pose, head upright and antennas up, and the five Stewart loop closures (`closing_k_1` / `closing_k_2` sites) coincide there; the script asserts it (gap < 0.1 mm).
2. Every visual geom (group 2) is placed with `geom_xpos` / `geom_xmat`, using MuJoCo's own processed mesh vertices (MuJoCo recentres meshes; the geom pose compensates). Collision geoms (group 3) and the scene (floor, props) are never read.
3. Hidden parts are dropped: rays are cast from 62 directions around the robot (none from under the table), and a part needs at least 100 first hits to stay. This removes the motors, horns, screws, connectors, bearing and antenna holders inside the shells.
4. Inner faces are culled: a face is kept only if a ray leaves the robot from it in some direction (either side of the face). This removes the inner walls of the 3D-printed shells, which held half of their triangles, but keeps inner surfaces that show through the neck gap.
5. Each part is decimated on its own (quadric, `fast_simplification`) to a cap per STL (in `CAPS`; shells get the most), then merged per node and material, welded, and given smooth normals split at 40° creases.
6. MuJoCo (Z up, X front) becomes glTF (Y up, Z front): `(x, y, z)_gltf = (y, z, x)_mujoco`. The base sits on y = 0, the yaw axis at x = z = 0.

## Previews

`preview-front.png`, `preview-three-quarter.png`, `preview-side.png` are rendered from the GLB itself (its nodes, normals and materials), not from MuJoCo. `check-posed.png` rotates `turn` by 35°, the head by -15° about X, and the antennas by ±40° about their `extras.axis`, to check the pivots.

The renderer is a simple painter's algorithm in matplotlib: the thin lines on the shells are its polygon outlines, not mesh defects.
