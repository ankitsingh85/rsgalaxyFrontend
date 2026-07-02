import { Shield, Award, Clock, Headphones } from 'lucide-react';

export default function WhyUs() {
  const features = [
    { icon: Shield, title: 'Secure Payments', desc: 'JWT auth, Razorpay & PayU integration', color: 'text-blue-600 bg-blue-50' },
    { icon: Award, title: 'Best Price Guarantee', desc: 'Find cheaper? We match + 10% off', color: 'text-amber-600 bg-amber-50' },
    { icon: Clock, title: 'Instant Confirmation', desc: 'Email confirmation in seconds', color: 'text-green-600 bg-green-50' },
    { icon: Headphones, title: '24/7 Support', desc: 'Expert team round the clock', color: 'text-purple-600 bg-purple-50' },
  ];
  return (
    <section className="py-16 bg-[#faf9f6] border-y border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Why RS Galaxy?</p>
          <h2 className="font-playfair text-4xl font-bold text-gray-900">The RS Galaxy Promise</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-stone-200 hover:border-amber-200 transition-all group hover:-translate-y-0.5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">{title}</h3>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
