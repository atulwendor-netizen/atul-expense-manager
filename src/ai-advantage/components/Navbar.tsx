import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Menu, X, ArrowRight, Sparkles } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  cartTotalINR: number;
  onOpenCart: () => void;
  onOpenSearch: () => void;
  onScrollToSection: (id: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  cartTotalINR,
  onOpenCart,
  onOpenSearch,
  onScrollToSection,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Products', id: 'catalog' },
    { label: 'Spotlight', id: 'spotlight' },
    { label: '3-Step System', id: 'how-it-works' },
    { label: 'Standards', id: 'trust' },
    { label: 'FAQ', id: 'faq' },
  ];

  const handleLinkClick = (id: string) => {
    setMobileMenuOpen(false);
    onScrollToSection(id);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#070A12]/85 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo & Tagline */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#070B16] rounded-[10px] flex items-center justify-center">
                <span className="font-black text-lg bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Δ
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white group-hover:text-blue-300 transition-colors">
                  AI Advantage
                </span>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-2.5 h-2.5" /> 2026 Edition
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium">
                Work Smarter. Build Your Advantage.
              </p>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/[0.08] rounded-full px-4 py-1.5 backdrop-blur-md">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] rounded-full transition-all"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Controls: Search & Cart */}
          <div className="flex items-center gap-2.5">
            {/* Instant Search Button */}
            <button
              onClick={onOpenSearch}
              aria-label="Search digital products"
              className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.08] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              aria-label={`Open Cart (${cartCount} items)`}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-blue-600/25 border border-blue-400/30 transition-all transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">
                {cartCount > 0 ? `₹${cartTotalINR}` : 'Cart'}
              </span>
              {cartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center justify-center animate-scale-in">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2.5 rounded-full bg-white/[0.04] text-slate-300 hover:text-white border border-white/[0.08] transition-all"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#070A12]/95 backdrop-blur-2xl border-b border-white/[0.08] px-4 pt-3 pb-6 animate-fadeIn">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id)}
                className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/[0.06] rounded-xl transition-all text-left"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}

            <div className="mt-2 pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-slate-400 px-4">
              <span>Prices in Indian Rupees (INR)</span>
              <span className="font-mono text-cyan-400">₹ Guaranteed Value</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
