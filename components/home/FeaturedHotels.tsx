'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, MapPin, ChevronRight, ArrowRight } from 'lucide-react';
import { hotelAPI } from '@/lib/api';
import type { Hotel } from '@/types';

export default function FeaturedHotels() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  useEffect(() => { hotelAPI.getAll().then(d => setHotels(d.hotels)).catch(() => {}); }, []);

  return (
    <section className="py-16 bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">All Properties</p>
            <h2 className="font-playfair text-4xl font-bold text-gray-900">RS Galaxy Hotels</h2>
          </div>
          <Link href="/hotels" className="hidden sm:flex items-center gap-2 border border-amber-200 hover:bg-amber-50 text-amber-700 px-4 py-2.5 rounded-xl text-sm font-bold">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hotels.slice(0, 2).map(hotel => (
            <Link key={hotel._id} href={`/hotels/${hotel._id}`} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-stone-200 hover:border-amber-200 transition-all hover:-translate-y-1">
              <div className="relative h-52 overflow-hidden">
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/70 to-transparent" />
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                  <Star className="w-3 h-3 fill-white" /> {hotel.rating}
                </div>
                <div className="absolute bottom-3 left-4">
                  <p className="font-playfair text-lg font-bold text-white">{hotel.name}</p>
                  <p className="flex items-center gap-1 text-xs text-amber-300"><MapPin className="w-3 h-3" />{hotel.city}, {hotel.country}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-amber-600 font-bold">{hotel.priceRange.split(' - ')[0]}<span className="text-xs text-gray-400 font-normal">/night</span></p>
                  <span className="flex items-center gap-1 text-amber-600 text-xs font-bold border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg group-hover:bg-amber-500 group-hover:text-white">
                    View Rooms <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
