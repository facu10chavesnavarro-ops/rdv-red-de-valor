import { config } from "@/lib/config";

const IMAGE = process.env.NEXT_PUBLIC_PRIZE_IMAGE ?? "";

/** Imagen del premio. Si no se configura NEXT_PUBLIC_PRIZE_IMAGE, muestra una ilustración genérica. */
export function PrizeArt() {
  if (IMAGE) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={IMAGE} alt={config.prizeName} className="mx-auto max-h-[360px] w-auto object-contain" />;
  }
  return (
    <svg viewBox="0 0 240 360" className="mx-auto h-[300px] w-auto sm:h-[360px]" role="img" aria-label={config.prizeName}>
      <defs>
        <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2A2F3A" />
          <stop offset="0.55" stopColor="#151A22" />
          <stop offset="1" stopColor="#3A2E0F" />
        </linearGradient>
        <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#F3BA2F" stopOpacity="0.35" />
          <stop offset="1" stopColor="#F3BA2F" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="120" cy="190" rx="120" ry="170" fill="url(#glow)" />
      <rect x="40" y="20" width="160" height="320" rx="30" fill="#0E1116" stroke="#3A4250" strokeWidth="3" />
      <rect x="49" y="29" width="142" height="302" rx="22" fill="url(#screen)" />
      <rect x="95" y="38" width="50" height="14" rx="7" fill="#0B0E11" />
      <text x="120" y="160" textAnchor="middle" fontFamily="monospace" fontSize="13" fill="#8A94A6">
        #0000 – #4999
      </text>
      <text x="120" y="190" textAnchor="middle" fontFamily="sans-serif" fontWeight="700" fontSize="22" fill="#F3BA2F">
        {config.prizeName}
      </text>
      <rect x="198" y="90" width="4" height="40" rx="2" fill="#3A4250" />
    </svg>
  );
}
