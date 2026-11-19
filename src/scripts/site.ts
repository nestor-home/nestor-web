/**
 * The site's only global script: small behaviours wired by data attributes (theme, menu, dither,
 * header hairline, table of contents, reveals, copy, tabs). Everything here is
 * progressive: without it, every section reads in full.
 */
import { drawDither } from "@nestor-home/character";
import { nextIndex, tabAxes } from "@/lib/tabs";

const root = document.documentElement;

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

/* the menu on small screens: a sheet, as a modal dialog (focus kept inside, Escape closes) */
const sheet = document.querySelector<HTMLDialogElement>("dialog[data-menu]");
const opener = document.querySelector<HTMLButtonElement>("[data-menu-open]");
if (sheet && opener) {
  opener.addEventListener("click", () => sheet.showModal());
  sheet.querySelector("[data-menu-close]")?.addEventListener("click", () => sheet.close());
  // a click on the dimmed page closes it
  sheet.addEventListener("click", (event) => {
    if (event.target === sheet) sheet.close();
  });
  // a link to a section of this page closes it first, then, once the page scrolls again, goes to the section
  for (const link of sheet.querySelectorAll("a")) {
    link.addEventListener("click", (event) => {
      const url = new URL(link.href);
      const target = url.pathname === location.pathname && url.hash ? document.querySelector(url.hash) : null;
      if (target) {
        event.preventDefault();
        sheet.addEventListener(
          "close",
          () => {
            history.pushState(null, "", url.hash);
            requestAnimationFrame(() => target.scrollIntoView());
          },
          { once: true },
        );
      }
      sheet.close();
    });
  }
  sheet.addEventListener("close", () => opener.focus({ preventScroll: true }));
  matchMedia("(min-width: 48rem)").addEventListener("change", () => sheet.close());
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

/* the section being read, in a page's table of contents (the docs) */
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

/* tabs (WAI-ARIA tabs pattern, automatic activation): the arrows of the list's orientation move
   (both for `data-tabs-grid`); with `data-tabs-hash`, the address keeps the chosen tab
   (`#<tab id>`) and opens it, so a link can name one */
for (const list of document.querySelectorAll<HTMLElement>("[role=tablist]")) {
  const tabs = [...list.querySelectorAll<HTMLButtonElement>("[role=tab]")];
  const hash = list.hasAttribute("data-tabs-hash");
  const axes = tabAxes(list);
  const select = (index: number, focus: boolean) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
      if (panel) panel.hidden = !on;
    });
    if (focus) tabs[index]?.focus();
    if (hash && tabs[index]) history.replaceState(null, "", `#${tabs[index].id}`);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(i, false));
    tab.addEventListener("keydown", (event) => {
      const next = nextIndex(event.key, i, tabs.length, axes);
      if (next === null) return;
      event.preventDefault();
      select(next, true);
    });
  });
  if (hash) {
    const follow = () => {
      const wanted = tabs.findIndex((tab) => tab.id === decodeURIComponent(location.hash.slice(1)));
      if (wanted >= 0) select(wanted, false);
    };
    follow();
    addEventListener("hashchange", follow);
  }
}
