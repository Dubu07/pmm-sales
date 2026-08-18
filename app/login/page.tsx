"use client";

import { FormEvent, useState } from "react";
import { buttonPrimary, inputClass, labelClass } from "@/components/ui";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Unable to sign in.");
        return;
      }

      window.location.assign("/");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <div className="mb-8 text-center">
          <img src="/company-logo.png" alt="Premium Machine Enterprise" className="mx-auto mb-5 h-16 w-auto object-contain" />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Sign in</h1>
          <p className="mt-2 text-sm text-slate-500">PMM Sales &amp; Invoice System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="user-id" className={labelClass}>ID</label>
            <input id="user-id" name="userId" value={userId} onChange={(event) => setUserId(event.target.value)} className={inputClass} autoComplete="username" autoFocus required />
          </div>
          <div>
            <label htmlFor="password" className={labelClass}>Password</label>
            <input id="password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} autoComplete="current-password" required />
          </div>
          {error ? <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <button type="submit" className={`${buttonPrimary} w-full`} disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}