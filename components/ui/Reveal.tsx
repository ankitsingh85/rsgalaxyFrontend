'use client';
import { useEffect, useRef, useState } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const offsetFor = (direction: Direction) => {
  switch (direction) {
    case 'up': return 'translate-y-10';
    case 'down': return '-translate-y-10';
    case 'left': return 'translate-x-10';
    case 'right': return '-translate-x-10';
    default: return '';
  }
};

export default function Reveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 700,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all ease-out ${visible ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${offsetFor(direction)}`} ${className}`}
      style={{ transitionDuration: `${duration}ms`, transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
