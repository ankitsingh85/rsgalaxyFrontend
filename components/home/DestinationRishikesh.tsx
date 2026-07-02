import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function DestinationRishikesh() {
  return (
    <section className="py-16 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-2">📍 Rishikesh, Uttarakhand</p>
            <h2 className="font-playfair text-4xl font-bold text-gray-900">RS Galaxy Rishikesh Retreat</h2>
            <p className="text-gray-500 text-sm mt-2">Spiritual sanctuary by the sacred Ganges.</p>
          </div>
          <Link href="/hotels" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shadow-md self-start sm:self-auto">
            Book a Room <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="relative rounded-2xl overflow-hidden group h-80 shadow-xl">
            <img src="https://images.pexels.com/photos/19332135/pexels-photo-19332135.jpeg?w=900" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-emerald-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">Luxury Suite</span>
              <p className="font-playfair text-xl font-bold">Forest View Rooms</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden group h-80 shadow-xl">
            <img src="https://images.pexels.com/photos/19041828/pexels-photo-19041828.jpeg?w=900" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-5 left-5 text-white">
              <span className="inline-block bg-teal-500 text-xs font-bold uppercase px-2.5 py-1 rounded-full mb-2">River View</span>
              <p className="font-playfair text-xl font-bold">Sacred Ganges Views</p>
              <p className="text-xs text-gray-300 mt-1">Starting ₹7,000/night</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
