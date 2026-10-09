// Contenido editable de la página: reparto de las donaciones, proyectos, cinta y roles.
// Cambiar acá no requiere tocar los componentes.

export const BRAND = { short: "RDV", name: "Red de Valor" };

/** Reparto de lo recaudado. Debe sumar 100. */
export const DONATION_SPLIT = [
  {
    key: "tech",
    pct: 50,
    label: "Proyectos",
    title: "Tecnología",
    items: ["Seguridad urbana · GPS + IA", "Aeroespacial", "RWA · Campo y ciudad"],
    legend: "Proyectos tecnológicos",
    color: "#a6ff3d",
  },
  {
    key: "impact",
    pct: 25,
    label: "Impacto",
    title: "Social y ambiental",
    items: ["Problemas sociales", "Cuidado del ambiente", "Comunidades locales"],
    legend: "Impacto social y ambiental",
    color: "#6fd3a8",
  },
  {
    key: "eco",
    pct: 25,
    label: "Sostener",
    title: "Ecosistema",
    items: ["Servidores y nodos", "Auditorías de seguridad", "Desarrollo y soporte"],
    legend: "Ecosistema e infraestructura",
    color: "#e6f6dc",
  },
] as const;

export type ArtKind = "prize" | "city" | "space" | "field" | "social" | "wallet" | "exchange" | "network";

export const PROJECTS: { kicker: string; title: string; text: string; art: ArtKind }[] = [
  {
    kicker: "Investigación",
    title: "Seguridad urbana con GPS + IA",
    text: "Investigamos cómo combinar geolocalización e inteligencia artificial para anticipar y reducir los robos en la ciudad: mapas de riesgo, alertas tempranas y datos abiertos para vecinos y autoridades.",
    art: "city",
  },
  {
    kicker: "Exploración",
    title: "Aeroespacial",
    text: "Desarrollo de tecnología aeroespacial aplicada: sensores, telemetría y prototipos que acercan la innovación espacial a problemas concretos de nuestra región.",
    art: "space",
  },
  {
    kicker: "Desarrollo",
    title: "RWA para el campo y la ciudad",
    text: "Llevamos activos del mundo real a la blockchain (RWA) para dar trazabilidad y financiamiento a proyectos productivos del campo y de la ciudad.",
    art: "field",
  },
  {
    kicker: "Impacto",
    title: "Problemas sociales y ambientales",
    text: "Un porcentaje de cada aporte va a iniciativas que atienden problemas sociales y ambientales, elegidas junto a organizaciones y a la comunidad.",
    art: "social",
  },
];

export const TICKER: [string, string, string][] = [
  ["G", "Seguridad urbana", "GPS + IA"],
  ["A", "Aeroespacial", "Investigación"],
  ["R", "RWA Campo", "Producción"],
  ["R", "RWA Ciudad", "Desarrollo urbano"],
  ["S", "Impacto social", "Comunidades"],
  ["V", "Ambiente", "Cuidado del entorno"],
  ["E", "Ecosistema", "Infraestructura abierta"],
];

export type RoleItem = { icon: string; title: string; text: string; cta: string; href: string };

export const ROLES: { key: string; title: string; text: string; items: RoleItem[] }[] = [
  {
    key: "participante",
    title: "Participante",
    text: "Comprá números y participá por el premio",
    items: [
      { icon: "ticket", title: "Elegí tu paquete", text: "Desde 2 USDT por número, con descuento por cantidad", cta: "Ver paquetes", href: "#participar" },
      { icon: "list", title: "Mis números", text: "Tus rangos de números, siempre a la vista", cta: "Ver mis números", href: "#mis-numeros" },
      { icon: "check", title: "Verificá el sorteo", text: "Recalculá el resultado en tu navegador", cta: "Cómo funciona", href: "#transparencia" },
    ],
  },
  {
    key: "donante",
    title: "Donante",
    text: "Aportá a los proyectos sin comprar números",
    items: [
      { icon: "heart", title: "Aporte libre", text: "Desde 1 USDT, sin números, directo a los proyectos", cta: "Hacer un aporte", href: "#participar" },
      { icon: "pie", title: "Destino de las donaciones", text: "Cómo se reparte cada aporte", cta: "Ver destino", href: "#donaciones" },
      { icon: "pulse", title: "Aportes en vivo", text: "Cada aporte con su comprobante on-chain", cta: "Ver en vivo", href: "#progreso" },
    ],
  },
  {
    key: "aliado",
    title: "Aliado",
    text: "Empresas, universidades e instituciones",
    items: [
      { icon: "bulb", title: "Proponé un proyecto", text: "Tecnología, impacto social o ambiental", cta: "Escribirnos", href: "#contacto" },
      { icon: "lab", title: "Colaborá con investigación", text: "Datos, laboratorios y conocimiento", cta: "Escribirnos", href: "#contacto" },
      { icon: "chat", title: "Contactanos", text: "Empresas, universidades e instituciones", cta: "Ver redes", href: "#contacto" },
    ],
  },
];
