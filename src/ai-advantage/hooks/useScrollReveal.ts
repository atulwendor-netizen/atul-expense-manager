import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.05, rootMargin = '0px 0px 80px 0px', triggerOnce = true } = options;
  const elementRef = useRef<T | null>(null);
  const prefersReduced = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const node = elementRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    // Immediate check if element is already within or near initial viewport
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 1.15) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, prefersReduced]);

  return { ref: elementRef, isVisible };
}
