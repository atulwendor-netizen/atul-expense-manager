import React, { useEffect } from 'react';
import { Product } from '../types';
import { ProductMockup3D } from './ProductMockup3D';
import { X, Check, ShoppingBag, BookOpen, Users } from 'lucide-react';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (product) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0E1A] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold px-2.5 py-1 rounded-full bg-cyan-950/40 border border-cyan-800/40">
              {product.categoryLabel}
            </span>
            {product.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {product.badge}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left Column: 3D Mockup */}
            <div className="md:col-span-5 flex flex-col items-center justify-center py-4 bg-white/[0.02] rounded-2xl border border-white/[0.06] p-4">
              <ProductMockup3D product={product} size="md" isHovered={true} />
              <div className="mt-4 text-[11px] font-mono text-slate-400 text-center">
                Format: <span className="text-white font-medium">{product.format}</span>
              </div>
            </div>

            {/* Right Column: Title, Description, Audience, Benefits */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h3 id="quick-view-title" className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                  {product.title}
                </h3>
                <p className="text-xs sm:text-sm text-cyan-300 font-medium">
                  {product.subtitle}
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {product.description}
              </p>

              {/* Target Audience */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-3">
                <Users className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-semibold text-white block">Designed for:</span>
                  <span className="text-slate-300">{product.targetAudience}</span>
                </div>
              </div>

              {/* Verified Benefits */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2">
                  What You Receive
                </h4>
                <div className="space-y-2">
                  {product.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-200">
                      <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents / Modules Breakdown */}
          {product.tableOfContents && product.tableOfContents.length > 0 && (
            <div className="pt-6 border-t border-white/[0.08]">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Contents & Chapters Breakdown
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.tableOfContents.map((chapter, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="font-mono text-cyan-400 font-bold">
                      {(i + 1).toString().padStart(2, '0')}.
                    </span>
                    <span className="leading-snug">{chapter}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Bar */}
        <div className="p-5 sm:p-6 border-t border-white/[0.08] bg-[#070A12] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                ₹{product.priceINR}
              </span>
              {product.originalPriceINR > product.priceINR && (
                <span className="text-xs text-slate-500 line-through font-mono">
                  ₹{product.originalPriceINR}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              One-time purchase • Includes free future updates
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>

            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Get Instant Access</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
