/**
 * Each code block of the documentation gets a copy button, cloned from the page's
 * `<template id="doc-copy">` (its words come from the catalogues). Without JavaScript the code
 * stays selectable.
 */
const template = document.querySelector<HTMLTemplateElement>("#doc-copy");

for (const pre of document.querySelectorAll<HTMLPreElement>(".doc-prose pre")) {
  const button = template?.content.firstElementChild?.cloneNode(true);
  if (!(button instanceof HTMLButtonElement)) break;
  const holder = document.createElement("div");
  holder.className = "doc-code";
  pre.replaceWith(holder);
  holder.append(pre, button);
  const label = button.querySelector<HTMLElement>("[data-copy-label]");
  const idle = label?.textContent ?? "";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText((pre.textContent ?? "").replace(/\n$/, ""));
      if (label) label.textContent = button.dataset.copied ?? idle;
      button.setAttribute("data-done", "");
      setTimeout(() => {
        if (label) label.textContent = idle;
        button.removeAttribute("data-done");
      }, 1600);
    } catch {
      // clipboard refused: the code stays selectable on screen
    }
  });
}
