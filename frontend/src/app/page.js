import Navbar from '@/components/firebase-studio/Navbar';
import Hero from '@/components/firebase-studio/Hero';
import Features from '@/components/firebase-studio/Features';
import Footer from '@/components/firebase-studio/Footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Footer />
    </main>
  );
}
