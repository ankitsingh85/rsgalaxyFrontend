import Link from 'next/link';
import { BedDouble, ChevronRight, Users } from 'lucide-react';
import { API_URL } from '@/lib/api';
import SearchFilters from '@/components/room/SearchFilters';
import type { Room } from '@/types';

type SearchParams = { [key: string]: string | string[] | undefined };

async function fetchRooms(searchParams: SearchParams): Promise<Room[]> {
  const params = new URLSearchParams();
  const passthrough = ['type', 'city', 'guests', 'minPrice', 'maxPrice', 'minRating', 'search'];
  for (const key of passthrough) {
    const value = searchParams[key];
    if (typeof value === 'string' && value) params.set(key, value);
  }

  try {
    const res = await fetch(`${API_URL}/rooms?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.rooms ?? [];
  } catch {
    return [];
  }
}

export default async function RoomsPage({ searchParams }: { searchParams: SearchParams }) {
  const rooms = await fetchRooms(searchParams);
  const checkIn = typeof searchParams.checkIn === 'string' ? searchParams.checkIn : '';
  const checkOut = typeof searchParams.checkOut === 'string' ? searchParams.checkOut : '';
  const guests = typeof searchParams.guests === 'string' ? searchParams.guests : '';

  const detailQuery = new URLSearchParams();
  if (checkIn) detailQuery.set('checkIn', checkIn);
  if (checkOut) detailQuery.set('checkOut', checkOut);
  if (guests) detailQuery.set('guests', guests);
  const detailSuffix = detailQuery.toString() ? `?${detailQuery.toString()}` : '';

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">
            Stay With Us
          </p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900">Rooms & Suites</h1>
          <p className="text-gray-500 mt-2">Choose a room across RS Galaxy properties.</p>

          <SearchFilters />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {rooms.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {rooms.map(room => (
              <Link
                key={room._id}
                href={`/room/${room._id}${detailSuffix}`}
                className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-200 transition-all"
              >
                <div className="relative h-56 overflow-hidden bg-stone-100">
                  <img
                    src={
                      room.images[0] ||
                      'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?w=900'
                    }
                    alt={`Room ${room.roomNumber}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-white/95 text-amber-700 border border-amber-100 px-3 py-1.5 rounded-full text-xs font-bold uppercase shadow-sm">
                    {room.type}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">
                    {room.hotelName}
                  </p>
                  <h2 className="font-playfair text-2xl font-bold text-gray-900">
                    Room {room.roomNumber}
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed mt-2 line-clamp-2">
                    {room.description || 'A comfortable RS Galaxy room prepared for a relaxing stay.'}
                  </p>

                  <div className="grid grid-cols-3 gap-3 my-5 text-sm">
                    <div className="bg-stone-50 rounded-xl p-3">
                      <Users className="w-4 h-4 text-amber-500 mb-1" />
                      <p className="font-bold text-gray-800">{room.capacity}</p>
                      <p className="text-xs text-gray-400">Guests</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3">
                      <BedDouble className="w-4 h-4 text-amber-500 mb-1" />
                      <p className="font-bold text-gray-800">{room.size}</p>
                      <p className="text-xs text-gray-400">Sqm</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3">
                      <p className="font-bold text-amber-500 mb-1">F</p>
                      <p className="font-bold text-gray-800">{room.floor}</p>
                      <p className="text-xs text-gray-400">Floor</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <p className="font-playfair text-xl font-bold text-amber-600">
                      Rs. {room.price.toLocaleString()}
                      <span className="text-xs text-gray-400 font-normal">/night</span>
                    </p>
                    <span className="flex items-center gap-1 text-sm font-bold text-gray-700 group-hover:text-amber-600">
                      Book <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
            <p className="font-bold text-gray-900">No rooms found</p>
            <p className="text-sm text-gray-500 mt-1">Try changing your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
