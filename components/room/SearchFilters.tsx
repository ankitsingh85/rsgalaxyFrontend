'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { addSearchTerm } from '@/lib/searchHistory';

const ROOM_TYPES = ['all', 'standard', 'deluxe', 'suite', 'presidential'] as const;
const CITIES = ['All Cities', 'Goa', 'Rishikesh'];

export default function SearchFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');

  const pushParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all' || value === 'All Cities') next.delete(key);
      else next.set(key, value);
    });
    router.push(`/room?${next.toString()}`, { scroll: false });
  };

  const commitSearch = () => { addSearchTerm(search); pushParams({ search }); };

  return (
    <div className="mt-6 space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onBlur={commitSearch}
            onKeyDown={e => { if (e.key === 'Enter') commitSearch(); }}
            placeholder="Search rooms or hotels..."
            className="w-full bg-white border border-stone-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400 shadow-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ROOM_TYPES.map(roomType => (
            <button
              key={roomType}
              type="button"
              onClick={() => pushParams({ type: roomType })}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize border transition-all ${
                (params.get('type') || 'all') === roomType
                  ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                  : 'bg-white border-stone-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              {roomType}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={params.get('city') || 'All Cities'} onChange={e => pushParams({ city: e.target.value })}
          className="bg-white border border-stone-200 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:outline-none">
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={params.get('guests') || ''} onChange={e => pushParams({ guests: e.target.value })}
          className="bg-white border border-stone-200 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:outline-none">
          <option value="">Any Guests</option>
          {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}+ Guests</option>)}
        </select>

        <input type="number" placeholder="Min Price" value={params.get('minPrice') || ''} onChange={e => pushParams({ minPrice: e.target.value })}
          className="w-28 bg-white border border-stone-200 px-3 py-2.5 rounded-xl text-sm shadow-sm focus:outline-none focus:border-amber-400" />
        <input type="number" placeholder="Max Price" value={params.get('maxPrice') || ''} onChange={e => pushParams({ maxPrice: e.target.value })}
          className="w-28 bg-white border border-stone-200 px-3 py-2.5 rounded-xl text-sm shadow-sm focus:outline-none focus:border-amber-400" />

        <select value={params.get('minRating') || ''} onChange={e => pushParams({ minRating: e.target.value })}
          className="bg-white border border-stone-200 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 shadow-sm focus:outline-none">
          <option value="">Any Rating</option>
          {[3, 3.5, 4, 4.5].map(r => <option key={r} value={r}>{r}+ ★</option>)}
        </select>
      </div>
    </div>
  );
}
