"use client";

import { useState } from "react";
import { ROLES } from "@/lib/content";
import { Arrow, LineIcon, Section } from "./ui";

/** "Sumate al ecosistema": pestañas de roles con sus accesos. */
export function Roles() {
  const [key, setKey] = useState(ROLES[0].key);
  const role = ROLES.find((r) => r.key === key)!;

  return (
    <Section kicker="Elegí cómo sumarte" title="Sumate al ecosistema">
      <div className="grid items-start gap-4 lg:grid-cols-[300px_1fr] lg:gap-9">
        <div className="grid grid-cols-3 gap-3 lg:grid-cols-1" role="tablist" aria-label="Roles">
          {ROLES.map((r) => {
            const sel = r.key === key;
            return (
              <button
                key={r.key}
                id={`tab-${r.key}`}
                type="button"
                role="tab"
                aria-selected={sel}
                aria-controls="role-panel"
                onClick={() => setKey(r.key)}
                className={`relative grid gap-1.5 rounded-xl border bg-surface p-4 text-left lg:p-5 ${
                  sel ? "border-accent shadow-[0_0_0_1px_rgba(166,255,61,.25)]" : "border-line hover:border-[#3a463b]"
                }`}
              >
                <b className="text-[17px] text-ink">{r.title}</b>
                <span className="hidden text-sm lg:block">{r.text}</span>
                {sel && (
                  <>
                    <span className="absolute -right-1 top-1/2 hidden h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-accent lg:block" />
                    <span className="absolute -right-[37px] top-1/2 hidden w-9 border-t-2 border-dashed border-accent lg:block" />
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div id="role-panel" role="tabpanel" aria-labelledby={`tab-${key}`} className="card grid gap-2.5 p-3.5">
          {role.items.map((it) => (
            <div
              key={it.title}
              className="grid items-center gap-3 rounded-xl border border-line bg-bg px-4 py-3.5 sm:grid-cols-[44px_1fr_auto] sm:gap-4"
            >
              <span className="hidden h-11 w-11 place-items-center rounded-[10px] bg-raised text-accent sm:grid">
                <LineIcon name={it.icon} />
              </span>
              <div>
                <h3 className="text-base font-semibold">{it.title}</h3>
                <p className="font-mono text-[12.5px] leading-relaxed text-muted">{it.text}</p>
              </div>
              <a href={it.href} className="pill-ghost pill-sm justify-self-start sm:justify-self-auto">
                {it.cta} <Arrow />
              </a>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
