"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import "./page-transition.css";

type Phase = "idle" | "exiting" | "covered" | "returning" | "entering";

const SWEEP_MS = 520;
const NAV_AT_MS = 470;
const REVEAL_MS = 400;
const FAILSAFE_MS = 2400;

const PUFFS = 8;
const WISPS = 6;

function routeKey(pathname: string, search: string) {
  return `${pathname}?${search}`;
}

type AppNavigateEvent = Event & {
  navigationType: string;
  canIntercept: boolean;
  hashChange?: boolean;
  destination: { url: string };
  intercept: (options?: {
    precommitHandler?: () => Promise<void>;
    handler?: () => void;
  }) => void;
};

type AppNavigation = {
  addEventListener(type: "navigate", listener: (event: AppNavigateEvent) => void): void;
  removeEventListener(type: "navigate", listener: (event: AppNavigateEvent) => void): void;
};

function appNavigation() {
  return (window as Window & { navigation?: AppNavigation }).navigation ?? null;
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [phase, setPhase] = useState<Phase>("idle");
  const phaseRef = useRef<Phase>("idle");
  const overlayRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const coverDone = useRef(false);
  const navDone = useRef(false);
  const currentKey = useRef(routeKey(pathname, search));
  const timers = useRef<number[]>([]);
  const routerRef = useRef(router);
  const revealRef = useRef<() => void>(() => {});
  const armHoldRef = useRef<() => void>(() => {});
  const pendingCommit = useRef<(() => void) | null>(null);
  const scrollLock = useRef<string | null>(null);
  const seenRoute = useRef(false);
  routerRef.current = router;

  const setPhaseSafe = (next: Phase) => {
    phaseRef.current = next;
    if (overlayRef.current) overlayRef.current.dataset.phase = next;
    setPhase(next);
  };

  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const finish = () => {
    clearTimers();
    busy.current = false;
    coverDone.current = false;
    navDone.current = false;
    if (scrollLock.current !== null) {
      document.documentElement.style.scrollBehavior = scrollLock.current;
      scrollLock.current = null;
    }
    setPhaseSafe("idle");
  };

  const holdScroll = () => {
    if (scrollLock.current !== null) return;
    scrollLock.current = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
  };

  const reveal = () => {
    if (phaseRef.current === "entering" || phaseRef.current === "idle") return;
    setPhaseSafe("entering");
    later(finish, REVEAL_MS);
  };
  revealRef.current = reveal;

  useEffect(() => {
    const key = routeKey(pathname, search);
    if (!seenRoute.current) {
      seenRoute.current = true;
      currentKey.current = key;
      return;
    }
    if (!busy.current) {
      if (key !== currentKey.current && !prefersReducedMotion()) {
        currentKey.current = key;
        busy.current = true;
        coverDone.current = false;
        navDone.current = true;
        holdScroll();
        setPhaseSafe("returning");
        armHoldRef.current();
        return;
      }
      currentKey.current = key;
      return;
    }
    if (key !== currentKey.current) {
      currentKey.current = key;
      navDone.current = true;
      if (coverDone.current) revealRef.current();
    }
  }, [pathname, search]);

  useEffect(() => {
    const armHold = () => {
      later(() => {
        coverDone.current = true;
        if (navDone.current) revealRef.current();
        else if (phaseRef.current === "exiting" || phaseRef.current === "returning") setPhaseSafe("covered");
      }, SWEEP_MS);
      later(() => {
        if (busy.current) finish();
      }, FAILSAFE_MS);
    };
    armHoldRef.current = armHold;

    const begin = () => {
      busy.current = true;
      coverDone.current = false;
      navDone.current = false;
      holdScroll();
      setPhaseSafe("exiting");
      armHold();
    };

    const onClick = (event: MouseEvent) => {
      if (prefersReducedMotion()) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const anchor = event.target.closest("a");
      if (!anchor) return;
      if (anchor.closest("[data-no-transition]")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:") || raw.startsWith("javascript:")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      const nextKey = routeKey(url.pathname, url.searchParams.toString());
      const here = new URL(window.location.href);
      const hereKey = routeKey(here.pathname, here.searchParams.toString());
      if (nextKey === hereKey) return;
      event.preventDefault();
      if (busy.current) return;
      const href = `${url.pathname}${url.search}${url.hash}`;
      begin();
      later(() => {
        routerRef.current.push(href);
      }, NAV_AT_MS);
    };

    const onTraverse = (event: AppNavigateEvent) => {
      if (event.navigationType !== "traverse") return;
      if (prefersReducedMotion()) return;
      if (!event.canIntercept || event.hashChange) return;
      let dest: URL;
      try {
        dest = new URL(event.destination.url);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return;
      const nextKey = routeKey(dest.pathname, dest.searchParams.toString());
      const here = new URL(window.location.href);
      if (nextKey === routeKey(here.pathname, here.searchParams.toString())) return;
      if (busy.current) return;
      event.intercept({
        precommitHandler: () =>
          new Promise<void>((resolve) => {
            pendingCommit.current = resolve;
            begin();
            window.setTimeout(() => {
              if (pendingCommit.current === resolve) pendingCommit.current = null;
              resolve();
            }, NAV_AT_MS);
          }),
        handler: () => {},
      });
    };

    const onPop = () => {
      if (prefersReducedMotion() || busy.current) return;
      const here = new URL(window.location.href);
      const key = routeKey(here.pathname, here.searchParams.toString());
      if (key === currentKey.current) return;
      currentKey.current = key;
      busy.current = true;
      coverDone.current = false;
      navDone.current = true;
      holdScroll();
      setPhaseSafe("returning");
      armHold();
    };

    const navigation = appNavigation();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop, true);
    navigation?.addEventListener("navigate", onTraverse);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop, true);
      navigation?.removeEventListener("navigate", onTraverse);
      pendingCommit.current?.();
      pendingCommit.current = null;
      clearTimers();
      busy.current = false;
      if (scrollLock.current !== null) {
        document.documentElement.style.scrollBehavior = scrollLock.current;
        scrollLock.current = null;
      }
    };
  }, []);

  return (
    <>
      <div className="sr-only" aria-live="polite">
        {phase === "idle" ? "" : "Nalagam stran"}
      </div>
      <div ref={overlayRef} className={"elmoto-ride"} data-phase={phase} aria-hidden="true">
        <div className={"elmoto-ride-cover"} />
        <div className={"elmoto-ride-wisps"}>
          {Array.from({ length: WISPS }, (_, index) => (
            <span key={index} className={"elmoto-ride-wisp"} />
          ))}
        </div>
        <div className={"elmoto-ride-puffs"}>
          {Array.from({ length: PUFFS }, (_, index) => (
            <span key={index} className={"elmoto-ride-puff"} />
          ))}
        </div>
        <img className={"elmoto-ride-logo"} src="/logo.png" alt="" width={947} height={235} />
      </div>
    </>
  );
}
