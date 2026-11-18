import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-sm text-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Turnable. A student project built with Next.js.</p>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
          <Link href="/dashboard" className="hover:text-ink">My products</Link>
        </div>
      </div>
    </footer>
  );
}
