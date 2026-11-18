/**
 * Draws a pretend product package ("Lumen tea") with the Canvas API,
 * so the home page can show a live 3D demo without any real photos.
 */
import * as THREE from "three";
import type { ViewSlot } from "@/lib/settings";

function face(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f7f7ff";
  ctx.fillRect(0, 0, w, h);
  draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function leaves(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.fillStyle = "#2dd4bf";
  for (let i = 0; i < 5; i++) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((i - 2) * 0.45);
    ctx.beginPath();
    ctx.ellipse(0, -s, s * 0.35, s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function createDemoTextures(): Partial<Record<ViewSlot, THREE.Texture>> {
  const front = face((ctx, w, h) => {
    ctx.fillStyle = "#5b5bd6";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    leaves(ctx, w / 2, h * 0.42, 70);
    ctx.fillStyle = "#1c1a3a";
    ctx.font = "bold 64px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Lumen", w / 2, h * 0.58);
    ctx.fillStyle = "#ffffff";
    ctx.font = "600 30px sans-serif";
    ctx.fillText("Jasmine green tea", w / 2, h * 0.76);
    ctx.font = "22px sans-serif";
    ctx.fillText("20 sachets", w / 2, h * 0.86);
  });
  const back = face((ctx) => {
    ctx.fillStyle = "#1c1a3a";
    ctx.font = "bold 34px sans-serif";
    ctx.fillText("Brewing", 50, 90);
    ctx.font = "24px sans-serif";
    ["80°C water", "Steep 3 minutes", "Enjoy without milk"].forEach((t, i) => ctx.fillText(t, 50, 150 + i * 44));
    ctx.fillStyle = "#1c1a3a";
    for (let i = 0; i < 40; i++) ctx.fillRect(50 + i * 9, 380, i % 3 ? 4 : 6, 70);
  });
  const side = face((ctx, w, h) => {
    ctx.fillStyle = "#5b5bd6";
    ctx.fillRect(0, 0, w, h);
    leaves(ctx, w / 2, h / 2, 60);
  });
  const top = face((ctx, w, h) => {
    ctx.fillStyle = "#ebeaff";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#5b5bd6";
    ctx.font = "bold 56px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Lumen", w / 2, h / 2 + 18);
  });
  return { front, back, left: side, right: side, top, bottom: top };
}
