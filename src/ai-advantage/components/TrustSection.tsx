import React from 'react';
import { TRUST_PILLARS, VERIFIED_METRICS } from '../data/trustData';
import { ScrollTextReveal } from './ScrollTextReveal';
import { ShieldCheck, Zap, RefreshCw, Layers, CheckCircle2, Award } from 'lucide-react';

export const TrustSection: React.FC = () => {
  const getPillarIcon = (name: string) => {
    switch (name) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
      case 'Zap':
        return <Zap className="w-6 h-6 text-cyan-400" />;
      case 'RefreshCw':
        return <RefreshCw className="w-6 h-6 text-indigo-400" />;
      case 'Layers':
        return <Layers className="w-6 h-6 text-blue-400" />;
      default:
        return <CheckCircle2 className="w-6 h-6 text-blue-400" />;
    }
  };

  return (
    <section id="trust" className="relative py-24 sm:py-32 bg-[#070A12] overflow-hidden">
      {/* Background Subtle Mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollTextReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-4">
              <Award className="w-3.5 h-3.5" /> Built for Serious Practitioners
            </div>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={100}>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              Why Ambitious Builders Choose AI Advantage
            </h2>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={150}>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              We reject shallow surface-level hype. Every asset in our catalog is engineered to
              deliver measurable workflow leverage from day one.
            </p>
          </ScrollTextReveal>
        </div>

        {/* Verifiable Catalog Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {VERIFIED_METRICS.map((metric, i) => (
            <ScrollTextReveal key={i} delayMs={i * 80}>
              <div className="p-5 sm:p-6 rounded-2xl bg-[#0B101E]/80 border border-white/[0.08] text-center hover:border-blue-500/30 transition-colors">
                <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 font-mono mb-2">
                  {metric.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-white mb-1">
                  {metric.label}
                </div>
                <div className="text-[11px] text-slate-400 leading-normal">
                  {metric.description}
                </div>
              </div>
            </ScrollTextReveal>
          ))}
        </div>

        {/* 4 Core Value Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_PILLARS.map((pillar, index) => (
            <ScrollTextReveal key={index} delayMs={index * 100}>
              <div className="h-full p-6 sm:p-7 rounded-2xl bg-[#0B0F1A]/70 border border-white/[0.08] hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5">
                    {getPillarIcon(pillar.iconName)}
                  </div>

                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block mb-2">
                    {pillar.tag}
                  </span>

                  <h3 className="text-base sm:text-lg font-bold text-white mb-3">
                    {pillar.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            </ScrollTextReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
