/**
 * The constellation: devices added by the visitor become satellites of Nestor. Adding one shows a
 * pairing code for a moment, then draws a thin line from the star to it, lights its point, and the
 * character looks at it and smiles; choosing it again takes it away. Every part of the page that
 * names the device (`[data-dev]`: its button, its line, its turn of the conversation, its
 * manifest) follows `data-on`. Lines are measured from the layout and redrawn when it changes.
 * Under reduced motion every device is lit and nothing moves; without this script, all are lit.
 */
import { NestorController } from "@nestor-home/character";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SVG = "http://www.w3.org/2000/svg";

for (const root of document.querySelectorAll<HTMLElement>("[data-constellation]")) {
  const sky = root.querySelector<HTMLElement>(".sky");
  const links = root.querySelector<SVGSVGElement>(".links");
  const star = root.querySelector<HTMLElement>(".star-disc");
  const buttons = [...root.querySelectorAll<HTMLButtonElement>("button.sat")];
  const thread = root.querySelector<HTMLElement>(".thread");
  const manifests = root.querySelector<HTMLElement>(".manifests");
  const svg = root.querySelector<SVGSVGElement>(".star svg.nestor");
  const nestor = svg && !reduced ? new NestorController(svg) : null;
  if (!sky || !links || !star) continue;

  // one line per device, from the star's centre to its point
  const lines = new Map<string, SVGLineElement>();
  for (const b of buttons) {
    const line = document.createElementNS(SVG, "line");
    line.dataset.dev = b.dataset.dev ?? "";
    links.append(line);
    lines.set(line.dataset.dev, line);
  }
  const measure = () => {
    const frame = sky.getBoundingClientRect();
    const s = star.getBoundingClientRect();
    const cx = s.left + s.width / 2 - frame.left;
    const cy = s.top + s.height / 2 - frame.top;
    for (const b of buttons) {
      const dot = b.querySelector(".sat-dot")?.getBoundingClientRect();
      const line = lines.get(b.dataset.dev ?? "");
      if (!dot || !line) continue;
      const x = dot.left + dot.width / 2 - frame.left;
      const y = dot.top + dot.height / 2 - frame.top;
      line.setAttribute("x1", String(cx));
      line.setAttribute("y1", String(cy));
      line.setAttribute("x2", String(x));
      line.setAttribute("y2", String(y));
      line.style.setProperty("--len", String(Math.hypot(x - cx, y - cy)));
    }
  };
  new ResizeObserver(measure).observe(sky);
  // the points breathe only while the sky is on screen
  new IntersectionObserver(([entry]) => root.toggleAttribute("data-paused", !entry?.isIntersecting)).observe(root);

  // the devices lit, in the order they were added: the last one's manifest is the one shown
  const lit: string[] = [];
  let order = 0;
  const set = (dev: string, on: boolean) => {
    for (const el of root.querySelectorAll(`[data-dev="${dev}"]`)) el.toggleAttribute("data-on", on);
    buttons.find((b) => b.dataset.dev === dev)?.setAttribute("aria-pressed", String(on));
    if (lit.includes(dev)) lit.splice(lit.indexOf(dev), 1);
    if (on) lit.push(dev);
    const turn = thread?.querySelector<HTMLElement>(`[data-dev="${dev}"]`);
    if (turn && on) turn.style.order = String(++order);
    if (manifests) manifests.dataset.latest = lit.at(-1) ?? "";
  };

  if (reduced) {
    for (const b of buttons) set(b.dataset.dev ?? "", true);
  } else {
    const first = (root.dataset.first ?? "").split(" ");
    for (const b of buttons) set(b.dataset.dev ?? "", first.includes(b.dataset.dev ?? ""));
  }
  measure();

  const code = () => String(Math.floor(100000 + Math.random() * 900000)).replace(/(\d{3})(\d{3})/, "$1 $2");
  // the character's reaction to the latest pairing only: a new one cancels the previous return to rest
  let rest = 0;
  for (const button of buttons) {
    const dev = button.dataset.dev ?? "";
    const label = button.querySelector<HTMLElement>(".sat-code");
    button.addEventListener("click", () => {
      if (button.hasAttribute("data-pairing")) return;
      if (button.hasAttribute("data-on")) {
        set(dev, false);
        return;
      }
      if (reduced) {
        set(dev, true);
        return;
      }
      if (label) label.textContent = code();
      button.setAttribute("data-pairing", "");
      if (nestor) {
        clearTimeout(rest);
        nestor.lookAt(button);
        nestor.state = "listening";
      }
      window.setTimeout(() => {
        button.removeAttribute("data-pairing");
        measure();
        set(dev, true);
        if (!nestor || root.querySelector("button.sat[data-pairing]")) return;
        nestor.state = "laughing";
        nestor.gesture("bob");
        rest = window.setTimeout(() => {
          nestor.state = "idle";
          nestor.center();
        }, 1200);
      }, 1100);
    });
  }
}
