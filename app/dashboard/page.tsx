'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Bell, Calendar, CreditCard, CheckCircle, CheckCheck, Clock, User as UserIcon,
  Crown, Upload, X, Trash2, Plus, Cake, ShieldOff, Mail, Phone, LayoutDashboard,
  UserCircle, Settings, LogOut, Menu, Award, MapPin, Sparkles, Download, ArrowUpCircle,
  Star, Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingAPI, notificationAPI, authAPI, savedCardAPI, roomAPI, reviewAPI } from '@/lib/api';
import { clearSearchHistory } from '@/lib/searchHistory';
import { estimateStayTotal } from '@/lib/roomPricing';
import { useAuthStore } from '@/lib/store';
import type { Booking, UserNotification, SavedCard, Review } from '@/types';

type Tab = 'overview' | 'bookings' | 'view-profile' | 'edit-profile';

const NAV_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: Calendar },
  { id: 'view-profile', label: 'View Profile', icon: UserCircle },
  { id: 'edit-profile', label: 'Edit Profile', icon: Settings },
];

const RESCHEDULE_CUTOFF_MS = 24 * 60 * 60 * 1000;
const CANCEL_CUTOFF_MS = 48 * 60 * 60 * 1000;
const BOOKING_FILTERS = ['all', 'upcoming', 'past', 'cancelled'] as const;

