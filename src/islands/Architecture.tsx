/**
 * The architecture, as a diagram you can question: pick a part (pointer or keyboard) and the panel
 * says what it does, which contracts it implements, and the lines show what it talks to. The only
 * React island of the site; every word arrives resolved from the page's Fluent catalogue.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BOW_KNOT, BOW_VIEWBOX, BOW_WINGS } from "@/character/geometry";

/** The bow tie as a list marker, as everywhere on the site. */
function Tie() {
  return (
    <svg viewBox={BOW_VIEWBOX} width="13" height="7" className="mt-[0.55rem] shrink-0 fill-ember" aria-hidden="true">
      {BOW_WINGS.map((d) => (
        <path key={d} d={d} />
      ))}
      <rect x={BOW_KNOT.x} y={BOW_KNOT.y} width={BOW_KNOT.width} height={BOW_KNOT.height} rx={BOW_KNOT.r} />
    </svg>
  );
}

export type PartId =
  | "agent"
  | "memory"
  | "initiative"
  | "journal"
  | "channels"
  | "satellites"
  | "home"
  | "connectors"
  | "executors"
  | "providers";

export interface Part {
  id: PartId;
  title: string;
  text: string;
  points: string[];
  ports: string[];
}

interface Props {
  parts: Part[];
  coreLabel: string;
  portsLabel: string;
}

const OUTER: PartId[] = ["channels", "satellites", "home", "providers", "connectors", "executors"];
const INNER: PartId[] = ["agent", "memory", "initiative", "journal"];

/** What each outer part talks to inside the core (the journal hears everything). */
export const LINKS: Record<PartId, PartId[]> = {
  channels: ["agent", "journal"],
  satellites: ["agent", "journal"],
  home: ["agent", "initiative", "journal"],
  connectors: ["agent", "initiative", "journal"],
  executors: ["agent", "journal"],
  providers: ["agent"],
  agent: ["memory", "initiative", "journal"],
  memory: ["agent", "journal"],
  initiative: ["agent", "journal"],
  journal: ["agent", "memory", "initiative"],
};

/** The parts lit when one is chosen: itself, what it talks to, and the outer parts that talk to it. */
export function related(id: PartId): Set<PartId> {
  const lit = new Set<PartId>([id, ...LINKS[id]]);
  if (INNER.includes(id)) for (const outer of OUTER) if (LINKS[outer].includes(id) && id !== "journal") lit.add(outer);
  return lit;
}

const AREA: Record<PartId, string> = {
  channels: "channels",
  satellites: "satellites",
  home: "home",
  providers: "providers",
  connectors: "connectors",
  executors: "executors",
  agent: "agent",
  memory: "memory",
  initiative: "initiative",
  journal: "journal",
};

interface Line {
  id: PartId;
  d: string;
}

export default function Architecture({ parts, coreLabel, portsLabel }: Props) {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const [chosen, setChosen] = useState<PartId>("agent");
  const [preview, setPreview] = useState<PartId | null>(null);
  const shown = preview ?? chosen;
  const lit = related(shown);
  const part = byId.get(shown);

  const box = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<PartId, HTMLElement>());
  const [lines, setLines] = useState<Line[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const measure = useCallback(() => {
    const frame = box.current?.getBoundingClientRect();
    const centre = core.current?.getBoundingClientRect();
    if (!frame || !centre) return;
    setSize({ w: frame.width, h: frame.height });
    const cx = centre.left + centre.width / 2 - frame.left;
    const cy = centre.top + centre.height / 2 - frame.top;
    const next: Line[] = [];
    for (const id of OUTER) {
      const el = nodes.current.get(id)?.getBoundingClientRect();
      if (!el) continue;
      const x = el.left + el.width / 2 - frame.left;
      const y = el.top + el.height / 2 - frame.top;
      // an elbow: out of the node vertically, then across to the core
      const midY =
        y < cy
          ? Math.min(cy - centre.height / 2, y + (cy - y) / 2)
          : Math.max(cy + centre.height / 2, y - (y - cy) / 2);
      const d =
        Math.abs(y - cy) < centre.height / 2
          ? `M${x},${y} L${cx},${y}`
          : `M${x},${y} L${x},${midY} L${cx},${midY} L${cx},${cy}`;
      next.push({ id, d });
    }
    setLines(next);
  }, []);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const observer = new ResizeObserver(measure);
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, [measure]);

  const register = (id: PartId) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  };

  const node = (id: PartId, inner: boolean) => {
    const p = byId.get(id);
    if (!p) return null;
    return (
      <button
        key={id}
        ref={register(id)}
        type="button"
        aria-pressed={chosen === id}
        aria-controls="arch-detail"
        onClick={() => setChosen(id)}
        onPointerEnter={() => setPreview(id)}
        onPointerLeave={() => setPreview(null)}
        onFocus={() => setPreview(id)}
        onBlur={() => setPreview(null)}
        className="arch-node"
        data-inner={inner || undefined}
        data-lit={lit.has(id) || undefined}
        data-shown={shown === id || undefined}
        style={{ gridArea: AREA[id] }}
      >
        <span className="arch-node-title">{p.title}</span>
      </button>
    );
  };

  return (
    <div className="arch">
      <div ref={box} className="arch-diagram">
        <svg className="arch-lines" width={size.w} height={size.h} aria-hidden="true">
          {lines.map((l) => (
            <path
              key={l.id}
              d={l.d}
              className="arch-line"
              data-lit={lit.has(l.id) && shown !== "journal" ? "" : undefined}
            />
          ))}
        </svg>
        {OUTER.slice(0, 3).map((id) => node(id, false))}
        <div ref={core} className="arch-core corner-marks" style={{ gridArea: "core" }}>
          <p className="arch-core-label">{coreLabel}</p>
          <div className="arch-core-grid">{INNER.map((id) => node(id, true))}</div>
        </div>
        {OUTER.slice(3).map((id) => node(id, false))}
      </div>

      <div id="arch-detail" className="arch-detail" aria-live="polite">
        {part ? (
          <>
            <h3 className="display-3 text-ink">{part.title}</h3>
            <p className="prose-copy mt-4">{part.text}</p>
            <ul className="mt-6 border-t border-rule">
              {part.points.map((point) => (
                <li
                  key={point}
                  className="flex gap-3 border-b border-rule py-3 text-[0.92rem] leading-relaxed text-ink-muted"
                >
                  <Tie />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex flex-wrap items-center gap-2">
              <span className="label-mono mr-1">{portsLabel}</span>
              {part.ports.map((port) => (
                <code key={port} className="tag text-ink">
                  {port}
                </code>
              ))}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
