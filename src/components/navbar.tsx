import Link from "next/link";
import Image from "next/image";
import { auth, signOut } from "@/auth";
import { Logo } from "./logo";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-mist/85 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <div className="flex items-center gap-1 text-sm font-medium sm:gap-3">
          <Link href="/pricing" className="rounded-full px-3 py-2 hover:text-primary">
            Pricing
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="rounded-full px-3 py-2 hover:text-primary">
                My products
              </Link>
              <Link href="/account" className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-lilac" title="Account">
                {user.image ? (
                  <Image src={user.image} alt="" width={28} height={28} className="rounded-full" />
                ) : (
                  <span className="grid size-7 place-items-center rounded-full bg-primary text-xs text-white">
                    {user.name?.[0] ?? "?"}
                  </span>
                )}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button className="hidden rounded-full px-3 py-2 text-muted hover:text-ink sm:block">Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
