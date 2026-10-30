/**
 * Nestor, alive in the page, relative to the visitor:
 *
 * - in the hero it holds a short exchange, looks toward the pointer (and toward what you hover or
 *   focus), tilts its head when you stop moving, dozes off when you leave, greets you when you
 *   come back, and glances down with a little hop when you start scrolling;
 * - after the hero, a small Nestor docks in the page's right margin (wide screens only, never over
 *   the text) and takes the mood of what you are reading, saying a line at a few moments.
 *
 * Nothing here runs under reduced motion: the characters keep their static pose and the dock stays
 * hidden. Every loop pauses when the character is off screen or the tab is hidden.
 */
import { NestorController } from "@/character/controller";
import type { NestorState } from "@/character/render";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const interactive = "a, button, [role=tab], summary";

/** Pointer moves, coalesced to one per frame. */
function onPointer(handler: (x: number, y: number) => void) {
  let pending: PointerEvent | null = null;
  addEventListener(
    "pointermove",
    (event) => {
      if (!pending) {
        requestAnimationFrame(() => {
          if (pending) handler(pending.clientX, pending.clientY);
          pending = null;
        });
      }
      pending = event;
    },
    { passive: true },
  );
}

/* ── the hero ────────────────────────────────────────────────────────────────────────────── */

const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
const heroSvg = document.querySelector<SVGSVGElement>("#hero-nestor");
let hero: NestorController | null = null;

if (stage && heroSvg && !reduced) {
  hero = new NestorController(heroSvg, { saccades: true });
  const nestor = hero;

  // the exchange: Léa asks, it listens, thinks, answers, smiles; then again
  const beats: [string, NestorState, number][] = [
    ["idle", "idle", 900],
    ["ask", "listening", 2300],
    ["think", "thinking", 1300],
    ["say", "speaking", 2700],
    ["say", "laughing", 800],
    ["say", "idle", 3400],
  ];
  let beat = 0;
  let timer = 0;
  let asleep = false;
  const play = () => {
    if (asleep) return;
    const [phase, state, wait] = beats[beat % beats.length] as [string, NestorState, number];
    stage.dataset.phase = phase;
    nestor.state = state;
    beat++;
    timer = window.setTimeout(play, wait);
  };
  new IntersectionObserver(([entry]) => {
    clearTimeout(timer);
    if (entry?.isIntersecting) play();
  }).observe(stage);

  // attention: the pointer, or what is hovered or focused
  let lastActivity = performance.now();
  let curious = false;
  const wake = () => {
    lastActivity = performance.now();
    if (curious) {
      curious = false;
      nestor.lean(0);
    }
    if (asleep) {
      asleep = false;
      nestor.gesture("greet");
      nestor.state = "laughing";
      window.setTimeout(play, 900);
    }
  };
  onPointer((x, y) => {
    wake();
    nestor.lookAt(x, y);
  });
  addEventListener("focusin", (event) => {
    const target = event.target as Element | null;
    if (target?.matches(interactive)) {
      wake();
      nestor.lookAt(target);
    }
  });
  addEventListener(
    "pointerover",
    (event) => {
      const target = (event.target as Element | null)?.closest(interactive);
      if (target) nestor.lookAt(target);
    },
    { passive: true },
  );

  // left alone: a curious tilt after a few seconds, a doze after a while
  window.setInterval(() => {
    const quiet = performance.now() - lastActivity;
    if (!asleep && !curious && quiet > 7000) {
      curious = true;
      nestor.center().lean(-6);
    }
    if (!asleep && quiet > 45_000) {
      asleep = true;
      clearTimeout(timer);
      stage.dataset.phase = "idle";
      nestor.state = "sleeping";
    }
  }, 1000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      lastActivity = performance.now() - 60_000; // it dozes while you are away
    } else if (asleep || performance.now() - lastActivity > 20_000) {
      asleep = true;
      wake();
    }
  });

  // the first scroll: it glances down, with a hop that says "this way"
  let hopped = false;
  addEventListener(
    "scroll",
    () => {
      if (hopped || scrollY < 80) return;
      hopped = true;
      wake();
      nestor.lookAt(innerWidth / 2, innerHeight * 1.4).gesture("bob");
    },
    { passive: true },
  );
}

/* ── the dock: a small Nestor in the margin, after the hero ─────────────────────────────── */

const dock = document.querySelector<HTMLElement>("[data-dock]");
const dockSvg = dock?.querySelector<SVGSVGElement>("svg.nestor");
const wide = matchMedia("(min-width: 85rem)");

function dismissed(): boolean {
  try {
    return sessionStorage.getItem("nestor.dock") === "hidden";
  } catch {
    return false;
  }
}

if (dock && dockSvg && !reduced && !dismissed()) {
  const bubble = dock.querySelector<HTMLElement>("[data-dock-bubble]");
  const nestor = new NestorController(dockSvg, { bubble, saccades: true });
  const said = new Set<string>();
  let current: Element | null = null;

  const show = (on: boolean) => {
    dock.toggleAttribute("data-shown", on && wide.matches);
  };
  const heroSection = document.querySelector("[data-dock-after]");
  if (heroSection) {
    new IntersectionObserver(([entry]) => show(!entry?.isIntersecting), { rootMargin: "0px 0px -20% 0px" }).observe(
      heroSection,
    );
  } else {
    show(true);
  }
  wide.addEventListener("change", () => show(!heroSection || scrollY > innerHeight * 0.6));

  // the mood of what is being read
  const moods = [...document.querySelectorAll<HTMLElement>("[data-mood]")];
  const moodObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.target === current) continue;
        current = entry.target;
        const el = entry.target as HTMLElement;
        const mood = (el.dataset.mood ?? "idle") as NestorState;
        const line = el.dataset.say;
        nestor.lookAt(el);
        if (line && !said.has(line)) {
          said.add(line);
          void nestor.say(line, mood);
        } else {
          nestor.state = mood;
        }
      }
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  for (const el of moods) moodObserver.observe(el);

  onPointer((x, y) => nestor.lookAt(x, y));

  // a line when you follow the invitation of the hero
  for (const link of document.querySelectorAll<HTMLElement>("[data-dock-follow]")) {
    link.addEventListener("click", () => {
      const line = link.dataset.dockFollow;
      if (line) window.setTimeout(() => void nestor.say(line), 600);
    });
  }

  dock.querySelector("[data-dock-close]")?.addEventListener("click", () => {
    dock.removeAttribute("data-shown");
    dock.hidden = true;
    nestor.destroy();
    try {
      sessionStorage.setItem("nestor.dock", "hidden");
    } catch {
      // storage unavailable: hidden for this page
    }
  });
}
