"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-2">
      <button
        type="button"
        className="btn btn-line w-full sm:w-auto"
        onClick={async () => {
          const url = window.location.href;
          try {
            if (navigator.share) {
              await navigator.share({ title, url });
              setMessage("Povezava je pripravljena za deljenje.");
              return;
            }
          } catch {
            return;
          }
          try {
            await navigator.clipboard.writeText(url);
            setMessage("Povezava je kopirana.");
          } catch {
            setMessage(url);
          }
        }}
      >
        Deli motor
      </button>
      {message ? <p className="break-all text-sm text-muted">{message}</p> : null}
    </div>
  );
}
