"""Build a web-ready GLB of Reachy Mini from Pollen Robotics' MuJoCo description.

Usage (from any directory, Python in isolated mode):
  uv run --with mujoco --with trimesh --with numpy --with pygltflib \
         --with fast_simplification --with embreex \
         python -I build.py <path/to/mjcf/reachy_mini.xml> <out.glb>

Pipeline:
1. Load the MJCF with MuJoCo, mj_forward at qpos0 (the model has no keyframe; the
   Onshape export is in its assembly pose: head upright, antennas up, and every
   Stewart closing site coincides with its pair, so the loop is closed there).
2. Take every visual geom (group 2), with MuJoCo's own processed mesh vertices
   (MuJoCo recentres meshes, geom_xpos/geom_xmat compensate) placed at their
   world pose.
3. Drop parts no camera can see: ray-cast an ID buffer from 62 directions around
   the robot (none from under the table) and keep geoms with enough visible hits.
4. Assign each geom to a node (base / turn / head / antenna_left / antenna_right)
   from its MuJoCo body, and to a material (shell / dark / antenna) from its STL name.
5. Merge per node and material, decimate (quadric), split normals at creases.
6. Convert Z-up to Y-up (front = +Z), put the base on y=0, yaw axis at x=z=0,
   write a plain GLB (no Draco, no meshopt, no extensions).
"""

import json
import sys

import fast_simplification
import mujoco
import numpy as np
import pygltflib
import trimesh

# ---- mapping -----------------------------------------------------------------

SHELL = {
    "body_down_3dprint", "body_top_3dprint", "head_front_3dprint", "head_back_3dprint",
    "head_mic_3dprint", "antenna_body_3dprint", "neck_reference_3dprint",
}
ANTENNA = {"antenna"}
# Everything else is "dark": foot, turning ring, Stewart plate/tricap/arms/rods/balls,
# motors and horns, screws, connectors, bearing, speaker, camera, lenses, lens caps,
# glasses holder, antenna holders and interfaces.

MATERIALS = {
    # name: (baseColor RGBA, metallic, roughness)
    "shell": ([0.93, 0.93, 0.91, 1.0], 0.0, 0.55),
    "dark": ([0.10, 0.10, 0.11, 1.0], 0.1, 0.5),
    "antenna": ([0.03, 0.03, 0.03, 1.0], 0.2, 0.35),
}

# Triangle cap per part after decimation (each part is decimated on its own, then
# merged per node and material). Shells and antennas keep the most; parts that are
# barely visible get the default for their visibility.
CAPS = {
    "body_top_3dprint": 14000, "body_down_3dprint": 12000, "head_front_3dprint": 13000,
    "head_back_3dprint": 13000, "head_mic_3dprint": 6000, "neck_reference_3dprint": 1500,
    "body_foot_3dprint": 5000, "body_turning_3dprint": 1500, "antenna": 1800,
    "antenna_body_3dprint": 1500, "glasses_dolder_3dprint": 3000, "big_lens_d40": 900,
    "small_lens_d30": 900, "stewart_tricap_3dprint": 800, "5w_speaker": 400,
    "stewart_link_rod": 250, "mp01062_stewart_arm_3": 300, "stewart_link_ball__2": 150,
    "stewart_main_plate_3dprint": 400, "arducam": 300,
}
DEFAULT_CAP = 150
MIN_VISIBLE_HITS = 100    # rays (of ~6M) that must land first on a part to keep it

YAW_JOINT = "yaw_body"
HEAD_BODY = "xl_330"
ANTENNA_BODIES = {"antenna_left": "left_antenna", "antenna_right": "right_antenna"}


def material_of(mesh_name: str) -> str:
    if mesh_name in SHELL:
        return "shell"
    if mesh_name in ANTENNA:
        return "antenna"
    return "dark"


# ---- MuJoCo ------------------------------------------------------------------

def load(xml):
    m = mujoco.MjModel.from_xml_path(xml)
    d = mujoco.MjData(m)
    mujoco.mj_forward(m, d)
    # sanity: the closed Stewart loop is satisfied in this pose
    names = [m.site(i).name for i in range(m.nsite)]
    for k in range(1, 6):
        a, b = names.index(f"closing_{k}_1"), names.index(f"closing_{k}_2")
        gap = np.linalg.norm(d.site_xpos[a] - d.site_xpos[b])
        assert gap < 1e-4, f"closing_{k} gap {gap}"
    return m, d


def descendants(m, root):
    out = {root}
    for b in range(m.nbody):
        p = b
        while p != 0:
            if p == root:
                out.add(b)
                break
            p = m.body_parentid[p]
    return out


