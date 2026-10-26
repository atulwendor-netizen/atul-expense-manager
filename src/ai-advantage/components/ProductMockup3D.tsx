import React from 'react';
import { Product } from '../types';
import { BookOpen, Sparkles, Layers, Terminal, Video, Compass } from 'lucide-react';

interface ProductMockup3DProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg' | 'spotlight';
  customRotateY?: number;
  customRotateX?: number;
  className?: string;
  isHovered?: boolean;
}

const THEME_STYLES: Record<
  Product['coverTheme'],
  {
    gradient: string;
    glow: string;
    accent: string;
    spineColor: string;
    borderGlow: string;
  }
> = {
  'electric-blue': {
    gradient: 'from-[#0B1528] via-[#0F2B5C] to-[#1E40AF]',
    glow: 'rgba(37, 99, 235, 0.35)',
    accent: 'text-blue-400',
    spineColor: '#081226',
    borderGlow: 'border-blue-500/30',
  },
  'violet-glow': {
    gradient: 'from-[#130B24] via-[#2A114E] to-[#6D28D9]',
    glow: 'rgba(124, 58, 237, 0.35)',
    accent: 'text-purple-400',
    spineColor: '#0E071A',
    borderGlow: 'border-purple-500/30',
  },
  'cyan-matrix': {
    gradient: 'from-[#061820] via-[#0A3342] to-[#0891B2]',
    glow: 'rgba(6, 182, 212, 0.35)',
    accent: 'text-cyan-300',
    spineColor: '#041017',
    borderGlow: 'border-cyan-500/30',
  },
  'emerald-ai': {
    gradient: 'from-[#061A14] via-[#083827] to-[#059669]',
    glow: 'rgba(16, 185, 129, 0.35)',
    accent: 'text-emerald-300',
    spineColor: '#04120D',
    borderGlow: 'border-emerald-500/30',
  },
  'amber-gold': {
    gradient: 'from-[#1C1408] via-[#3B290B] to-[#D97706]',
    glow: 'rgba(245, 158, 11, 0.35)',
    accent: 'text-amber-300',
    spineColor: '#140E05',
    borderGlow: 'border-amber-500/30',
  },
  'neon-purple': {
    gradient: 'from-[#190826] via-[#3D0C54] to-[#C026D3]',
    glow: 'rgba(217, 70, 239, 0.35)',
    accent: 'text-fuchsia-300',
    spineColor: '#12041A',
    borderGlow: 'border-fuchsia-500/30',
  },
};

