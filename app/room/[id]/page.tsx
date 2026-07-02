'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Building2, Calendar, CheckCircle, CreditCard, Star, Users } from 'lucide-react';
import { bookingAPI, roomAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { Room } from '@/types';

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    if (!params.id) return;

    roomAPI
      .getOne(params.id)
      .then(data => setRoom(data.room))
      .finally(() => setLoading(false));
  }, [params.id]);

  const nights =
    checkIn && checkOut
      ? Math.max(
          0,
          Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)
        )
      : 0;
  const subtotal = room ? nights * room.price : 0;
  const tax = Math.round(subtotal * 0.12);
  const total = subtotal + tax;

  const handleBook = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!checkIn || !checkOut || nights <= 0) {
      toast.error('Select valid dates');
      return;
    }

    setBooking(true);
    try {
      const data = await bookingAPI.create({
        roomId: room!._id,
        checkIn,
        checkOut,
        guests,
        specialRequests,
      });
      setSuccess(data.booking);
      toast.success('Booking confirmed!');
    } catch (err: any) {
      toast.error(err.message || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!room) {
    return <div className="min-h-screen flex items-center justify-center">Room not found</div>;
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#faf9f6]">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center shadow-xl border border-stone-200">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="font-playfair text-3xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-amber-600 font-bold font-mono mb-4">{success.bookingRef}</p>
          <p className="text-gray-500 text-sm mb-6">Confirmation sent to {user?.email}</p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold"
          >
            View My Bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="relative h-72">
        <img
          src={
            room.images[0] ||
            'https://images.pexels.com/photos/3688261/pexels-photo-3688261.jpeg?w=1200'
          }
          alt={`Room ${room.roomNumber}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 text-white">
          <span className="text-xs bg-amber-500 px-2.5 py-1 rounded-full font-bold uppercase">
            {room.type}
          </span>
          <h1 className="font-playfair text-4xl font-bold mt-2">Room {room.roomNumber}</h1>
          <p className="text-amber-300">{room.hotelName}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div>
                <Users className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Capacity</p>
                <p className="font-bold">{room.capacity} guests</p>
              </div>
              <div>
                <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Size</p>
                <p className="font-bold">{room.size} sqm</p>
              </div>
              <div>
                <Building2 className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Floor</p>
                <p className="font-bold">{room.floor}</p>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-6">{room.description}</p>
            <h3 className="font-bold text-gray-900 mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-2">
              {room.amenities.map(amenity => (
                <div key={amenity} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-amber-500" />
                  {amenity}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside>
          <div className="bg-white border-2 border-amber-200 rounded-2xl p-6 sticky top-24">
            <p className="text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">From</p>
            <p className="font-playfair text-3xl font-bold text-gray-900 mb-5">
              Rs. {room.price.toLocaleString()}
              <span className="text-sm text-gray-400 font-normal">/night</span>
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Check-in</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={checkIn}
                    onChange={event => setCheckIn(event.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Check-out</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input
                    type="date"
                    min={checkIn}
                    value={checkOut}
                    onChange={event => setCheckOut(event.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">Guests</label>
                <select
                  value={guests}
                  onChange={event => setGuests(Number(event.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400"
                >
                  {Array.from({ length: room.capacity }, (_, index) => index + 1).map(count => (
                    <option key={count} value={count}>
                      {count} {count === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">
                  Special Requests
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={event => setSpecialRequests(event.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            {nights > 0 && (
              <div className="bg-stone-50 rounded-xl p-3 mb-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Rs. {room.price.toLocaleString()} x {nights} nights
                  </span>
                  <span className="font-semibold">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxes (12%)</span>
                  <span className="font-semibold">Rs. {tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-stone-200 font-bold">
                  <span>Total</span>
                  <span className="text-amber-600 text-lg">Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleBook}
              disabled={booking || room.status !== 'available'}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {booking ? (
                'Processing...'
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  {isAuthenticated ? 'Book Now' : 'Login to Book'}
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
