'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, CreditCard, CheckCircle, Clock } from 'lucide-react';
import { bookingAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { Booking } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    bookingAPI.getAll().then(data => setBookings(data.bookings)).finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalPrice, 0);

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <div className="bg-stone-100 border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="font-playfair text-3xl font-bold text-gray-900">Welcome back, {user?.name.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm">Here are your reservations.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'bg-blue-50 text-blue-600' },
            { label: 'Confirmed', value: confirmed, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
            { label: 'Pending', value: pending, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: CreditCard, color: 'bg-amber-50 text-amber-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="font-bold text-gray-900 mb-4">My Bookings</h2>
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200">
            <p className="text-4xl mb-4">📅</p>
            <p className="text-gray-500">No bookings yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(b => (
              <div key={b._id} className="bg-white border border-stone-200 rounded-2xl p-5 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900">{b.hotelName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      b.status === 'confirmed' ? 'bg-green-50 text-green-600' :
                      b.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-gray-500">Room {b.roomNumber} · {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{b.bookingRef}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-amber-600">₹{b.totalPrice.toLocaleString()}</p>
                  <p className={`text-xs ${b.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{b.paymentStatus}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
