import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Network, 
  Terminal, 
  Sliders, 
  Activity, 
  Copy, 
  Check 
} from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SimulationPreset {
  id: string;
  name: string;
  badge: string;
  prompt: string;
  modelsUsed: string[];
  executionTimeMs: number;
  tokensPerSec: number;
  outputCode: string;
  steps: { title: string; desc: string; duration: number }[];
}

const PRESETS: SimulationPreset[] = [
  {
    id: 'swarm',
    name: 'Autonomous Agent Swarm',
    badge: 'Multi-Agent',
    prompt: 'Synthesize global supply chain disruptions across 14 ports, correlate with satellite AIS telemetry, and re-route container carrier fleet.',
    modelsUsed: ['Nexa-Reason-v2.5', 'Claude-3.5-Sonnet', 'DeepSeek-R1-Distill'],
    executionTimeMs: 142,
    tokensPerSec: 184.2,
    steps: [
      { title: 'Swarm Orchestration', desc: 'Dispatched 8 parallel sub-agents across telemetry nodes', duration: 300 },
      { title: 'Deterministic Filtering', desc: 'Filtered 14,200 AIS signals through zero-trust guardrails', duration: 400 },
      { title: 'Pareto Optimization', desc: 'Calculated fuel burn vs. arrival SLA across 42 feasible waypoints', duration: 500 },
      { title: 'Cryptographic Signoff', desc: 'Generated Ed25519 verifiable execution proof', duration: 250 }
    ],
    outputCode: `// ⚡ Nexa Swarm Execution Result — Verified in 142ms
{
  "status": "SWARM_CONSENSUS_REACHED",
  "fleet_rerouted": 14,
  "telemetry_vectors_evaluated": 14200,
  "optimal_waypoints": [
    { "port": "ROTTERDAM_EXP_04", "eta_delta": "-4.2h", "fuel_saving_pct": 11.4 },
    { "port": "SINGAPORE_ANCHOR_B", "eta_delta": "-1.8h", "fuel_saving_pct": 8.7 }
  ],
  "cryptographic_proof": "0x7f4b89c991a03e1b89...ed25519_verified"
}`
  },
  {
    id: 'sql',
    name: 'Secure SQL & Guardrails',
    badge: 'Zero-Leakage',
    prompt: 'Query historical transactional ledger for top 1% enterprise accounts with abnormal cross-border wire velocity, masking all PII.',
    modelsUsed: ['Nexa-Guard-v3', 'GPT-4o-Mini-FineTune'],
    executionTimeMs: 64,
    tokensPerSec: 242.8,
    steps: [
      { title: 'Intent Parsing', desc: 'Extracted semantic parameters & temporal window', duration: 200 },
      { title: 'AST Security Audit', desc: 'No SQL injection, dropped table vectors, or schema leakages found', duration: 250 },
      { title: 'Differential Privacy', desc: 'Dynamic column masking applied for enterprise PII compliance', duration: 300 }
    ],
    outputCode: `SELECT 
  tenant_id,
  SHA256(account_id || salt) AS masked_account_hash,
  COUNT(tx_id) AS velocity_window_1h,
  SUM(amount_usd) AS aggregated_volume
FROM ledger.enterprise_stream
WHERE tx_timestamp >= NOW() - INTERVAL '24 HOURS'
GROUP BY 1, 2
HAVING COUNT(tx_id) > 150
ORDER BY aggregated_volume DESC;`
  },
  {
    id: 'reason',
    name: 'Tree-of-Thought Math Solver',
    badge: 'Deterministic',
    prompt: 'Formal verification of an automated zero-knowledge liquidity pool smart contract invariant: x * y = k with dynamic slippage decay.',
    modelsUsed: ['Nexa-Prover-v1', 'Gemini-1.5-Pro'],
    executionTimeMs: 288,
    tokensPerSec: 132.5,
    steps: [
      { title: 'Hypothesis Branching', desc: 'Spawned 16 recursive deduction branches', duration: 400 },
      { title: 'Boundary Check', desc: 'Proved resilience against flash-loan reentrancy up to 10^18 wei', duration: 500 },
      { title: 'Theorem Verification', desc: 'Automated Z3 SMT solver confirmed invariant holds true', duration: 350 }
    ],
    outputCode: `theorem liquidity_invariant_holds (x y dx dy k : ℝ) :
  x > 0 ∧ y > 0 ∧ k = x * y ∧ (x + dx) * (y - dy) = k →
  dy = (y * dx) / (x + dx) :=
begin
  intros h,
  rcases h with ⟨hx, hy, hk1, hk2⟩,
  -- Q.E.D. Verified via Nexa Lean 4 Formal Kernel
end`
  }
];

