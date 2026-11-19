/**
 * Reachy Mini in 3D (public/models/reachy-mini.glb, built from Pollen Robotics' MuJoCo description), going
 * through a conversation: listening, thinking, speaking, then a pause. The scene's element carries the current
 * state (`data-state`), which its words and states follow in CSS. Drawn only while on screen; with reduced
 * motion, one still frame.
 */
import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  Euler,
  HemisphereLight,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type State = "listening" | "thinking" | "speaking" | "idle";

/** The conversation's beats, in seconds: what plays when, looped. */
const BEATS: readonly (readonly [State, number])[] = [
  ["idle", 1.6],
  ["listening", 3.2],
  ["thinking", 2.4],
  ["speaking", 4.6],
  ["idle", 1.8],
];
const LOOP = BEATS.reduce((sum, [, d]) => sum + d, 0);

function stateAt(time: number): { state: State; since: number } {
  let t = time % LOOP;
  for (const [state, duration] of BEATS) {
    if (t < duration) return { state, since: t };
    t -= duration;
  }
  return { state: "idle", since: 0 };
}

/** A pose: the body's yaw, the head's pitch (positive looks down) and roll, each antenna's angle (radians; the
 * model mirrors their axes, so the same angle moves them as a pair). */
interface Pose {
  yaw: number;
  pitch: number;
  roll: number;
  left: number;
  right: number;
}

function poseOf(state: State, since: number, time: number): Pose {
  const breathe = Math.sin(time * 0.9) * 0.02;
  switch (state) {
    case "listening":
      // straightens up, looks up a little, antennas raised with a small twitch
      return {
        yaw: Math.sin(time * 0.5) * 0.03,
        pitch: -0.14 + breathe,
        roll: 0,
        left: -0.08 + Math.sin(time * 9) * 0.05 * Math.exp(-since * 2),
        right: -0.08 + Math.sin(time * 9) * 0.05 * Math.exp(-since * 2),
      };
    case "thinking":
      // tilts its head, antennas hesitate apart
      return {
        yaw: 0.06,
        pitch: -0.04,
        roll: 0.16,
        left: 0.45 + Math.sin(time * 1.6) * 0.12,
        right: -0.1 + Math.sin(time * 1.3 + 1) * 0.1,
      };
    case "speaking": {
      // a nod on each word: short beats, some longer, like speech
      const word = Math.max(0, Math.sin(time * 9.5)) * (0.6 + 0.4 * Math.sin(time * 2.3));
      return {
        yaw: Math.sin(time * 0.7) * 0.05,
        pitch: 0.02 + word * 0.07,
        roll: Math.sin(time * 1.1) * 0.03,
        left: 0.15 + Math.sin(time * 3.2) * 0.14,
        right: 0.15 + Math.sin(time * 3.2 + 0.6) * 0.14,
      };
    }
    default:
      return {
        yaw: Math.sin(time * 0.35) * 0.05,
        pitch: breathe,
        roll: 0,
        left: 0.1 + Math.sin(time * 0.8) * 0.05,
        right: 0.1 + Math.sin(time * 0.8 + 0.5) * 0.05,
      };
  }
}

/** The colours of the parts, by the material names the model gives them. */
const PARTS: Record<string, MeshStandardMaterial> = {
  shell: new MeshStandardMaterial({ color: new Color("#f3eee4"), roughness: 0.62, metalness: 0 }),
  dark: new MeshStandardMaterial({ color: new Color("#2a2622"), roughness: 0.45, metalness: 0.15 }),
  antenna: new MeshStandardMaterial({ color: new Color("#1d1a17"), roughness: 0.5, metalness: 0.1 }),
};

