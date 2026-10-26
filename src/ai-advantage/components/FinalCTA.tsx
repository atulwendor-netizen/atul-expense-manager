import React from 'react';
import { ScrollTextReveal } from './ScrollTextReveal';
import { ArrowRight, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface FinalCTAProps {
  onCatalogClick: () => void;
  onMasterBundleClick: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({
  onCatalogClick,
  onMasterBundleClick,
}) => {
  return (
    <section className="relative py-28 sm:py-36 bg-[#070A12] overflow-hidden">
      {/* Decorative Floating Mesh Gradient Shapes */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[350px] bg-gradient-to-r from-blue-600/30 via-indigo-600/25 to-purple-600/30 rounded-full blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Container with Glassmorphic Border */}
        <div className="relative p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.12] backdrop-blur-2xl shadow-2xl overflow-hidden">
          {/* Subtle Corner Accents */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

          <ScrollTextReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Transform Your Workflow Today
            </div>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={100}>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
              Work Smarter.{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                Build Your Advantage.
              </span>
            </h2>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={150}>
            <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
              Join students, creators, and freelancers replacing trial-and-error with verified AI
              playbooks. Instant digital downloads in universal formats.
            </p>
          </ScrollTextReveal>

          {/* Action CTAs */}
          <ScrollTextReveal delayMs={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <button
                onClick={onMasterBundleClick}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 border border-blue-400/40 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 group"
              >
                <span>Get Master Bundle — ₹1,999</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onCatalogClick}
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 hover:text-white font-semibold text-sm border border-white/[0.1] backdrop-blur-md transition-all transform hover:-translate-y-0.5"
              >
                Browse Individual Assets
              </button>
            </div>
          </ScrollTextReveal>

          {/* Bottom Security & Reassurance Strip */}
          <ScrollTextReveal delayMs={250}>
            <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400 pt-6 border-t border-white/[0.08]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Encrypted & Verified Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Instant Digital Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Free Future Revisions</span>
              </div>
            </div>
          </ScrollTextReveal>
        </div>
      </div>
    </section>
  );
};
