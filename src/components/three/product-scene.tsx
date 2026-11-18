"use client";
/**
 * THE 3D SCENE
 * ------------
 * Built with react-three-fiber (React + Three.js).
 *  - <PhotoModel>  builds a box or cylinder and puts one photo on each face.
 *  - <AiModel>     loads a .glb file made by the AI service.
 * Both read the same `settings` object, so the editor controls work for both.
 */
import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, OrbitControls, useGLTF } from "@react-three/drei";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { FINISHES, type EditorSettings, type Lighting, type ProductImages, type ViewSlot } from "@/lib/settings";

export type SceneHandle = {
  exportGlb: () => Promise<Blob>;
  screenshot: () => string; // PNG as a data URL
};

type Textures = Partial<Record<ViewSlot, THREE.Texture>>;

type Props = {
  settings: EditorSettings;
  images?: ProductImages; // photo URLs (photo mode)
  textures?: Textures; // ready-made textures (used by the home page demo)
  modelUrl?: string | null; // .glb URL (AI mode)
  handleRef?: RefObject<SceneHandle | null>;
  controls?: boolean;
};

export default function ProductScene({ settings, images, textures, modelUrl, handleRef, controls = true }: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [2.1, 1.3, 2.7], fov: 40 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }} // preserveDrawingBuffer = allow screenshots
    >
      <color attach="background" args={[settings.background]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />

      <Suspense fallback={null}>
        <StudioLights lighting={settings.lighting} />
        <ModelGroup settings={settings} images={images} textures={textures} modelUrl={modelUrl} handleRef={handleRef} />
        <ContactShadows position={[0, -0.85, 0]} opacity={0.35} scale={8} blur={2.4} far={3} />
      </Suspense>

      <OrbitControls
        makeDefault
        enabled={controls}
        enablePan={false}
        autoRotate={settings.autoRotate}
        autoRotateSpeed={1.2}
        minDistance={1.5}
        maxDistance={9}
      />
    </Canvas>
  );
}

/**
 * Reflections and soft light for shiny materials.
 * We build the "environment" from glowing panels (Lightformers) instead of
 * downloading a photo-based HDR file, so it works offline and loads instantly.
 */
const LIGHT_SETUPS: Record<Lighting, { color: string; panels: { pos: [number, number, number]; scale: [number, number, number]; intensity: number; color?: string }[] }> = {
  studio: {
    color: "#ffffff",
    panels: [
      { pos: [0, 5, -2], scale: [10, 2, 1], intensity: 3 },
      { pos: [-5, 1, 0], scale: [4, 6, 1], intensity: 2 },
      { pos: [5, 1, 0], scale: [4, 6, 1], intensity: 2 },
    ],
  },
  city: {
    color: "#dfe7ff",
    panels: [
      { pos: [0, 4, -5], scale: [12, 4, 1], intensity: 2.5, color: "#cfe0ff" },
      { pos: [-6, 0, 2], scale: [2, 8, 1], intensity: 3, color: "#a9c4ff" },
      { pos: [6, 0, 2], scale: [2, 8, 1], intensity: 1.5 },
    ],
  },
  apartment: {
    color: "#fff8f0",
    panels: [
      { pos: [-4, 3, 3], scale: [5, 5, 1], intensity: 3, color: "#fff6e8" },
      { pos: [4, 2, -3], scale: [3, 3, 1], intensity: 1.2 },
    ],
  },
  park: {
    color: "#e8fbf6",
    panels: [
      { pos: [0, 6, 0], scale: [12, 12, 1], intensity: 2.5, color: "#eaf6ff" },
      { pos: [0, -3, 4], scale: [10, 2, 1], intensity: 1, color: "#b8f0d8" },
    ],
  },
};

function StudioLights({ lighting }: { lighting: Lighting }) {
  const setup = LIGHT_SETUPS[lighting] ?? LIGHT_SETUPS.studio;
  return (
    <Environment resolution={256} key={lighting}>
      <color attach="background" args={[setup.color]} />
      {setup.panels.map((p, i) => (
        <Lightformer
          key={i}
          form="rect"
          position={p.pos}
          scale={p.scale}
          intensity={p.intensity}
          color={p.color ?? "#ffffff"}
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
      ))}
    </Environment>
  );
}

/** Wraps the model in a group so we can export it, and exposes export/screenshot. */
function ModelGroup({ settings, images, textures, modelUrl, handleRef }: Omit<Props, "controls">) {
  const group = useRef<THREE.Group>(null);
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    if (!handleRef) return;
    handleRef.current = {
      async exportGlb() {
        const exporter = new GLTFExporter();
        const result = await exporter.parseAsync(group.current!, { binary: true });
        return new Blob([result as ArrayBuffer], { type: "model/gltf-binary" });
      },
      screenshot() {
        gl.render(scene, camera);
        return gl.domElement.toDataURL("image/png");
      },
    };
  }, [handleRef, gl, scene, camera]);

  return (
    <group ref={group} name="product">
      {modelUrl ? (
        <AiModel url={modelUrl} settings={settings} />
      ) : (
        <PhotoModel settings={settings} images={images} textures={textures} />
      )}
    </group>
  );
}

