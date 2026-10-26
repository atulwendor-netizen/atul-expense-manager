import React, { useRef, useState, useEffect } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { ProductMockup3D } from './ProductMockup3D';
import { ScrollTextReveal } from './ScrollTextReveal';
import { ChevronLeft, ChevronRight, Sparkles, ShoppingBag, Eye } from 'lucide-react';

interface HorizontalShowcaseProps {
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const HorizontalShowcase: React.FC<HorizontalShowcaseProps> = ({
  onQuickView,
  onAddToCart,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Showcase selected top high-demand products
  const showcaseProducts = PRODUCTS.slice(0, 6);

  const checkScrollState = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    const maxScroll = scrollWidth - clientWidth;
    setScrollProgress(maxScroll > 0 ? scrollLeft / maxScroll : 0);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScrollState, { passive: true });
    checkScrollState();
    return () => el.removeEventListener('scroll', checkScrollState);
  }, []);

  const scrollBy = (offset: number) => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <section className="relative py-24 sm:py-32 bg-[#060911] overflow-hidden border-t border-white/[0.06]">
      {/* Ambient Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header with Navigation Arrows */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <ScrollTextReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> High-Retention Digital Assets
              </div>
            </ScrollTextReveal>

            <ScrollTextReveal delayMs={100}>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-2">
                Bestseller Spotlight Carousel
              </h2>
            </ScrollTextReveal>

            <ScrollTextReveal delayMs={150}>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Explore our most downloaded guides and template suites. Swipe or use the arrow controls
                to preview each asset.
              </p>
            </ScrollTextReveal>
          </div>

          {/* Desktop Carousel Controls */}
          <div className="flex items-center gap-3 self-end">
            <button
              onClick={() => scrollBy(-360)}
              disabled={!canScrollLeft}
              aria-label="Previous product"
              className={`p-3 rounded-full border transition-all ${
                canScrollLeft
                  ? 'bg-white/[0.04] text-white hover:bg-white/[0.1] border-white/[0.15]'
                  : 'bg-white/[0.01] text-slate-600 border-white/[0.04] cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={() => scrollBy(360)}
              disabled={!canScrollRight}
              aria-label="Next product"
              className={`p-3 rounded-full border transition-all ${
                canScrollRight
                  ? 'bg-white/[0.04] text-white hover:bg-white/[0.1] border-white/[0.15]'
                  : 'bg-white/[0.01] text-slate-600 border-white/[0.04] cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Carousel Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-none snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {showcaseProducts.map((product) => (
            <div
              key={product.id}
              className="flex-shrink-0 w-[280px] sm:w-[320px] snap-center rounded-2xl bg-[#0B101E]/90 border border-white/[0.08] hover:border-blue-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                    {product.categoryLabel.split(' ')[0]}
                  </span>
                  <span className="text-xs font-mono text-white font-bold">
                    ₹{product.priceINR}
                  </span>
                </div>

                {/* 3D Mockup Container */}
                <div className="py-4 flex items-center justify-center min-h-[220px]">
                  <ProductMockup3D product={product} size="sm" isHovered={false} />
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 mb-1">
                  {product.title}
                </h3>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {product.subtitle}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-2">
                <button
                  onClick={() => onQuickView(product)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] font-medium flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3 h-3 text-cyan-400" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => onAddToCart(product)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
                >
                  <ShoppingBag className="w-3 h-3" />
                  <span>Get — ₹{product.priceINR}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress Bar Track */}
        <div className="max-w-xs mx-auto mt-4 h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-150"
            style={{ width: `${Math.max(scrollProgress * 100, 15)}%` }}
          />
        </div>
      </div>
    </section>
  );
};
