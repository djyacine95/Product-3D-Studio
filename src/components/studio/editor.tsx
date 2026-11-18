"use client";
/**
 * Step 2 of the studio: the 3D editor.
 * Left: the live 3D view. Right: controls that change `settings`.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Image as ImageIcon, Loader2, Lock, Save, Trash2, ArrowLeft } from "lucide-react";
import { ProductScene } from "@/components/three/scene-loader";
import type { SceneHandle } from "@/components/three/product-scene";
import {
  COLOR_SWATCHES,
  FINISHES,
  type EditorSettings,
  type Finish,
  type Lighting,
  type ProductImages,
} from "@/lib/settings";

type EditorProject = {
  id: string;
  name: string;
  mode: "photo" | "ai";
  images: ProductImages;
  settings: EditorSettings;
  status: string;
  progress: number;
  modelUrl: string | null;
  errorMessage: string | null;
};

const BACKGROUNDS = ["#eef1fb", "#ffffff", "#e3f7f4", "#f3e8ff", "#1c1a3a"];
const LIGHTING: { id: Lighting; label: string }[] = [
  { id: "studio", label: "Studio" },
  { id: "city", label: "City" },
  { id: "apartment", label: "Home" },
  { id: "park", label: "Outdoor" },
];

export function Editor({ project: initial, canExportGlb }: { project: EditorProject; canExportGlb: boolean }) {
  const router = useRouter();
  const sceneRef = useRef<SceneHandle | null>(null);
  const [project, setProject] = useState(initial);
  const [settings, setSettings] = useState(initial.settings);
  const [name, setName] = useState(initial.name);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");

  // Update one setting, e.g. update("color", "#5b5bd6")
  function update<K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaveState("dirty");
  }

  // ---- AI projects: ask the server for progress every 5 seconds ----
  useEffect(() => {
    if (project.status !== "processing") return;
    const timer = setInterval(async () => {
      const res = await fetch(`/api/projects/${project.id}/status`);
      if (res.ok) {
        const { project: p } = await res.json();
        setProject((old) => ({ ...old, status: p.status, progress: p.progress, modelUrl: p.modelUrl, errorMessage: p.errorMessage }));
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [project.id, project.status]);

  async function save() {
    setSaveState("saving");
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, settings }),
    });
    setSaveState(res.ok ? "saved" : "dirty");
  }

  async function remove() {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    router.push("/dashboard");
    router.refresh();
  }

  function download(href: string, filename: string) {
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
  }

  async function downloadGlb() {
    const blob = await sceneRef.current?.exportGlb();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    download(url, `${slug(name)}.glb`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const isAi = project.mode === "ai";
  const ready = project.status === "ready";

  return (
    <div className="mx-auto max-w-7xl px-5 py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-primary">
        <ArrowLeft className="size-4" /> My products
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------------- 3D view ---------------- */}
        <div className="panel relative h-[60vh] overflow-hidden lg:h-[calc(100vh-9rem)]">
          {ready ? (
            <ProductScene
              settings={settings}
              images={project.images}
              modelUrl={isAi ? project.modelUrl : null}
              handleRef={sceneRef}
            />
          ) : project.status === "processing" ? (
            <div className="grid h-full place-items-center p-6 text-center">
              <div className="w-full max-w-xs">
                <Loader2 className="mx-auto size-8 animate-spin text-primary" />
                <p className="mt-4 font-semibold text-ink">AI is building your 3D model</p>
                <p className="mt-1 text-sm text-muted">This usually takes 2–5 minutes. You can leave this page.</p>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-lilac">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                </div>
                <p className="mt-2 text-sm font-semibold text-primary">{project.progress}%</p>
              </div>
            </div>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center">
              <div className="max-w-sm">
                <p className="font-semibold text-danger">The model could not be built</p>
                <p className="mt-1 text-sm">{project.errorMessage}</p>
                <p className="mt-3 text-sm">Try again with sharper photos on a plain background.</p>
              </div>
            </div>
          )}
          {ready && <p className="pointer-events-none absolute bottom-3 left-4 text-xs text-muted">Drag to turn, scroll to zoom</p>}
        </div>

        {/* ---------------- Controls ---------------- */}
        <aside className="panel space-y-6 p-5 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
          <div>
            <label htmlFor="name" className="field-label">Product name</label>
            <input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaveState("dirty");
              }}
              className="w-full rounded-xl border border-line px-3 py-2 outline-none focus:border-primary"
            />
          </div>

          {!isAi && (
            <Group title="Shape">
              <Chips
                value={settings.shape}
                options={[{ id: "box", label: "Box" }, { id: "cylinder", label: "Bottle / can" }]}
                onChange={(v) => update("shape", v)}
              />
            </Group>
          )}

          <Group title="Color">
            <div className="flex flex-wrap gap-2">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  aria-label={`Color ${c}`}
                  onClick={() => update("color", c)}
                  className={`size-8 rounded-full border-2 ${settings.color === c ? "border-primary ring-2 ring-primary/30" : "border-line"}`}
                  style={{ background: c }}
                />
              ))}
              <label className="relative grid size-8 cursor-pointer place-items-center rounded-full border-2 border-dashed border-line text-xs font-bold text-muted" title="Pick any color">
                +
                <input type="color" value={settings.color} onChange={(e) => update("color", e.target.value)} className="sr-only" />
              </label>
            </div>
            <Toggle label="Show photos on the product" checked={settings.showPhotos} onChange={(v) => update("showPhotos", v)} />
            <p className="text-xs text-muted">Turn photos off to see the product in a solid color.</p>
          </Group>

          <Group title="Finish">
            <Chips
              value={settings.finish}
              options={(Object.keys(FINISHES) as Finish[]).map((f) => ({ id: f, label: FINISHES[f].label }))}
              onChange={(v) => update("finish", v)}
            />
          </Group>

          <Group title="Size">
            <Slider label="Width" value={settings.width} min={0.2} max={3} onChange={(v) => update("width", v)} />
            <Slider label="Height" value={settings.height} min={0.2} max={3} onChange={(v) => update("height", v)} />
            <Slider label="Depth" value={settings.depth} min={0.05} max={3} onChange={(v) => update("depth", v)} />
          </Group>

          <Group title="Scene">
            <Chips value={settings.lighting} options={LIGHTING} onChange={(v) => update("lighting", v)} />
            <div className="flex gap-2">
              {BACKGROUNDS.map((c) => (
                <button
                  key={c}
                  aria-label={`Background ${c}`}
                  onClick={() => update("background", c)}
                  className={`h-7 w-10 rounded-lg border-2 ${settings.background === c ? "border-primary" : "border-line"}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <Toggle label="Spin automatically" checked={settings.autoRotate} onChange={(v) => update("autoRotate", v)} />
            <Toggle label="Wireframe view" checked={settings.wireframe} onChange={(v) => update("wireframe", v)} />
          </Group>

          <div className="space-y-2 border-t border-line pt-5">
            <button onClick={save} disabled={saveState !== "dirty"} className="btn-primary w-full">
              {saveState === "saving" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saveState === "saved" ? "All changes saved" : saveState === "saving" ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={() => sceneRef.current && download(sceneRef.current.screenshot(), `${slug(name)}.png`)}
              disabled={!ready}
              className="btn-ghost w-full"
            >
              <ImageIcon className="size-4" /> Download image (PNG)
            </button>
            {canExportGlb ? (
              <button onClick={downloadGlb} disabled={!ready} className="btn-ghost w-full">
                <Download className="size-4" /> Download 3D file (GLB)
              </button>
            ) : (
              <Link href="/pricing" className="btn-ghost w-full">
                <Lock className="size-4" /> 3D file download on Pro
              </Link>
            )}
            <button onClick={remove} className="btn w-full text-danger hover:bg-danger/10">
              <Trash2 className="size-4" /> Delete product
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------- Small UI pieces ----------------

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product";
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 text-sm font-bold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function Chips<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${value === o.id ? "bg-ink text-white" : "bg-mist text-body hover:bg-lilac"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Slider({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="flex justify-between">
        <span>{label}</span>
        <span className="tabular-nums text-muted">{value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={0.05}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-primary"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      {label}
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-primary" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${checked ? "left-5.5" : "left-0.5"}`} />
      </button>
    </label>
  );
}
