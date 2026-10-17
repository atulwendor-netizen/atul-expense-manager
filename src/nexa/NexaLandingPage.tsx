import React, { useState, useEffect } from 'react';
import { NexaNavbar } from './components/NexaNavbar';
import { HeroSection } from './components/HeroSection';
import { ProductIntroSection } from './components/ProductIntroSection';
import { PinnedStorySection } from './components/PinnedStorySection';
import { ProductShowcaseSection } from './components/ProductShowcaseSection';
import { ScrollVideoSection } from './components/ScrollVideoSection';
import { BenefitsSection } from './components/BenefitsSection';
import { InteractivePlayground } from './components/InteractivePlayground';
import { TestimonialsAndSecurity } from './components/TestimonialsAndSecurity';
import { FinalCTAAndFooter } from './components/FinalCTAAndFooter';
import { BookDemoModal } from './components/BookDemoModal';
import { useReducedMotion } from './hooks/useReducedMotion';

interface NexaLandingPageProps {
  onLaunchPlatform: () => void;
}

export const NexaLandingPage: React.FC<NexaLandingPageProps> = ({ onLaunchPlatform }) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBookDemoOpen, setIsBookDemoOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  // Global scroll progress bar listener
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const currentProgress = (window.scrollY / totalHeight) * 100;
            setScrollProgress(Math.min(100, Math.max(0, currentProgress)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070f] text-slate-100 selection:bg-blue-600/30 selection:text-white font-sans overflow-x-hidden relative">
      
      {/* Top Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 z-50 transition-all duration-75 pointer-events-none shadow-[0_0_12px_rgba(59,130,246,0.6)]"
        style={{ width: `${scrollProgress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />

      {/* Global Navbar */}
      <NexaNavbar 
        onLaunchPlatform={onLaunchPlatform} 
        onOpenBookDemo={() => setIsBookDemoOpen(true)}
      />

      {/* Main Content Sections */}
      <main id="main-content">
        {/* 1. Hero Section */}
        <HeroSection 
          onOpenBookDemo={() => setIsBookDemoOpen(true)} 
          onExploreDocs={onLaunchPlatform}
          reducedMotion={prefersReduced}
        />

        {/* 2. Product Introduction & Kinetic Reveal */}
        <ProductIntroSection />

        {/* 3. Pinned Feature Story (Sticky Pinning ScrollTrigger) */}
        <PinnedStorySection />

        {/* 4. Product Showcase (Depth & Perspective Cards) */}
        <ProductShowcaseSection />

        {/* 5. Scroll-Driven Video & Frame Progression */}
        <ScrollVideoSection />

        {/* 6. Benefits and Industry Use Cases */}
        <BenefitsSection 
          onOpenBookDemo={() => setIsBookDemoOpen(true)} 
          reducedMotion={prefersReduced}
        />

        {/* 7. Interactive Neural Sandbox & Live Model Arbitration */}
        <InteractivePlayground />

        {/* 8. Empirical Benchmarks & Enterprise Security */}
        <TestimonialsAndSecurity />
      </main>

      {/* 9. Final Aurora CTA and Comprehensive Footer */}
      <FinalCTAAndFooter 
        onOpenBookDemo={() => setIsBookDemoOpen(true)}
        onLaunchPlatform={onLaunchPlatform}
      />

      {/* Interactive Consultation / Demo Booking Modal */}
      <BookDemoModal 
        isOpen={isBookDemoOpen}
        onClose={() => setIsBookDemoOpen(false)}
      />

    </div>
  );
};

export default NexaLandingPage;
