"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="vsebina" className="grid min-h-[70svh] place-items-center px-4 py-16 text-center">
      <div>
        <h1 className="display text-6xl">Nekaj je šlo narobe</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">Strani trenutno ni mogoče prikazati. Poskusite znova.</p>
        <button className="btn btn-primary mt-8" type="button" onClick={() => reset()}>
          Poskusi znova
        </button>
      </div>
    </main>
  );
}
