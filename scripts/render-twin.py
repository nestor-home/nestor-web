"""Renders the Reachy Mini MuJoCo twin going through a conversation, for the site.

The motion is not keyframed by hand: every frame's head and antenna target comes from
`nestor_reachy.pose.pose`, the pure function the `nestor-reachy` satellite runs on the device,
and the head joints from the Reachy Mini SDK's own inverse kinematics, as its MuJoCo daemon does.
Nothing talks to a daemon or a robot: this script loads the model and renders offscreen.

Run it with the twin's environment (MuJoCo, reachy_mini, nestor_reachy installed):

    ../playground/reachy-twin/.venv/bin/python scripts/render-twin.py

Writes public/media/reachy-twin.{mp4,webm} and .poster.webp (needs ffmpeg) and records the clip
in src/data/media.json under "twin".
"""

import json
import math
import subprocess
import tempfile
from importlib.resources import files
from pathlib import Path

import mujoco
import numpy as np
import reachy_mini
from nestor_reachy.pose import pose
from nestor_satellite import Behavior, Expression
from reachy_mini.kinematics import AnalyticalKinematics
from reachy_mini.reachy_mini import SLEEP_HEAD_JOINT_POSITIONS
from reachy_mini.utils import create_head_pose

ROOT = Path(__file__).resolve().parent.parent
MEDIA = ROOT / "public" / "media"
DATA = ROOT / "src" / "data" / "media.json"

SIZE = 900  # square, device pixels
FPS = 30
PHYSICS_DT = 0.002
PAPER = (0.961, 0.941, 0.902)  # --paper, light theme (#f5f0e6)

# What the core asks of the body, second by second: the same intents the satellite receives.
SCRIPT: list[tuple[float, Behavior]] = [
    (0.0, Behavior.IDLE),
    (1.2, Behavior.LISTENING),  # someone talks to Richie
    (3.6, Behavior.THINKING),  # end of turn: the agent answers
    (4.6, Behavior.SPEAKING),  # the voice plays
    (10.2, Behavior.IDLE),
]
DURATION = 11.6
# one accent per spoken word, as the voice plays them (gaps between sentences)
BEATS = [4.75, 5.05, 5.3, 5.62, 5.9, 6.2, 6.45, 8.25, 8.55, 8.8, 9.1, 9.42, 9.7]
LAUGH_AT = 6.7  # `[laughs]` in the reply: the body laughs when the voice does


def behavior_at(t: float) -> Behavior:
    current = SCRIPT[0][1]
    for at, behavior in SCRIPT:
        if t >= at:
            current = behavior
    return current


def target(t: float):
    beat_age = None
    for b in BEATS:
        if b <= t:
            beat_age = t - b
    expression = Expression.JOY if t >= LAUGH_AT else None
    return pose(
        behavior_at(t),
        t,
        expression=expression,
        expression_age=t - LAUGH_AT,
        beat_age=beat_age,
    )


def scene() -> Path:
    """The robot alone on the site's paper, without the SDK's blue checkered studio."""
    mjcf = Path(str(files(reachy_mini).joinpath("descriptions/reachy_mini/mjcf")))
    r, g, b = PAPER
    xml = f"""<mujoco model="site">
  <include file="{mjcf / "reachy_mini.xml"}"/>
  <compiler meshdir="{mjcf / "assets"}" texturedir="{mjcf / "assets"}"/>
  <visual>
    <headlight diffuse="0.5 0.5 0.5" ambient="0.5 0.5 0.5" specular="0.04 0.04 0.04"/>
    <rgba haze="{r} {g} {b} 1"/>
    <global offwidth="{SIZE}" offheight="{SIZE}"/>
    <quality shadowsize="8192"/>
    <map shadowclip="3" shadowscale="0.6"/>
  </visual>
  <asset>
    <texture type="skybox" builtin="flat" rgb1="{r} {g} {b}" rgb2="{r} {g} {b}" width="64" height="64"/>
    <material name="paper" rgba="{r} {g} {b} 1" emission="0.158" reflectance="0" specular="0" shininess="0"/>
  </asset>
  <worldbody>
    <light pos="-0.6 -0.4 1.6" dir="0.4 0.3 -1" directional="true" diffuse="0.3 0.3 0.3" specular="0 0 0" castshadow="true"/>
    <geom name="floor" size="0 0 0.05" type="plane" material="paper"/>
  </worldbody>
</mujoco>"""
    path = Path(tempfile.mkdtemp()) / "site.xml"
    path.write_text(xml)
    return path