// ------------------------------------------------------------------
// Shared: create one material from the settings
// ------------------------------------------------------------------
function makeMaterial(settings: EditorSettings, map?: THREE.Texture | null) {
  const finish = FINISHES[settings.finish];
  return new THREE.MeshPhysicalMaterial({
    color: settings.color,
    map: settings.showPhotos ? map ?? null : null,
    roughness: finish.roughness,
    metalness: finish.metalness,
    transmission: finish.transmission ?? 0,
    thickness: finish.transmission ? 0.5 : 0,
    clearcoat: settings.finish === "glossy" ? 1 : 0,
    wireframe: settings.wireframe,
  });
}

// ------------------------------------------------------------------
// Photo mode
// ------------------------------------------------------------------

/** Loads photo URLs as Three.js textures. */
function useImageTextures(images?: ProductImages): Textures {
  const [loaded, setLoaded] = useState<Textures>({});
  const key = JSON.stringify(images ?? {});

  useEffect(() => {
    if (!images) return;
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const result: Textures = {};

    Promise.all(
      Object.entries(images).map(async ([slot, url]) => {
        if (!url) return;
        const texture = await loader.loadAsync(url);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        result[slot as ViewSlot] = texture;
      })
    ).then(() => !cancelled && setLoaded(result));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return loaded;
}

function PhotoModel({ settings, images, textures }: { settings: EditorSettings; images?: ProductImages; textures?: Textures }) {
  const fromUrls = useImageTextures(textures ? undefined : images);
  const tex = textures ?? fromUrls;

  // Box faces in Three.js order: right, left, top, bottom, front, back
  const boxMaterials = useMemo(
    () => [tex.right, tex.left, tex.top, tex.bottom, tex.front, tex.back].map((t) => makeMaterial(settings, t)),
    [tex, settings]
  );

  // Cylinder: the side shows front + back photos side by side
  const sideTexture = useMemo(() => wrapAroundTexture(tex.front, tex.back), [tex.front, tex.back]);
  const cylinderMaterials = useMemo(
    () => [makeMaterial(settings, sideTexture), makeMaterial(settings, tex.top), makeMaterial(settings, tex.bottom)],
    [settings, sideTexture, tex.top, tex.bottom]
  );

  // Clean up GPU memory when materials change
  useEffect(() => () => boxMaterials.forEach((m) => m.dispose()), [boxMaterials]);
  useEffect(() => () => cylinderMaterials.forEach((m) => m.dispose()), [cylinderMaterials]);

  const { width, height, depth } = settings;
  // Keep the product standing on the "floor" (y = -0.85)
  const y = -0.85 + height / 2;

  if (settings.shape === "cylinder") {
    return (
      <mesh position={[0, y, 0]} scale={[1, 1, depth / width]} material={cylinderMaterials} castShadow>
        <cylinderGeometry args={[width / 2, width / 2, height, 64]} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, y, 0]} material={boxMaterials} castShadow>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  );
}

/** Joins front and back photos into one long image that wraps around a cylinder. */
function wrapAroundTexture(front?: THREE.Texture, back?: THREE.Texture) {
  if (!front) return null;
  const f = front.image as HTMLImageElement | HTMLCanvasElement;
  const b = (back?.image ?? f) as HTMLImageElement | HTMLCanvasElement;
  const h = 512;
  const canvas = document.createElement("canvas");
  canvas.width = h * 2;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(f, 0, 0, h, h);
  ctx.drawImage(b, h, 0, h, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.offset.x = 0.25; // center the front photo on the side facing the camera
  return texture;
}

// ------------------------------------------------------------------
// AI mode
// ------------------------------------------------------------------
function AiModel({ url, settings }: { url: string; settings: EditorSettings }) {
  const gltf = useGLTF(url);

  // Copy the model so our changes don't affect the cached original,
  // and scale it so its biggest side is 1.6 units.
  const { model, baseScale, offset } = useMemo(() => {
    const model = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const baseScale = 1.6 / Math.max(size.x, size.y, size.z);
    const offset = new THREE.Vector3(-center.x, -box.min.y, -center.z).multiplyScalar(baseScale);
    model.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.userData.originalMaterial = mesh.material; // remember original look
      }
    });
    return { model, baseScale, offset };
  }, [gltf.scene]);

  // Re-style every mesh when the settings change
  useEffect(() => {
    model.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const original = mesh.userData.originalMaterial as THREE.MeshStandardMaterial;
      const material = makeMaterial(settings, original.map);
      if (settings.showPhotos) {
        material.normalMap = original.normalMap ?? null;
        material.roughnessMap = original.roughnessMap ?? null;
        material.metalnessMap = original.metalnessMap ?? null;
      }
      if (mesh.material !== original) (mesh.material as THREE.Material).dispose();
      mesh.material = material;
    });
  }, [model, settings]);

  return (
    <group position={[offset.x * settings.width, -0.85 + offset.y * settings.height, offset.z * settings.depth]}>
      <primitive
        object={model}
        scale={[baseScale * settings.width, baseScale * settings.height, baseScale * settings.depth]}
      />
    </group>
  );
}