export const InteractivePlayground: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<SimulationPreset>(PRESETS[0]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [streamedText, setStreamedText] = useState<string>(PRESETS[0].outputCode);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [guardrailStrength, setGuardrailStrength] = useState<number>(98);
  const [copied, setCopied] = useState<boolean>(false);
  const prefersReduced = useReducedMotion();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const runSimulation = (preset: SimulationPreset) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsExecuting(true);
    setActiveStepIndex(0);
    setStreamedText('');

    if (prefersReduced) {
      setActiveStepIndex(preset.steps.length - 1);
      setStreamedText(preset.outputCode);
      setIsExecuting(false);
      return;
    }

    // Step through the workflow
    let currentStep = 0;
    const executeNextStep = () => {
      if (currentStep < preset.steps.length) {
        setActiveStepIndex(currentStep);
        const duration = preset.steps[currentStep].duration;
        currentStep++;
        timerRef.current = setTimeout(executeNextStep, duration);
      } else {
        // Stream the output code
        let charIndex = 0;
        const fullText = preset.outputCode;
        const streamInterval = setInterval(() => {
          charIndex += 4;
          if (charIndex >= fullText.length) {
            setStreamedText(fullText);
            clearInterval(streamInterval);
            setIsExecuting(false);
          } else {
            setStreamedText(fullText.slice(0, charIndex));
          }
        }, 15);
      }
    };

    timerRef.current = setTimeout(executeNextStep, 200);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(streamedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="playground" className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-indigo-600/10 blur-[130px] -z-10 pointer-events-none rounded-full" />

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4 tracking-wider uppercase">
          <Terminal className="w-3.5 h-3.5" />
          Interactive Neural Sandbox
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
          Experience Sub-150ms <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
            Autonomous Multi-Agent Routing
          </span>
        </h2>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          Test real-time model arbitration, zero-knowledge verification, and deterministic safety filters directly in your browser.
        </p>
      </div>

      {/* Playground Container */}
      <div className="glass-panel rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        
        {/* Left Column: Controls & Presets */}
        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-black/40">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-400" /> Choose Scenario
              </span>
              <span className="text-xs text-blue-400/90 font-mono">Live Simulator</span>
            </div>

            {/* Presets List */}
            <div className="space-y-3 mb-6">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset);
                      runSimulation(preset);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-300 ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                        : 'bg-white/[0.03] border-white/5 hover:border-white/15 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-white tracking-wide">{preset.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {preset.prompt}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Sliders / Parameters */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                  <span className="text-slate-400">Deterministic Temperature</span>
                  <span className="text-blue-400 font-bold">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                  <span className="text-slate-400">Security Guardrail Rigor</span>
                  <span className="text-emerald-400 font-bold">{guardrailStrength}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={guardrailStrength}
                  onChange={(e) => setGuardrailStrength(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Action Trigger */}
          <div className="pt-6 mt-6 border-t border-white/10">
            <button
              onClick={() => runSimulation(selectedPreset)}
              disabled={isExecuting}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isExecuting ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Agents...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-white group-hover:scale-110 transition-transform fill-current" />
                  <span>Execute Neural Pipeline</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Execution Terminal & Telemetry */}
        <div className="lg:col-span-7 flex flex-col bg-slate-950/70 p-6 sm:p-8">
          
          {/* Telemetry Bar */}
          <div className="grid grid-cols-3 gap-3 mb-6 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="text-center">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">TTFT Latency</span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {selectedPreset.executionTimeMs} ms
              </span>
            </div>
            <div className="text-center border-x border-white/10">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Throughput</span>
              <span className="text-sm sm:text-base font-bold font-mono text-blue-400 flex items-center justify-center gap-1">
                <Activity className="w-3.5 h-3.5" />
                {selectedPreset.tokensPerSec} t/s
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider">Verification</span>
              <span className="text-sm sm:text-base font-bold font-mono text-purple-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-Trust
              </span>
            </div>
          </div>

          {/* Stepper Process Flow */}
          <div className="mb-6 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2">
              <Network className="w-3.5 h-3.5 text-indigo-400" /> Pipeline Steps
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedPreset.steps.map((step, idx) => {
                const isPassed = activeStepIndex > idx || (!isExecuting && activeStepIndex >= 0);
                const isCurrent = activeStepIndex === idx && isExecuting;

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs transition-all duration-300 flex items-start gap-2.5 ${
                      isCurrent
                        ? 'bg-blue-500/10 border-blue-400/50 text-white'
                        : isPassed
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-slate-300'
                        : 'bg-white/[0.01] border-white/5 text-slate-500'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : isCurrent ? (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white/90">{step.title}</div>
                      <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Output Code Stream */}
          <div className="flex-1 flex flex-col min-h-[200px] rounded-xl border border-white/10 bg-black/60 overflow-hidden relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-slate-900/60">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="text-xs font-mono text-slate-400 ml-2">nexa_stream.json</span>
              </div>
              <button
                onClick={handleCopy}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-white/5"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-blue-200/90 overflow-x-auto flex-1 leading-relaxed selection:bg-blue-600/40">
              <code>{streamedText || '// Initializing agent node...'}</code>
            </pre>
          </div>

          {/* Active Model Badges */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500">Active Routing:</span>
            {selectedPreset.modelsUsed.map((m, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-[11px] font-mono text-indigo-300">
                {m}
              </span>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
