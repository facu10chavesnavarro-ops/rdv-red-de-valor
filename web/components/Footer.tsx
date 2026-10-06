import { config } from "@/lib/config";

const SOCIAL = [
  ["Instagram", config.social.instagram],
  ["X", config.social.x],
  ["Telegram", config.social.telegram],
] as const;

export function Footer() {
  const socials = SOCIAL.filter(([, url]) => url);
  return (
    <footer className="mt-8 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-10 text-sm md:grid-cols-3">
        <div className="space-y-3 md:col-span-2">
          <p className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-bad">
            <strong>Nunca te vamos a pedir tu frase semilla</strong> ni tus claves privadas, por ningún medio. Si alguien te las pide
            en nuestro nombre, es una estafa.
          </p>
          {config.isTestnet && (
            <p className="rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-accent">
              Versión de prueba en testnet: los tokens que se usan acá no tienen valor y esta rifa no entrega premios reales.
            </p>
          )}
          <p className="text-muted">
            Los aportes se destinan a financiar los proyectos tecnológicos de la empresa. Las reglas de la rifa están programadas en un
            contrato inteligente público y no pueden modificarse.
          </p>
        </div>

        <div className="space-y-3 text-muted">
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
            <p className="label">Contacto</p>
            {socials.length ? (
              <ul className="flex flex-wrap gap-3">
                {socials.map(([name, url]) => (
                  <li key={name}>
                    <a className="link" href={url} target="_blank" rel="noreferrer">
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nuestras redes, próximamente</p>
            )}
          </div>
        </div>
      </div>
      <p className="border-t border-line py-4 text-center text-xs text-muted">Rifa solidaria on-chain · MVP</p>
    </footer>
  );
}
