'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Clock, Tag, Star, CheckCircle, ArrowRight } from 'lucide-react';

const offers = [
  {
    id: 1,
    title: 'Early Bird Special',
    subtitle: 'Book 30 Days in Advance',
    discount: '30%',
    code: 'EARLYBIRD30',
    description: 'Plan ahead and save big! Book any room at least 30 days before your check-in date and enjoy a 30% discount.',
    validity: 'Valid until Dec 31, 2025',
    image: 'https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?w=600',
    badge: '🌅 Best Value',
    includes: ['Free cancellation up to 7 days', 'Complimentary breakfast', 'Room upgrade on availability', 'Late check-out until 2 PM'],
    color: 'from-amber-500 to-amber-600',
  },
  {
    id: 2,
    title: 'Weekend Escape',
    subtitle: 'Friday to Sunday',
    discount: '25%',
    code: 'WEEKEND25',
    description: 'Escape the weekday hustle with our exclusive weekend package.',
    validity: 'Valid every weekend',
    image: 'https://images.pexels.com/photos/19041828/pexels-photo-19041828.jpeg?w=600',
    badge: '🏖️ Popular',
    includes: ['Free spa access', 'Welcome cocktails', 'Dinner for two', 'Sunrise yoga session'],
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 3,
    title: 'Honeymoon Package',
    subtitle: 'Celebrate Your Love',
    discount: '20%',
    code: 'HONEYMOON20',
    description: 'Begin your forever together in style with romantic touches.',
    validity: 'Valid for couples only',
    image: 'https://images.pexels.com/photos/14464348/pexels-photo-14464348.jpeg?w=600',
    badge: '💝 Most Romantic',
    includes: ['Champagne & rose petals', 'Couples spa treatment', 'Private beach dinner', 'Honeymoon suite upgrade'],
    color: 'from-pink-500 to-rose-600',
  },
  {
    id: 4,
    title: 'Loyalty Member Deal',
    subtitle: 'Exclusive for Members',
    discount: '35%',
    code: 'MEMBER35',
    description: 'Registered members enjoy our best rates. Create a free account to unlock.',
    validity: 'For registered users only',
    image: 'https://images.pexels.com/photos/19332135/pexels-photo-19332135.jpeg?w=600',
    badge: '⭐ Member Only',
    includes: ['Priority check-in', 'Room upgrade guarantee', 'Free airport transfer', 'Exclusive member lounge'],
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 5,
    title: 'Extended Stay',
    subtitle: 'Stay 7+ Nights',
    discount: '40%',
    code: 'LONGSTAY40',
    description: 'The longer you stay, the more you save. Book 7+ consecutive nights.',
    validity: 'Minimum 7 nights',
    image: 'https://images.pexels.com/photos/37240654/pexels-photo-37240654.jpeg?w=600',
    badge: '🏡 Best for Long Stays',
    includes: ['Weekly laundry service', 'Dedicated butler', 'Grocery delivery', 'Local tour package'],
    color: 'from-green-500 to-green-600',
  },
  {
    id: 6,
    title: 'Corporate Rate',
    subtitle: 'For Business Travelers',
    discount: '15%',
    code: 'CORPORATE15',
    description: 'Designed for the modern business traveler with productive amenities.',
    validity: 'Valid for business bookings',
    image: 'https://images.pexels.com/photos/14011664/pexels-photo-14011664.jpeg?w=600',
    badge: '💼 Business',
    includes: ['Business center access', 'Express checkout', 'Daily newspaper', 'Meeting room discount'],
    color: 'from-gray-600 to-gray-700',
  },
];

export default function OffersPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <div className="bg-stone-100 border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-4 font-medium">
            <Link href="/" className="hover:text-amber-700">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Special Offers</span>
          </div>
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Exclusive Deals</p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900 mb-3">Special Offers & Discounts</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Save big on your luxury stays. Use our promo codes at checkout for instant discounts.
          </p>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-700 py-5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-white font-semibold text-lg">
            🔥 Use code <span className="bg-white text-amber-600 px-2 py-0.5 rounded font-bold mx-1">RSGALAXY2025</span> for an extra 5% off any booking!
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {offers.map(offer => (
            <div key={offer.id} className="group bg-white rounded-2xl overflow-hidden border border-stone-200 hover:border-amber-200 transition-all hover:shadow-2xl hover:-translate-y-1">
              <div className="relative h-48 overflow-hidden">
                <img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-medium bg-white/95 text-amber-600 px-2.5 py-1.5 rounded-full backdrop-blur-sm">
                    {offer.badge}
                  </span>
                </div>
                <div className={`absolute bottom-3 right-3 bg-gradient-to-r ${offer.color} text-white px-3 py-2 rounded-xl font-bold text-2xl shadow-lg`}>
                  {offer.discount} OFF
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-playfair text-xl font-bold text-gray-900 mb-0.5">{offer.title}</h3>
                <p className="text-amber-600 text-sm font-medium mb-3">{offer.subtitle}</p>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{offer.description}</p>

                <div className="space-y-1.5 mb-4">
                  {offer.includes.map(inc => (
                    <div key={inc} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      {inc}
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Promo Code</p>
                      <p className="font-mono font-bold text-amber-700 tracking-wider">{offer.code}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(offer.code)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        copiedCode === offer.code
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-amber-500 text-white hover:bg-amber-600'
                      }`}
                    >
                      {copiedCode === offer.code ? '✓ Copied!' : 'Copy Code'}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {offer.validity}
                  </div>
                </div>

                <Link
                  href="/hotels"
                  className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${offer.color} text-white py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90`}
                >
                  Book with This Offer <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Terms */}
        <div className="mt-12 bg-white border border-stone-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="w-5 h-5 text-amber-500" />
            Terms & Conditions
          </h3>
          <ul className="text-sm text-gray-500 space-y-1.5">
            {[
              'Offers cannot be combined with other promotions unless stated.',
              'Discounts apply to base room rates only, excluding taxes and fees.',
              'Valid for new bookings only made through rsgalaxy.com.',
              'RS Galaxy reserves the right to modify or cancel offers without notice.',
              'Promo codes must be entered at checkout to apply the discount.',
              'Subject to room availability. Blackout dates may apply.',
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2">
                <Star className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}