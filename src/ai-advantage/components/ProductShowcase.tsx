import React, { useState, useMemo } from 'react';
import { Product, ProductCategory } from '../types';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { ProductCard } from './ProductCard';
import { ScrollTextReveal } from './ScrollTextReveal';
import { Search, Sparkles, X, Filter } from 'lucide-react';

interface ProductShowcaseProps {
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const ProductShowcase: React.FC<ProductShowcaseProps> = ({
  onQuickView,
  onAddToCart,
  searchQuery,
  onSearchChange,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'discount'>('featured');

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        product.title.toLowerCase().includes(q) ||
        product.subtitle.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q) ||
        product.benefits.some((b) => b.toLowerCase().includes(q)) ||
        product.categoryLabel.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceINR - b.priceINR;
      if (sortBy === 'price-desc') return b.priceINR - a.priceINR;
      if (sortBy === 'discount') {
        const discA = a.originalPriceINR - a.priceINR;
        const discB = b.originalPriceINR - b.priceINR;
        return discB - discA;
      }
      return 0; // default featured
    });
  }, [selectedCategory, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: PRODUCTS.length };
    CATEGORIES.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = PRODUCTS.filter((p) => p.category === cat.id).length;
      }
    });
    return counts;
  }, []);

  return (
    <section id="catalog" className="relative py-24 sm:py-32 bg-[#070A12] overflow-hidden">
      {/* Background Subtle Gradient Accents */}
      <div className="absolute top-1/3 -left-48 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with Scroll Reveal */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <ScrollTextReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Curated Digital Vault
            </div>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={100}>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Explore Our Digital Products
            </h2>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={200}>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Every resource is built for high-retention learning and immediate copy-paste execution.
              Transparent INR pricing with lifetime free updates.
            </p>
          </ScrollTextReveal>
        </div>

        {/* Filter Bar: Categories, Search & Sort */}
        <div className="space-y-4 mb-10">
          {/* Top Row: Search Input & Sort Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search by topic, tool (e.g. Claude, YouTube, Notion)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.1] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products by"
                className="px-3 py-2 rounded-xl bg-[#0F1424] border border-white/[0.1] text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="featured">Featured Resources</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Highest Savings</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as ProductCategory)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/40'
                      : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] border border-white/[0.08]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info Bar */}
        <div className="flex items-center justify-between mb-8 text-xs text-slate-400 font-mono border-b border-white/[0.06] pb-3">
          <div>
            Showing <span className="text-white font-bold">{filteredProducts.length}</span>{' '}
            {filteredProducts.length === 1 ? 'product' : 'products'}
            {searchQuery && (
              <span>
                {' '}
                for &ldquo;<span className="text-cyan-400">{searchQuery}</span>&rdquo;
              </span>
            )}
          </div>
          <div>All assets licensed for commercial personal use</div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product, index) => (
              <ScrollTextReveal key={product.id} delayMs={(index % 3) * 100}>
                <ProductCard
                  product={product}
                  index={index}
                  onQuickView={onQuickView}
                  onAddToCart={onAddToCart}
                />
              </ScrollTextReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 rounded-3xl bg-white/[0.02] border border-white/[0.08]">
            <Filter className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No matching products found</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
              We couldn&apos;t find anything matching your search. Try resetting your filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                onSearchChange('');
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
