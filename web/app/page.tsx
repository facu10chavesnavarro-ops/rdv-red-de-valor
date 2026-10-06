import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LiveProgress } from "@/components/LiveProgress";
import { MyNumbers } from "@/components/MyNumbers";
import { Participate } from "@/components/Participate";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LiveProgress />
        <Participate />
        <MyNumbers />
      </main>
    </>
  );
}
