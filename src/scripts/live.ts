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
 * hidden. Every loop and timer pauses when the character is off screen or the tab is hidden.
 */
import { NestorController, type NestorState } from "@nestor-home/character";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const interactive = "a, button, [role=tab], summary";
/** how long it stays dizzy */
const DIZZY_MS = 2600;
/** quiet that makes it curious (a tilt), then asleep */
const CURIOUS_MS = 7000;
const ASLEEP_MS = 45_000;

/** Pointer moves over `area` (the whole page by default), coalesced to one per frame. */
function onPointer(handler: (x: number, y: number) => void, area: EventTarget = window) {
  let pending: PointerEvent | null = null;
  area.addEventListener(
    "pointermove",
    (event) => {
      if (!(event instanceof PointerEvent)) return;
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

/**
 * Circling the pointer (or a finger) around the character: the signed angle swept around its
 * centre is summed over the last few seconds; three full turns call `dizzy`. Stopping, leaving
 * its surroundings or a pause resets the count. Only moves over `area` (the hero) are read, once
 * per frame; the centre is measured when the pointer comes in and after a scroll or a resize.
 */
function onCircling(area: Element, target: Element, dizzy: () => void) {
  const TURNS = 3;
  const WINDOW = 4000;
  let sweeps: { at: number; angle: number }[] = [];
  let last: number | null = null;
  let lastAt = 0;
  let cooldown = 0;
  let centre: { x: number; y: number; size: number } | null = null;
  const measure = () => {
    const box = target.getBoundingClientRect();
    centre = { x: box.left + box.width / 2, y: box.top + box.height / 2, size: box.width };
    return centre;
  };
  const forget = () => {
    centre = null;
  };
  addEventListener("resize", forget, { passive: true });
  addEventListener("scroll", forget, { passive: true });
  area.addEventListener("pointerenter", measure);
  area.addEventListener("pointerleave", () => {
    sweeps = [];
    last = null;
  });
  onPointer((x, y) => {
    const now = performance.now();
    const c = centre ?? measure();
    const dx = x - c.x;
    const dy = y - c.y;
    const distance = Math.hypot(dx, dy);
    // around it: neither on its very centre nor far away; a pause starts over
    if (distance < c.size * 0.15 || distance > c.size * 1.6 || now - lastAt > 400 || now < cooldown) {
      sweeps = [];
      last = distance > c.size * 1.6 ? null : Math.atan2(dy, dx);
      lastAt = now;
      return;
    }
    const angle = Math.atan2(dy, dx);
    if (last !== null) {
      let delta = angle - last;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      sweeps.push({ at: now, angle: delta });
      sweeps = sweeps.filter((s) => now - s.at < WINDOW);
      const swept = sweeps.reduce((sum, s) => sum + s.angle, 0);
      if (Math.abs(swept) >= TURNS * 2 * Math.PI) {
        sweeps = [];
        cooldown = now + 8000;
        dizzy();
      }
    }
    last = angle;
    lastAt = now;
  }, area);
}

/* ── the hero ────────────────────────────────────────────────────────────────────────────── */

const stage = document.querySelector<HTMLElement>("[data-hero-stage]");
const heroSvg = document.querySelector<SVGSVGElement>("#hero-nestor");

if (stage && heroSvg) {
  const nestor = reduced ? null : new NestorController(heroSvg, { saccades: true });

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
  let dizzy = false;
  let onScreen = false;
  const play = () => {
    if (!nestor || asleep || dizzy) return;
    const [phase, state, wait] = beats[beat % beats.length] as [string, NestorState, number];
    stage.dataset.phase = phase;
    nestor.state = state;
    beat++;
    timer = window.setTimeout(play, wait);
  };

  // left alone: a curious tilt after a few seconds, a doze after a while. One timeout, set for the
  // next of the two moments while the hero is seen and the tab visible; activity moves the moments
  // (the timeout finds it out when it fires) and wakes it up again once it sleeps.
  let lastActivity = performance.now();
  let curious = false;
  let idle = 0;
  const sleep = () => {
    if (!nestor) return;
    asleep = true;
    clearTimeout(timer);
    stage.dataset.phase = "idle";
    nestor.state = "sleeping";
  };
  const arm = () => {
    clearTimeout(idle);
    idle = 0;
    if (!nestor || asleep || !onScreen || document.hidden) return;
    const quiet = performance.now() - lastActivity;
    const next = curious ? ASLEEP_MS : CURIOUS_MS;
    idle = window.setTimeout(check, Math.max(0, next - quiet));
  };
  const check = () => {
    idle = 0;
    if (!nestor || asleep) return;
    const quiet = performance.now() - lastActivity;
    if (!curious && quiet >= CURIOUS_MS) {
      curious = true;
      nestor.center().lean(-6);
    }
    if (quiet >= ASLEEP_MS) sleep();
    else arm();
  };

  // attention: the pointer, or what is hovered or focused
  const wake = () => {
    lastActivity = performance.now();
    if (!nestor) return;
    if (curious) {
      curious = false;
      nestor.lean(0);
    }
    if (asleep) {
      asleep = false;
      nestor.gesture("greet");
      nestor.state = "laughing";
      timer = window.setTimeout(play, 900);
    }
    if (!idle) arm();
  };

  if (nestor) {
    new IntersectionObserver(([entry]) => {
      onScreen = Boolean(entry?.isIntersecting);
      clearTimeout(timer);
      if (onScreen) play();
      arm();
    }).observe(stage);

    onPointer((x, y) => {
      wake();
      if (onScreen) nestor.lookAt(x, y);
    });
    addEventListener("focusin", (event) => {
      const target = event.target as Element | null;
      if (target?.matches(interactive)) {
        wake();
        if (onScreen) nestor.lookAt(target);
      }
    });
    addEventListener(
      "pointerover",
      (event) => {
        if (!onScreen) return;
        const target = (event.target as Element | null)?.closest(interactive);
        if (target) nestor.lookAt(target);
      },
      { passive: true },
    );

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        // it dozes while you are away
        lastActivity = performance.now() - 60_000;
        sleep();
        arm();
      } else if (asleep || performance.now() - lastActivity > 20_000) {
        asleep = true;
        wake();
      }
    });

    // the first scroll: it glances down, with a hop that says "this way"
    const hop = () => {
      if (scrollY < 80) return;
      removeEventListener("scroll", hop);
      wake();
      nestor.lookAt(innerWidth / 2, innerHeight * 1.4).gesture("bob");
    };
    addEventListener("scroll", hop, { passive: true });
  }

  // circled around for too long, it gets dizzy, then recovers (still under reduced motion: one state)
  // the whole hero listens: a circle around the character leaves its narrow column at every turn
  onCircling(stage.closest("section") ?? stage, heroSvg, () => {
    if (!nestor) {
      const before = heroSvg.dataset.state ?? "idle";
      heroSvg.dataset.state = "dizzy";
      window.setTimeout(() => (heroSvg.dataset.state = before), DIZZY_MS);
      return;
    }
    dizzy = true;
    clearTimeout(timer);
    stage.dataset.phase = "idle";
    nestor.center();
    nestor.state = "dizzy";
    window.setTimeout(() => {
      dizzy = false;
      nestor.state = "idle";
      timer = window.setTimeout(play, 600);
    }, DIZZY_MS);
  });
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
  const said = new Set<string>();
  /** what is being read: its element and mood */
  let current: HTMLElement | null = null;
  let mood: NestorState = "idle";
  /** the character runs only while the dock is shown: made the first time, let go when hidden */
  let nestor: NestorController | null = null;
  let closed = false;

  const show = (on: boolean) => {
    const shown = on && wide.matches && !closed;
    dock.toggleAttribute("data-shown", shown);
    if (shown && !nestor) {
      nestor = new NestorController(dockSvg, { bubble, saccades: true });
      nestor.state = mood;
      if (current) nestor.lookAt(current);
    } else if (!shown && nestor) {
      nestor.destroy();
      nestor = null;
      bubble?.removeAttribute("data-open");
    }
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
  const moodObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.target === current) continue;
        current = entry.target as HTMLElement;
        mood = (current.dataset.mood ?? "idle") as NestorState;
        if (!nestor) continue;
        const line = current.dataset.say;
        nestor.lookAt(current);
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
  for (const el of document.querySelectorAll("[data-mood]")) moodObserver.observe(el);

  onPointer((x, y) => nestor?.lookAt(x, y));

  // a line when you follow the invitation of the hero
  for (const link of document.querySelectorAll<HTMLElement>("[data-dock-follow]")) {
    link.addEventListener("click", () => {
      const line = link.dataset.dockFollow;
      if (line) window.setTimeout(() => void nestor?.say(line), 600);
    });
  }

  dock.querySelector("[data-dock-close]")?.addEventListener("click", () => {
    show(false);
    closed = true;
    dock.hidden = true;
    moodObserver.disconnect();
    try {
      sessionStorage.setItem("nestor.dock", "hidden");
    } catch {
      // storage unavailable: hidden for this page
    }
  });
}
