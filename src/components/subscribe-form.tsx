"use client";

import { useActionState } from "react";
import { subscribe, type FormState } from "@/lib/actions/public";

export function SubscribeForm() {
  const [state, action, pending] = useActionState(subscribe, null as FormState);
  return (
    <form action={action} className="grid gap-3 border border-white/10 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="field dark-fields">
        <span>Obvestila o novi ponudbi</span>
        <input name="email" type="email" required autoComplete="email" placeholder="vas@email.si" />
      </label>
      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Shranjujem..." : "Prijavi me"}
      </button>
      <label className="flex items-start gap-3 text-sm text-muted sm:col-span-2">
        <input name="consent" type="checkbox" required className="mt-1 h-5 w-5" />
        <span>Soglašam, da EL-MOTO hrani ta naslov za obvestila o ponudbi. Odjava je mogoča kadarkoli.</span>
      </label>
      <input name="website" className="hidden" tabIndex={-1} autoComplete="off" />
      {state?.message ? <p className="text-sm sm:col-span-2">{state.message}</p> : null}
    </form>
  );
}
