'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, MapPin } from 'lucide-react';
import { hotelAPI } from '@/lib/api';
import type { Hotel } from '@/types';

export default function DestinationGoa() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const hotelHref = hotel ? `/hotels/${hotel._id}` : '/hotels';

  useEffect(() => {
    hotelAPI
      .getAll({ city: 'Goa', status: 'active' })
      .then(data => setHotel((data.hotels ?? [])[0] ?? null))
      .catch(() => setHotel(null));
  }, []);

  return (
    <section className="py-16 bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">
              <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              Goa, India
            </p>
            <h2 className="font-playfair text-4xl font-bold text-gray-900">
              RS Galaxy Goa Beach Resort
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Beachfront luxury on Goa's most pristine shores.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 self-start sm:self-auto">
            <Link
              href={hotelHref}
              className="bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              View Details <Info className="w-4 h-4" />
            </Link>
            <Link
              href={hotel ? `${hotelHref}#rooms` : '/room'}
              className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md"
            >
              Book a Room <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link href={hotelHref} className="relative rounded-2xl overflow-hidden group h-80 shadow-xl block">
            <img
              src="https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?w=900"
              alt="RS Galaxy Goa infinity pool and deck"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-amber-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">
                Outdoor Pool
              </span>
              <p className="font-playfair text-xl font-bold">Infinity Pool & Deck</p>
            </div>
          </Link>

          <Link href={hotelHref} className="relative rounded-2xl overflow-hidden group h-80 shadow-xl block">
            <img
              src="https://images.pexels.com/photos/14464348/pexels-photo-14464348.jpeg?w=900"
              alt="RS Galaxy Goa beachview premium rooms"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-blue-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">
                Premium Room
              </span>
              <p className="font-playfair text-xl font-bold">Beachview Rooms</p>
              <p className="text-xs text-gray-300 mt-1">Starting Rs. 8,500/night</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
