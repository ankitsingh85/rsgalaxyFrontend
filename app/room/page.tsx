'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BedDouble, ChevronRight, Search, Users } from 'lucide-react';
import { roomAPI } from '@/lib/api';
import type { Room } from '@/types';

const roomTypes = ['all', 'standard', 'deluxe', 'suite', 'presidential'] as const;

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<(typeof roomTypes)[number]>('all');

  useEffect(() => {
    roomAPI
      .getAll()
      .then(data => setRooms(data.rooms ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rooms.filter(room => {
      const matchesType = type === 'all' || room.type === type;
      const matchesSearch =
        !query ||
        room.hotelName.toLowerCase().includes(query) ||
        room.roomNumber.toLowerCase().includes(query) ||
        room.type.toLowerCase().includes(query);

      return matchesType && matchesSearch;
    });
  }, [rooms, search, type]);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-amber-600 font-bold text-xs uppercase tracking-widest mb-2">
            Stay With Us
          </p>
          <h1 className="font-playfair text-5xl font-bold text-gray-900">Rooms & Suites</h1>
          <p className="text-gray-500 mt-2">Choose a room across RS Galaxy properties.</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search rooms or hotels..."
                className="w-full bg-white border border-stone-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:border-amber-400 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {roomTypes.map(roomType => (
                <button
                  key={roomType}
                  type="button"
                  onClick={() => setType(roomType)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize border transition-all ${
                    type === roomType
                      ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                      : 'bg-white border-stone-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
                  }`}
                >
                  {roomType}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filteredRooms.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <Link
                key={room._id}
                href={`/room/${room._id}`}
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
            <p className="text-sm text-gray-500 mt-1">Try changing your search or room type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
