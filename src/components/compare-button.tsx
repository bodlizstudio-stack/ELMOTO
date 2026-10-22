"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "elmoto-compare";
export const COMPARE_LIMIT = 3;

function readIds(key: string) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]") as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function compareKey() {
  return KEY;
}

export function readCompare() {
  return readIds(KEY).slice(0, COMPARE_LIMIT);
}

export function writeCompare(ids: string[]) {
  const next = ids.filter((id, index) => ids.indexOf(id) === index).slice(0, COMPARE_LIMIT);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("elmoto-compare"));
  return next;
}

export function CompareActions({ id }: { id: string }) {
  const [on, setOn] = useState(false);
  const [count, setCount] = useState(0);
  const [note, setNote] = useState("");

  useEffect(() => {
    const sync = () => {
      const ids = readCompare();
      setOn(ids.includes(id));
      setCount(ids.length);
    };
    sync();
    window.addEventListener("elmoto-compare", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("elmoto-compare", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  return (
    <div className="grid gap-2">
      <button
        type="button"
        aria-pressed={on}
        className="btn btn-dark w-full px-3 text-base"
        onClick={() => {
          const ids = readCompare();
          if (ids.includes(id)) {
            writeCompare(ids.filter((item) => item !== id));
            setNote("");
            return;
          }
          if (ids.length >= COMPARE_LIMIT) {
            setNote("Primerjate lahko največ tri motorje.");
            return;
          }
          writeCompare([...ids, id]);
          setNote("");
        }}
      >
        {on ? "Odstrani iz primerjave" : "Dodaj v primerjavo"}
      </button>
      <Link href="/primerjava" className="btn btn-line btn-ink w-full px-3 text-base">
        Primerjaj{count ? ` (${count}/3)` : ""}
      </Link>
      <p className={`text-xs leading-5 ${note ? "text-accent" : "text-ink/55"}`} aria-live="polite">
        {note || "V primerjavi je lahko največ 3 motorji."}
      </p>
    </div>
  );
}
