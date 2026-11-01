/**
 * The house as a constellation: Nestor at the centre, the rooms around it, and the devices a
 * household can add as satellites. Rooms sit on a fixed grid (three above the star, three below),
 * so nothing overlaps at any width. Capabilities and pairing methods are the protocol's own names
 * (`nestor.satellite/1`).
 */
export type RoomId = "kitchen" | "office" | "living" | "kids" | "bedroom" | "hall";
export type Capability =
  | "audio.capture"
  | "audio.playback"
  | "expression.emotion"
  | "motion.head"
  | "vision.person_detection";

export interface Satellite {
  id: "speaker" | "tablet" | "reachy" | "phone" | "browser" | "pi" | "esp";
  room: RoomId;
  model: string;
  pairing: string;
  capabilities: Capability[];
  /** not shipped yet (marked on the developers' page) */
  planned?: boolean;
}

/** Above the star, then below it. */
export const ROOMS: RoomId[] = ["kitchen", "office", "living", "kids", "bedroom", "hall"];

const voice: Capability[] = ["audio.capture", "audio.playback"];
const face: Capability[] = [...voice, "expression.emotion"];

export const SATELLITES: Satellite[] = [
  { id: "speaker", room: "kitchen", model: "pi-speaker", pairing: "device_code.speech", capabilities: voice },
  { id: "browser", room: "office", model: "browser", pairing: "device_code.display", capabilities: face },
  {
    id: "reachy",
    room: "living",
    model: "reachy-mini",
    pairing: "enrollment.qr",
    capabilities: [...face, "motion.head", "vision.person_detection"],
  },
  {
    id: "esp",
    room: "living",
    model: "esp32-s3",
    pairing: "enrollment.provisioning",
    capabilities: voice,
    planned: true,
  },
  { id: "phone", room: "kids", model: "old-phone", pairing: "device_code.display", capabilities: face },
  { id: "pi", room: "bedroom", model: "raspberry-pi-4", pairing: "enrollment.provisioning", capabilities: voice },
  { id: "tablet", room: "hall", model: "wall-tablet", pairing: "device_code.display", capabilities: face },
];

/** What the house starts with when the page runs (everything is lit without JavaScript). */
export const FIRST: Satellite["id"][] = ["speaker", "reachy"];

/** A satellite's manifest, as it declares itself when it pairs (trimmed to what the sky shows). */
export function manifest(s: Satellite): string {
  return JSON.stringify(
    {
      protocol: "nestor.satellite/1",
      device: { id: `${s.id}-${s.room}`, model: s.model, room: s.room },
      pairing_methods: [s.pairing],
      capabilities: s.capabilities.map((name) => ({ name })),
    },
    null,
    2,
  );
}
