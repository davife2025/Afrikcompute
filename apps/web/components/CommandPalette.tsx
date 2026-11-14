"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import { ENDPOINTS, endpointAnchor } from "@/lib/endpoints";

interface Item {
  group: string;
  label: string;
  hint: string;
  href: string;
  external?: boolean;
}

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const [tasks, setTasks] = useState<Item[]>([]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setCursor(0);
    input.current?.focus();
    api
      .requests()
      .then((rows) =>
        setTasks(rows.map((r) => ({ group: t.groupTasks, label: r.title, hint: `${r.languageCode}, ${r.taskType}`, href: "/try" }))),
      )
      .catch(() => setTasks([]));
  }, [open, t.groupTasks]);

  const items = useMemo<Item[]>(() => {
    const all: Item[] = [
      { group: t.groupDocs, label: "Get started", hint: "Onboarding for contributors and requesters", href: "/#start" },
      { group: t.groupDocs, label: "Agents on Intents", hint: "Agent API overview", href: "https://docs.agentsonintents.com/integration/agent-api/overview", external: true },
      { group: t.groupDocs, label: "TEE verification", hint: "What the Verified panel checks", href: "/#proof" },
      ...ENDPOINTS.map((e) => ({ group: t.groupApi, label: `${e.method} ${e.path}`, hint: e.summary, href: `/docs#${endpointAnchor(e)}` })),
      ...tasks,
      { group: t.groupDatasets, label: "Sample datasets", hint: "Fictional data to try the flow", href: "/#resources" },
    ];
    const needle = q.trim().toLowerCase();
    return needle ? all.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(needle)) : all;
  }, [q, tasks, t]);

  const go = (i?: Item) => {
    if (!i) return;
    onClose();
    if (i.external) window.open(i.href, "_blank", "noopener");
    else router.push(i.href);
  };

  if (!open) return null;
  let lastGroup = "";
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t.searchLabel}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, items.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
          if (e.key === "Enter") go(items[cursor]);
        }}
      >
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setCursor(0); }}
          placeholder={t.searchPlaceholder}
          aria-label={t.searchLabel}
        />
        <ul role="listbox">
          {items.length === 0 ? <li className="empty">Nothing matches “{q}”. Try a language, an endpoint or a task title.</li> : null}
          {items.map((i, idx) => {
            const header = i.group !== lastGroup ? i.group : null;
            lastGroup = i.group;
            return (
              <li key={`${i.group}-${i.label}-${idx}`} role="presentation">
                {header ? <div className="group">{header}</div> : null}
                <button role="option" aria-selected={idx === cursor} className={idx === cursor ? "active" : ""} onMouseEnter={() => setCursor(idx)} onClick={() => go(i)}>
                  <span>{i.label}</span>
                  <small>{i.hint}</small>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
