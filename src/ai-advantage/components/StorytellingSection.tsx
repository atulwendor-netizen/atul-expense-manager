import React, { useState, useEffect, useRef } from 'react';
import { WORKFLOW_STEPS } from '../data/trustData';
import { ScrollTextReveal } from './ScrollTextReveal';
import { Compass, BookOpen, Rocket, CheckCircle2, Sparkles, Terminal } from 'lucide-react';

export const StorytellingSection: React.FC<StorytellingSectionProps> = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;

      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        // Check if middle of element is near viewport center
        if (rect.top <= windowHeight * 0.45 && rect.bottom >= windowHeight * 0.25) {
          setActiveStepIndex(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeStep = WORKFLOW_STEPS[activeStepIndex] || WORKFLOW_STEPS[0];

  const getStepIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <Compass className="w-5 h-5 text-cyan-400" />;
      case 1:
        return <BookOpen className="w-5 h-5 text-blue-400" />;
      case 2:
        return <Rocket className="w-5 h-5 text-purple-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <section id="how-it-works" className="relative py-28 sm:py-36 bg-[#070A12] overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <ScrollTextReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> The AI Advantage Methodology
            </div>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={100}>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
              From Overwhelm to Execution in 3 Steps
            </h2>
          </ScrollTextReveal>

          <ScrollTextReveal delayMs={200}>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Most people drown in AI news and endless bookmark folders. Our structured framework
              turns confusing models into high-leverage personal systems.
            </p>
          </ScrollTextReveal>
        </div>

        {/* Desktop Sticky Experience & Mobile Sequential Stack */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Sticky Progress & Overview Panel */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B101E]/90 border border-white/[0.08] backdrop-blur-xl shadow-2xl">
              <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider mb-3">
                Current Phase: Step {activeStep.step} of 03
              </div>

              <h3 className="text-2xl font-black text-white mb-3">
                {activeStep.title}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                {activeStep.tagline}
              </p>

              {/* Step Navigation Indicator Buttons */}
              <div className="space-y-3 mb-8">
                {WORKFLOW_STEPS.map((step, idx) => {
                  const isActive = activeStepIndex === idx;
                  return (
                    <button
                      key={step.step}
                      onClick={() => {
                        setActiveStepIndex(idx);
                        stepRefs.current[idx]?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        });
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                        isActive
                          ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                            isActive
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {step.step}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">
                          {step.title}
                        </span>
                      </div>

                      {getStepIcon(idx)}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic Interactive Preview Card */}
              <div className="p-4 rounded-2xl bg-[#070A12] border border-white/[0.08]">
                <div className="flex items-center justify-between mb-3 text-[10px] font-mono text-slate-400 border-b border-white/[0.06] pb-2">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>system_workflow.ts</span>
                  </div>
                  <span className="text-emerald-400">ACTIVE</span>
                </div>

                <pre className="text-[11px] font-mono text-cyan-200 bg-black/40 p-3 rounded-xl overflow-x-auto leading-relaxed border border-white/[0.04]">
                  <code>{activeStep.codeSnippet}</code>
                </pre>

                {/* Tags in current active step */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2">
                  {activeStep.previewPills.map((pill, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/[0.06]"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Scroll Trigger Steps List */}
          <div className="lg:col-span-7 space-y-16 sm:space-y-24">
            {WORKFLOW_STEPS.map((step, idx) => (
              <div
                key={step.step}
                ref={(el) => (stepRefs.current[idx] = el)}
                className={`p-6 sm:p-10 rounded-3xl bg-[#0B0F1A]/80 border transition-all duration-500 ${
                  activeStepIndex === idx
                    ? 'border-blue-500/40 shadow-2xl shadow-blue-500/10'
                    : 'border-white/[0.06] opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl sm:text-5xl font-black font-mono text-blue-500/40">
                    {step.step}
                  </span>
                  <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    {getStepIcon(idx)}
                  </div>
                </div>

                <h4 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {step.title}
                </h4>

                <p className="text-xs sm:text-sm text-cyan-400 font-medium mb-4">
                  {step.tagline}
                </p>

                <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Highlights List */}
                <div className="space-y-2.5 pt-4 border-t border-white/[0.06]">
                  {step.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface StorytellingSectionProps {}
