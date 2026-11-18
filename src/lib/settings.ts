/**
 * EDITOR SETTINGS
 * Everything the user can change in the 3D editor is stored in one object.
 * We save this object in the database (projects.settings) as JSON.
 */

// The photo slots a user can fill. front/back/top/bottom are the main four,
// left/right are optional extras.
export const VIEW_SLOTS = ["front", "back", "top", "bottom", "left", "right"] as const;
export type ViewSlot = (typeof VIEW_SLOTS)[number];
export type ProductImages = Partial<Record<ViewSlot, string>>;

export const VIEW_LABELS: Record<ViewSlot, string> = {
  front: "Front",
  back: "Back",
  top: "Top",
  bottom: "Bottom",
  left: "Left side",
  right: "Right side",
};

export type Shape = "box" | "cylinder";
export type Finish = "matte" | "satin" | "glossy" | "metallic" | "glass";
export type Lighting = "studio" | "city" | "apartment" | "park";

export type EditorSettings = {
  shape: Shape; // only for photo projects
  width: number; // size in "units" (1 = 1 meter in the scene)
  height: number;
  depth: number;
  color: string; // product color (hex)
  showPhotos: boolean; // true = photos on the faces, false = solid color only
  finish: Finish;
  background: string;
  lighting: Lighting;
  autoRotate: boolean;
  wireframe: boolean;
};

export const DEFAULT_SETTINGS: EditorSettings = {
  shape: "box",
  width: 1,
  height: 1.4,
  depth: 0.6,
  color: "#ffffff",
  showPhotos: true,
  finish: "satin",
  background: "#eef1fb",
  lighting: "studio",
  autoRotate: true,
  wireframe: false,
};

// How each finish translates into real material values in Three.js
export const FINISHES: Record<
  Finish,
  { label: string; roughness: number; metalness: number; transmission?: number }
> = {
  matte: { label: "Matte", roughness: 0.9, metalness: 0 },
  satin: { label: "Satin", roughness: 0.5, metalness: 0.05 },
  glossy: { label: "Glossy", roughness: 0.12, metalness: 0 },
  metallic: { label: "Metallic", roughness: 0.25, metalness: 0.9 },
  glass: { label: "Glass", roughness: 0.05, metalness: 0, transmission: 0.9 },
};

// Color swatches offered in the editor (no orange or brown on purpose)
export const COLOR_SWATCHES = [
  "#ffffff",
  "#1e1b4b",
  "#5b5bd6",
  "#8b5cf6",
  "#2dd4bf",
  "#0ea5e9",
  "#22c55e",
  "#e11d74",
  "#94a3b8",
  "#111827",
];

/** Merge saved settings with the defaults, so old projects never miss a field. */
export function withDefaults(s?: Partial<EditorSettings> | null): EditorSettings {
  return { ...DEFAULT_SETTINGS, ...(s ?? {}) };
}
