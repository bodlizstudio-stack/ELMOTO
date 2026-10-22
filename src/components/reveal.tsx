"use client";

import { useEffect, useState } from "react";

export function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.16 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return (
    <div ref={setNode} className={`reveal ${shown ? "reveal-in" : ""} ${className}`}>
      {children}
    </div>
  );
}
