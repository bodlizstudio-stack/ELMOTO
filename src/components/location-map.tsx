"use client";

import dynamic from "next/dynamic";
import { mapsDirectionsUrl, mapsSearchUrl, osmUrl, site } from "@/lib/site";

const LocationMapInner = dynamic(() => import("@/components/location-map-inner"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-panel" />,
});

export function LocationMap() {
  return (
    <section className="mt-8" aria-labelledby="map-heading" data-testid="location-map">
      <h2 id="map-heading" className="display text-4xl text-ink sm:text-5xl">
        Kje nas najdete
      </h2>
      <p className="mt-2 text-ink/70">
        {site.brand}, {site.street}, {site.postalCode} {site.city}
      </p>
      <div className="mt-4 h-72 overflow-hidden border border-black/10 sm:h-[420px]">
        <LocationMapInner />
      </div>
      <div className="mt-4 grid gap-3 sm:flex sm:flex-wrap">
        <a className="btn btn-dark w-full sm:w-auto" href={mapsSearchUrl} target="_blank" rel="noreferrer">
          Odpri v Google Maps
        </a>
        <a className="btn btn-dark w-full sm:w-auto" href={mapsDirectionsUrl} target="_blank" rel="noreferrer">
          Odpri navigacijo
        </a>
        <a className="btn btn-line btn-ink w-full sm:w-auto" href={osmUrl} target="_blank" rel="noreferrer">
          Odpri v OpenStreetMap
        </a>
      </div>
    </section>
  );
}
