'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Info, MapPin } from 'lucide-react';
import { hotelAPI } from '@/lib/api';
import type { Hotel } from '@/types';

export default function DestinationRishikesh() {
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const hotelHref = hotel ? `/hotels/${hotel._id}` : '/hotels';

  useEffect(() => {
    hotelAPI
      .getAll({ city: 'Rishikesh', status: 'active' })
      .then(data => setHotel((data.hotels ?? [])[0] ?? null))
      .catch(() => setHotel(null));
  }, []);

  return (
    <section className="py-16 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-widest mb-2">
              <MapPin className="w-3.5 h-3.5 text-red-500 fill-red-500" />
              Rishikesh, Uttarakhand
            </p>
            <h2 className="font-playfair text-4xl font-bold text-gray-900">
              RS Galaxy Rishikesh Retreat
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              Spiritual sanctuary by the sacred Ganges.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 self-start sm:self-auto">
            <Link
              href={hotelHref}
              className="bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              View Details <Info className="w-4 h-4" />
            </Link>
            <Link
              href={hotel ? `${hotelHref}#rooms` : '/room'}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md"
            >
              Book a Room <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Link href={hotelHref} className="relative rounded-2xl overflow-hidden group h-80 shadow-xl block">
            <img
              src="https://images.pexels.com/photos/19332135/pexels-photo-19332135.jpeg?w=900"
              alt="RS Galaxy Rishikesh forest view rooms"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-emerald-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">
                Luxury Suite
              </span>
              <p className="font-playfair text-xl font-bold">Forest View Rooms</p>
            </div>
          </Link>

          <Link href={hotelHref} className="relative rounded-2xl overflow-hidden group h-80 shadow-xl block">
            <img
              src="https://images.pexels.com/photos/19041828/pexels-photo-19041828.jpeg?w=900"
              alt="RS Galaxy Rishikesh Ganges river view"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-teal-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">
                River View
              </span>
              <p className="font-playfair text-xl font-bold">Sacred Ganges Views</p>
              <p className="text-xs text-gray-300 mt-1">Starting Rs. 7,000/night</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
