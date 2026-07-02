'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const active = hovered ?? Math.round(value || 0);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1">Star Rating</label>
      <div className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)} onMouseLeave={() => setHovered(null)}>
            <Star className={`w-5 h-5 ${star <= active ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-400">{value || 0} / 5</span>
      </div>
    </div>
  );
}
