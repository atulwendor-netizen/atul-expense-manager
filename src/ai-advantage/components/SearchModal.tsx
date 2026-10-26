import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product } from '../types';
import { PRODUCTS } from '../data/products';
import { Search, X, ShoppingBag, Eye } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
  onAddToCart,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return PRODUCTS.slice(0, 4); // show top 4 by default
    return PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subtitle.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.benefits.some((b) => b.toLowerCase().includes(q)) ||
        p.categoryLabel.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search catalog"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fadeIn"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#090D18] border border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-in">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-white/[0.08] bg-white/[0.02]">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search eBooks, prompts, Notion OS, templates..."
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-mono px-2 py-1 rounded bg-white/[0.06] text-slate-400 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto max-h-[60vh] p-4 sm:p-5 space-y-3">
          <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-2">
            {query ? `Search Results (${results.length})` : 'Popular Recommendations'}
          </div>

          {results.length > 0 ? (
            results.map((product) => (
              <div
                key={product.id}
                className="p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] flex items-center justify-between gap-4 transition-all group"
              >
                <div
                  onClick={() => {
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex-1 min-w-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">
                      {product.categoryLabel.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500">•</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {product.pagesOrItems}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors truncate">
                    {product.title}
                  </h4>
                  <p className="text-xs text-slate-400 truncate">
                    {product.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black font-mono text-white">
                    ₹{product.priceINR}
                  </span>

                  <button
                    onClick={() => {
                      onSelectProduct(product);
                      onClose();
                    }}
                    className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white transition-colors"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" />
                  </button>

                  <button
                    onClick={() => {
                      onAddToCart(product);
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No products found matching &ldquo;{query}&rdquo;.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
