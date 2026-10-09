import { Academy } from "@/components/Academy";
import { Donations } from "@/components/Donations";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LiveProgress } from "@/components/LiveProgress";
import { MyNumbers } from "@/components/MyNumbers";
import { Participate } from "@/components/Participate";
import { PrizeFeature } from "@/components/PrizeArt";
import { Roles } from "@/components/Roles";
import { Transparency } from "@/components/Transparency";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <PrizeFeature />
        <LiveProgress />
        <Participate />
        <MyNumbers />
        <Donations />
        <Roles />
        <Transparency />
        <Academy />
      </main>
      <Footer />
    </>
  );
}
