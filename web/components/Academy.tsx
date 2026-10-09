"use client";

import { useState, type ReactNode } from "react";
import { chain, config } from "@/lib/config";
import type { ArtKind } from "@/lib/content";
import { Art } from "./Art";
import { Section } from "./ui";

function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="mt-1 space-y-3 text-sm">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line font-mono text-xs text-accent">
            {i + 1}
          </span>
          <span>{it}</span>
        </li>
      ))}
    </ol>
  );
}

/** Guía con formato de tarjeta de blog: arte, etiqueta, título, bajada y botón "Leer". */
function Guide({ art, meta, title, intro, children }: { art: ArtKind; meta: string; title: string; intro: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="card grid content-start gap-3 p-3">
      <div className="relative aspect-video overflow-hidden rounded-[10px]">
        <Art kind={art} />
      </div>
      <p className="kicker px-1.5">{meta}</p>
      <h3 className="px-1.5 text-[17px] font-semibold">{title}</h3>
      <p className="px-1.5 text-sm text-muted">{intro}</p>
      {open && <div className="px-1.5 pb-1">{children}</div>}
      <button type="button" className="pill-ghost w-full border-[#c8e9b4]" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Cerrar" : "Leer"}
      </button>
    </article>
  );
}

const Warn = ({ children }: { children: ReactNode }) => (
  <p className="mt-4 rounded-xl border border-accent/40 bg-accent-soft px-3.5 py-2.5 text-sm text-ink">{children}</p>
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
    <div className="card p-5 sm:p-6">
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
    <Section
      id="primeros-pasos"
      kicker="Academia"
      title="Primeros pasos"
      intro="¿Nunca usaste cripto? Estas tres guías cortas te explican lo necesario para participar de forma segura."
    >
      <div className="grid items-start gap-4 md:grid-cols-3">
        <Guide art="wallet" meta="Guía 1 · 3 min" title="Crear una wallet de forma segura" intro="Tu wallet es tu cuenta: solo vos la controlás.">
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
          art="exchange"
          meta="Guía 2 · 4 min"
          title="Comprar USDT y retirarlo por la red BNB Chain (BEP-20)"
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
          art="network"
          meta="Guía 3 · 3 min"
          title="Cómo participar y qué hacer si te equivocás de red"
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
          <div className="mt-5 space-y-2 text-sm">
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
      </div>
      <div className="mt-4">
        <Calculator />
      </div>
    </Section>
  );
}
