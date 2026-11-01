/**
 * The documentation's provider pickers (components/docs/Providers.astro): a click, the arrow keys,
 * Home or End choose a provider and show its setup; the address keeps the choice (`#model-ollama`)
 * so a link opens it. Without JavaScript the default provider's setup stays shown.
 */
import { nextIndex } from "@/lib/tabs";

const pickers = [...document.querySelectorAll<HTMLElement>("[data-providers]")];

function tabsOf(picker: HTMLElement): HTMLElement[] {
  return [...picker.querySelectorAll<HTMLElement>('[role="tab"]')];
}

function select(picker: HTMLElement, chosen: HTMLElement): void {
  for (const tab of tabsOf(picker)) {
    const on = tab === chosen;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls") ?? "");
    if (panel) panel.hidden = !on;
  }
}

function choose(picker: HTMLElement, tab: HTMLElement): void {
  select(picker, tab);
  history.replaceState(null, "", `#${tab.id}`);
}

/** The provider the address names, if any (the browser scrolls to its tile). */
function follow(): void {
  const wanted = decodeURIComponent(location.hash.slice(1));
  if (!wanted) return;
  for (const picker of pickers) {
    const tab = tabsOf(picker).find((t) => t.id === wanted);
    if (!tab) continue;
    select(picker, tab);
  }
}

for (const picker of pickers) {
  const tabs = tabsOf(picker);
  for (const [i, tab] of tabs.entries()) {
    tab.addEventListener("click", () => choose(picker, tab));
    tab.addEventListener("keydown", (event) => {
      const to = nextIndex(event.key, i, tabs.length);
      const next = to === null ? undefined : tabs[to];
      if (!next) return;
      event.preventDefault();
      choose(picker, next);
      next.focus();
    });
  }
}

follow();
addEventListener("hashchange", follow);
