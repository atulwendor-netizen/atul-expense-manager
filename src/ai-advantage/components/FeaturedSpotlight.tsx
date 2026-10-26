import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { ProductMockup3D } from './ProductMockup3D';
import { ScrollTextReveal } from './ScrollTextReveal';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Check, Sparkles, ShoppingBag, Eye } from 'lucide-react';

interface FeaturedSpotlightProps {
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const FeaturedSpotlight: React.FC<FeaturedSpotlightProps> = ({
  onQuickView,
  onAddToCart,
}) => {
  const spotlightProduct =
    PRODUCTS.find((p) => p.id === 'ai-tools-beginners') || PRODUCTS[0];
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReduced = useReducedMotion();

  // Scroll-driven rotation progress (0 to 1)
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (prefersReduced) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!sectionRef.current) return;
          const rect = sectionRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          // Calculate progress as section travels through viewport
          const totalDistance = windowHeight + rect.height;
          const currentDistance = windowHeight - rect.top;
          const progress = Math.min(Math.max(currentDistance / totalDistance, 0), 1);
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefersReduced]);

  // Interpolate rotation: from -24deg down to -5deg as user scrolls into center
  const calculatedRotateY = prefersReduced
    ? -6
    : -24 + scrollProgress * 19; // -24deg -> -5deg
  const calculatedRotateX = prefersReduced
    ? 2
    : 10 - scrollProgress * 8; // 10deg -> 2deg

  return (
    <section
      id="spotlight"
      ref={sectionRef}
      className="relative py-28 sm:py-36 bg-[#0B0F19] overflow-hidden border-y border-white/[0.06]"
    >
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Dynamic 3D eBook Mockup with Scroll-Driven Rotation */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md flex flex-col items-center">
              {/* Rotating Mockup */}
              <div className="relative py-6">
                <ProductMockup3D
                  product={spotlightProduct}
                  size="spotlight"
                  customRotateY={calculatedRotateY}
                  customRotateX={calculatedRotateX}
                  isHovered={true}
                />
              </div>

              {/* Dynamic Scroll Interaction Note */}
              <div className="mt-6 flex items-center gap-2 text-xs text-slate-500 font-mono">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Scroll-responsive 3D perspective</span>
              </div>
            </div>
          </div>

          {/* Right Column: Editorial Value Stack & Pricing */}
          <div className="lg:col-span-7">
            <ScrollTextReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Featured Spotlight Guide
              </div>
            </ScrollTextReveal>

            <ScrollTextReveal delayMs={100}>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-3">
                {spotlightProduct.title}
              </h2>
            </ScrollTextReveal>

            <ScrollTextReveal delayMs={150}>
              <p className="text-base sm:text-lg text-cyan-300 font-medium mb-4">
                {spotlightProduct.subtitle}
              </p>
            </ScrollTextReveal>

            <ScrollTextReveal delayMs={200}>
              <p className="text-sm text-slate-300/90 leading-relaxed mb-6">
                {spotlightProduct.description}
              </p>
            </ScrollTextReveal>

            {/* Quick Metrics Pills */}
            <ScrollTextReveal delayMs={250}>
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <div className="text-lg font-black text-white font-mono">138</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Pages PDF</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <div className="text-lg font-black text-cyan-400 font-mono">52</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Tools Tested</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                  <div className="text-lg font-black text-emerald-400 font-mono">Free</div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Lifetime Updates</div>
                </div>
              </div>
            </ScrollTextReveal>

            {/* Key Benefits List */}
            <ScrollTextReveal delayMs={300}>
              <div className="space-y-3 mb-8">
                {spotlightProduct.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200">
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </ScrollTextReveal>

            {/* Pricing Box & Primary Actions */}
            <ScrollTextReveal delayMs={350}>
              <div className="p-5 sm:p-6 rounded-2xl bg-[#070B16] border border-blue-500/30 shadow-xl shadow-blue-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-black text-white font-mono">
                      ₹{spotlightProduct.priceINR}
                    </span>
                    <span className="text-sm text-slate-500 line-through font-mono">
                      ₹{spotlightProduct.originalPriceINR}
                    </span>
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Save ₹{spotlightProduct.originalPriceINR - spotlightProduct.priceINR}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Includes DRM-free PDF, Notion Index, and instant download
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => onQuickView(spotlightProduct)}
                    className="flex-1 sm:flex-initial px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 hover:text-white font-semibold text-xs border border-white/[0.1] flex items-center justify-center gap-2 transition-all"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <span>Look Inside</span>
                  </button>

                  <button
                    onClick={() => onAddToCart(spotlightProduct)}
                    className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 border border-blue-400/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Get Instant Access</span>
                  </button>
                </div>
              </div>
            </ScrollTextReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
