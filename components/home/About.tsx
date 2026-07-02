import { Trophy, Heart, Star, Award, CheckCircle, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function About() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="relative h-80 sm:h-[400px]">
          <div className="absolute left-0 top-0 bottom-0 w-[57%] rounded-2xl overflow-hidden shadow-xl">
            <img src="https://images.pexels.com/photos/33824477/pexels-photo-33824477.jpeg?w=600" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute right-0 top-0 w-[41%] h-[47%] rounded-2xl overflow-hidden shadow-xl">
            <img src="https://images.pexels.com/photos/2725675/pexels-photo-2725675.jpeg?w=420" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute right-0 bottom-0 w-[41%] h-[47%] rounded-2xl overflow-hidden shadow-xl">
            <img src="https://images.pexels.com/photos/12387869/pexels-photo-12387869.jpeg?w=420" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-5 left-[52%] -translate-x-1/2 z-10">
            <div className="bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-xl px-4 py-2 shadow-2xl text-center">
              <p className="font-playfair text-2xl font-bold leading-none">2+</p>
              <p className="text-[9px] font-bold tracking-widest uppercase opacity-90">Yrs Excellence</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-3">About RS Galaxy Hotel</p>
          <h2 className="font-playfair text-4xl font-bold text-gray-900 mb-4">Luxury Redefined,<br /><span className="text-amber-600">Always With You</span></h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">Founded in 2022, RS Galaxy Hotel is India's most celebrated luxury hotel brand — blending 5-star global standards with warm Indian hospitality across Goa & Rishikesh.</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: Trophy, t: 'Award-Winning', s: '50+ awards' },
              { icon: Heart,  t: '10K+ Guests',   s: 'Yearly' },
              { icon: Star,   t: '5-Star Rated',  s: 'All properties' },
              { icon: Award,  t: 'Best Service',  s: 'Certified' },
            ].map(({ icon: Icon, t, s }) => (
              <div key={t} className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Icon className="w-4 h-4 text-amber-500" />
                <div><p className="text-xs font-bold">{t}</p><p className="text-[10px] text-gray-500">{s}</p></div>
              </div>
            ))}
          </div>

          <Link href="/hotels" className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md">
            Explore Hotels <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