def node_of_bodies(m):
    yaw = m.joint(YAW_JOINT)
    turn_root = yaw.bodyid[0]
    head_root = m.body(HEAD_BODY).id
    ant = {n: m.joint(j).bodyid[0] for n, j in ANTENNA_BODIES.items()}
    owner = {}
    for b in range(m.nbody):
        owner[b] = "base"
    for b in descendants(m, turn_root):
        owner[b] = "turn"
    for b in descendants(m, head_root):
        owner[b] = "head"
    for n, root in ant.items():
        for b in descendants(m, root):
            owner[b] = n
    return owner


def world_geoms(m, d):
    owner = node_of_bodies(m)
    parts = []
    for g in range(m.ngeom):
        if m.geom_group[g] != 2 or m.geom_type[g] != mujoco.mjtGeom.mjGEOM_MESH:
            continue
        body = m.geom_bodyid[g]
        if owner.get(body) is None or body == 0:
            continue
        mid = m.geom_dataid[g]
        va, vn = m.mesh_vertadr[mid], m.mesh_vertnum[mid]
        fa, fn = m.mesh_faceadr[mid], m.mesh_facenum[mid]
        v = m.mesh_vert[va:va + vn].astype(np.float64)
        f = m.mesh_face[fa:fa + fn].astype(np.int64)
        R = d.geom_xmat[g].reshape(3, 3)
        v = v @ R.T + d.geom_xpos[g]
        name = m.mesh(mid).name
        parts.append(dict(geom=g, mesh=name, node=owner[body], material=material_of(name),
                          v=v, f=f))
    return parts


# ---- visibility ----------------------------------------------------------------

def fibonacci_dirs(n):
    i = np.arange(n) + 0.5
    phi = np.arccos(1 - 2 * i / n)
    theta = np.pi * (1 + 5 ** 0.5) * i
    return np.stack([np.cos(theta) * np.sin(phi), np.sin(theta) * np.sin(phi), np.cos(phi)], 1)


def visible_hits(parts, res=320):
    V = np.concatenate([p["v"] for p in parts])
    offs = np.cumsum([0] + [len(p["v"]) for p in parts])
    F = np.concatenate([p["f"] + offs[i] for i, p in enumerate(parts)])
    owner = np.concatenate([np.full(len(p["f"]), i) for i, p in enumerate(parts)])
    mesh = trimesh.Trimesh(V, F, process=False)
    center = (V.min(0) + V.max(0)) / 2
    radius = np.linalg.norm(V.max(0) - V.min(0)) / 2 * 1.05
    dirs = fibonacci_dirs(80)
    dirs = dirs[dirs[:, 2] > -0.25]          # nobody looks from under the table
    hits = np.zeros(len(parts), dtype=np.int64)
    s = np.linspace(-radius, radius, res)
    gu, gv = np.meshgrid(s, s)
    for dvec in dirs:                        # dvec: from robot towards the eye
        up = np.array([0, 0, 1.0]) if abs(dvec[2]) < 0.9 else np.array([1.0, 0, 0])
        u = np.cross(up, dvec); u /= np.linalg.norm(u)
        w = np.cross(dvec, u)
        origins = center + dvec * radius * 2 + gu.reshape(-1, 1) * u + gv.reshape(-1, 1) * w
        tri = mesh.ray.intersects_first(origins, np.repeat(-dvec[None], len(origins), 0))
        tri = tri[tri >= 0]
        hits += np.bincount(owner[tri], minlength=len(parts))
    return hits


def cull_interior(parts, n_dirs=24, eps=2e-5):
    """Keep only faces from which at least one ray leaves the robot (towards anywhere
    but under the table). Removes the inner walls of the printed shells and anything
    buried, while keeping inner surfaces seen through an opening (neck gap, eyes)."""
    V = np.concatenate([p["v"] for p in parts])
    offs = np.cumsum([0] + [len(p["v"]) for p in parts])
    F = np.concatenate([p["f"] + offs[i] for i, p in enumerate(parts)])
    scene = trimesh.Trimesh(V, F, process=False)
    dirs = fibonacci_dirs(n_dirs * 2)
    dirs = dirs[dirs[:, 2] > -0.25]
    for p in parts:
        t = p["v"][p["f"]]
        c = t.mean(1)
        n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0])
        n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-15)
        keep = np.zeros(len(t), bool)
        for side in (1, -1):              # the face may be seen from either side
            for dvec in dirs:
                todo = ~keep & ((n @ dvec) * side > 0.05)
                if not todo.any():
                    continue
                o = c[todo] + side * n[todo] * eps
                hit = scene.ray.intersects_any(o, np.repeat(dvec[None], len(o), 0))
                idx = np.flatnonzero(todo)[~hit]
                keep[idx] = True
        p["f"] = p["f"][keep]


