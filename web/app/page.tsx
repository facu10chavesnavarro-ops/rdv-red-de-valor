import { Academy } from "@/components/Academy";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LiveProgress } from "@/components/LiveProgress";
import { MyNumbers } from "@/components/MyNumbers";
import { Participate } from "@/components/Participate";
import { Transparency } from "@/components/Transparency";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LiveProgress />
        <Participate />
        <MyNumbers />
        <Transparency />
        <Academy />
      </main>
      <Footer />
    </>
  );
}
