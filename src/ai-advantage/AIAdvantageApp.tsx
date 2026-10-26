import React, { useState } from 'react';
import { Product } from './types';
import { PRODUCTS } from './data/products';
import { useCart } from './hooks/useCart';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeaturedSpotlight } from './components/FeaturedSpotlight';
import { ProductShowcase } from './components/ProductShowcase';
import { StorytellingSection } from './components/StorytellingSection';
import { HorizontalShowcase } from './components/HorizontalShowcase';
import { TrustSection } from './components/TrustSection';
import { FAQSection } from './components/FAQSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { CheckoutModal } from './components/CheckoutModal';
import { SearchModal } from './components/SearchModal';

export const AIAdvantageApp: React.FC = () => {
  const {
    items,
    totalINR,
    totalCount,
    isOpen: isCheckoutOpen,
    setIsOpen: setIsCheckoutOpen,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const masterBundle =
    PRODUCTS.find((p) => p.id === 'ultimate-master-bundle') || PRODUCTS[PRODUCTS.length - 1];

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Navigation */}
      <Navbar
        cartCount={totalCount}
        cartTotalINR={totalINR}
        onOpenCart={() => setIsCheckoutOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onScrollToSection={scrollToSection}
      />

      <main>
        {/* Hero Section */}
        <Hero
          onExploreClick={() => scrollToSection('catalog')}
          onSpotlightClick={() => scrollToSection('spotlight')}
        />

        {/* Featured Product Spotlight (AI Tools for Beginners) */}
        <FeaturedSpotlight
          onQuickView={(product) => setQuickViewProduct(product)}
          onAddToCart={(product) => addToCart(product)}
        />

        {/* Product Catalog Showcase with Filters & Search */}
        <ProductShowcase
          onQuickView={(product) => setQuickViewProduct(product)}
          onAddToCart={(product) => addToCart(product)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Sticky Storytelling Section (3 Steps: Discover, Learn, Apply) */}
        <StorytellingSection />

        {/* Horizontal Scrolling Showcase */}
        <HorizontalShowcase
          onQuickView={(product) => setQuickViewProduct(product)}
          onAddToCart={(product) => addToCart(product)}
        />

        {/* Statistics & Qualitative Trust Section */}
        <TrustSection />

        {/* Frequently Asked Questions Accordion */}
        <FAQSection />

        {/* Bold Final Animated CTA */}
        <FinalCTA
          onCatalogClick={() => scrollToSection('catalog')}
          onMasterBundleClick={() => addToCart(masterBundle)}
        />
      </main>

      {/* Footer */}
      <Footer onScrollToSection={scrollToSection} />

      {/* Modals & Overlays */}
      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={(product) => addToCart(product)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={items}
        totalINR={totalINR}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProduct={(product) => setQuickViewProduct(product)}
        onAddToCart={(product) => addToCart(product)}
      />
    </div>
  );
};
