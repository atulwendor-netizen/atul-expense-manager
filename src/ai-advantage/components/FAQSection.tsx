import React, { useState } from 'react';
import { FAQS } from '../data/faqs';
import { ScrollTextReveal } from './ScrollTextReveal';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="relative py-24 sm:py-32 bg-[#070A12] overflow-hidden border-t border-white/[0.06]">
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/3 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <ScrollTextReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono uppercase tracking-wider mb-4">
              <HelpCircle className="w-3.5 h-3.5" /> Clear & Transparent
            </div>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={100}>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Frequently Asked Questions
            </h2>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={150}>
            <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Everything you need to know about formats, delivery, software requirements, and our
              payment security standards.
            </p>
          </ScrollTextReveal>
        </div>

        {/* Accordion Items List */}
        <div className="space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openId === faq.id;
            return (
              <ScrollTextReveal key={faq.id} delayMs={index * 60}>
                <div
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? 'bg-[#0D1322] border-blue-500/40 shadow-xl shadow-blue-500/5'
                      : 'bg-[#0B0F1A]/70 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="text-sm sm:text-base font-bold text-white leading-snug">
                      {faq.question}
                    </span>

                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                        isOpen
                          ? 'rotate-180 bg-blue-600 text-white'
                          : 'bg-white/[0.04] text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Smooth Accordion Body */}
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-96 opacity-100 px-5 sm:px-6 pb-6' : 'max-h-0 opacity-0 px-5 sm:px-6 pb-0'
                    } overflow-hidden`}
                  >
                    <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed pt-2 border-t border-white/[0.06]">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </ScrollTextReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