def main() -> None:
    model = mujoco.MjModel.from_xml_path(str(scene()))
    model.opt.timestep = PHYSICS_DT
    data = mujoco.MjData(model)
    actuators = [model.actuator(k).name for k in range(model.nu)]
    addr = [model.jnt_qposadr[mujoco.mj_name2id(model, mujoco.mjtObj.mjOBJ_JOINT, n)] for n in actuators]
    kinematics = AnalyticalKinematics(automatic_body_yaw=False)

    def joints(t: float) -> np.ndarray:
        p = target(t)
        head = create_head_pose(z=p.z, roll=p.roll, pitch=p.pitch, yaw=p.yaw, mm=True, degrees=True)
        return np.concatenate([kinematics.ik(head, body_yaw=0.0), -np.array(p.antennas)])

    # settle from the SDK's sleep pose into the first target before recording, as the daemon does
    data.qpos[addr] = np.array(SLEEP_HEAD_JOINT_POSITIONS + [-3.05, 3.05])
    mujoco.mj_forward(model, data)
    start = joints(0.0)
    for i in range(1500):
        w = min(1.0, i / 1000)
        data.ctrl[:] = (1 - w) * data.qpos[addr] + w * start
        mujoco.mj_step(model, data)

    renderer = mujoco.Renderer(model, height=SIZE, width=SIZE)
    camera = mujoco.MjvCamera()
    camera.type = mujoco.mjtCamera.mjCAMERA_FREE
    camera.lookat[:] = [0.0, 0.0, 0.19]
    camera.distance = 0.78
    camera.azimuth = 158
    camera.elevation = -9

    MEDIA.mkdir(parents=True, exist_ok=True)
    raw = MEDIA / "reachy-twin.raw-tmp.mp4"
    encoder = subprocess.Popen(
        [
            "ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SIZE}x{SIZE}",
            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "12", "-preset", "fast", "-pix_fmt", "yuv444p",
            str(raw),
        ],
        stdin=subprocess.PIPE,
    )  # fmt: skip
    assert encoder.stdin is not None
    steps_per_frame = round(1 / FPS / PHYSICS_DT)
    poster = None
    frames = math.ceil(DURATION * FPS)
    for frame in range(frames):
        t0 = frame / FPS
        for s in range(steps_per_frame):
            data.ctrl[:] = joints(t0 + s * PHYSICS_DT)  # the device's loop runs at 30 Hz; physics at 500 Hz
            mujoco.mj_step(model, data)
        renderer.update_scene(data, camera)
        image = renderer.render()
        if frame == round(7.0 * FPS):
            poster = image.copy()
        encoder.stdin.write(image.tobytes())
    encoder.stdin.close()
    encoder.wait()

    out = 720
    scale = f"scale={out}:{out}:flags=lanczos,format=yuv420p"
    common = ["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-vf", scale, "-an"]
    mp4, webm = MEDIA / "reachy-twin.mp4", MEDIA / "reachy-twin.webm"
    subprocess.run([*common, "-c:v", "libx264", "-crf", "24", "-preset", "slow", "-movflags", "+faststart", str(mp4)],
                   check=True)  # fmt: skip
    subprocess.run([*common, "-c:v", "libvpx-vp9", "-crf", "34", "-b:v", "0", "-row-mt", "1", str(webm)], check=True)
    if poster is not None:  # ffmpeg often lacks a WebP encoder: sharp (the site's) writes it
        png = MEDIA / "reachy-twin.poster-tmp.png"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{SIZE}x{SIZE}", "-i", "-",
             "-vf", f"scale={out}:{out}:flags=lanczos", "-frames:v", "1", str(png)],
            input=poster.tobytes(), check=True,
        )  # fmt: skip
        script = "require('sharp')(process.argv[1]).webp({quality:80}).toFile(process.argv[2])"
        subprocess.run(["node", "-e", script, str(png), str(MEDIA / "reachy-twin.poster.webp")], cwd=ROOT, check=True)
        png.unlink()
    raw.unlink()

    inventory = json.loads(DATA.read_text()) if DATA.exists() else {"shots": [], "clips": {}}
    inventory["twin"] = {"width": out, "height": out, "duration": DURATION, "theme": "light"}
    DATA.parent.mkdir(parents=True, exist_ok=True)
    DATA.write_text(json.dumps(inventory, indent=2) + "\n")
    for f in (mp4, webm):
        print(f, f"{f.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
