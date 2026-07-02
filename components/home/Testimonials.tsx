import { Star } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    { name: 'Rahul Mehta', loc: 'Mumbai', text: 'RS Galaxy Goa is breathtaking. The pool, the service, the food — absolutely world-class.', avatar: 'R' },
    { name: 'Priya Sharma', loc: 'Delhi', text: 'Rishikesh retreat was spiritual bliss. Waking up to Himalayan views was unforgettable.', avatar: 'P' },
    { name: 'James Anderson', loc: 'London', text: 'Best hotel brand in India. RS Galaxy sets the standard for luxury and warm hospitality.', avatar: 'J' },
  ];
  return (
    <section className="py-16 bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Guest Reviews</p>
          <h2 className="font-playfair text-3xl font-bold text-gray-900">Loved By Guests</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-stone-200">
              <div className="flex gap-0.5 mb-4">{Array.from({length:5}).map((_,i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white font-bold">{t.avatar}</div>
                <div><p className="font-bold text-gray-900 text-sm">{t.name}</p><p className="text-xs text-gray-400">{t.loc}</p></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
