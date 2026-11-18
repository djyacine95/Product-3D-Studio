import Link from "next/link";
import { HeroDemo } from "@/components/hero-demo";
import { PricingTable } from "@/components/pricing-table";
import { auth } from "@/auth";

const STEPS = [
  {
    title: "Photograph your product",
    text: "Take a picture of the front, back, top and bottom. A phone camera and a plain background are enough.",
  },
  {
    title: "Get a 3D model",
    text: "Turnable wraps your photos into a 3D model in seconds. On paid plans, AI rebuilds the real shape.",
  },
  {
    title: "Restyle and share",
    text: "Try new colors and finishes, change the size, then download an image or a 3D file for your shop.",
  },
];

export default async function HomePage() {
  const session = await auth();
  const startHref = session ? "/studio/new" : "/login";

  return (
    <>
      {/* ---------- Hero: a live 3D product you can play with ---------- */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-[1fr_1.1fr] md:py-20">
        <div>
          <h1 className="text-4xl leading-[1.05] font-bold sm:text-5xl lg:text-6xl">
            Four product photos in. A 3D model you can restyle out.
          </h1>
          <p className="mt-5 max-w-md text-lg">
            Upload the front, back, top and bottom of any product. Spin it, recolor it and try new finishes before
            you ever make a sample.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={startHref} className="btn-primary px-6 py-3 text-base">
              Make my first 3D product
            </Link>
            <Link href="/pricing" className="btn-ghost px-6 py-3 text-base">
              See plans
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">Free plan included. Sign in with your Google account.</p>
        </div>
        <HeroDemo />
      </section>

      {/* ---------- How it works (a real sequence, so numbered) ---------- */}
      <section className="border-y border-line bg-card">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-3xl font-bold">How it works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-display text-5xl leading-none font-bold text-lilac [-webkit-text-stroke:1.5px_var(--color-primary)]">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                  <p className="mt-1.5">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-3xl font-bold">Plans</h2>
        <p className="mt-2 max-w-xl">Start free. Upgrade when you need AI-built shapes and 3D file downloads.</p>
        <div className="mt-8">
          <PricingTable signedIn={Boolean(session)} />
        </div>
      </section>
    </>
  );
}