# ---- geometry ------------------------------------------------------------------

def merge(parts):
    vs, fs, n = [], [], 0
    for p in parts:
        vs.append(p["v"]); fs.append(p["f"] + n); n += len(p["v"])
    return np.concatenate(vs), np.concatenate(fs)


def decimate(v, f, target):
    if len(f) <= target:
        return v, f
    reduction = 1 - target / len(f)
    # work in millimetres: the quadric thresholds behave better than in metres.
    # Some CAD parts (Stewart rods, arms) stall above their target; we accept that.
    v2, f2 = fast_simplification.simplify((v * 1000).astype(np.float32), f.astype(np.int32),
                                          target_reduction=reduction)
    return v2.astype(np.float64) / 1000, f2.astype(np.int64)


def crease_split(v, f, angle_deg=40):
    mesh = trimesh.Trimesh(v, f, process=True)
    mesh.remove_unreferenced_vertices()
    # drop degenerate faces left by decimation
    mesh.update_faces(mesh.nondegenerate_faces())
    sm = trimesh.graph.smooth_shade(mesh, angle=np.radians(angle_deg))
    return np.asarray(sm.vertices), np.asarray(sm.faces), np.asarray(sm.vertex_normals)


def to_gltf(p):
    """MuJoCo (x fwd, y left, z up) -> glTF (x right-of-viewer, y up, z towards viewer)."""
    p = np.asarray(p, dtype=np.float64)
    return np.stack([p[..., 1], p[..., 2], p[..., 0]], -1)


# ---- GLB writer ------------------------------------------------------------------

class Writer:
    def __init__(self):
        self.g = pygltflib.GLTF2(asset=pygltflib.Asset(generator="reachy-mini build.py", version="2.0"))
        self.blob = bytearray()
        self.g.buffers = [pygltflib.Buffer(byteLength=0)]
        self.mat = {}
        for name, (rgba, metal, rough) in MATERIALS.items():
            self.mat[name] = len(self.g.materials)
            self.g.materials.append(pygltflib.Material(
                name=name,
                pbrMetallicRoughness=pygltflib.PbrMetallicRoughness(
                    baseColorFactor=rgba, metallicFactor=metal, roughnessFactor=rough)))

    def _view(self, data: bytes, target):
        while len(self.blob) % 4:
            self.blob.append(0)
        off = len(self.blob)
        self.blob += data
        self.g.bufferViews.append(pygltflib.BufferView(buffer=0, byteOffset=off,
                                                       byteLength=len(data), target=target))
        return len(self.g.bufferViews) - 1

    def _acc(self, arr, ctype, typ, target, minmax=False):
        view = self._view(arr.tobytes(), target)
        acc = pygltflib.Accessor(bufferView=view, componentType=ctype, count=len(arr), type=typ)
        if minmax:
            acc.min = arr.min(0).tolist(); acc.max = arr.max(0).tolist()
        self.g.accessors.append(acc)
        return len(self.g.accessors) - 1

    def mesh(self, name, prims):
        out = []
        for mat, v, f, n in prims:
            pos = self._acc(v.astype(np.float32), pygltflib.FLOAT, "VEC3", pygltflib.ARRAY_BUFFER, True)
            nor = self._acc(n.astype(np.float32), pygltflib.FLOAT, "VEC3", pygltflib.ARRAY_BUFFER)
            idx_t = np.uint16 if len(v) < 65536 else np.uint32
            ctype = pygltflib.UNSIGNED_SHORT if idx_t is np.uint16 else pygltflib.UNSIGNED_INT
            idx = self._acc(f.astype(idx_t).reshape(-1), ctype, "SCALAR", pygltflib.ELEMENT_ARRAY_BUFFER)
            out.append(pygltflib.Primitive(attributes=pygltflib.Attributes(POSITION=pos, NORMAL=nor),
                                           indices=idx, material=self.mat[mat]))
        self.g.meshes.append(pygltflib.Mesh(name=name, primitives=out))
        return len(self.g.meshes) - 1

    def node(self, **kw):
        self.g.nodes.append(pygltflib.Node(**kw))
        return len(self.g.nodes) - 1

    def save(self, path):
        self.g.buffers[0].byteLength = len(self.blob)
        self.g.set_binary_blob(bytes(self.blob))
        self.g.save_binary(path)


# ---- main ------------------------------------------------------------------------

