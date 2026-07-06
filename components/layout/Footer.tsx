import Link from 'next/link';
import { Phone, Mail, MapPin, ArrowRight, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-amber-900/30">
      <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <img
            src="/logo.png"
            alt="RS Galaxy Hotel"
            className="h-28 w-auto object-contain mb-4"
          />
          <p className="text-sm text-gray-400 leading-relaxed">Premium 5-star luxury hotel brand across Goa & Rishikesh. Always with you.</p>
        </div>
        {[
          { title: 'Explore', links: [['Home','/'], ['Hotels','/hotels'], ['Rooms','/room'], ['Contact','/contact']] },
          { title: 'Support', links: [['Help','/'], ['Privacy','/'], ['Terms','/'], ['Cancel Policy','/']] },
        ].map(s => (
          <div key={s.title}>
            <h4 className="font-bold text-amber-400 text-sm uppercase tracking-widest mb-4 border-b border-amber-900/40 pb-2">{s.title}</h4>
            <ul className="space-y-2.5">
              {s.links.map(([l,h]) => (
                <li key={l}><Link href={h} className="text-sm text-gray-400 hover:text-amber-400 transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="font-bold text-amber-400 text-sm uppercase tracking-widest mb-4 border-b border-amber-900/40 pb-2">Contact</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li className="flex items-start gap-2"><MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />RS Galaxy Ave, India</li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-amber-400" />+91-800-RS-GALAXY</li>
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-amber-400" />hello@rsgalaxy.com</li>
          </ul>
          <form className="mt-5 flex gap-2">
            <input type="email" placeholder="Newsletter" className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500" />
            <button className="w-9 h-9 bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center"><ArrowRight className="w-4 h-4 text-white" /></button>
          </form>
        </div>
      </div>
      <div className="border-t border-gray-800 py-5 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} <span className="text-amber-500 font-semibold">RS Galaxy Hotel</span>. Made with <Heart className="w-3 h-3 inline text-red-500 fill-red-500" /> for luxury hospitality.
      </div>
    </footer>
  );
}
