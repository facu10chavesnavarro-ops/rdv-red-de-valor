import { config } from "@/lib/config";
import { BRAND } from "@/lib/content";
import { Logo } from "./Header";

const SOCIAL = [
  ["Instagram", config.social.instagram],
  ["X", config.social.x],
  ["Telegram", config.social.telegram],
] as const;

export function Footer() {
  const socials = SOCIAL.filter(([, url]) => url);
  return (
    <footer id="contacto" className="mt-10 scroll-mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-11 md:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-3">
          <div className="mb-1 flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-bold text-ink">
              {BRAND.short} <span className="font-normal text-muted">· {BRAND.name}</span>
            </span>
          </div>
          <p className="rounded-xl border border-bad/45 bg-bad/10 px-3.5 py-3 text-sm text-[#ffb3bb]">
            <strong>Nunca te vamos a pedir tu frase semilla</strong> ni tus claves privadas, por ningún medio. Si alguien te las pide en
            nuestro nombre, es una estafa.
          </p>
          {config.isTestnet && (
            <p className="rounded-xl border border-accent/35 bg-accent-soft px-3.5 py-3 text-sm text-ink">
              Versión de prueba en testnet: los tokens que se usan acá no tienen valor y esta rifa no entrega premios reales.
            </p>
          )}
          <p className="text-sm text-muted">
            Lo recaudado no se reparte entre socios: financia proyectos tecnológicos, sociales y ambientales y el sostenimiento del
            ecosistema. Las reglas de la rifa están programadas en un contrato inteligente público y no pueden modificarse.
          </p>
        </div>

        <div className="grid content-start gap-5">
          <div>
            <p className="label">Autorización</p>
            <p className="font-mono text-ink">{config.authorizationNumber || "Pendiente"}</p>
          </div>
          <div>
            <p className="label">Términos y condiciones</p>
            {config.termsUrl ? (
              <a className="link" href={config.termsUrl} target="_blank" rel="noreferrer">
                Ver términos
              </a>
            ) : (
              <p>Próximamente</p>
            )}
          </div>
          <div>
            <p className="label">Seguinos</p>
            {socials.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {socials.map(([name, url]) => (
                  <a key={name} className="pill-ghost pill-sm" href={url} target="_blank" rel="noreferrer">
                    {name}
                  </a>
                ))}
              </div>
            ) : (
              <p>Nuestras redes, próximamente</p>
            )}
          </div>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center font-mono text-xs tracking-[0.08em] text-muted">
        {BRAND.short} · {BRAND.name.toUpperCase()} · MVP
      </p>
    </footer>
  );
}
