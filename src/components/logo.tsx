import Link from "next/link";

/** The app logo: a small isometric cube + the name. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
        <path d="M16 3 28 10v12L16 29 4 22V10z" fill="#5b5bd6" />
        <path d="M16 3 28 10 16 17 4 10z" fill="#8f8ff0" />
        <path d="M16 17v12l12-7V10z" fill="#2dd4bf" />
      </svg>
      Turnable
    </Link>
  );
}
