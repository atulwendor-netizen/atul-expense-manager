import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface ScrollTextRevealProps {
  children: React.ReactNode;
  as?: 'div' | 'h1' | 'h2' | 'h3' | 'p' | 'section';
  delayMs?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}

export const ScrollTextReveal: React.FC<ScrollTextRevealProps> = ({
  children,
  as: Component = 'div',
  delayMs = 0,
  className = '',
  direction = 'up',
  distance = 14,
}) => {
  const prefersReduced = useReducedMotion();
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold: 0.05,
    rootMargin: '0px 0px 80px 0px',
  });

  const getTransform = () => {
    if (isVisible || prefersReduced) return 'none';
    switch (direction) {
      case 'up':
        return `translateY(${distance}px)`;
      case 'down':
        return `translateY(-${distance}px)`;
      case 'left':
        return `translateX(${distance}px)`;
      case 'right':
        return `translateX(-${distance}px)`;
      default:
        return `translateY(${distance}px)`;
    }
  };

  return (
    <Component
      ref={ref as any}
      className={`transition-all duration-600 ease-out will-change-[opacity,transform] ${className}`}
      style={{
        opacity: isVisible || prefersReduced ? 1 : 0,
        transform: getTransform(),
        transitionDelay: `${delayMs}ms`,
      }}
    >
      {children}
    </Component>
  );
};
