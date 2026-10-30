/**
 * The site's only global script: small, dependency-free behaviours wired by data attributes.
 * Everything here is progressive — without it, every section reads in full.
 */
import { drawDither } from "@/lib/dither";
import { nextIndex } from "@/lib/tabs";

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)");

/* theme: system by default, a click pins the opposite of what is shown */
function currentTheme(): "light" | "dark" {
  const pinned = root.dataset.theme;
  if (pinned === "light" || pinned === "dark") return pinned;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]")) {
  const sync = () => button.setAttribute("aria-pressed", String(currentTheme() === "dark"));
  sync();
  button.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("nestor.theme", next);
    } catch {
      // storage unavailable: the choice lasts for this page
    }
    sync();
    redrawAll();
  });
}

/* dither textures */
const canvases = [...document.querySelectorAll<HTMLCanvasElement>("canvas[data-dither]")];
function redrawAll() {
  for (const canvas of canvases) drawDither(canvas);
}
const resize = new ResizeObserver((entries) => {
  for (const entry of entries) drawDither(entry.target as HTMLCanvasElement);
});
for (const canvas of canvases) resize.observe(canvas);
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redrawAll);

/* header hairline once the page moves */
const header = document.querySelector<HTMLElement>("[data-header]");
const onScroll = () => header?.toggleAttribute("data-scrolled", window.scrollY > 40);
onScroll();
addEventListener("scroll", onScroll, { passive: true });

/* the section being read, in the navigation */
const links = new Map(
  [...document.querySelectorAll<HTMLAnchorElement>("[data-nav]")].map((a) => [a.dataset.nav ?? "", a]),
);
const sections = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const [id, link] of links) {
        link.toggleAttribute("data-active", id === entry.target.id);
        if (id === entry.target.id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    }
  },
  { rootMargin: "-45% 0px -50% 0px" },
);
for (const id of links.keys()) {
  const section = document.getElementById(id);
  if (section) sections.observe(section);
}

/* reveals */
const reveals = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute("data-shown", "");
      reveals.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -8% 0px" },
);
for (const element of document.querySelectorAll("[data-reveal]")) reveals.observe(element);

/* things that animate once when they come into view: bars, pairing */
const once = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.dispatchEvent(new CustomEvent("inview"));
      entry.target.setAttribute("data-inview", "");
      once.unobserve(entry.target);
    }
  },
  { threshold: 0.35 },
);
for (const element of document.querySelectorAll("[data-inview-once]")) once.observe(element);

/* copy buttons */
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  const label = button.querySelector<HTMLElement>("[data-copy-label]");
  const idle = label?.textContent ?? "";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy ?? "");
      if (label) label.textContent = button.dataset.copied ?? idle;
      button.setAttribute("data-done", "");
      setTimeout(() => {
        if (label) label.textContent = idle;
        button.removeAttribute("data-done");
      }, 1600);
    } catch {
      // clipboard refused: the command stays selectable on screen
    }
  });
}

/* tabs (WAI-ARIA tabs pattern, automatic activation) */
for (const list of document.querySelectorAll<HTMLElement>("[role=tablist]")) {
  const tabs = [...list.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[index]?.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const next = nextIndex(event.key, i, tabs.length);
      if (next === null) return;
      event.preventDefault();
      select(next, true);
    });
  });
}

/* the guided story: the step in the middle of the screen drives the stage */
for (const story of document.querySelectorAll<HTMLElement>("[data-story]")) {
  const stage = story.querySelector<HTMLElement>("[data-stage]");
  const counter = story.querySelector<HTMLElement>("[data-stage-step]");
  const steps = [...story.querySelectorAll<HTMLElement>("li[data-step]")];
  const show = (n: number) => {
    if (!stage || stage.dataset.step === String(n)) return;
    stage.dataset.step = String(n);
    stage.style.setProperty("--step", String(n));
    for (const step of steps) step.toggleAttribute("data-current", step.dataset.step === String(n));
    if (counter) counter.textContent = counter.dataset.template?.replace("{n}", String(n)) ?? "";
  };
  show(1);
  const watcher = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) show(Number((entry.target as HTMLElement).dataset.step));
    },
    { rootMargin: "-58% 0px -40% 0px" },
  );
  for (const step of steps) watcher.observe(step);
}

