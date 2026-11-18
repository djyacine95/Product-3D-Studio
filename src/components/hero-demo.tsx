"use client";
/** The live 3D product on the home page. Visitors can recolor it right away. */
import { useEffect, useState } from "react";
import type * as THREE from "three";
import { ProductScene } from "./three/scene-loader";
import { DEFAULT_SETTINGS, FINISHES, type Finish, type ViewSlot } from "@/lib/settings";

const DEMO_COLORS = [
  { name: "Original", hex: "#ffffff" },
  { name: "Aqua", hex: "#9ff0e4" },
  { name: "Lilac", hex: "#c9c3ff" },
  { name: "Rose", hex: "#ffc2d9" },
  { name: "Night", hex: "#6f6aa8" },
];

export function HeroDemo() {
  const [textures, setTextures] = useState<Partial<Record<ViewSlot, THREE.Texture>>>();
  const [color, setColor] = useState("#ffffff");
  const [finish, setFinish] = useState<Finish>("satin");

  useEffect(() => {
    import("./three/demo-textures").then((m) => setTextures(m.createDemoTextures()));
  }, []);

  const settings = { ...DEFAULT_SETTINGS, color, finish, background: "#e6e9fa", width: 0.9, height: 1.3, depth: 0.55 };

  return (
    <div className="panel overflow-hidden">
      <div className="aspect-square w-full sm:aspect-[5/4]">
        {textures && <ProductScene settings={settings} textures={textures} />}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Product color">
          {DEMO_COLORS.map((c) => (
            <button
              key={c.hex}
              role="radio"
              aria-checked={color === c.hex}
              aria-label={c.name}
              title={c.name}
              onClick={() => setColor(c.hex)}
              className={`size-7 rounded-full border-2 ${color === c.hex ? "border-primary" : "border-line"}`}
              style={{ background: c.hex }}
            />
          ))}
        </div>
        <div className="flex gap-1 text-xs font-semibold">
          {(["matte", "satin", "metallic"] as Finish[]).map((f) => (
            <button
              key={f}
              onClick={() => setFinish(f)}
              className={`rounded-full px-3 py-1.5 ${finish === f ? "bg-ink text-white" : "text-body hover:bg-lilac"}`}
            >
              {FINISHES[f].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
