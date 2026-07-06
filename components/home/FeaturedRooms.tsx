'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BedDouble, ChevronRight, Users } from 'lucide-react';
import { roomAPI } from '@/lib/api';
import type { Room } from '@/types';

const fallbackImage = 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?w=900';

export default function FeaturedRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomAPI
      .getAll({ status: 'available' })
      .then(data => setRooms(data.rooms ?? []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-20 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="h-px w-9 bg-amber-500" />
            <p className="text-amber-600 font-bold text-xs uppercase tracking-[0.45em]">
              Rooms & Suites
            </p>
            <span className="h-px w-9 bg-amber-500" />
          </div>
          <h2 className="font-playfair text-4xl sm:text-5xl font-bold text-gray-900">
            Find Your Perfect Room
          </h2>
          <p className="text-gray-500 mt-3 text-lg">
            Every room is a sanctuary of comfort and elegance
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">Loading rooms...</div>
        ) : rooms.length ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {rooms.slice(0, 3).map(room => (
                <Link
                  key={room._id}
                  href={`/room/${room._id}`}
                  className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-200 transition-all hover:-translate-y-1"
                >
                  <div className="relative h-64 overflow-hidden bg-stone-100">
                    <img
                      src={room.images?.[0] || fallbackImage}
                      alt={`Room ${room.roomNumber}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 via-transparent to-gray-950/10" />
                    <span className="absolute top-5 left-5 bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm">
                      {room.type}
                    </span>
                    <span className="absolute top-5 right-5 bg-green-500/85 text-white px-3 py-1.5 rounded-full text-sm font-bold capitalize shadow-sm">
                      {room.status}
                    </span>
                    <div className="absolute bottom-4 right-4 bg-white text-gray-500 px-4 py-2 rounded-xl shadow-sm">
                      <span className="text-amber-700 font-bold text-xl">
                        ₹{room.price.toLocaleString()}
                      </span>
                      <span className="text-sm">/night</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Room {room.roomNumber}
                    </h3>
                    <p className="text-gray-500 mt-1">{room.hotelName}</p>
                    <p className="text-gray-500 text-sm leading-relaxed mt-4 line-clamp-2">
                      {room.description || 'A comfortable RS Galaxy room prepared for a relaxing stay.'}
                    </p>

                    <div className="flex items-center justify-between gap-3 mt-5 pt-5 border-t border-stone-100">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-amber-500" />
                          {room.capacity} guests
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4 text-amber-500" />
                          {room.size} sqm
                        </span>
                      </div>
                      <span className="flex items-center gap-1 text-amber-700 text-sm font-bold">
                        View Details <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <Link
                href="/room"
                className="inline-flex items-center gap-2 border border-amber-200 hover:bg-amber-50 text-amber-700 px-5 py-3 rounded-xl text-sm font-bold"
              >
                View All Rooms <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl">
            <p className="font-bold text-gray-900">No rooms available right now</p>
            <p className="text-sm text-gray-500 mt-1">Please check back soon.</p>
          </div>
        )}
      </div>
    </section>
  );
}
