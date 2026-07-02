import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DestinationGoa() {
  return (
    <section className="py-16 bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">📍 Goa, India</p>
            <h2 className="font-playfair text-4xl font-bold text-gray-900">RS Galaxy Goa Beach Resort</h2>
            <p className="text-gray-500 text-sm mt-2">Beachfront luxury on Goa's most pristine shores.</p>
          </div>
          <Link href="/hotels" className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md self-start sm:self-auto">
            Book a Room <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="relative rounded-2xl overflow-hidden group h-80 shadow-xl">
            <img src="https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?w=900" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-amber-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">Outdoor Pool</span>
              <p className="font-playfair text-xl font-bold">Infinity Pool & Deck</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden group h-80 shadow-xl">
            <img src="https://images.pexels.com/photos/14464348/pexels-photo-14464348.jpeg?w=900" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-blue-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">Premium Room</span>
              <p className="font-playfair text-xl font-bold">Beachview Rooms</p>
              <p className="text-xs text-gray-300 mt-1">Starting ₹8,500/night</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
