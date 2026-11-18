"use client";
// Three.js only works in the browser, so we load the scene without
// server-side rendering (ssr: false) and show a placeholder meanwhile.
import dynamic from "next/dynamic";

export const ProductScene = dynamic(() => import("./product-scene"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm text-muted">Loading 3D viewer…</div>
  ),
});
