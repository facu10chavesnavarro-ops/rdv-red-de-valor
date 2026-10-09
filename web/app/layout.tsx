import type { Metadata, Viewport } from "next";
import { DM_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-sans" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "RDV · Red de Valor",
  description:
    "Tecnología con impacto, financiada por la comunidad. Participá por un iPhone en una rifa on-chain en BNB Chain: cada aporte financia proyectos tecnológicos, sociales y ambientales, y el sorteo se verifica con Chainlink VRF.",
};

export const viewport: Viewport = { themeColor: "#060807", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
