"use client";

import { useState, type ReactNode } from "react";
import { chain, config } from "@/lib/config";
import { Section } from "./ui";

/* ---------- ilustraciones simples (SVG inline, sin imágenes externas) ---------- */

const Ico = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 64 64" className="h-14 w-14 shrink-0" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.5">
    {children}
  </svg>
);

const WalletArt = () => (
  <Ico>
    <rect x="8" y="16" width="48" height="34" rx="6" className="text-accent" />
    <path d="M40 30h16v10H40a5 5 0 0 1 0-10Z" className="text-accent" />
    <circle cx="42" cy="35" r="1.8" fill="currentColor" className="text-accent" />
    <path d="M14 16l26-8 4 8" className="text-muted" />
  </Ico>
);

const ExchangeArt = () => (
  <Ico>
    <circle cx="20" cy="32" r="12" className="text-muted" />
    <text x="20" y="37" textAnchor="middle" fontSize="13" fill="currentColor" stroke="none" className="text-muted">$</text>
    <circle cx="44" cy="32" r="12" className="text-accent" />
    <text x="44" y="37" textAnchor="middle" fontSize="11" fill="currentColor" stroke="none" className="text-accent">₮</text>
    <path d="M28 18c4-4 10-4 14 0M36 46c-4 4-10 4-14 0" className="text-ink" />
  </Ico>
);

const NetworkArt = () => (
  <Ico>
    <circle cx="32" cy="14" r="6" className="text-accent" />
    <circle cx="14" cy="48" r="6" className="text-muted" />
    <circle cx="50" cy="48" r="6" className="text-muted" />
    <path d="M29 19 17 43M35 19l12 24M20 48h24" className="text-ink" />
  </Ico>
);

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-4 space-y-3 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line font-mono text-xs text-accent">
            {i + 1}
          </span>
          <span className="text-muted">{it}</span>
        </li>
      ))}
    </ol>
  );
}

function Guide({ art, title, intro, children, open = false }: { art: ReactNode; title: string; intro: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="card group p-4 sm:p-5" open={open}>
      <summary className="flex cursor-pointer list-none items-center gap-4">
        {art}
        <div className="flex-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted">{intro}</p>
        </div>
        <span className="text-muted transition group-open:rotate-180">⌄</span>
      </summary>
      {children}
    </details>
  );
}

const Warn = ({ children }: { children: ReactNode }) => (
  <p className="mt-4 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-sm text-accent">{children}</p>
);
const B = ({ children }: { children: ReactNode }) => <strong className="text-ink">{children}</strong>;

/* ---------- calculadora ---------- */

// Paquetes de referencia (los mismos que define el contrato)
const PACKS = [
  { q: 15, p: 15 },
  { q: 7, p: 8 },
  { q: 3, p: 4 },
  { q: 1, p: 2 },
];

