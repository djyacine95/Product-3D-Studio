"use client";
import { useState } from "react";

/** Opens Stripe's billing portal (change plan, update card, cancel). */
export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      className="btn-ghost"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const json = await res.json();
        if (json.url) window.location.assign(json.url);
        else setLoading(false);
      }}
    >
      {loading ? "Opening…" : "Manage billing"}
    </button>
  );
}