def main(xml, out):
    m, d = load(xml)
    parts = world_geoms(m, d)
    hits = visible_hits(parts)
    kept, dropped = [], []
    for p, h in zip(parts, hits):
        p["hits"] = int(h)
        (kept if h >= MIN_VISIBLE_HITS else dropped).append(p)

    cull_interior(kept)
    kept = [p for p in kept if len(p["f"])]

    # world-space pivots (MuJoCo frame)
    yaw = m.joint(YAW_JOINT).id
    yaw_anchor, yaw_axis = d.xanchor[yaw].copy(), d.xaxis[yaw].copy()
    head_shell = [p for p in kept if p["node"] == "head" and p["material"] == "shell"]
    hv = np.concatenate([p["v"] for p in head_shell])
    head_center = (hv.min(0) + hv.max(0)) / 2
    head_site = d.site_xpos[m.site("head").id].copy()
    ant = {}
    for n, j in ANTENNA_BODIES.items():
        jid = m.joint(j).id
        ant[n] = (d.xanchor[jid].copy(), d.xaxis[jid].copy())

    # glTF frame: base on y=0, yaw axis at x=z=0
    allv = to_gltf(np.concatenate([p["v"] for p in kept]))
    shift = np.array([-to_gltf(yaw_anchor)[0], -allv[:, 1].min(), -to_gltf(yaw_anchor)[2]])

    def G(p):
        return to_gltf(p) + shift

    pivots = {
        "base": np.zeros(3),
        "turn": G(yaw_anchor),
        "head": G(head_center),
        "antenna_left": G(ant["antenna_left"][0]),
        "antenna_right": G(ant["antenna_right"][0]),
    }
    axes = {
        "turn": to_gltf(yaw_axis),
        "antenna_left": to_gltf(ant["antenna_left"][1]),
        "antenna_right": to_gltf(ant["antenna_right"][1]),
    }
    parent = {"head": "turn", "antenna_left": "head", "antenna_right": "head"}

    # triangle budget by (node, material), weighted by the material's priority
    groups = {}
    for p in kept:
        groups.setdefault((p["node"], p["material"]), []).append(p)

    w = Writer()
    report = {"nodes": {}, "dropped": sorted({p["mesh"] for p in dropped}),
              "kept_meshes": sorted({p["mesh"] for p in kept})}
    meshes = {}
    tri_total = 0
    for node in ["base", "turn", "head", "antenna_left", "antenna_right"]:
        prims = []
        for mat in MATERIALS:
            ps = groups.get((node, mat))
            if not ps:
                continue
            v, f = merge([dict(p, **dict(zip("vf", decimate(p["v"], p["f"], CAPS.get(p["mesh"], DEFAULT_CAP)))))
                          for p in ps])
            v, f, n = crease_split(v, f)
            v = G(v) - pivots[node]
            n = to_gltf(n)
            prims.append((mat, v, f, n))
            tri_total += len(f)
            report["nodes"].setdefault(node, {})[mat] = int(len(f))
        meshes[node] = w.mesh(node, prims)

    # nodes, translation relative to the parent pivot, no rotation
    idx = {}
    for node in ["antenna_left", "antenna_right", "head", "turn", "base"]:
        par = parent.get(node)
        t = pivots[node] - (pivots[par] if par else 0)
        extras = {}
        if node in axes:
            extras["axis"] = [round(float(x), 6) for x in axes[node]]
        if node == "head":
            extras["stewart_head_frame"] = [round(float(x), 6) for x in (G(head_site) - pivots["head"])]
        kids = {"head": ["antenna_left", "antenna_right"], "turn": ["head"]}.get(node, [])
        idx[node] = w.node(name=node, mesh=meshes[node],
                           translation=[float(x) for x in t],
                           children=[idx[k] for k in kids], extras=extras)
    root = w.node(name="reachy_mini", children=[idx["base"], idx["turn"]],
                  extras={"attribution": "Reachy Mini model © Pollen Robotics, CC BY-SA-NC, "
                                         "from pollen-robotics/reachy_mini"})
    w.g.scenes = [pygltflib.Scene(name="reachy_mini", nodes=[root])]
    w.g.scene = 0
    w.save(out)

    report.update(
        triangles=tri_total,
        pivots={k: [round(float(x), 5) for x in v] for k, v in pivots.items()},
        axes={k: [round(float(x), 5) for x in v] for k, v in axes.items()},
        height=float(allv[:, 1].max() - allv[:, 1].min()),
        hits={p["mesh"] + f"#{p['geom']}": p["hits"] for p in parts},
    )
    print(json.dumps(report, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
