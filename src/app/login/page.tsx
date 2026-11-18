import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { GoogleButton } from "@/components/google-button";

export const metadata = { title: "Sign in — Turnable" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { callbackUrl } = await searchParams;
  const target = typeof callbackUrl === "string" && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  // Already signed in? Skip this page.
  if ((await auth())?.user) redirect(target);

  return (
    <div className="mx-auto max-w-md px-5 py-20">
      <div className="panel p-8">
        <h1 className="text-3xl font-bold">Sign in to Turnable</h1>
        <p className="mt-2">Use your Google account. If it’s your first time, we’ll create your free account.</p>
        <div className="mt-8">
          <GoogleButton callbackUrl={target} />
        </div>
        <p className="mt-6 text-xs text-muted">
          We only receive your name, email address and profile picture from Google.
        </p>
      </div>
    </div>
  );
}
