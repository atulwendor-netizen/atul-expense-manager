import { TrustPillar } from '../types';

export const TRUST_PILLARS: TrustPillar[] = [
  {
    title: '100% Practical & Tested',
    description: 'Every prompt, workflow, and guide is field-tested in actual production environments before inclusion. Zero speculative AI fluff.',
    iconName: 'ShieldCheck',
    tag: 'Quality Standard'
  },
  {
    title: 'Instant Digital Access',
    description: 'Get immediate access to your PDF downloads, Notion workspace templates, and resource links directly after order verification.',
    iconName: 'Zap',
    tag: 'Speed & Delivery'
  },
  {
    title: 'Lifetime Free Updates',
    description: 'AI tooling evolves rapidly. All guide owners receive continuous digital updates and refreshed tool lists at zero extra charge.',
    iconName: 'RefreshCw',
    tag: 'Future-Proof'
  },
  {
    title: 'Universal Formats',
    description: 'Delivered in universally accessible formats: high-res PDFs, Notion duplicable templates, Canva links, CSVs, and markdown.',
    iconName: 'Layers',
    tag: 'Compatibility'
  }
];

export const VERIFIED_METRICS = [
  { value: '52+', label: 'Vetted AI Tools Analyzed', description: 'Tested across text, video, voice, and design' },
  { value: '1,500+', label: 'Production-Ready Prompts', description: 'With dynamic brackets for ChatGPT & Claude' },
  { value: '6', label: 'Curated Resource Categories', description: 'Targeted directly to creators, freelancers & pros' },
  { value: '100%', label: 'Actionable Digital Delivery', description: 'Structured for immediate copy-paste execution' }
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Discover useful AI tools',
    tagline: 'Cut through marketing noise with curated tool stacks',
    description: 'Stop wasting hours testing dozens of sub-par apps. We systematically test AI engines across writing, voice, video, image generation, and workflow automation, filtering out the gimmicks so you only invest time in high-yield tools.',
    highlights: ['52+ tools categorized by use-case', 'Free vs. Paid ROI breakdown', 'Instant setup checklists'],
    previewPills: ['ChatGPT-4o', 'Claude 3.5 Sonnet', 'Perplexity', 'ElevenLabs', 'Midjourney', 'Make.com'],
    codeSnippet: '// Curated Stack Selection\nconst stack = filterTools({\n  goal: "Faceless Content",\n  budget: "Under ₹1,000/mo",\n  speedMultiplier: "5x"\n});'
  },
  {
    step: '02',
    title: 'Learn with practical guides',
    tagline: 'Skip the guesswork with battle-tested playbooks',
    description: 'Theoretical advice does not produce results. Our guides provide granular step-by-step blueprints, exact copy-paste prompt structures with dynamic variables, and real production frameworks that eliminate friction.',
    highlights: ['Structured prompt frameworks with [variables]', 'Retention-driven video script templates', 'Notion operating systems'],
    previewPills: ['8-Sec Retention Hook', 'Few-Shot Prompting', 'B-Roll Shot Mapping', 'Content Operating System'],
    codeSnippet: '// Prompt Architecture\nPROMPT = `Act as Senior Copywriter.\nContext: [Audience Profile]\nFramework: Hook -> Pattern Interrupt -> Value -> CTA\nTone: Punchy, Authoritative, No fluff`;'
  },
  {
    step: '03',
    title: 'Apply the knowledge to real projects',
    tagline: 'Turn digital resources into real-world output and leverage',
    description: 'Whether your objective is launching an automated YouTube channel, packaging freelance deliverables faster, or launching your first digital product, apply step-by-step systems that generate tangible value.',
    highlights: ['Automate repetitive creator deliverables', 'Launch digital products in INR', 'Save 15+ hours every week'],
    previewPills: ['Digital Products', 'Faceless Channels', 'Client Turnaround 3x', 'Automated Funnels'],
    codeSnippet: '// Production Execution\nawait executePipeline({\n  script: generateViralScript(),\n  audio: synthesizeElevenLabsVoice(),\n  delivery: renderTimelineAndExport()\n});\n// Result: Project completed in 45 mins'
  }
];
