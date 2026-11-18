"use client";
/**
 * Step 1 of the studio: upload photos, name the product, pick how to build it.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, X, Zap, Sparkles } from "lucide-react";
import { uploadImage } from "@/lib/image";
import { VIEW_LABELS, VIEW_SLOTS, type ProductImages, type ViewSlot } from "@/lib/settings";

const REQUIRED: ViewSlot[] = ["front", "back", "top", "bottom"];

export function NewProductForm({ aiAvailable, aiReason }: { aiAvailable: boolean; aiReason: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [images, setImages] = useState<ProductImages>({});
  const [uploading, setUploading] = useState<Partial<Record<ViewSlot, boolean>>>({});
  const [mode, setMode] = useState<"photo" | "ai">("photo");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleFile(slot: ViewSlot, file?: File) {
    if (!file) return;
    setError("");
    setUploading((u) => ({ ...u, [slot]: true }));
    try {
      const url = await uploadImage(file);
      setImages((imgs) => ({ ...imgs, [slot]: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading((u) => ({ ...u, [slot]: false }));
    }
  }

  async function create() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Untitled product", mode, images }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Could not create the product.");
      setSaving(false);
      return;
    }
    router.push(`/studio/${json.project.id}`);
  }

  const missing = REQUIRED.filter((s) => !images[s]);
  const busy = Object.values(uploading).some(Boolean);

  return (
    <div className="mt-8 space-y-8">
      {/* ---------- Photos ---------- */}
      <section>
        <h2 className="text-lg font-bold">Photos</h2>
        <p className="text-sm text-muted">Front, back, top and bottom are needed. Left and right sides are optional.</p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {VIEW_SLOTS.map((slot) => (
            <PhotoSlot
              key={slot}
              label={VIEW_LABELS[slot]}
              optional={!REQUIRED.includes(slot)}
              url={images[slot]}
              loading={uploading[slot]}
              onFile={(f) => handleFile(slot, f)}
              onRemove={() =>
                setImages((imgs) => {
                  const copy = { ...imgs };
                  delete copy[slot];
                  return copy;
                })
              }
            />
          ))}
        </div>
      </section>

      {/* ---------- Name ---------- */}
      <section className="max-w-md">
        <label htmlFor="name" className="field-label">
          Product name
        </label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Jasmine tea box"
          maxLength={80}
          className="w-full rounded-xl border border-line bg-card px-4 py-2.5 outline-none focus:border-primary"
        />
      </section>

      {/* ---------- Build mode ---------- */}
      <section>
        <h2 className="text-lg font-bold">How should we build it?</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2" role="radiogroup">
          <ModeOption
            selected={mode === "photo"}
            onSelect={() => setMode("photo")}
            icon={<Zap className="size-5" />}
            title="Instant 3D"
            text="Your photos are placed on a box or bottle shape. Ready in seconds, on every plan."
          />
          <ModeOption
            selected={mode === "ai"}
            onSelect={() => aiAvailable && setMode("ai")}
            disabled={!aiAvailable}
            icon={<Sparkles className="size-5" />}
            title="AI 3D"
            text={aiAvailable ? "AI rebuilds the real shape of your product. Takes 2–5 minutes." : aiReason}
          />
        </div>
      </section>

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button onClick={create} disabled={missing.length > 0 || busy || saving} className="btn-primary px-6 py-3">
          {saving && <Loader2 className="size-4 animate-spin" />}
          {mode === "ai" ? "Build with AI" : "Build 3D model"}
        </button>
        {missing.length > 0 && (
          <p className="text-sm text-muted">Still needed: {missing.map((s) => VIEW_LABELS[s].toLowerCase()).join(", ")}</p>
        )}
      </div>
    </div>
  );
}

function PhotoSlot(props: {
  label: string;
  optional: boolean;
  url?: string;
  loading?: boolean;
  onFile: (f?: File) => void;
  onRemove: () => void;
}) {
  const { label, optional, url, loading, onFile, onRemove } = props;
  return (
    <div className="relative">
      <label
        className={`flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-sm transition-colors ${
          url ? "border-transparent" : "border-line bg-card hover:border-primary hover:bg-lilac/50"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFile(e.dataTransfer.files[0]);
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={`${label} photo`} className="h-full w-full object-cover" />
        ) : loading ? (
          <Loader2 className="size-6 animate-spin text-primary" />
        ) : (
          <>
            <ImagePlus className="size-7 text-primary" />
            <span className="mt-2 font-semibold text-ink">{label}</span>
            <span className="text-xs text-muted">{optional ? "Optional" : "Click or drop a photo"}</span>
          </>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>
      {url && (
        <>
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-white">
            {label}
          </span>
          <button
            onClick={onRemove}
            aria-label={`Remove ${label} photo`}
            className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-white/90 text-ink hover:text-danger"
          >
            <X className="size-4" />
          </button>
        </>
      )}
    </div>
  );
}

function ModeOption(props: {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button
      role="radio"
      aria-checked={props.selected}
      aria-disabled={props.disabled}
      onClick={props.onSelect}
      className={`rounded-2xl border-2 p-5 text-left transition-colors ${
        props.selected ? "border-primary bg-lilac/60" : "border-line bg-card"
      } ${props.disabled ? "cursor-not-allowed opacity-60" : "hover:border-primary"}`}
    >
      <span className="flex items-center gap-2 font-bold text-ink">
        <span className="text-primary">{props.icon}</span>
        {props.title}
      </span>
      <span className="mt-1.5 block text-sm">{props.text}</span>
    </button>
  );
}
