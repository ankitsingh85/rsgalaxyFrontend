'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, MapPin, Users, ChevronRight } from 'lucide-react';
import { hotelAPI } from '@/lib/api';
import type { Hotel, Room } from '@/types';

export default function HotelDetailPage() {
  const params = useParams();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      hotelAPI.getOne(params.id as string)
        .then(data => { setHotel(data.hotel); setRooms(data.rooms); })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!hotel) return <div className="min-h-screen flex items-center justify-center">Hotel not found</div>;

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="relative h-96 overflow-hidden">
        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute bottom-8 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 text-white">
          <p className="flex items-center gap-1 text-amber-400 text-sm mb-2"><MapPin className="w-4 h-4" />{hotel.city}, {hotel.country}</p>
          <h1 className="font-playfair text-5xl font-bold mb-2">{hotel.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-amber-500 px-3 py-1.5 rounded-full text-sm font-bold"><Star className="w-4 h-4 fill-white" /> {hotel.rating}</div>
            <span className="text-amber-200">{hotel.priceRange} / night</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-3">About this hotel</h2>
              <p className="text-gray-600 leading-relaxed">{hotel.description}</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h2 className="font-playfair text-2xl font-bold text-gray-900 mb-4">Available Rooms ({rooms.length})</h2>
              <div className="space-y-4">
                {rooms.map(room => (
                  <Link key={room._id} href={`/rooms/${room._id}`} className="block p-5 bg-stone-50 hover:bg-amber-50 border border-stone-200 hover:border-amber-200 rounded-xl transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900">Room {room.roomNumber} <span className="text-xs text-amber-600 font-semibold capitalize ml-2">· {room.type}</span></p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {room.capacity}</span>
                          <span>{room.size}m²</span>
                          <span>Floor {room.floor}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-600">₹{room.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">per night</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-amber-500 ml-3" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sticky top-24">
              <h3 className="font-bold text-gray-900 mb-4">Amenities</h3>
              <div className="space-y-2">
                {hotel.amenities.map(a => (
                  <div key={a} className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> {a}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
