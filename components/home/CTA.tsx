import Link from 'next/link';
import { ArrowRight, Phone } from 'lucide-react';

export default function CTA() {
  return (
    <section className="relative py-20 overflow-hidden bg-gray-900">
      <img src="https://images.pexels.com/photos/297985/pexels-photo-297985.jpeg?w=1920" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 to-gray-900/60" />
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 max-w-xl">
        <div className="mb-6">
          <p className="text-amber-400 font-playfair text-3xl font-bold tracking-wide">RS GALAXY HOTEL</p>
          <p className="text-amber-300/80 text-sm italic">Always with you</p>
        </div>
        <h2 className="font-playfair text-5xl font-bold text-white mb-4">Your Next Luxury<br />Stay Awaits</h2>
        <p className="text-gray-300 mb-8">Join thousands across Goa & Rishikesh. <em className="text-amber-400 font-semibold">Always with you.</em></p>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <Link href="/register" className="bg-amber-500 hover:bg-amber-400 text-white px-8 py-4 rounded-xl font-bold shadow-xl text-center">Create Free Account</Link>
          <Link href="/hotels" className="border-2 border-white/30 hover:border-amber-400 text-white hover:text-amber-400 px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2">Browse Hotels <ArrowRight className="w-4 h-4" /></Link>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Phone className="w-3.5 h-3.5 text-amber-500" /> Call: <span className="text-amber-400 font-semibold">+91-800-RS-GALAXY</span>
        </div>
      </div>
    </section>
  );
}
