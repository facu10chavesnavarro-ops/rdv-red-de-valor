import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { LiveProgress } from "@/components/LiveProgress";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <LiveProgress />
      </main>
    </>
  );
}
