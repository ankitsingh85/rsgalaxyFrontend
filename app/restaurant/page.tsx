'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Leaf, Beef, Sparkles, WheatOff, UtensilsCrossed } from 'lucide-react';
import { menuItemAPI, hotelAPI } from '@/lib/api';
import type { MenuItem, DietaryTag, Hotel } from '@/types';

const TAG_META: Record<DietaryTag, { label: string; icon: any; color: string }> = {
  'veg': { label: 'Veg', icon: Leaf, color: 'text-green-600 bg-green-50 border-green-200' },
  'non-veg': { label: 'Non-Veg', icon: Beef, color: 'text-red-600 bg-red-50 border-red-200' },
  'vegan': { label: 'Vegan', icon: Leaf, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  'gluten-free': { label: 'Gluten-Free', icon: WheatOff, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  'jain': { label: 'Jain', icon: Sparkles, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  'contains-nuts': { label: 'Contains Nuts', icon: Sparkles, color: 'text-amber-700 bg-amber-50 border-amber-200' },
};

export default function RestaurantPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState('');
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState<DietaryTag | 'all'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    hotelAPI.getAll().then(data => setHotels(data.hotels ?? [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    menuItemAPI
      .getPublic(hotelId || undefined)
      .then(data => setItems(data.menuItems ?? []))
      .finally(() => setLoading(false));
  }, [hotelId]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map(i => i.category)))], [items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesCategory = category === 'all' || item.category === category;
      const matchesTag = tag === 'all' || item.dietaryTags?.includes(tag);
      const matchesSearch = !query || item.name.toLowerCase().includes(query) || item.category.toLowerCase().includes(query);
      return matchesCategory && matchesTag && matchesSearch;
    });
  }, [items, category, tag, search]);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Dine With Us</p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900">Restaurant & Dining</h1>
          <p className="text-gray-500 mt-2">Explore our curated menu, crafted fresh at every RS Galaxy property.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setHotelId('')}
              className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                hotelId === '' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-stone-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
              }`}
            >
              All Properties
            </button>
            {hotels.map(h => (
              <button
                key={h._id}
                type="button"
                onClick={() => setHotelId(h._id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                  hotelId === h._id ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-stone-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
                }`}
              >
                {h.name}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search dishes..."
                className="w-full bg-white border border-stone-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400 shadow-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {(['all', ...Object.keys(TAG_META)] as (DietaryTag | 'all')[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize border transition-all ${
                    tag === t ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-stone-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  {t === 'all' ? 'All Diets' : TAG_META[t as DietaryTag].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize border transition-all ${
                  category === c ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-stone-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading menu...</div>
        ) : filteredItems.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div
                key={item._id}
                className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-200 transition-all"
              >
                <div className="relative h-52 overflow-hidden bg-stone-100 flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <UtensilsCrossed className="w-10 h-10 text-stone-300" />
                  )}
                  <span className="absolute top-4 left-4 bg-white/95 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm">
                    {item.category}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">{item.hotelName}</p>
                  <h2 className="font-playfair text-xl font-bold text-gray-900">{item.name}</h2>

                  {item.dietaryTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.dietaryTags.map(t => {
                        const meta = TAG_META[t];
                        const Icon = meta.icon;
                        return (
                          <span key={t} className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border ${meta.color}`}>
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100">
                    <p className="font-playfair text-xl font-bold text-amber-600">Rs. {item.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
            <p className="font-bold text-gray-900">No dishes found</p>
            <p className="text-sm text-gray-500 mt-1">Try changing your search, category, or diet filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
