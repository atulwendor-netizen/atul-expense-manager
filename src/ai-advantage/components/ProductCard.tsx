import React, { useState } from 'react';
import { Product } from '../types';
import { ProductMockup3D } from './ProductMockup3D';
import { Eye, ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  index?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  onAddToCart,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const discountPercent = Math.round(
    ((product.originalPriceINR - product.priceINR) / product.originalPriceINR) * 100
  );

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col justify-between rounded-2xl bg-[#0B101E]/80 border border-white/[0.08] hover:border-blue-500/40 p-5 sm:p-6 backdrop-blur-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10 overflow-hidden"
    >
      {/* Top Ambient Glow on Hover */}
      <div
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-opacity duration-500"
        style={{
          background: isHovered
            ? 'radial-gradient(circle, rgba(59, 130, 246, 0.25), transparent 70%)'
            : 'transparent',
        }}
      />

      {/* Top Header: Category & Discount Badge */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-slate-400 bg-white/[0.04] px-2.5 py-1 rounded-full border border-white/[0.06]">
            {product.categoryLabel.split(' ')[0]}
          </span>

          {discountPercent > 0 && (
            <span className="text-[11px] font-bold font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded-full">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* 3D Mockup Container with Zoom & Hover Lift */}
        <div className="relative py-6 flex items-center justify-center min-h-[260px] overflow-visible">
          <div className="transform group-hover:scale-105 transition-transform duration-500">
            <ProductMockup3D product={product} size="md" isHovered={isHovered} />
          </div>

          {/* Quick View Floating Overlay on Hover */}
          <button
            onClick={() => onQuickView(product)}
            aria-label={`Quick view ${product.title}`}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 shadow-lg flex items-center gap-1.5 hover:bg-slate-800"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>Look Inside</span>
          </button>
        </div>

        {/* Product Information */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase">
              {product.format.split('+')[0]}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] font-mono text-slate-400">
              {product.pagesOrItems}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1 mb-2">
            {product.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {product.subtitle}
          </p>

          {/* Key 2 Benefits */}
          <div className="space-y-1.5 mb-5 pt-3 border-t border-white/[0.06]">
            {product.benefits.slice(0, 2).map((benefit, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-1">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer: INR Price & CTA Buttons */}
      <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-white font-mono">
              ₹{product.priceINR}
            </span>
            {product.originalPriceINR > product.priceINR && (
              <span className="text-xs text-slate-500 line-through font-mono">
                ₹{product.originalPriceINR}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Instant Download</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onQuickView(product)}
            title="Inspect Table of Contents"
            className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onAddToCart(product)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 border border-blue-400/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Get Access</span>
          </button>
        </div>
      </div>
    </article>
  );
};
