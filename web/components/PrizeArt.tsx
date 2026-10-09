import { config } from "@/lib/config";
import { Art } from "./Art";
import { Arrow } from "./ui";

const IMAGE = process.env.NEXT_PUBLIC_PRIZE_IMAGE ?? "";

function Phone() {
  if (IMAGE) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={IMAGE} alt={config.prizeName} className="mx-auto max-h-[300px] w-auto object-contain" />;
  }
  return (
    <svg viewBox="0 0 220 330" className="mx-auto h-[230px] w-auto sm:h-[290px]" role="img" aria-label={config.prizeName}>
      <defs>
        <linearGradient id="scr" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1c241c" />
          <stop offset=".6" stopColor="#0d120e" />
          <stop offset="1" stopColor="#2a4a10" />
        </linearGradient>
      </defs>
      <rect x="10" y="6" width="200" height="318" rx="34" fill="#0b0f0c" stroke="#3b473c" strokeWidth="3" />
      <rect x="20" y="16" width="180" height="298" rx="26" fill="url(#scr)" />
      <rect x="82" y="26" width="56" height="16" rx="8" fill="#060807" />
      <text x="110" y="150" textAnchor="middle" fontFamily="monospace" fontSize="12" fill="#7d8b7f">
        #0000 – #4999
      </text>
      <text x="110" y="182" textAnchor="middle" fontFamily="sans-serif" fontWeight="600" fontSize="26" fill="#a6ff3d">
        {config.prizeName}
      </text>
    </svg>
  );
}

/** Tarjeta grande del premio. */
export function PrizeFeature() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 pt-16 sm:pt-20" aria-labelledby="premio-t">
      <article className="relative grid min-h-[360px] items-center overflow-hidden rounded-2xl border border-line bg-surface md:grid-cols-[1.15fr_.85fr]">
        <Art kind="prize" />
        <div className="relative grid max-w-[560px] gap-4 p-6 pt-8 sm:p-12">
          <p className="kicker">Premio</p>
          <h2 id="premio-t" className="text-[clamp(1.7rem,3.4vw,2.5rem)] font-semibold leading-[1.1]">
            Un {config.prizeName} para el número que elija Chainlink
          </h2>
          <p>
            Comprá números con USDT en BNB Chain. Al cerrar la venta, Chainlink VRF genera un número aleatorio que nadie puede predecir
            ni cambiar, y el contrato elige al ganador a la vista de todos.
          </p>
          <div>
            <a href="#participar" className="pill-solid">
              Elegí tu paquete <Arrow />
            </a>
          </div>
        </div>
        <div className="relative px-6 pb-8 md:p-8">
          <Phone />
        </div>
      </article>
    </section>
  );
}
