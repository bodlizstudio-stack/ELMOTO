import type { Metadata } from "next";
import { SavedBikes } from "@/components/saved-bikes";

export const metadata: Metadata = {
  title: "Primerjava motorjev",
  description: "Primerjava do treh motorjev iz ponudbe EL-MOTO.",
  robots: { index: false },
};

export default function ComparePage() {
  return (
    <SavedBikes
      title="Primerjava motorjev"
      empty="Pod motorjem izberite Dodaj v primerjavo. Primerjate lahko največ tri motorje, potem odprite Primerjaj."
    />
  );
}
