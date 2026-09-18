"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "beealert:sidebar-collapsed";

// Small localStorage-backed external store, read via useSyncExternalStore —
// the standard way to sync to a browser-only API without a hydration
// mismatch (getServerSnapshot always returns the SSR default; React swaps
// in the real value right after hydration) and without setState-in-effect.
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) listener();
}

function subscribe(callback: () => void) {
  listeners = [...listeners, callback];
  return () => {
    listeners = listeners.filter((listener) => listener !== callback);
  };
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

function setCollapsedStore(next: boolean) {
  window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  emitChange();
}

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    setCollapsedStore(!(window.localStorage.getItem(STORAGE_KEY) === "1"));
  }, []);

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return ctx;
}