export const ProductMockup3D: React.FC<ProductMockup3DProps> = ({
  product,
  size = 'md',
  customRotateY,
  customRotateX,
  className = '',
  isHovered = false,
}) => {
  const theme = THEME_STYLES[product.coverTheme] || THEME_STYLES['electric-blue'];

  // Base rotation angles
  const rotateY = customRotateY !== undefined ? customRotateY : isHovered ? -8 : -14;
  const rotateX = customRotateX !== undefined ? customRotateX : isHovered ? 2 : 5;

  const sizeDimensions = {
    sm: { width: 'w-44', height: 'h-60', titleSize: 'text-xs', badgeSize: 'text-[9px]' },
    md: { width: 'w-56', height: 'h-76', titleSize: 'text-sm', badgeSize: 'text-[10px]' },
    lg: { width: 'w-72', height: 'h-96', titleSize: 'text-base', badgeSize: 'text-xs' },
    spotlight: { width: 'w-72 sm:w-84 md:w-96', height: 'h-96 sm:h-[420px] md:h-[480px]', titleSize: 'text-lg', badgeSize: 'text-xs' },
  }[size];

  const getCategoryIcon = () => {
    switch (product.category) {
      case 'ebooks':
        return <BookOpen className="w-4 h-4 text-white/80" />;
      case 'youtube':
        return <Video className="w-4 h-4 text-white/80" />;
      case 'prompts':
        return <Terminal className="w-4 h-4 text-white/80" />;
      case 'templates':
        return <Layers className="w-4 h-4 text-white/80" />;
      case 'bundles':
        return <Sparkles className="w-4 h-4 text-white/80" />;
      default:
        return <Compass className="w-4 h-4 text-white/80" />;
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{ perspective: '1200px' }}
    >
      {/* Dynamic Ambient Glow Behind Cover */}
      <div
        className="absolute -inset-4 rounded-3xl blur-2xl opacity-70 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${theme.glow}, transparent 70%)`,
        }}
      />

      {/* 3D Book Assembly */}
      <div
        className={`relative ${sizeDimensions.width} ${sizeDimensions.height} transition-transform duration-500 ease-out`}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateY(${rotateY}deg) rotateX(${rotateX}deg) translateZ(0)`,
        }}
      >
        {/* Layered Drop Shadow Under Book */}
        <div
          className="absolute -bottom-6 left-4 right-4 h-8 rounded-full blur-xl pointer-events-none transition-all duration-500"
          style={{
            background: 'rgba(0, 0, 0, 0.75)',
            transform: `rotateX(80deg) translateZ(-40px) scale(${isHovered ? 1.05 : 0.95})`,
          }}
        />

        {/* 3D Book Spine Thickness (Left Edge) */}
        <div
          className="absolute top-0 bottom-0 left-0 w-5 origin-left rounded-l-sm"
          style={{
            background: `linear-gradient(90deg, ${theme.spineColor} 0%, #151d30 60%, rgba(255,255,255,0.08) 100%)`,
            transform: 'rotateY(-90deg) translateX(-19px)',
            boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)',
          }}
        >
          {/* Subtle Spine Text / Indent */}
          <div className="h-full flex items-center justify-center">
            <span className="text-[7px] text-white/40 tracking-widest uppercase rotate-90 whitespace-nowrap">
              AI ADVANTAGE
            </span>
          </div>
        </div>

        {/* 3D Book Pages / Right Thickness Edge */}
        <div
          className="absolute top-1 bottom-1 -right-3 w-4 origin-left rounded-r-xs pointer-events-none"
          style={{
            background: 'repeating-linear-gradient(to right, #242938 0px, #e2e8f0 1px, #1e2433 2px, #333d52 3px)',
            transform: 'rotateY(90deg) translateZ(2px)',
            opacity: 0.9,
          }}
        />

        {/* Front Cover Container */}
        <div
          className={`relative w-full h-full rounded-xl overflow-hidden border ${theme.borderGlow} shadow-2xl flex flex-col justify-between p-5 sm:p-6 text-white`}
          style={{
            background: `linear-gradient(145deg, #070B16 0%, #0F172A 40%, #0B1120 100%)`,
            boxShadow: `0 20px 45px -10px rgba(0, 0, 0, 0.9), inset 1px 1px 0 rgba(255, 255, 255, 0.15), 0 0 25px ${theme.glow}`,
          }}
        >
          {/* Inner Gradient Backdrop Art */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-85 pointer-events-none`}
          />

          {/* Geometric Grid Mesh Texture */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Diagonal Glass Specular Sheen (Reflective Light Sweep) */}
          <div
            className="absolute -inset-full pointer-events-none opacity-20 transform -rotate-45"
            style={{
              background:
                'linear-gradient(to right, transparent 20%, rgba(255,255,255,0.5) 50%, transparent 80%)',
            }}
          />

          {/* Book Spine Crease Highlight on Front Cover Left Edge */}
          <div
            className="absolute top-0 bottom-0 left-0 w-3 pointer-events-none"
            style={{
              background:
                'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
            }}
          />

          {/* Header Row: Brand Lockup & Category Icon */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                <span className="text-[10px] font-black text-cyan-300">Δ</span>
              </div>
              <span className="text-[10px] font-bold tracking-wider uppercase text-white/80">
                AI ADVANTAGE
              </span>
            </div>

            <div className="p-1 rounded-md bg-black/40 backdrop-blur-md border border-white/10">
              {getCategoryIcon()}
            </div>
          </div>

          {/* Middle Section: Title, Subtitle, Graphic Accent */}
          <div className="relative z-10 my-auto py-2">
            {product.badge && (
              <span
                className={`inline-block mb-2 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${sizeDimensions.badgeSize} bg-white/15 text-white backdrop-blur-md border border-white/20 shadow-sm`}
              >
                {product.badge}
              </span>
            )}

            <h3
              className={`font-black tracking-tight leading-tight text-white mb-2 ${sizeDimensions.titleSize}`}
            >
              {product.title}
            </h3>

            <p className="text-[11px] sm:text-xs text-white/70 line-clamp-2 leading-relaxed">
              {product.subtitle}
            </p>

            {/* Subtle Circuit / Neural Line Accent */}
            <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
              <span className="text-[10px] font-mono text-white/60">
                {product.pagesOrItems}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-cyan-300">
                {product.format.split('+')[0].trim()}
              </span>
            </div>
          </div>

          {/* Bottom Row: Official Seal / Hologram Strip */}
          <div className="relative z-10 flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-white/60 tracking-wider uppercase font-semibold">
                Official Digital Edition
              </span>
            </div>

            <div className="text-[10px] font-bold font-mono text-white">
              ₹{product.priceINR}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