/* the pairing demonstration: device code, typed code, approval, manifest */
for (const demo of document.querySelectorAll<HTMLElement>("[data-pairing]")) {
  const phases = ["code", "typing", "approve", "paired", "manifest"];
  const delays = [300, 900, 1500, 700, 500];
  let timers: number[] = [];
  const play = () => {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
    if (reduced.matches) {
      demo.dataset.phase = "manifest";
      return;
    }
    demo.dataset.phase = "idle";
    let at = 0;
    phases.forEach((phase, i) => {
      at += delays[i] ?? 600;
      timers.push(window.setTimeout(() => (demo.dataset.phase = phase), at));
    });
  };
  demo.addEventListener("inview", play);
  demo.querySelector("[data-replay]")?.addEventListener("click", play);
}

/* recordings play only while seen, and never by themselves under reduced motion */
const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]")];
const playing = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting && !reduced.matches && !video.dataset.paused) void video.play().catch(() => {});
      else video.pause();
    }
  },
  { threshold: 0.4 },
);
for (const video of videos) playing.observe(video);
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-video-toggle]")) {
  const video = document.getElementById(button.getAttribute("aria-controls") ?? "") as HTMLVideoElement | null;
  if (!video) continue;
  const sync = () => button.setAttribute("aria-pressed", String(video.paused));
  video.addEventListener("play", sync);
  video.addEventListener("pause", sync);
  button.addEventListener("click", () => {
    if (video.paused) {
      delete video.dataset.paused;
      void video.play();
    } else {
      video.dataset.paused = "1";
      video.pause();
    }
  });
}

/* Nestor, the character: a sequence of states when it comes into view ("listening@0,speaking@900") */
for (const character of document.querySelectorAll<SVGElement>("svg.nestor[data-script]")) {
  const steps = (character.dataset.script ?? "")
    .split(",")
    .map((part) => part.split("@"))
    .map(([state, at]) => ({ state: state ?? "idle", at: Number(at ?? 0) }));
  character.addEventListener("inview", () => {
    if (reduced.matches) {
      const last = steps.at(-1);
      if (last) character.dataset.state = last.state;
      return;
    }
    for (const step of steps) setTimeout(() => (character.dataset.state = step.state), step.at);
  });
}

/* the hero's exchange: Léa asks, Nestor listens, thinks, answers; then again */
const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
const hero = document.getElementById("hero-nestor");
if (stage && hero && !reduced.matches) {
  const beats: [string, string, number][] = [
    ["idle", "idle", 700],
    ["ask", "listening", 2200],
    ["think", "thinking", 1300],
    ["say", "speaking", 2600],
    ["say", "laughing", 900],
    ["say", "idle", 2600],
  ];
  let i = 0;
  let timer = 0;
  const next = () => {
    const [phase, state, wait] = beats[i % beats.length] as [string, string, number];
    stage.dataset.phase = phase;
    hero.dataset.state = state;
    i++;
    timer = window.setTimeout(next, wait);
  };
  new IntersectionObserver(([entry]) => {
    clearTimeout(timer);
    if (entry?.isIntersecting) next();
  }).observe(stage);

  /* it looks toward the pointer, a little */
  addEventListener(
    "pointermove",
    (event) => {
      const box = hero.getBoundingClientRect();
      const dx = (event.clientX - (box.left + box.width / 2)) / innerWidth;
      const dy = (event.clientY - (box.top + box.height / 2)) / innerHeight;
      hero.style.setProperty("--gx", (Math.max(-1, Math.min(1, dx * 2.4)) * 5).toFixed(2));
      hero.style.setProperty("--gy", (Math.max(-1, Math.min(1, dy * 2.4)) * 4).toFixed(2));
    },
    { passive: true },
  );
}
