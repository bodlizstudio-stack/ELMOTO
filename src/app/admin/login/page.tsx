"use client";

import { useActionState } from "react";
import { LogoLink } from "@/components/logo";
import { login, type ActionState } from "@/lib/actions/admin";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null as ActionState);
  return (
    <main className="grid min-h-dvh place-items-center bg-ink px-4">
      <form action={action} className="grid w-full max-w-md gap-4 bg-panel p-6">
        <LogoLink className="h-10 w-auto" />
        <h1 className="text-lg">Prijava v administracijo</h1>
        <label className="field dark-fields">
          <span>E-pošta</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field dark-fields">
          <span>Geslo</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {state?.error ? <p className="text-sm text-accent">{state.error}</p> : null}
        <button className="btn btn-primary" disabled={pending}>
          {pending ? "Prijava..." : "Prijava"}
        </button>
      </form>
    </main>
  );
}