function Calculator() {
  const [bought, setBought] = useState("20");
  const [fee, setFee] = useState("1");
  const parse = (v: string) => Number(v.replace(",", ".")) || 0;
  const net = Math.max(0, parse(bought) - parse(fee));

  // Ejemplo simple: paquetes más grandes primero
  let left = net;
  let numbers = 0;
  for (const p of PACKS) {
    const n = Math.floor(left / p.p);
    numbers += n * p.q;
    left -= n * p.p;
  }
  const fmt = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 2 });

  return (
    <div className="card p-4 sm:p-5">
      <h3 className="font-semibold">¿Cuánto me llega realmente?</h3>
      <p className="mt-1 text-sm text-muted">
        Al retirar USDT del exchange a tu wallet, el exchange cobra una comisión de retiro. Fijate cuánto es en la pantalla de retiro y
        cargalo acá.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="label">USDT que compraste</span>
          <input className="input mt-1" inputMode="decimal" value={bought} onChange={(e) => setBought(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="label">Comisión de retiro (USDT)</span>
          <input className="input mt-1" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
        </label>
      </div>
      <div className="mt-4 rounded-lg border border-line bg-raised p-4">
        <p className="label">Te llegan a la wallet</p>
        <p className="mt-1 font-mono text-3xl font-bold text-accent">
          {fmt(net)} <span className="text-base text-muted">{config.tokenSymbol}</span>
        </p>
        <p className="mt-2 text-sm text-muted">
          Por ejemplo, te alcanza para <B>{numbers}</B> {numbers === 1 ? "número" : "números"}
          {left > 0.0001 && <> y te sobran {fmt(left)} USDT</>}.
        </p>
      </div>
      <p className="mt-3 text-xs text-muted">
        Recordá que además necesitás un poco de BNB en la wallet para pagar la comisión de red de cada operación (suelen ser centavos
        de dólar).
      </p>
    </div>
  );
}

/* ---------- sección ---------- */

export function Academy() {
  return (
    <Section id="primeros-pasos" kicker="Academia" title="Primeros pasos">
      <p className="-mt-2 mb-6 max-w-2xl text-muted">
        ¿Nunca usaste cripto? Estas tres guías cortas te explican lo necesario para participar de forma segura.
      </p>

      <div className="grid gap-4">
        <Guide art={<WalletArt />} title="1. Crear una wallet de forma segura" intro="Tu wallet es tu cuenta: solo vos la controlás." open>
          <Steps
            items={[
              <>
                Descargá <B>MetaMask</B> o <B>Trust Wallet</B> solo desde la tienda oficial de tu celular o el sitio oficial. Desconfiá
                de anuncios y links que te manden por mensaje.
              </>,
              <>Elegí “Crear una wallet nueva” y poné una contraseña para la app.</>,
              <>
                La app te va a mostrar tu <B>frase semilla</B> (12 palabras). Anotala en papel, en orden, y guardala en un lugar seguro.
              </>,
              <>Confirmá la frase cuando la app te lo pida. Tu dirección empieza con “0x…”: esa sí la podés compartir.</>,
            ]}
          />
          <Warn>
            La frase semilla es la llave de tus fondos. No le saques foto, no la guardes en la nube y no se la des a nadie. Nunca te la
            vamos a pedir: si alguien te la pide, es una estafa.
          </Warn>
        </Guide>

        <Guide
          art={<ExchangeArt />}
          title="2. Comprar USDT y retirarlo por la red BNB Chain (BEP-20)"
          intro="Cómo pasar de pesos a USDT en tu wallet."
        >
          <Steps
            items={[
              <>Creá una cuenta en un exchange que opere en Argentina y completá la verificación de identidad.</>,
              <>Depositá pesos (por transferencia) y comprá USDT.</>,
              <>
                Andá a <B>Retirar</B> → USDT y pegá la dirección de tu wallet (la que empieza con 0x).
              </>,
              <>
                En <B>Red</B>, elegí <B>BNB Smart Chain (BEP-20)</B>. Es el paso más importante: tiene que ser esta red.
              </>,
              <>Revisá la comisión de retiro (usá la calculadora de abajo) y confirmá. En pocos minutos lo vas a ver en tu wallet.</>,
              <>Retirá también un poco de BNB por la misma red para pagar las comisiones de red.</>,
            ]}
          />
          <Warn>La primera vez, probá con un monto chico. Si llega bien, enviá el resto.</Warn>
          {config.isTestnet && (
            <p className="mt-3 text-sm text-muted">
              <B>En esta versión de prueba</B> no hace falta comprar nada: usamos {chain.name}. Pedí BNB de prueba en el{" "}
              <a className="link" href="https://www.bnbchain.org/en/testnet-faucet" target="_blank" rel="noreferrer">
                faucet oficial de BNB Chain
              </a>{" "}
              y USDT de prueba con el botón que aparece en “Participar”. Estos tokens no tienen valor.
            </p>
          )}
        </Guide>

        <Guide
          art={<NetworkArt />}
          title="3. Cómo participar y qué hacer si te equivocás de red"
          intro="El paso a paso de la compra y cómo resolver el error más común."
        >
          <Steps
            items={[
              <>Tocá “Conectar wallet” y elegí tu wallet.</>,
              <>Si la web te avisa que estás en otra red, tocá “Cambiar a BNB Chain” y aceptá en tu wallet.</>,
              <>Elegí un paquete. El de 3 números es el recomendado.</>,
              <>
                <B>Autorizar:</B> tu wallet te pide permiso para que el contrato cobre exactamente el precio del paquete.
              </>,
              <>
                <B>Comprar:</B> confirmás la compra y te aparecen tus números. También los ves en “Mis números”.
              </>,
            ]}
          />
          <div className="mt-5 space-y-2 text-sm text-muted">
            <p className="font-semibold text-ink">¿Retiraste por otra red?</p>
            <p>
              Si elegiste otra red compatible con direcciones “0x” (por ejemplo Ethereum o Polygon), los USDT están en tu misma
              dirección, pero en esa otra red. Agregá esa red en tu wallet y los vas a ver. Para moverlos vas a necesitar la moneda de
              esa red para pagar la comisión (por ejemplo, ETH en Ethereum).
            </p>
            <p>
              Si el exchange no te dejó retirar o el retiro quedó pendiente, contactá a su soporte oficial desde su web o app. Nunca
              aceptes ayuda de personas que te escriben por privado ofreciendo “recuperar” fondos.
            </p>
          </div>
        </Guide>

        <Calculator />
      </div>
    </Section>
  );
}
