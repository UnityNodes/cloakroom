"use client";

import { useState } from "react";
import { useActivity } from "@/lib/activity-store";
import { txUrl } from "@/lib/chains";
import { formatRelativeTime } from "@/lib/format";

const KIND_ICON: Record<string, string> = {
  shield: "🛡",
  unshield: "📤",
  faucet: "🚰",
  decrypt: "🔓",
  system: "⚙",
};

export function ActivityDrawer() {
  const { entries, devLog, clear } = useActivity();
  const [open, setOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);

  const pendingCount = entries.filter((e) => e.status === "pending").length;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-2.5 text-sm shadow-xl transition-colors hover:border-[var(--accent)]"
      >
        {pendingCount > 0 && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
        )}
        Activity
        {entries.length > 0 && (
          <span className="rounded-full bg-[var(--panel-2)] px-2 py-0.5 text-xs text-[var(--muted)]">
            {entries.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={() => setOpen(false)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-sm flex-col border-l border-[var(--line)] bg-[var(--bg)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <h2 className="text-sm font-semibold">Activity</h2>
              <div className="flex items-center gap-3 text-xs">
                <label className="flex cursor-pointer items-center gap-1.5 text-[var(--muted)]">
                  <input
                    type="checkbox"
                    checked={devMode}
                    onChange={(e) => setDevMode(e.target.checked)}
                    className="accent-[var(--accent)]"
                  />
                  dev mode
                </label>
                <button onClick={clear} className="text-[var(--muted)] hover:text-[var(--bad)]">
                  clear
                </button>
                <button onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--text)]">
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {!devMode && (
                <ul className="space-y-2">
                  {entries.length === 0 && (
                    <p className="p-6 text-center text-xs text-[var(--muted)]">
                      Shield, unshield, faucet and decrypt operations will show up here.
                    </p>
                  )}
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-[var(--line)] bg-[var(--panel)] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span>{KIND_ICON[entry.kind]}</span>
                        <p className="flex-1 truncate text-xs font-medium">{entry.label}</p>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            entry.status === "success"
                              ? "bg-[var(--good)]"
                              : entry.status === "error"
                                ? "bg-[var(--bad)]"
                                : "animate-pulse bg-[var(--accent)]"
                          }`}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between pl-6 text-[11px] text-[var(--muted)]">
                        <span className="truncate">{entry.detail}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          {entry.txHash && (
                            <a
                              href={txUrl(entry.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[var(--accent)] hover:underline"
                            >
                              tx ↗
                            </a>
                          )}
                          {formatRelativeTime(entry.ts)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {devMode && (
                <div className="space-y-1 font-mono text-[10px] leading-relaxed">
                  <p className="mb-2 text-[var(--muted)]">
                    Raw SDK event stream — every encrypt, decrypt and contract call the app
                    makes.
                  </p>
                  {devLog.length === 0 && (
                    <p className="text-[var(--muted)]">No SDK events yet this session.</p>
                  )}
                  {devLog.map((entry) => (
                    <p key={entry.id} className="break-all border-b border-[var(--line)] pb-1">
                      <span className="text-[var(--accent)]">{entry.type}</span>{" "}
                      <span className="text-[var(--muted)]">{entry.detail}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
