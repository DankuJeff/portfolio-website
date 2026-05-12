import Hero from "@/components/Hero";
import SystemMetrics from "@/components/SystemMetrics";
import Projects from "@/components/Projects";
import About from "@/components/About";
import Contact from "@/components/Contact";
import SideNav from "@/components/SideNav";
import ScrollProgress from "@/components/ScrollProgress";

export default function Home() {
  return (
    <main className="relative flex flex-col min-h-screen lg:pl-44">
      <ScrollProgress />
      <SideNav />
      <Hero />
      <SystemMetrics />
      <Projects />
      <About />
      <Contact />
    </main>
  );
}
