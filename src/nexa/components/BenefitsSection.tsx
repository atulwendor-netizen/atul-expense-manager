import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Code,
  ShieldAlert,
  BarChart3,
  Dna,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface BenefitsSectionProps {
  reducedMotion?: boolean;
  onOpenBookDemo?: () => void;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ 
  reducedMotion = false,
  onOpenBookDemo
}) => {
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<'software' | 'security' | 'fintech' | 'bio'>(
    'software'
  );

  useEffect(() => {
    if (reducedMotion) return;

    const ctx = gsap.context(() => {
      if (gridRef.current) {
        const cards = gridRef.current.querySelectorAll('.benefit-card');
        gsap.fromTo(
          cards,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: gridRef.current,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion, activeCategory]);

  const categories = [
    { id: 'software', label: 'Software Engineering', icon: Code },
    { id: 'security', label: 'Autonomous Red-Teaming', icon: ShieldAlert },
    { id: 'fintech', label: 'Financial Arbitrage', icon: BarChart3 },
    { id: 'bio', label: 'Biotech & Genomics', icon: Dna },
  ];

  const content = {
    software: [
      {
        title: 'Autonomous Multi-Repo Migration',
        description:
          'Migrate monolithic legacy architectures to microservices, TypeScript strict mode, and distributed event systems without human refactor fatigue.',
        stat: '+840%',
        statLabel: 'Sprint Velocity',
        badge: 'Distributed Swarm',
        tags: ['AST Refactoring', 'Zero Breaking Changes', 'Automated PRs'],
      },
      {
        title: 'Full-Coverage Test Synthesis',
        description:
          'Generates deterministic unit, integration, and fuzz tests that achieve true 98%+ branch coverage across millions of lines of mission-critical code.',
        stat: '98.6%',
        statLabel: 'Branch Coverage',
        badge: 'Self-Verifying',
        tags: ['Fuzzing', 'Mutation Testing', 'CI/CD Native'],
      },
      {
        title: 'Sub-Millisecond Codebase RAG',
        description:
          'Embed your entire historical git commit lineage, PR reviews, and architectural RFCs for instantaneous semantic contextual resolution.',
        stat: '< 2.1ms',
        statLabel: 'Query Latency',
        badge: 'Zero Hallucination',
        tags: ['Lossless Index', 'Vector Cache', 'Graph Memory'],
      },
    ],
    security: [
      {
        title: 'Continuous Adversarial Red-Teaming',
        description:
          'Autonomous attack agents continuously simulate zero-day vulnerabilities, logic flaws, and supply-chain exploits against your infrastructure.',
        stat: '100%',
        statLabel: 'Zero-Day Discovery',
        badge: 'Adversarial Swarm',
        tags: ['AST Scanning', 'Prompt Injection', 'Supply Chain'],
      },
      {
        title: 'Deterministic Memory Enclave',
        description:
          'Customer proprietary secrets, API credentials, and internal schemas are protected inside hardware-isolated enclaves with zero residual data leakage.',
        stat: '0 Byte',
        statLabel: 'Data Leakage',
        badge: 'SOC2 Type II',
        tags: ['AES-256 GCM', 'PII Scrubbing', 'Signed Audit'],
      },
      {
        title: 'Cryptographic Provenance Verification',
        description:
          'Every single token and tool call is signed with an immutable Ed25519 signature to create a tamper-evident chain of cognitive custody.',
        stat: '100%',
        statLabel: 'Verifiable Proofs',
        badge: 'Ed25519 Signed',
        tags: ['Audit Trail', 'Chain of Custody', 'Enterprise SLA'],
      },
    ],
    fintech: [
      {
        title: 'Real-Time Quantitative Arbitrage',
        description:
          'Ingest high-frequency financial feeds, earnings transcripts, and regulatory filings to execute complex multi-market risk models in microseconds.',
        stat: '< 4.2ms',
        statLabel: 'Decision Latency',
        badge: 'Low-Latency Feed',
        tags: ['SEC 10-K RAG', 'Risk Arbitrage', 'Sub-millisecond'],
      },
      {
        title: 'Autonomous Compliance Auditing',
        description:
          'Continuously verify all transaction flows and customer onboarding flows against global AML, KYC, and FINRA regulatory frameworks.',
        stat: '-94%',
        statLabel: 'Audit Overhead',
        badge: 'Deterministic Rules',
        tags: ['FINRA / SEC', 'Zero Non-compliance', 'Live Reports'],
      },
      {
        title: 'Predictive Liquidity Optimization',
        description:
          'Simulate complex market stress events and multi-asset treasury rebalancing with probabilistic tree-of-thought predictive algorithms.',
        stat: '99.98%',
        statLabel: 'Forecast Accuracy',
        badge: 'Tree-of-Thought',
        tags: ['Treasury Ops', 'Monte Carlo', 'Stress Test'],
      },
    ],
    bio: [
      {
        title: 'Multimodal Research Synthesis',
        description:
          'Ingest millions of PubMed biomedical papers, Protein Data Bank 3D structures, and clinical trial records into a unified neural knowledge graph.',
        stat: '10M+',
        statLabel: 'Papers Indexed',
        badge: 'Biomedical Graph',
        tags: ['PDB 3D', 'PubMed BioC', 'ClinicalTrials.gov'],
      },
      {
        title: 'Protein Variant Impact Prediction',
        description:
          'Predict functional impact of missense mutations and regulatory variants across tissue-specific gene expression tracks with deep confidence metrics.',
        stat: '< 15ms',
        statLabel: 'Variant Scoring',
        badge: 'Genomic AI',
        tags: ['AlphaGenome', 'ClinVar Controls', 'Lossless RAG'],
      },
      {
        title: 'Automated Regulatory Dossier Prep',
        description:
          'Synthesize preclinical safety documentation, IND applications, and FDA compliance filings with exact citation provenance.',
        stat: '6.8x',
        statLabel: 'Filing Velocity',
        badge: 'FDA Validated',
        tags: ['IND / NDA', 'Traceable Citations', 'Zero Errors'],
      },
    ],
  };

  return (
    <section
      id="benefits"
      ref={sectionRef}
      className="relative py-28 lg:py-36 bg-[#03050a] overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute top-1/2 right-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/10 via-blue-600/10 to-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-4">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>ENTERPRISE IMPACT & USE CASES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Purpose-Built for Mission-Critical Domains
          </h2>

          <p className="text-slate-400 text-base sm:text-lg mt-4 leading-relaxed font-normal">
            Where hallucination is not an option. See how engineering leaders deploy Nexa across four core verticals.
          </p>

          {/* Category Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8 p-1.5 rounded-full glass-panel border border-white/10 shadow-lg">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-xs font-bold transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Card Grid */}
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {content[activeCategory].map((card, idx) => (
            <div
              key={idx}
              className="benefit-card rounded-3xl glass-panel p-8 relative overflow-hidden flex flex-col justify-between border border-white/10 hover:border-blue-500/40 transition-all duration-300 group"
            >
              {/* Subtle card glow on hover */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-600/10 to-violet-600/10 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-cyan-300 font-semibold">
                    {card.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    0{idx + 1}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-3">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal mb-6">
                  {card.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {card.tags.map((tag, t) => (
                    <span
                      key={t}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stat footer */}
              <div className="pt-6 border-t border-white/10 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-violet-400 font-mono">
                    {card.stat}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-0.5">
                    {card.statLabel}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenBookDemo}
                  className="h-9 w-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors group/btn"
                  aria-label={`Learn more about ${card.title}`}
                >
                  <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