/** A soft round shadow under the robot, drawn once on a canvas. */
function contactShadow(): Mesh {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  if (g) {
    const gradient = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(30,22,14,0.38)");
    gradient.addColorStop(1, "rgba(30,22,14,0)");
    g.fillStyle = gradient;
    g.fillRect(0, 0, size, size);
  }
  const shadow = new Mesh(
    new PlaneGeometry(0.34, 0.34),
    new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.001;
  return shadow;
}

/** The axis a node turns about, as the model records it (`extras.axis`), or the one given. */
function axisOf(node: Object3D | undefined, fallback: Vector3): Vector3 {
  const axis = (node?.userData as { axis?: number[] } | undefined)?.axis;
  return axis && axis.length === 3 ? new Vector3(...axis).normalize() : fallback;
}

export async function mount(element: HTMLElement): Promise<void> {
  const canvas = element.querySelector<HTMLCanvasElement>("canvas");
  if (!canvas) return;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // a high-density screen already smooths the edges: multisampling only below it
  const renderer = new WebGLRenderer({ canvas, antialias: devicePixelRatio < 2, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;

  const scene = new Scene();
  scene.add(new HemisphereLight("#fff6ea", "#5a4a3a", 1.6));
  const key = new DirectionalLight("#fff3e2", 2.4);
  key.position.set(0.6, 1.2, 0.9);
  scene.add(key);
  const rim = new DirectionalLight("#ffd9c2", 1.2);
  rim.position.set(-0.8, 0.6, -0.6);
  scene.add(rim);
  scene.add(contactShadow());

  const camera = new PerspectiveCamera(26, 4 / 3, 0.01, 10);

  const gltf = await new GLTFLoader().loadAsync("/models/reachy-mini.glb");
  const robot = gltf.scene;
  robot.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    const name = (node.material as Material).name;
    node.material = PARTS[name] ?? PARTS.shell;
  });
  scene.add(robot);

  // each moving part, its pose at rest, and how the current pose turns it from there
  const joints = (
    [
      ["turn", (p: Pose, axis: Vector3) => quat(axis, p.yaw), new Vector3(0, 1, 0)],
      ["head", (p: Pose) => euler(p.pitch, p.roll), null],
      ["antenna_left", (p: Pose, axis: Vector3) => quat(axis, p.left), new Vector3(0, 0, 1)],
      ["antenna_right", (p: Pose, axis: Vector3) => quat(axis, p.right), new Vector3(0, 0, 1)],
    ] as const
  ).flatMap(([name, turnOf, fallback]) => {
    const node = robot.getObjectByName(name);
    if (!node) return [];
    const axis = fallback ? axisOf(node, fallback) : new Vector3();
    return [{ node, rest: node.quaternion.clone(), turnOf: (p: Pose) => turnOf(p, axis) }];
  });

  // frame the robot by its own size: a little from the side, a little from above, with room around it
  const box = new Box3().setFromObject(robot);
  const size = box.getSize(new Vector3());
  const target = box.getCenter(new Vector3());
  const distance = (size.y * 0.6) / Math.tan(((camera.fov / 2) * Math.PI) / 180);
  camera.position.copy(target).add(new Vector3(0.28, 0.2, 1).normalize().multiplyScalar(distance));
  camera.lookAt(target);

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  const pose: Pose = { yaw: 0, pitch: 0, roll: 0, left: 0.1, right: 0.1 };
  const apply = () => {
    for (const joint of joints) joint.node.quaternion.copy(joint.rest).multiply(joint.turnOf(pose));
  };

  // the page's lines and states, marked as the conversation goes
  const lines = [...element.querySelectorAll<HTMLElement>("[data-line]")];
  const chips = [...element.querySelectorAll<HTMLElement>("[data-chip]")];
  const mark = (state: State) => {
    const reached = lines.findIndex((line) => line.dataset.line === state);
    lines.forEach((line, i) => {
      line.toggleAttribute("data-on", reached >= 0 && i <= reached);
    });
    for (const chip of chips) chip.toggleAttribute("data-on", chip.dataset.chip === state);
  };

  if (still) {
    mark("listening");
    Object.assign(pose, poseOf("listening", 2, 0));
    apply();
    renderer.render(scene, camera);
    return;
  }

  let last = 0;
  let time = 0;
  let shown: State | null = null;
  let running = false;
  const KEYS = Object.keys(pose) as (keyof Pose)[];
  const frame = (now: number) => {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    time += dt;
    const { state, since } = stateAt(time);
    if (state !== shown) {
      shown = state;
      element.dataset.state = state;
      element.toggleAttribute("data-playing", state !== "idle");
      mark(state);
    }
    // ease toward the state's pose, so changes of state never jump
    const want = poseOf(state, since, time);
    const k = 1 - Math.exp(-dt * 7);
    for (const key of KEYS) pose[key] += (want[key] - pose[key]) * k;
    apply();
    renderer.render(scene, camera);
  };
  // drawn only while on screen and in a visible tab: no frame is asked for otherwise
  let onScreen = false;
  const update = () => {
    const wanted = onScreen && !document.hidden;
    if (wanted === running) return;
    running = wanted;
    last = 0;
    if (running) requestAnimationFrame(frame);
  };
  new IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    update();
  }).observe(element);
  document.addEventListener("visibilitychange", update);
}

// reused every frame: a turn about one axis, and the head's pitch and roll
const turnBy = new Quaternion();
const tilt = new Euler(0, 0, 0, "XYZ");
const tiltBy = new Quaternion();

function quat(axis: Vector3, angle: number): Quaternion {
  return turnBy.setFromAxisAngle(axis, angle);
}

/** The head's pitch (about its side axis, x) and roll (about its facing axis, z), in its own frame. */
function euler(pitch: number, roll: number): Quaternion {
  return tiltBy.setFromEuler(tilt.set(pitch, 0, roll));
}