const statusBadgeColor = (s: string) =>
  s === 'confirmed' || s === 'checked-in' ? 'bg-green-50 text-green-600' :
  s === 'checked-out' ? 'bg-blue-50 text-blue-600' :
  s === 'cancelled' ? 'bg-red-50 text-red-500' :
  'bg-yellow-50 text-yellow-600';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, loadUser, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const reloadBookings = () => bookingAPI.getAll().then(d => setBookings(d.bookings || []));
  const reloadReviews = () => reviewAPI.getMine().then(d => setReviews(d.reviews || [])).catch(() => {});

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (user && user.role !== 'user') {
      router.push(user.role === 'admin' ? '/admin' : '/manager');
      return;
    }
    Promise.all([
      loadUser(),
      bookingAPI.getAll(),
      notificationAPI.getMine().catch(() => ({ notifications: [] })),
      savedCardAPI.getAll().catch(() => ({ cards: [] })),
      roomAPI.getAll().catch(() => ({ rooms: [] })),
      reviewAPI.getMine().catch(() => ({ reviews: [] })),
    ]).then(([, bookingData, notificationData, cardData, roomData, reviewData]) => {
      setBookings(bookingData.bookings || []);
      setNotifications(notificationData.notifications || []);
      setSavedCards(cardData.cards || []);
      setRooms(roomData.rooms || []);
      setReviews(reviewData.reviews || []);
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router]);

  const confirmed = bookings.filter(b => b.status === 'confirmed').length;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const totalSpent = bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalPrice, 0);
  const unreadNotifications = notifications.filter(notification => !notification.isRead).length;
  const upcomingStays = bookings
    .filter(b => new Date(b.checkIn) >= new Date(new Date().toDateString()) && !['cancelled', 'checked-out'].includes(b.status))
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

  const markNotificationRead = async (id: string) => {
    try {
      await notificationAPI.markMineRead(id);
      setNotifications(prev => prev.map(item => item._id === id ? { ...item, isRead: true, readAt: new Date().toISOString() } : item));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ── Edit profile form ──
  const [editForm, setEditForm] = useState<any>({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [idUploading, setIdUploading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditForm({
      name: user.name || '', phone: user.phone || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : '',
      preferences: user.preferences || '',
      avatar: user.avatar || '', idDocument: user.idDocument || '',
      notificationPrefs: { email: user.notificationPrefs?.email !== false, push: user.notificationPrefs?.push !== false },
    });
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const res = await authAPI.uploadAvatar(file);
      setEditForm((f: any) => ({ ...f, avatar: res.url }));
      toast.success('Photo uploaded');
    } catch (err: any) { toast.error(err.message); }
    finally { setAvatarUploading(false); e.target.value = ''; }
  };

  const handleIdChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdUploading(true);
    try {
      const res = await authAPI.uploadId(file);
      setEditForm((f: any) => ({ ...f, idDocument: res.url }));
      toast.success('ID document uploaded');
    } catch (err: any) { toast.error(err.message); }
    finally { setIdUploading(false); e.target.value = ''; }
  };

  const saveProfile = async () => {
    if (!editForm.name) { toast.error('Name is required'); return; }
    try {
      await authAPI.updateProfile(editForm);
      toast.success('Profile updated');
      await loadUser();
    } catch (err: any) { toast.error(err.message); }
  };

  const deleteMyData = async () => {
    try {
      await authAPI.deleteMyData();
      clearSearchHistory();
      setSavedCards([]);
      setDeleteConfirmOpen(false);
      toast.success('Saved cards removed and search history cleared');
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Saved cards ──
  const [newCard, setNewCard] = useState({ brand: 'Visa', last4: '', expiryMonth: '', expiryYear: '', cardholderName: '' });
  const addCard = async () => {
    if (!newCard.last4 || !/^\d{4}$/.test(newCard.last4) || !newCard.expiryMonth || !newCard.expiryYear || !newCard.cardholderName) {
      toast.error('Fill in all card fields (last 4 digits must be numeric)');
      return;
    }
    try {
      await savedCardAPI.create(newCard);
      const data = await savedCardAPI.getAll();
      setSavedCards(data.cards || []);
      setNewCard({ brand: 'Visa', last4: '', expiryMonth: '', expiryYear: '', cardholderName: '' });
      toast.success('Card saved');
    } catch (err: any) { toast.error(err.message); }
  };
  const removeCard = async (id: string) => {
    try {
      await savedCardAPI.delete(id);
      setSavedCards(prev => prev.filter(c => c._id !== id));
      toast.success('Card removed');
    } catch (err: any) { toast.error(err.message); }
  };

  const handleLogout = () => { logout(); router.push('/'); };
  const goTo = (tab: Tab) => { setActiveTab(tab); setMobileNavOpen(false); };

  const pageMeta: Record<Tab, { title: string; subtitle: string }> = {
    overview: { title: `Welcome back, ${user?.name?.split(' ')[0] || 'Guest'}`, subtitle: 'Here’s what’s happening with your stays.' },
    bookings: { title: 'Booking History', subtitle: 'View, modify, and download invoices for your stays.' },
    'view-profile': { title: 'Your Profile', subtitle: 'Your details, upcoming stays, and saved cards at a glance.' },
    'edit-profile': { title: 'Edit Profile', subtitle: 'Update your details, documents, and preferences.' },
  };

  // ── Bookings tab: filters ──
  const [bookingFilter, setBookingFilter] = useState<(typeof BOOKING_FILTERS)[number]>('all');
  const now = new Date(new Date().toDateString());
  const filteredHistory = bookings.filter(b => {
    if (bookingFilter === 'cancelled') return b.status === 'cancelled';
    if (bookingFilter === 'upcoming') return new Date(b.checkIn) >= now && b.status !== 'cancelled';
    if (bookingFilter === 'past') return new Date(b.checkOut) < now && b.status !== 'cancelled';
    return true;
  }).sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

  const canModify = (b: Booking) =>
    ['pending', 'confirmed'].includes(b.status) && new Date(b.checkIn).getTime() - Date.now() > RESCHEDULE_CUTOFF_MS;
  const canCancel = (b: Booking) =>
    ['pending', 'confirmed'].includes(b.status) && new Date(b.checkIn).getTime() - Date.now() > CANCEL_CUTOFF_MS;

  const downloadInvoice = async (b: Booking) => {
    try { await bookingAPI.downloadInvoice(b._id, b.bookingRef); }
    catch (err: any) { toast.error(err.message); }
  };

  // ── Cancel ──
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const submitCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) { toast.error('A reason is required'); return; }
    try {
      await bookingAPI.cancel(cancelTarget._id, cancelReason.trim());
      toast.success('Booking cancelled');
      setCancelTarget(null); setCancelReason('');
      reloadBookings();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Modify (reschedule) ──
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState<any>({});

  const openReschedule = (b: Booking) => {
    setRescheduleTarget(b);
    setRescheduleForm({
      roomId: b.roomId,
      checkIn: new Date(b.checkIn).toISOString().slice(0, 10),
      checkOut: new Date(b.checkOut).toISOString().slice(0, 10),
    });
  };
  const currentRoomForTarget = rescheduleTarget ? rooms.find((r: any) => r._id === rescheduleTarget.roomId) : null;
  const upgradeRooms = rooms.filter((r: any) =>
    rescheduleTarget && r.hotelId === rescheduleTarget.hotelId && r.status === 'available' &&
    (!currentRoomForTarget || r.price >= currentRoomForTarget.price)
  );
  const rescheduleEstimate = (() => {
    const room = rooms.find((r: any) => r._id === rescheduleForm.roomId) || currentRoomForTarget;
    return estimateStayTotal(room, rescheduleForm.checkIn, rescheduleForm.checkOut).total;
  })();

  const submitReschedule = async () => {
    if (!rescheduleTarget) return;
    try {
      await bookingAPI.reschedule(rescheduleTarget._id, rescheduleForm);
      toast.success('Booking updated');
      setRescheduleTarget(null);
      reloadBookings();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Rate & Review ──
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewForm, setReviewForm] = useState<{ rating: number; comment: string }>({ rating: 5, comment: '' });

  const openReview = (b: Booking) => {
    const existing = reviews.find(r => r.bookingId === b._id);
    setReviewTarget(b);
    setReviewForm({ rating: existing?.rating || 5, comment: existing?.comment || '' });
  };
  const submitReview = async () => {
    if (!reviewTarget) return;
    const existing = reviews.find(r => r.bookingId === reviewTarget._id);
    try {
      if (existing) {
        await reviewAPI.update(existing._id, reviewForm);
        toast.success('Review updated');
      } else {
        await reviewAPI.create({ bookingId: reviewTarget._id, ...reviewForm });
        toast.success('Review posted');
      }
      setReviewTarget(null);
      reloadReviews();
    } catch (err: any) { toast.error(err.message); }
  };
  const deleteReview = async () => {
    if (!reviewTarget) return;
    const existing = reviews.find(r => r.bookingId === reviewTarget._id);
    if (!existing) return;
    try {
      await reviewAPI.delete(existing._id);
      toast.success('Review deleted');
      setReviewTarget(null);
      reloadReviews();
    } catch (err: any) { toast.error(err.message); }
  };

  const loyaltyGradient: Record<string, string> = {
    none: 'from-gray-400 to-gray-500',
    bronze: 'from-amber-700 to-amber-800',
    silver: 'from-slate-400 to-slate-500',
    gold: 'from-amber-400 to-yellow-500',
    platinum: 'from-indigo-400 to-purple-500',
  };

  if (!user) return <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-[#faf9f6] lg:flex">
      {/* ══════════════ SIDEBAR (desktop) ══════════════ */}
      <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 border-r border-stone-200 bg-white sticky top-0 h-screen">
        <div className="p-6 border-b border-stone-100">
          <Link href="/" className="font-playfair text-xl font-bold text-gray-900">RS Galaxy</Link>
        </div>

        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img src={user.avatar} className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-100" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">{user.name[0]}</div>
            )}
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate flex items-center gap-1">
                {user.name}
                {user.isVIP && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              </p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => goTo(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === id ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-gray-600 hover:bg-stone-100'
              }`}>
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-stone-100 space-y-1">
          <Link href="/hotels" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-stone-100">
            <MapPin className="w-4.5 h-4.5" /> Explore Hotels
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50">
            <LogOut className="w-4.5 h-4.5" /> Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        {/* ══════════════ TOP BAR (mobile) ══════════════ */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-playfair text-lg font-bold text-gray-900">RS Galaxy</Link>
          <button onClick={() => setMobileNavOpen(v => !v)} className="p-2 rounded-lg bg-stone-100"><Menu className="w-5 h-5 text-gray-700" /></button>
        </div>
        {mobileNavOpen && (
          <div className="lg:hidden bg-white border-b border-stone-200 px-4 py-3 space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => goTo(id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  activeTab === id ? 'bg-amber-500 text-white' : 'text-gray-600 bg-stone-50'
                }`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 bg-red-50">
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        )}

        {/* ══════════════ HEADER ══════════════ */}
        <div className="bg-gradient-to-r from-stone-100 to-stone-50 border-b border-stone-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 lg:py-10">
            <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-gray-900">{pageMeta[activeTab].title}</h1>
            <p className="text-gray-500 text-sm mt-1">{pageMeta[activeTab].subtitle}</p>
          </div>
        </div>

        <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 lg:py-10">
          {/* ══════════════ OVERVIEW ══════════════ */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                {[
                  { label: 'Total Bookings', value: bookings.length, icon: Calendar, gradient: 'from-blue-400 to-blue-600' },
                  { label: 'Confirmed', value: confirmed, icon: CheckCircle, gradient: 'from-emerald-400 to-emerald-600' },
                  { label: 'Pending', value: pending, icon: Clock, gradient: 'from-amber-400 to-amber-600' },
                  { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, icon: CreditCard, gradient: 'from-purple-400 to-purple-600' },
                ].map(({ label, value, icon: Icon, gradient }) => (
                  <div key={label} className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-br ${gradient} shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 text-lg">Notifications</h2>
                  {unreadNotifications > 0 && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                      {unreadNotifications} unread
                    </span>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-sm text-gray-400">
                    No notifications yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map(notification => (
                      <div key={notification._id} className={`bg-white border rounded-2xl p-5 flex items-start gap-4 transition-shadow hover:shadow-md ${
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

              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900 text-lg">Recent Bookings</h2>
                {bookings.length > 0 && (
                  <button onClick={() => goTo('bookings')} className="text-xs font-bold text-amber-600 hover:text-amber-700">View all →</button>
                )}
              </div>
              {loading ? (
                <div className="text-center py-12 text-gray-400">Loading...</div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
                  <p className="text-4xl mb-4">📅</p>
                  <p className="text-gray-500">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.slice(0, 3).map(b => (
                    <div key={b._id} className="bg-white border border-stone-200 rounded-2xl p-5 flex justify-between items-center hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{b.hotelName}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${statusBadgeColor(b.status)}`}>{b.status}</span>
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
            </>
          )}

          {/* ══════════════ BOOKINGS (History & Management) ══════════════ */}
          {activeTab === 'bookings' && (
            <div>
              <div className="flex items-center gap-2 mb-6 flex-wrap">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mr-1"><Filter className="w-4 h-4 text-amber-500" /> Filter</div>
                {BOOKING_FILTERS.map(f => (
                  <button key={f} onClick={() => setBookingFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold capitalize border transition-all ${
                      bookingFilter === f ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-white border-stone-200 text-gray-600 hover:border-amber-300'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300">
                  <p className="text-4xl mb-4">📅</p>
                  <p className="text-gray-500">No bookings in this filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredHistory.map(b => {
                    const review = reviews.find(r => r.bookingId === b._id);
                    return (
                      <div key={b._id} className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900">{b.hotelName}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${statusBadgeColor(b.status)}`}>{b.status}</span>
                            </div>
                            <p className="text-xs text-gray-500">Room {b.roomNumber} ({b.roomType}) · {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-400 mt-1 font-mono">{b.bookingRef}</p>
                            {review && (
                              <div className="flex items-center gap-1 mt-2">
                                {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />)}
                              </div>
                            )}
                          </div>
                          <p className="text-xl font-bold text-amber-600">₹{b.totalPrice.toLocaleString()}</p>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-stone-100">
                          <button onClick={() => downloadInvoice(b)} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg">
                            <Download className="w-3.5 h-3.5" /> Invoice
                          </button>
                          {canModify(b) && (
                            <button onClick={() => openReschedule(b)} className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg">
                              <ArrowUpCircle className="w-3.5 h-3.5" /> Modify
                            </button>
                          )}
                          {canCancel(b) && (
                            <button onClick={() => { setCancelTarget(b); setCancelReason(''); }} className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg">
                              <X className="w-3.5 h-3.5" /> Cancel
                            </button>
                          )}
                          {b.status === 'checked-out' && (
                            <button onClick={() => openReview(b)} className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-lg">
                              <Star className="w-3.5 h-3.5" /> {review ? 'Edit Review' : 'Rate & Review'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════ VIEW PROFILE ══════════════ */}
          {activeTab === 'view-profile' && (
            <div className="space-y-8">
              <div className="relative bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500" />
                <div className="px-6 pb-6 -mt-10">
                  <div className="flex items-end justify-between flex-wrap gap-4">
                    <div className="flex items-end gap-4">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-lg" />
                      ) : (
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white shadow-lg">{user.name[0]}</div>
                      )}
                      <div className="pb-1">
                        <p className="font-playfair text-2xl font-bold text-gray-900 flex items-center gap-2">
                          {user.name}
                          {user.isVIP && <Crown className="w-5 h-5 text-amber-500" />}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
                      </div>
                    </div>
                    <div className={`text-right px-5 py-3 rounded-2xl bg-gradient-to-br ${loyaltyGradient[user.loyaltyTier || 'none']} text-white shadow-md`}>
                      <p className="text-[10px] uppercase tracking-widest opacity-80 flex items-center justify-end gap-1"><Award className="w-3 h-3" /> Loyalty</p>
                      <p className="font-playfair text-lg font-bold capitalize">{user.loyaltyTier && user.loyaltyTier !== 'none' ? user.loyaltyTier : 'Member'}</p>
                      <p className="text-xs opacity-90">{user.loyaltyPoints || 0} points</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 pt-5 border-t border-stone-100">
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="w-4 h-4 text-amber-500" /> {user.phone}</div>
                    )}
                    {user.dateOfBirth && (
                      <div className="flex items-center gap-2 text-sm text-gray-600"><Cake className="w-4 h-4 text-amber-500" /> {new Date(user.dateOfBirth).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-500" /> Upcoming Stays</h2>
                  {upcomingStays.length === 0 ? (
                    <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-sm text-gray-400">No upcoming stays.</div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingStays.map(b => (
                        <div key={b._id} className="bg-white border border-stone-200 rounded-2xl p-4 flex justify-between items-center hover:shadow-md transition-shadow">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{b.hotelName}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Room {b.roomNumber} · {new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</p>
                          </div>
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-green-50 text-green-600 capitalize">{b.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-500" /> Saved Cards</h2>
                  <div className="space-y-2 mb-4">
                    {savedCards.length === 0 ? (
                      <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center text-sm text-gray-400">No saved cards.</div>
                    ) : savedCards.map(c => (
                      <div key={c._id} className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"><CreditCard className="w-4 h-4 text-white" /></div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{c.brand} •••• {c.last4}</p>
                            <p className="text-xs text-gray-500">{c.cardholderName} · {String(c.expiryMonth).padStart(2, '0')}/{c.expiryYear}</p>
                          </div>
                        </div>
                        <button onClick={() => removeCard(c._id)} className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white border border-stone-200 rounded-2xl p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Add a card</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <select value={newCard.brand} onChange={e => setNewCard({ ...newCard, brand: e.target.value })}
                        className="bg-stone-50 border border-stone-200 px-2 py-2 rounded-lg text-sm col-span-2 sm:col-span-1">
                        {['Visa', 'Mastercard', 'Amex', 'RuPay'].map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                      <input value={newCard.last4} onChange={e => setNewCard({ ...newCard, last4: e.target.value })} placeholder="Last 4" maxLength={4}
                        className="bg-stone-50 border border-stone-200 px-2 py-2 rounded-lg text-sm" />
                      <input value={newCard.expiryMonth} onChange={e => setNewCard({ ...newCard, expiryMonth: e.target.value })} placeholder="MM" maxLength={2}
                        className="bg-stone-50 border border-stone-200 px-2 py-2 rounded-lg text-sm" />
                      <input value={newCard.expiryYear} onChange={e => setNewCard({ ...newCard, expiryYear: e.target.value })} placeholder="YYYY" maxLength={4}
                        className="bg-stone-50 border border-stone-200 px-2 py-2 rounded-lg text-sm" />
                      <input value={newCard.cardholderName} onChange={e => setNewCard({ ...newCard, cardholderName: e.target.value })} placeholder="Name on card"
                        className="bg-stone-50 border border-stone-200 px-2 py-2 rounded-lg text-sm col-span-2" />
                    </div>
                    <button onClick={addCard} className="w-full flex items-center justify-center gap-1.5 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg">
                      <Plus className="w-4 h-4" /> Add Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ EDIT PROFILE ══════════════ */}
          {activeTab === 'edit-profile' && (
            <div className="max-w-2xl space-y-6">
              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-900 mb-4">Profile Photo</p>
                <div className="flex items-center gap-5">
                  {editForm.avatar ? (
                    <div className="relative group">
                      <img src={editForm.avatar} className="w-20 h-20 rounded-2xl object-cover" />
                      <button onClick={() => setEditForm({ ...editForm, avatar: '' })} className="absolute -top-2 -right-2 bg-black/70 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400"><UserIcon className="w-7 h-7" /></div>
                  )}
                  <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" /> {avatarUploading ? 'Uploading…' : 'Upload Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                  </label>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                <p className="text-sm font-bold text-gray-900">Personal Details</p>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Full Name *</label>
                  <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-colors" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Phone</label>
                    <input value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Date of Birth</label>
                    <input type="date" value={editForm.dateOfBirth || ''} onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                      className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Preferences</label>
                  <textarea value={editForm.preferences || ''} onChange={e => setEditForm({ ...editForm, preferences: e.target.value })} rows={3}
                    placeholder="e.g. non-smoking room, extra pillows, early check-in"
                    className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:bg-white transition-colors resize-none" />
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-900 mb-4">ID Document</p>
                <div className="flex items-center gap-5">
                  {editForm.idDocument ? (
                    <img src={editForm.idDocument} className="w-20 h-20 rounded-xl object-cover" />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 text-xs">None</div>
                  )}
                  <label className="flex items-center gap-2 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 rounded-xl cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" /> {idUploading ? 'Uploading…' : 'Upload ID'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleIdChange} disabled={idUploading} />
                  </label>
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-2xl p-6">
                <p className="text-sm font-bold text-gray-900 mb-4">Notification Preferences</p>
                <div className="space-y-3">
                  <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer">
                    <span>Email notifications</span>
                    <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={editForm.notificationPrefs?.email !== false}
                      onChange={e => setEditForm({ ...editForm, notificationPrefs: { ...editForm.notificationPrefs, email: e.target.checked } })} />
                  </label>
                  <label className="flex items-center justify-between text-sm text-gray-700 cursor-pointer">
                    <span>Push notifications</span>
                    <input type="checkbox" className="w-4 h-4 accent-amber-500" checked={editForm.notificationPrefs?.push !== false}
                      onChange={e => setEditForm({ ...editForm, notificationPrefs: { ...editForm.notificationPrefs, push: e.target.checked } })} />
                  </label>
                </div>
              </div>

              <button onClick={saveProfile} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-amber-500/20 transition-colors">
                Save Changes
              </button>

              <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                <p className="text-sm font-bold text-red-700 mb-1 flex items-center gap-2"><ShieldOff className="w-4 h-4" /> Delete My Data</p>
                <p className="text-xs text-red-600/80 mb-4">Removes your saved cards and clears your local search history. Your account and booking history are not affected.</p>
                {!deleteConfirmOpen ? (
                  <button onClick={() => setDeleteConfirmOpen(true)} className="text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors">
                    Delete My Data
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirmOpen(false)} className="text-sm font-semibold text-gray-600 bg-white border border-stone-200 px-4 py-2.5 rounded-xl">Cancel</button>
                    <button onClick={deleteMyData} className="text-sm font-bold text-white bg-red-500 hover:bg-red-600 px-4 py-2.5 rounded-xl">Confirm Delete</button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CANCEL BOOKING MODAL */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-playfair text-xl font-bold text-gray-900 mb-1">Cancel Booking</h3>
            <p className="text-xs text-gray-500 mb-4">{cancelTarget.hotelName} · {cancelTarget.bookingRef}</p>
            <p className="text-xs text-gray-500 bg-stone-50 border border-stone-200 rounded-xl p-3 mb-4">
              Free cancellation up to 48 hours before check-in. If this booking was paid, it will be automatically refunded.
            </p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3} placeholder="Reason for cancellation..."
              className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-red-400 resize-none mb-4" />
            <div className="flex gap-2">
              <button onClick={() => setCancelTarget(null)} className="flex-1 text-sm font-semibold text-gray-600 bg-white border border-stone-200 py-3 rounded-xl">Keep Booking</button>
              <button onClick={submitCancel} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold text-sm">Cancel Booking</button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFY BOOKING MODAL */}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-playfair text-xl font-bold text-gray-900">Modify Booking</h3>
              <button onClick={() => setRescheduleTarget(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-stone-100"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">{rescheduleTarget.hotelName} · {rescheduleTarget.bookingRef}</p>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Check-in</label>
                  <input type="date" value={rescheduleForm.checkIn || ''} onChange={e => setRescheduleForm({ ...rescheduleForm, checkIn: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Check-out</label>
                  <input type="date" value={rescheduleForm.checkOut || ''} onChange={e => setRescheduleForm({ ...rescheduleForm, checkOut: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Room (upgrades only)</label>
                <select value={rescheduleForm.roomId || ''} onChange={e => setRescheduleForm({ ...rescheduleForm, roomId: e.target.value })}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400">
                  {upgradeRooms.map((r: any) => (
                    <option key={r._id} value={r._id}>#{r.roomNumber} {r.type} · ₹{Number(r.price).toLocaleString()}/night{r._id === rescheduleTarget.roomId ? ' (current)' : ''}</option>
                  ))}
                </select>
              </div>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Re-priced Total</p>
                  <p className="text-xs text-gray-500">Room rate × nights + 12% tax.</p>
                </div>
                <p className="text-lg font-bold text-amber-600">₹{rescheduleEstimate.toLocaleString()}</p>
              </div>
              <p className="text-xs text-gray-400">Changes are only allowed up to 24 hours before check-in and subject to room availability.</p>
              <button onClick={submitReschedule} className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold">
                Confirm Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RATE & REVIEW MODAL */}
      {reviewTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-playfair text-xl font-bold text-gray-900">Rate Your Stay</h3>
              <button onClick={() => setReviewTarget(null)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-stone-100"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-4">{reviewTarget.hotelName} · {reviewTarget.bookingRef}</p>

            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setReviewForm({ ...reviewForm, rating: n })}>
                  <Star className={`w-8 h-8 transition-colors ${n <= reviewForm.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
                </button>
              ))}
            </div>
            <textarea value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} rows={4}
              placeholder="Share your experience..."
              className="w-full bg-stone-50 border border-stone-200 px-3.5 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 resize-none mb-4" />

            <div className="flex gap-2">
              {reviews.some(r => r.bookingId === reviewTarget._id) && (
                <button onClick={deleteReview} className="flex-1 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 py-3 rounded-xl">Delete</button>
              )}
              <button onClick={submitReview} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-bold">
                {reviews.some(r => r.bookingId === reviewTarget._id) ? 'Save Changes' : 'Post Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
