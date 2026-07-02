'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, ChevronRight, Search, ArrowRight } from 'lucide-react';
import { hotelAPI } from '@/lib/api';
import type { Hotel } from '@/types';

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    hotelAPI.getAll()
      .then(data => setHotels(data.hotels))
      .finally(() => setLoading(false));
  }, []);

  const filtered = hotels.filter(h =>
    !search || h.name.toLowerCase().includes(search.toLowerCase()) || h.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Our Properties</p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900">RS Galaxy Hotels</h1>
          <p className="text-gray-500 mt-2">Two extraordinary destinations. One legendary name.</p>
          <div className="mt-6 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search hotels..."
              className="w-full bg-white border border-stone-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400 shadow-sm" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-10">
            {filtered.map((hotel, idx) => (
              <div key={hotel._id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-200 transition-all">
                <div className={`grid grid-cols-1 lg:grid-cols-2 ${idx % 2 ? 'lg:[&>*:first-child]:order-last' : ''}`}>
                  <div className="relative overflow-hidden h-72 lg:h-auto min-h-[320px]">
                    <img src={hotel.image} alt={hotel.name} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-5 right-5 bg-white/95 rounded-xl px-3 py-2 text-center shadow-lg">
                      <div className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><span className="font-bold text-sm">{hotel.rating}</span></div>
                    </div>
                  </div>
                  <div className="p-10 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3 text-amber-600 text-xs font-bold uppercase tracking-wider">
                      <MapPin className="w-4 h-4" /> {hotel.city}, {hotel.country}
                    </div>
                    <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-3">{hotel.name}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">{hotel.description}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {hotel.amenities.slice(0, 6).map(a => (
                        <span key={a} className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full font-semibold">{a}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-5 border-t border-stone-100">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider">From</p>
                        <p className="font-playfair text-xl font-bold text-amber-600">{hotel.priceRange.split(' - ')[0]}<span className="text-xs text-gray-400 font-normal">/night</span></p>
                      </div>
                      <Link href={`/hotels/${hotel._id}`} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md">
                        View & Book <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
