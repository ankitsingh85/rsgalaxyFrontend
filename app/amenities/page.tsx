'use client';
import Link from 'next/link';
import { CheckCircle, ChevronRight, ArrowRight } from 'lucide-react';

const amenityCategories = [
  {
    title: 'Wellness & Spa',
    emoji: '🧖',
    description: 'Rejuvenate body and mind with world-class wellness facilities.',
    items: ['Full-Service Spa', 'Heated Pool', 'Jacuzzi & Hot Tub', 'Sauna & Steam Room', 'Yoga Studio', 'Meditation Garden', 'Personal Trainer', 'Beauty Salon'],
    image: 'https://images.pexels.com/photos/3865711/pexels-photo-3865711.jpeg?w=800',
  },
  {
    title: 'Dining & Bar',
    emoji: '🍽️',
    description: 'Culinary excellence with award-winning restaurants and bars.',
    items: ['Fine Dining Restaurant', 'Rooftop Bar & Lounge', '24/7 Room Service', 'Breakfast Buffet', 'Private Dining', 'Wine Cellar Tours', 'Cooking Classes', 'Poolside Bar'],
    image: 'https://images.pexels.com/photos/12387869/pexels-photo-12387869.jpeg?w=800',
  },
  {
    title: 'Business & Events',
    emoji: '💼',
    description: 'State-of-the-art facilities for meetings and memorable events.',
    items: ['Conference Rooms', 'Ballroom (1000+ capacity)', 'AV Equipment', 'Business Center', 'High-Speed WiFi', 'Event Planning', 'Catering Service', 'Breakout Rooms'],
    image: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg?w=800',
  },
  {
    title: 'Recreation',
    emoji: '🏊',
    description: 'Stay active and entertained with diverse recreational offerings.',
    items: ['Fitness Center', 'Tennis Courts', 'Beach Access', 'Cycling Tours', 'Water Sports', 'Game Room', 'Kids Club', 'Outdoor Activities'],
    image: 'https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?w=800',
  },
  {
    title: 'Concierge Services',
    emoji: '🛎️',
    description: 'Personalized services to make every moment exceptional.',
    items: ['24/7 Concierge', 'Valet Parking', 'Airport Transfers', 'Tour Arrangements', 'Shopping Assistance', 'Restaurant Reservations', 'Laundry Service', 'Butler Service'],
    image: 'https://images.pexels.com/photos/271639/pexels-photo-271639.jpeg?w=800',
  },
  {
    title: 'Technology',
    emoji: '📱',
    description: 'Stay connected with cutting-edge technology throughout your stay.',
    items: ['High-Speed WiFi', 'Smart Room Controls', 'Digital Check-in', 'In-Room Tablets', '4K Smart TVs', 'USB Charging Ports', 'EV Charging', 'Virtual Concierge'],
    image: 'https://images.pexels.com/photos/3865711/pexels-photo-3865711.jpeg?w=800',
  },
];

export default function AmenitiesPage() {
  return (
    <div className="min-h-screen bg-[#faf9f6]">
      {/* Header */}
      <div className="bg-stone-100 border-b border-stone-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-4 font-medium">
            <Link href="/" className="hover:text-amber-700">Home</Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">Amenities</span>
          </div>
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">Premium Facilities</p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900 mb-3">World-Class Amenities</h1>
          <p className="text-gray-500 text-lg max-w-xl">
            Every detail crafted for your ultimate comfort. Discover the facilities that make RS Galaxy exceptional.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="space-y-16">
          {amenityCategories.map((cat, i) => (
            <div key={cat.title} className={`flex flex-col lg:flex-row gap-10 items-center ${i % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
              <div className="lg:w-1/2">
                <div className="relative rounded-2xl overflow-hidden shadow-xl">
                  <img src={cat.image} alt={cat.title} className="w-full h-72 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/40 to-transparent" />
                  <div className="absolute top-4 left-4 bg-white rounded-xl px-3 py-2 shadow-lg">
                    <span className="text-3xl">{cat.emoji}</span>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2">
                <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-3">{cat.title}</h2>
                <p className="text-gray-500 mb-6 leading-relaxed">{cat.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {cat.items.map(item => (
                    <div key={item} className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                      <CheckCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-amber-500 to-amber-700 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="font-playfair text-4xl font-bold mb-4">Experience It All</h2>
          <p className="text-amber-100 mb-8">Book your stay and enjoy unlimited access to all amenities.</p>
          <Link href="/hotels" className="inline-flex items-center gap-2 bg-white text-amber-600 hover:bg-amber-50 px-8 py-4 rounded-xl font-bold shadow-xl">
            Browse Hotels <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}