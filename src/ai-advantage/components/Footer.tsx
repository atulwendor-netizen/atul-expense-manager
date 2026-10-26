import React from 'react';
import { CATEGORIES } from '../data/products';
import { ArrowUp, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onScrollToSection: (id: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToSection }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#05080F] border-t border-white/[0.08] pt-16 pb-12 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px]">
                <div className="w-full h-full bg-[#070B16] rounded-[10px] flex items-center justify-center">
                  <span className="font-black text-base bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Δ
                  </span>
                </div>
              </div>
              <span className="font-black text-lg text-white tracking-tight">
                AI Advantage
              </span>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-sm">
              Work Smarter. Build Your Advantage. Premium digital eBooks, tested prompt vaults,
              faceless YouTube guides, and Notion operating systems for ambitious builders.
            </p>

            <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-xl w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>All Prices in Indian Rupees (INR - ₹)</span>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">
              Resource Catalog
            </h4>
            <ul className="space-y-2.5">
              {CATEGORIES.slice(1).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onScrollToSection('catalog')}
                    className="hover:text-white transition-colors"
                  >
                    {cat.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() => onScrollToSection('spotlight')}
                  className="hover:text-white transition-colors"
                >
                  Featured Spotlight
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('how-it-works')}
                  className="hover:text-white transition-colors"
                >
                  3-Step Methodology
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('trust')}
                  className="hover:text-white transition-colors"
                >
                  Quality Standards
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('faq')}
                  className="hover:text-white transition-colors"
                >
                  FAQs & Delivery
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Security Policies */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-white font-bold mb-4">
              Security & Policy
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li>Encrypted Digital Delivery</li>
              <li>Server-Verified Payments</li>
              <li>Commercial Use License</li>
              <li>Free Lifetime Updates</li>
              <li>No Client-Side Secret Keys</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} AI Advantage. All rights reserved.
            Built with modern scroll-driven motion design.
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-white border border-white/[0.06] transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
