import { Wifi, Car, Utensils, Dumbbell, Coffee, Bath } from 'lucide-react';

export default function Amenities() {
  const list = [
    { icon: Wifi, label: 'Free WiFi' },
    { icon: Car, label: 'Free Parking' },
    { icon: Utensils, label: 'Fine Dining' },
    { icon: Dumbbell, label: 'Fitness Center' },
    { icon: Coffee, label: '24/7 Room Service' },
    { icon: Bath, label: 'Spa & Wellness' },
  ];
  return (
    <section className="py-14 border-y border-stone-200 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-amber-600 font-bold text-xs uppercase tracking-widest mb-3">Premium Amenities</p>
        <h3 className="font-playfair text-3xl font-bold text-gray-900 text-center mb-10">Everything You Need</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-5">
          {list.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-3 text-center group">
              <div className="w-14 h-14 bg-white border-2 border-stone-200 rounded-2xl flex items-center justify-center group-hover:border-amber-400 group-hover:bg-amber-50 transition-all shadow-sm">
                <Icon className="w-6 h-6 text-amber-500" />
              </div>
              <span className="text-xs text-gray-500 font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
