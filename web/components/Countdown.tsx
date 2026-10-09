"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({ deadline }: { deadline?: number }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now() / 1000);
    const id = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(id);
  }, []);

  if (!deadline || now === null) {
    return <div className="h-[66px]" aria-hidden />;
  }

  const left = Math.max(0, Math.floor(deadline - now));
  if (left === 0) {
    return <p className="font-mono text-lg text-accent">La venta terminó</p>;
  }
  const parts = [
    [Math.floor(left / 86400), "días"],
    [Math.floor((left % 86400) / 3600), "horas"],
    [Math.floor((left % 3600) / 60), "min"],
    [left % 60, "seg"],
  ] as const;

  return (
    <div className="flex gap-2" aria-label="Tiempo restante de la venta">
      {parts.map(([v, l]) => (
        <div key={l} className="min-w-[62px] rounded-xl border border-line bg-surface/75 px-2 py-2.5 text-center sm:min-w-[70px]">
          <div className="font-mono text-[22px] font-medium tabular-nums text-ink sm:text-[26px]">{pad(v)}</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{l}</div>
        </div>
      ))}
    </div>
  );
}
