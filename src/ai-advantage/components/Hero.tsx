import React, { useState } from 'react';
import { ProductMockup3D } from './ProductMockup3D';
import { PRODUCTS } from '../data/products';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Sparkles, BookOpen, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface HeroProps {
  onExploreClick: () => void;
  onSpotlightClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onSpotlightClick }) => {
  const prefersReduced = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const spotlightProduct = PRODUCTS.find((p) => p.id === 'ai-tools-beginners') || PRODUCTS[0];
  const youtubeProduct = PRODUCTS.find((p) => p.id === 'faceless-youtube-empire') || PRODUCTS[1];

  // Parallax tilt on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReduced) return;
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  const words = ['Work', 'Smarter.', 'Build', 'Your', 'Advantage.'];

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative min-h-[88vh] lg:min-h-[700px] lg:max-h-[900px] flex flex-col justify-between pt-24 pb-10 sm:pt-32 sm:pb-14 overflow-hidden bg-[#070A12]"
    >
      {/* Ambient Gradient Lighting Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] sm:w-[900px] sm:h-[450px] bg-gradient-to-tr from-blue-700/25 via-indigo-600/20 to-purple-600/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }}
      />

      {/* Main Hero Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline, Subhead & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Top Eyebrow Badge */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-md mb-6 animate-hero-word"
              style={{ animationDelay: '0ms' }}
            >
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Premium Digital Playbooks & Tools
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs font-mono text-cyan-300">2026 Ready</span>
            </div>

            {/* Main Animated Headline: Word-by-Word */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] text-white mb-6">
              {words.map((word, index) => {
                const isGradient = word === 'Advantage.' || word === 'Smarter.';
                return (
                  <span
                    key={index}
                    className="inline-block mr-3 sm:mr-4 animate-hero-word will-change-transform"
                    style={{
                      animationDelay: `${40 + index * 60}ms`,
                    }}
                  >
                    {isGradient ? (
                      <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                        {word}
                      </span>
                    ) : (
                      word
                    )}
                  </span>
                );
              })}
            </h1>

            {/* Subhead / Value Proposition */}
            <p
              className="text-base sm:text-lg md:text-xl text-slate-300/90 font-normal max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-8 animate-hero-word"
              style={{ animationDelay: '350ms' }}
            >
              Curated AI eBooks, field-tested prompt vaults, faceless YouTube blueprints,
              and Notion operating systems. Built for creators, students, and freelancers who
              demand practical execution over theoretical hype.
            </p>

            {/* Action Buttons Staggered Reveal */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-10 animate-hero-word"
              style={{ animationDelay: '450ms' }}
            >
              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 border border-blue-400/30 flex items-center justify-center gap-2 group transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Explore Digital Catalog</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onSpotlightClick}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white font-semibold text-sm border border-white/[0.1] backdrop-blur-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
              >
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Featured Guide — ₹499</span>
              </button>
            </div>

            {/* Value Checkmark Chips */}
            <div
              className="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-y-2 gap-x-6 text-xs text-slate-400 animate-hero-word"
              style={{ animationDelay: '550ms' }}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Zero Technical Jargon</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Instant Digital Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Lifetime Free Updates</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating 3D Product Mockups with Parallax Depth */}
          <div className="lg:col-span-5 relative flex items-center justify-center py-6 sm:py-10">
            {/* Parallax Container */}
            <div
              className="relative w-full max-w-md sm:max-w-lg flex items-center justify-center transition-transform duration-300 ease-out"
              style={{
                transform: prefersReduced
                  ? 'none'
                  : `translate(${mousePos.x * -25}px, ${mousePos.y * -25}px)`,
              }}
            >
              {/* Back Card / Secondary Guide (YouTube Empire) */}
              <div
                className="absolute -right-2 sm:right-2 -top-4 sm:-top-8 transform scale-85 sm:scale-90 opacity-80 hover:opacity-100 hover:z-20 transition-all duration-500"
                style={{
                  transform: prefersReduced
                    ? 'none'
                    : `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) rotateY(-5deg) rotateX(4deg)`,
                }}
              >
                <ProductMockup3D product={youtubeProduct} size="md" />
              </div>

              {/* Front Primary Card (AI Tools for Beginners) */}
              <div
                className="relative z-10 transform scale-95 sm:scale-105 hover:scale-110 transition-transform duration-500"
                style={{
                  transform: prefersReduced
                    ? 'none'
                    : `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px) rotateY(-18deg) rotateX(6deg)`,
                }}
              >
                <ProductMockup3D product={spotlightProduct} size="lg" isHovered={true} />
              </div>

              {/* Floating Value Pill */}
              <div
                className="absolute -bottom-6 left-2 sm:left-4 z-20 px-4 py-2.5 rounded-2xl bg-[#0B1222]/90 border border-blue-500/30 backdrop-blur-xl shadow-2xl flex items-center gap-3 animate-float-slow"
                style={{
                  transform: prefersReduced
                    ? 'none'
                    : `translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)`,
                }}
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">52+ Curated Tools</div>
                  <div className="text-[10px] text-slate-400">Field-Tested for 2026</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-8">
        <button
          onClick={onExploreClick}
          aria-label="Scroll to product catalog"
          className="flex flex-col items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-2"
        >
          <span className="text-[11px] font-mono tracking-widest uppercase">
            Scroll to Explore
          </span>
          <div className="w-5 h-8 rounded-full border border-slate-700 flex items-start justify-center p-1 group-hover:border-slate-500 transition-colors">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  );
};
