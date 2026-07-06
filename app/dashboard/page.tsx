'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Calendar, CreditCard, CheckCircle, CheckCheck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI, notificationAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import type { Booking, UserNotification } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    Promise.all([
      bookingAPI.getAll(),
      notificationAPI.getMine().catch(() => ({ notifications: [] })),
    ]).then(([bookingData, notificationData]) => {
      setBookings(bookingData.bookings || []);
      setNotifications(notificationData.notifications || []);
    }).finally(() => setLoading(false));
  }, [isAuthenticated, router]);

  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalPrice, 0);
  const unreadNotifications = notifications.filter(notification => !notification.isRead).length;

  const markNotificationRead = async (id: string) => {
    try {
      await notificationAPI.markMineRead(id);
      setNotifications(prev => prev.map(item => item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Notifications</h2>
            {unreadNotifications > 0 && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                {unreadNotifications} unread
              </span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-6 text-sm text-gray-500">
              No notifications yet.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.slice(0, 5).map(notification => (
                <div key={notification._id} className={`bg-white border rounded-2xl p-5 flex items-start gap-4 ${
                  notification.isRead ? 'border-stone-200' : 'border-amber-200 shadow-sm'
                }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    notification.isRead ? 'bg-stone-100 text-stone-500' : 'bg-amber-50 text-amber-600'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{notification.title}</h3>
                      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  {!notification.isRead && (
                    <button onClick={() => markNotificationRead(notification._id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-xl">
                      <CheckCheck className="w-4 h-4" /> Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
