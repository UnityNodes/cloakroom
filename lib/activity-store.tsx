"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ZamaSDKEvent } from "@zama-fhe/sdk";
import { sdkEventBus } from "./event-bus";

export type ActivityKind = "shield" | "unshield" | "faucet" | "decrypt" | "system";
export type ActivityStatus = "pending" | "success" | "error";

export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  label: string;
  status: ActivityStatus;
  detail?: string;
  txHash?: string;
  chainId?: number;
  ts: number;
}

export interface DevLogEntry {
  id: number;
  type: string;
  detail: string;
  ts: number;
}

interface ActivityContextValue {
  entries: ActivityEntry[];
  devLog: DevLogEntry[];
  addEntry: (entry: Omit<ActivityEntry, "ts">) => void;
  updateEntry: (id: string, patch: Partial<Omit<ActivityEntry, "id" | "ts">>) => void;
  clear: () => void;
}

const ActivityContext = createContext<ActivityContextValue | null>(null);

const STORAGE_KEY = "cloakroom.activity.v1";
const MAX_ENTRIES = 50;
const MAX_DEV_LOG = 200;

function loadEntries(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ActivityEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ENTRIES) : [];
  } catch {
    return [];
  }
}

function describeSdkEvent(event: ZamaSDKEvent): string {
  const parts: string[] = [];
  const record = event as unknown as Record<string, unknown>;
  for (const key of ["tokenAddress", "txHash", "operation", "path", "error"]) {
    const value = record[key];
    if (typeof value === "string") parts.push(`${key}=${value}`);
    if (value instanceof Error) parts.push(`${key}=${value.message}`);
  }
  return parts.join(" ");
}

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [devLog, setDevLog] = useState<DevLogEntry[]>([]);
  const devLogSeq = useRef(0);

  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    } catch {
      void 0;
    }
  }, [entries]);

  useEffect(() => {
    return sdkEventBus.subscribe((event) => {
      setDevLog((log) => {
        const next: DevLogEntry = {
          id: devLogSeq.current++,
          type: event.type,
          detail: describeSdkEvent(event),
          ts: Date.now(),
        };
        return [next, ...log].slice(0, MAX_DEV_LOG);
      });
    });
  }, []);

  const addEntry = useCallback((entry: Omit<ActivityEntry, "ts">) => {
    setEntries((prev) => {
      const without = prev.filter((e) => e.id !== entry.id);
      return [{ ...entry, ts: Date.now() }, ...without].slice(0, MAX_ENTRIES);
    });
  }, []);

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<ActivityEntry, "id" | "ts">>) => {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    },
    [],
  );

  const clear = useCallback(() => {
    setEntries([]);
    setDevLog([]);
  }, []);

  const value = useMemo(
    () => ({ entries, devLog, addEntry, updateEntry, clear }),
    [entries, devLog, addEntry, updateEntry, clear],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
