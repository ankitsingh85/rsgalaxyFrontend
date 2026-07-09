'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, Users } from 'lucide-react';

export default function Hero() {
  const router = useRouter();
  const [city, setCity] = useState('All Cities');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative h-screen min-h-[600px] flex flex-col justify-end overflow-hidden -mt-20">
      <div className="absolute inset-0 -top-20" style={{ transform: `translateY(${scrollY * 0.35}px)` }}>
        <img src="https://images.pexels.com/photos/14917401/pexels-photo-14917401.jpeg?w=1920" alt="" className="w-full h-[calc(100%+160px)] object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-0 w-full">
        <div className="pb-10">
          <div className="text-center mb-8">
            <p className="text-amber-300 text-sm font-semibold tracking-[0.3em] uppercase mb-3">✦ Five Star Luxury · Always With You ✦</p>
            <h1 className="font-playfair text-5xl sm:text-7xl font-bold text-white leading-tight">Where Every Stay Becomes<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400">a Memory</span>
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              <div className="col-span-2 lg:col-span-1">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 pt-1.5 pb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-500" /> Destination</label>
                <select value={city} onChange={e => setCity(e.target.value)} className="w-full bg-transparent text-gray-800 px-2 pb-2 text-sm font-semibold focus:outline-none cursor-pointer">
                  <option>All Cities</option><option>Goa</option><option>Rishikesh</option>
                </select>
              </div>
              <div className="border-l border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-1.5 pb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-500" /> Check In</label>
                <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="w-full bg-transparent text-gray-800 px-3 pb-2 text-sm font-semibold focus:outline-none" />
              </div>
              <div className="border-l border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-1.5 pb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3 text-amber-500" /> Check Out</label>
                <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full bg-transparent text-gray-800 px-3 pb-2 text-sm font-semibold focus:outline-none" />
              </div>
              <div className="border-l border-gray-100">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-1.5 pb-0.5 flex items-center gap-1"><Users className="w-3 h-3 text-amber-500" /> Guests</label>
                <select value={guests} onChange={e => setGuests(e.target.value)} className="w-full bg-transparent text-gray-800 px-3 pb-2 text-sm font-semibold focus:outline-none cursor-pointer">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n===1?'Guest':'Guests'}</option>)}
                </select>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <button onClick={() => {
                  const params = new URLSearchParams();
                  if (city !== 'All Cities') params.set('city', city);
                  if (checkIn) params.set('checkIn', checkIn);
                  if (checkOut) params.set('checkOut', checkOut);
                  if (guests) params.set('guests', guests);
                  router.push(`/room?${params.toString()}`);
                }} className="w-full h-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 py-3 shadow-lg">
                  <Search className="w-4 h-4" /> Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 bg-black/40 backdrop-blur border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-4 divide-x divide-white/10">
          {[{v:'2+',l:'Hotels'},{v:'10K+',l:'Guests'},{v:'2',l:'Destinations'},{v:'4.9★',l:'Rating'}].map(s => (
            <div key={s.l} className="text-center py-4">
              <p className="font-playfair text-xl sm:text-2xl font-bold text-amber-400">{s.v}</p>
              <p className="text-[10px] sm:text-xs text-gray-300 uppercase tracking-wider mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}