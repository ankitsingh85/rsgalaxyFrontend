'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Hotel, Bed, Users, Calendar, MessageSquare,
  LogOut, Plus, Edit2, Trash2, X, Search, AlignJustify,
  TrendingUp, DollarSign, CheckCircle, Eye, ShieldCheck,
  Mail, Phone, Crown, UserX, UserCheck, KeyRound, Filter,
  TicketPercent, BarChart3, Power, Newspaper, Bell
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { hotelAPI, roomAPI, bookingAPI, userAPI, contactAPI, couponAPI, blogAPI, notificationAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import HotelsManager from '@/components/admin/HotelsManager';
import CustomersManager from '@/components/admin/CustomersManager';
import BlogsManager from '@/components/admin/BlogsManager';
import NotificationsManager from '@/components/admin/NotificationsManager';
import { Modal, Input, TextArea, Select } from '@/components/admin/FormControls';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hotels' | 'rooms' | 'bookings' | 'blogs' | 'notifications' | 'coupons' | 'admins' | 'managers' | 'users' | 'messages'
  >('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const [modal, setModal] = useState<'hotel' | 'room' | 'booking' | 'coupon' | 'manager' | 'admin' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [bookingView, setBookingView] = useState<'all' | 'manual' | 'update'>('all');
  const [bookingFilters, setBookingFilters] = useState({
    hotelId: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    paymentStatus: '',
  });

  useEffect(() => {
    if (!isAuthenticated) { router.push('/adminlogin'); return; }
    if (user && user.role !== 'admin') { router.push('/'); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router]);

  const loadAll = async () => {
    try {
      const [h, r, b, bl, nt, cp, u, c] = await Promise.all([
        hotelAPI.getAll(),
        roomAPI.getAll(),
        bookingAPI.getAll(),
        blogAPI.getAdminAll().catch(() => ({ blogs: [] })),
        notificationAPI.getAll().catch(() => ({ notifications: [] })),
        couponAPI.getAll().catch(() => ({ coupons: [] })),
        userAPI.getAll().catch(() => ({ users: [] })),
        contactAPI.getAll().catch(() => ({ contacts: [] })),
      ]);
      setHotels(h.hotels || []);
      setRooms(r.rooms || []);
      setBookings(b.bookings || []);
      setBlogs(bl.blogs || []);
      setNotifications(nt.notifications || []);
      setCoupons(cp.coupons || []);
      setUsers(u.users || []);
      setContacts(c.contacts || []);
    } catch (err: any) {
      toast.error('Failed to load data');
    }
  };

  if (!user || user.role !== 'admin') return null;

  // ── Stats ──
  const totalRevenue = bookings
    .filter((b: any) => b.paymentStatus === 'paid')
    .reduce((s: number, b: any) => s + b.totalPrice, 0);
  const availableRooms = rooms.filter((r: any) => r.status === 'available').length;
  const occupiedRooms = rooms.filter((r: any) => r.status === 'occupied').length;
  const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
  const admins = users.filter((u: any) => u.role === 'admin');
  const managers = users.filter((u: any) => u.role === 'manager');
  const customers = users.filter((u: any) => u.role === 'user');

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview', badge: null },
    { id: 'hotels', icon: Hotel, label: 'Hotels', badge: hotels.length },
    { id: 'rooms', icon: Bed, label: 'Rooms', badge: rooms.length },
    { id: 'bookings', icon: Calendar, label: 'Bookings', badge: bookings.length },
    { id: 'blogs', icon: Newspaper, label: 'Blogs', badge: blogs.filter((b: any) => b.status === 'published').length },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: notifications.filter((n: any) => !n.isRead).length },
    { id: 'coupons', icon: TicketPercent, label: 'Coupons', badge: coupons.filter((c: any) => c.isActive).length },
    { id: 'admins', icon: ShieldCheck, label: 'Admins', badge: admins.length, highlight: true },
    { id: 'managers', icon: Users, label: 'Managers', badge: managers.length },
    { id: 'users', icon: Users, label: 'Customers', badge: customers.length },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: contacts.length },
  ];

  // ── CRUD Handlers ──
  const handleSaveRoom = async () => {
    try {
      const data = {
        ...form,
        amenities: typeof form.amenities === 'string'
          ? form.amenities.split(',').map((a: string) => a.trim())
          : form.amenities,
        images: form.image ? [form.image] : [],
      };
      if (editingId) {
        await roomAPI.update(editingId, data);
        toast.success('Room updated');
      } else {
        await roomAPI.create(data);
        toast.success('Room created');
      }
      setModal(null); setEditingId(null); setForm({});
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    try { await roomAPI.delete(id); toast.success('Deleted'); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveManager = async () => {
    try {
      await userAPI.createManager(form);
      toast.success('Manager created');
      setModal(null); setForm({});
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSaveAdmin = async () => {
    try {
      if (!form.name || !form.email || !form.password) {
        toast.error('Please fill all required fields');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      await userAPI.createAdmin(form);
      toast.success('✨ New admin created successfully!');
      setModal(null); setForm({});
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteUser = async (id: string, role?: string) => {
    const msg = role === 'admin' ? 'Delete this admin?' : 'Delete this user?';
    if (!confirm(msg)) return;
    try { await userAPI.delete(id); toast.success('Deleted'); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleStatus = async (id: string) => {
    try { await userAPI.toggleStatus(id); toast.success('Status updated'); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const updateRoomStatus = async (id: string, status: string) => {
    try { await roomAPI.update(id, { status }); toast.success('Status updated'); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const updateBookingStatus = async (id: string, status: string) => {
    try { await bookingAPI.update(id, { status }); toast.success('Updated'); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const getRoomPriceTotal = (roomId: string, checkIn: string, checkOut: string) => {
    const room = rooms.find((r: any) => r._id === roomId);
    if (!room || !checkIn || !checkOut) return 0;
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    if (nights < 1) return 0;
    const subtotal = nights * Number(room.price || 0);
    return subtotal + Math.round(subtotal * 0.12);
  };

  const openCreateBooking = () => {
    setEditingId(null);
    setForm({
      userId: customers[0]?._id || '',
      hotelId: hotels[0]?._id || '',
      roomId: '',
      guests: 1,
      checkIn: '',
      checkOut: '',
      status: 'confirmed',
      paymentStatus: 'paid',
      specialRequests: '',
    });
    setModal('booking');
  };

  const openEditBooking = (booking: any) => {
    setEditingId(booking._id);
    setForm({
      userId: booking.userId || '',
      hotelId: booking.hotelId || '',
      roomId: booking.roomId || '',
      guests: booking.guests || 1,
      checkIn: booking.checkIn ? new Date(booking.checkIn).toISOString().slice(0, 10) : '',
      checkOut: booking.checkOut ? new Date(booking.checkOut).toISOString().slice(0, 10) : '',
      status: booking.status || 'confirmed',
      paymentStatus: booking.paymentStatus || 'paid',
      specialRequests: booking.specialRequests || '',
    });
    setBookingView('update');
    setModal('booking');
  };

  const handleSaveBooking = async () => {
    try {
      if (!form.userId || !form.roomId || !form.checkIn || !form.checkOut) {
        toast.error('Select customer, room, and dates');
        return;
      }

      const totalPrice = getRoomPriceTotal(form.roomId, form.checkIn, form.checkOut);
      if (!totalPrice) {
        toast.error('Please choose a valid date range');
        return;
      }

      const selectedRoom = rooms.find((r: any) => r._id === form.roomId);
      const payload = {
        userId: form.userId,
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests || 1),
        status: form.status,
        paymentStatus: form.paymentStatus,
        totalPrice,
        specialRequests: form.specialRequests,
        ...(selectedRoom ? {
          hotelId: selectedRoom.hotelId,
          hotelName: selectedRoom.hotelName,
          roomNumber: selectedRoom.roomNumber,
          roomType: selectedRoom.type,
        } : {}),
      };

      if (editingId) {
        await bookingAPI.update(editingId, payload);
        toast.success('Booking updated and re-priced');
      } else {
        await bookingAPI.create(payload);
        toast.success('Manual booking created');
      }
      setModal(null); setEditingId(null); setForm({});
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  // ── Filtered data ──
  const openCreateCoupon = () => {
    setEditingId(null);
    setForm({
      code: '',
      type: 'percent',
      value: 10,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil: '',
      minBookingAmount: 0,
      usageLimit: 100,
      isActive: true,
    });
    setModal('coupon');
  };

  const openEditCoupon = (coupon: any) => {
    setEditingId(coupon._id);
    setForm({
      code: coupon.code || '',
      type: coupon.type || 'percent',
      value: coupon.value || 0,
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 10) : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().slice(0, 10) : '',
      minBookingAmount: coupon.minBookingAmount || 0,
      usageLimit: coupon.usageLimit || 1,
      isActive: coupon.isActive,
    });
    setModal('coupon');
  };

  const handleSaveCoupon = async () => {
    try {
      if (!form.code || !form.validFrom || !form.validUntil) {
        toast.error('Code and validity dates are required');
        return;
      }

      const payload = {
        ...form,
        code: String(form.code).trim().toUpperCase(),
        value: Number(form.value || 0),
        minBookingAmount: Number(form.minBookingAmount || 0),
        usageLimit: Number(form.usageLimit || 1),
      };

      if (editingId) {
        await couponAPI.update(editingId, payload);
        toast.success('Coupon updated');
      } else {
        await couponAPI.create(payload);
        toast.success('Coupon created');
      }
      setModal(null); setEditingId(null); setForm({});
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const toggleCouponStatus = async (coupon: any) => {
    try {
      await couponAPI.update(coupon._id, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteCoupon = async (coupon: any) => {
    if (!confirm(`Deactivate coupon ${coupon.code}? Existing applied bookings will stay unchanged.`)) return;
    try {
      await couponAPI.delete(coupon._id);
      toast.success('Coupon deactivated');
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const filteredRooms = rooms.filter((r: any) =>
    !search || r.roomNumber.includes(search) || r.hotelName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBookings = bookings.filter((b: any) => {
    const matchesSearch = !search ||
      b.userName?.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
      b.bookingRef?.toLowerCase().includes(search.toLowerCase()) ||
      b.hotelName?.toLowerCase().includes(search.toLowerCase());
    const matchesHotel = !bookingFilters.hotelId || b.hotelId === bookingFilters.hotelId;
    const checkIn = b.checkIn ? new Date(b.checkIn) : null;
    const matchesFrom = !bookingFilters.dateFrom || (checkIn && checkIn >= new Date(bookingFilters.dateFrom));
    const matchesTo = !bookingFilters.dateTo || (checkIn && checkIn <= new Date(bookingFilters.dateTo));
    const matchesStatus = !bookingFilters.status || b.status === bookingFilters.status;
    const matchesPayment = !bookingFilters.paymentStatus || b.paymentStatus === bookingFilters.paymentStatus;
    return matchesSearch && matchesHotel && matchesFrom && matchesTo && matchesStatus && matchesPayment;
  });
  const bookingRooms = rooms.filter((r: any) => !form.hotelId || r.hotelId === form.hotelId);
  const bookingEstimate = getRoomPriceTotal(form.roomId, form.checkIn, form.checkOut);
  const filteredCoupons = coupons.filter((coupon: any) =>
    !search ||
    coupon.code?.toLowerCase().includes(search.toLowerCase()) ||
    coupon.type?.toLowerCase().includes(search.toLowerCase())
  );
  const activeCoupons = coupons.filter((coupon: any) => coupon.isActive).length;
  const totalCouponUses = coupons.reduce((sum: number, coupon: any) => sum + (coupon.analytics?.usageCount || coupon.usedCount || 0), 0);
  const totalCouponImpact = coupons.reduce((sum: number, coupon: any) => sum + (coupon.analytics?.revenueImpact || coupon.revenueImpact || 0), 0);
  const avgRedemptionRate = coupons.length
    ? Math.round(coupons.reduce((sum: number, coupon: any) => sum + (coupon.analytics?.redemptionRate || 0), 0) / coupons.length)
    : 0;
  const filteredAdmins = admins.filter((a: any) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-950 flex pt-20 -mt-20">

      {/* ── SIDEBAR ── */}
      <aside className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="font-playfair text-xl font-bold text-amber-400">RS Galaxy</Link>
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-lg font-bold border border-red-500/20">Admin</span>
          </div>
          <div className="flex items-center gap-3 p-2.5 bg-gray-800 rounded-xl">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ id, icon: Icon, label, badge, highlight }) => (
            <button key={id} onClick={() => { setActiveTab(id as any); setSidebarOpen(false); }}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : highlight
                    ? 'text-red-400 hover:bg-red-500/10 border border-red-500/10'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <span className="flex items-center gap-3">
                <Icon className="w-4 h-4" /> {label}
              </span>
              {badge !== null && badge > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === id ? 'bg-amber-500/30 text-amber-300' :
                  highlight ? 'bg-red-500/20 text-red-300' :
                  'bg-gray-800 text-gray-400'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link href="/admin/profile" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-amber-400">
            <KeyRound className="w-4 h-4" /> Change Password
          </Link>
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white">
            <Eye className="w-4 h-4" /> View Website
          </Link>
          <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400">
            <AlignJustify className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-white capitalize text-lg flex-1">
            {activeTab === 'overview' ? 'Dashboard Overview' : activeTab}
          </h1>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500 w-56" />
          </div>
        </div>

        <div className="p-6">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'from-amber-500 to-amber-600' },
                  { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'from-blue-500 to-blue-600' },
                  { label: 'Occupancy Rate', value: `${occupancyRate}%`, icon: TrendingUp, color: 'from-green-500 to-green-600' },
                  { label: 'Total Customers', value: customers.length, icon: Users, color: 'from-purple-500 to-purple-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5 hover:border-red-500/40 transition-all cursor-pointer" onClick={() => setActiveTab('admins')}>
                  <ShieldCheck className="w-8 h-8 text-red-400 mb-2" />
                  <p className="text-sm text-gray-400 mb-1">Admins</p>
                  <p className="text-3xl font-bold text-white">{admins.length}</p>
                  <p className="text-xs text-red-400 mt-1 font-medium">Manage admins →</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-sm text-gray-400 mb-1">Hotels</p>
                  <p className="text-3xl font-bold text-white">{hotels.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{hotels.filter((h: any) => h.status === 'active').length} active</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-sm text-gray-400 mb-1">Rooms</p>
                  <p className="text-3xl font-bold text-white">{rooms.length}</p>
                  <p className="text-xs text-green-400 mt-1">{availableRooms} available</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <p className="text-sm text-gray-400 mb-1">Managers</p>
                  <p className="text-3xl font-bold text-white">{managers.length}</p>
                  <p className="text-xs text-gray-500 mt-1">active managers</p>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Recent Bookings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-800">
                      {['Guest', 'Hotel', 'Room', 'Check-in', 'Amount', 'Status'].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {bookings.slice(0, 5).map((b: any) => (
                        <tr key={b._id} className="border-b border-gray-800/50">
                          <td className="py-3 px-3 text-white">{b.userName}</td>
                          <td className="py-3 px-3 text-gray-400 truncate max-w-[100px]">{b.hotelName}</td>
                          <td className="py-3 px-3 text-gray-400">#{b.roomNumber}</td>
                          <td className="py-3 px-3 text-gray-400">{new Date(b.checkIn).toLocaleDateString()}</td>
                          <td className="py-3 px-3 text-amber-400 font-bold">₹{b.totalPrice.toLocaleString()}</td>
                          <td className="py-3 px-3"><span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ADMINS TAB */}
          {activeTab === 'admins' && (
            <>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-6 h-6 text-red-400" />
                    <h2 className="text-2xl font-bold text-white">Admin Management ({admins.length})</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Manage system administrators with full access</p>
                </div>
                <button
                  onClick={() => { setForm({}); setModal('admin'); }}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-lg shadow-red-500/20"
                >
                  <Plus className="w-4 h-4" /> Create New Admin
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-300 font-semibold text-sm">⚠️ Important</p>
                  <p className="text-amber-200/80 text-xs mt-1">
                    Admins have <strong>full access</strong> to manage everything. Only create admins for trusted personnel.
                    You cannot delete yourself or the last remaining admin.
                  </p>
                </div>
              </div>

              {filteredAdmins.length === 0 ? (
                <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                  <ShieldCheck className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">No admins found</p>
                  <button onClick={() => { setForm({}); setModal('admin'); }}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create First Admin
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredAdmins.map((admin: any) => (
                    <div key={admin._id}
                      className={`bg-gray-900 border rounded-2xl p-5 hover:border-red-500/40 transition-all relative ${
                        admin._id === user.id ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-gray-800'
                      }`}>

                      {admin._id === user.id && (
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                          You
                        </span>
                      )}

                      <div className="flex items-start gap-3 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-red-500/30 flex-shrink-0">
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <h3 className="font-bold text-white truncate">{admin.name}</h3>
                          </div>
                          <span className="inline-block text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                            Administrator
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Mail className="w-3.5 h-3.5 text-gray-500" />
                          <span className="truncate">{admin.email}</span>
                        </div>
                        {admin.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Phone className="w-3.5 h-3.5 text-gray-500" />
                            <span>{admin.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar className="w-3.5 h-3.5 text-gray-500" />
                          <span>Joined {new Date(admin.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-4 pt-3 border-t border-gray-800">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 ${
                          admin.isActive
                            ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                          {admin.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        {admin._id !== user.id ? (
                          <>
                            <button
                              onClick={() => handleToggleStatus(admin._id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                admin.isActive
                                  ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'
                                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                              }`}>
                              {admin.isActive ? <><UserX className="w-3.5 h-3.5" /> Deactivate</> : <><UserCheck className="w-3.5 h-3.5" /> Activate</>}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(admin._id, 'admin')}
                              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full text-center py-2 bg-amber-500/5 border border-amber-500/20 rounded-lg text-xs text-amber-400 font-medium">
                            Current User Account
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* HOTELS */}
          {activeTab === 'hotels' && (
            <HotelsManager hotels={hotels} onReload={loadAll} />
          )}

          {/* BLOGS */}
          {activeTab === 'blogs' && (
            <BlogsManager blogs={blogs} onReload={loadAll} />
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationsManager notifications={notifications} users={users} hotels={hotels} onReload={loadAll} />
          )}

          {/* ROOMS */}
          {activeTab === 'rooms' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Rooms ({rooms.length})</h2>
                  <p className="text-gray-400 text-sm">{availableRooms} available</p>
                </div>
                <button onClick={() => { setEditingId(null); setForm({ status: 'available', type: 'standard', capacity: 2, floor: 1, size: 30 }); setModal('room'); }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
                  <Plus className="w-4 h-4" /> Add Room
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                    {['Room', 'Hotel', 'Type', 'Price', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredRooms.map((room: any) => (
                      <tr key={room._id} className="border-b border-gray-800/50">
                        <td className="py-3 px-4 text-white font-medium">#{room.roomNumber}</td>
                        <td className="py-3 px-4 text-gray-400 max-w-[150px] truncate">{room.hotelName}</td>
                        <td className="py-3 px-4"><span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full capitalize">{room.type}</span></td>
                        <td className="py-3 px-4 text-amber-400 font-bold">₹{room.price.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <select value={room.status} onChange={e => updateRoomStatus(room._id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded-full bg-transparent border outline-none cursor-pointer ${
                              room.status === 'available' ? 'border-green-500/30 text-green-400' :
                              room.status === 'occupied' ? 'border-red-500/30 text-red-400' :
                              'border-yellow-500/30 text-yellow-400'
                            }`}>
                            <option value="available">Available</option>
                            <option value="occupied">Occupied</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1.5">
                            <button onClick={() => { setEditingId(room._id); setForm({ ...room, amenities: room.amenities.join(', '), image: room.images?.[0] || '' }); setModal('room'); }}
                              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={() => handleDeleteRoom(room._id)} className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Booking Management ({filteredBookings.length})</h2>
                  <p className="text-gray-400 text-sm">View all reservations, create manual bookings, and update stays.</p>
                </div>
                <button onClick={() => { setBookingView('manual'); openCreateBooking(); }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
                  <Plus className="w-4 h-4" /> Manual Booking
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  ['all', 'View All Bookings'],
                  ['manual', 'Manual Booking'],
                  ['update', 'Update Booking'],
                ].map(([id, label]) => (
                  <button key={id} onClick={() => {
                    setBookingView(id as any);
                    if (id === 'manual') openCreateBooking();
                  }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      bookingView === id
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-gray-900 text-gray-400 border-gray-800 hover:text-white'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>

              {bookingView === 'update' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-5 flex items-start gap-3">
                  <Edit2 className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-100/90">
                    Choose a booking from the list to modify check-in/out, assigned room, guest count, status, and payment. Price is recalculated from the selected room and dates.
                  </p>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                  <Filter className="w-4 h-4 text-amber-400" /> Advanced Filters
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
                  <select value={bookingFilters.hotelId} onChange={e => setBookingFilters({ ...bookingFilters, hotelId: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                    <option value="">All hotels</option>
                    {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
                  </select>
                  <input type="date" value={bookingFilters.dateFrom} onChange={e => setBookingFilters({ ...bookingFilters, dateFrom: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500" />
                  <input type="date" value={bookingFilters.dateTo} onChange={e => setBookingFilters({ ...bookingFilters, dateTo: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500" />
                  <select value={bookingFilters.status} onChange={e => setBookingFilters({ ...bookingFilters, status: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                    <option value="">All statuses</option>
                    {['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={bookingFilters.paymentStatus} onChange={e => setBookingFilters({ ...bookingFilters, paymentStatus: e.target.value })}
                    className="bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:border-amber-500">
                    <option value="">All payments</option>
                    {['pending', 'paid', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                    {['Ref', 'Guest', 'Hotel', 'Dates', 'Guests', 'Amount', 'Status', 'Payment', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredBookings.map((b: any) => (
                      <tr key={b._id} className="border-b border-gray-800/50">
                        <td className="py-3 px-4 text-xs text-gray-500 font-mono">{b.bookingRef}</td>
                        <td className="py-3 px-4 text-white">{b.userName}<br /><span className="text-xs text-gray-500">{b.userEmail}</span></td>
                        <td className="py-3 px-4 text-gray-400 max-w-[120px] truncate">{b.hotelName}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">{new Date(b.checkIn).toLocaleDateString()}<br />{new Date(b.checkOut).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-gray-300">{b.guests}</td>
                        <td className="py-3 px-4 text-amber-400 font-bold">₹{b.totalPrice.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <select value={b.status} onChange={e => updateBookingStatus(b._id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full bg-transparent border border-green-500/30 text-green-400 outline-none">
                            {['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${b.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.paymentStatus}</span></td>
                        <td className="py-3 px-4">
                          <button onClick={() => openEditBooking(b)}
                            className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* COUPONS */}
          {activeTab === 'coupons' && (
            <>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TicketPercent className="w-6 h-6 text-amber-400" />
                    <h2 className="text-2xl font-bold text-white">Coupons ({coupons.length})</h2>
                  </div>
                  <p className="text-gray-400 text-sm">Create codes, track redemption, edit validity, and deactivate instantly.</p>
                </div>
                <button onClick={openCreateCoupon}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
                  <Plus className="w-4 h-4" /> Create Coupon
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Active Coupons', value: activeCoupons, icon: TicketPercent, color: 'from-amber-500 to-amber-600' },
                  { label: 'Total Uses', value: totalCouponUses, icon: CheckCircle, color: 'from-green-500 to-green-600' },
                  { label: 'Avg Redemption', value: `${avgRedemptionRate}%`, icon: BarChart3, color: 'from-blue-500 to-blue-600' },
                  { label: 'Revenue Impact', value: `₹${totalCouponImpact.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className={`w-11 h-11 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                    {['Code', 'Discount', 'Validity', 'Min Booking', 'Usage', 'Analytics', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredCoupons.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-gray-500">No coupons found</td>
                      </tr>
                    ) : (
                      filteredCoupons.map((coupon: any) => {
                        const analytics = coupon.analytics || {};
                        const usage = analytics.usageCount ?? coupon.usedCount ?? 0;
                        const limit = analytics.usageLimit ?? coupon.usageLimit ?? 0;
                        return (
                          <tr key={coupon._id} className="border-b border-gray-800/50">
                            <td className="py-3 px-4">
                              <p className="font-mono font-bold text-white">{coupon.code}</p>
                              <p className="text-xs text-gray-500">Created {new Date(coupon.createdAt).toLocaleDateString()}</p>
                            </td>
                            <td className="py-3 px-4 text-amber-400 font-bold">
                              {coupon.type === 'percent' ? `${coupon.value}%` : `₹${Number(coupon.value || 0).toLocaleString()}`}
                              <span className="block text-xs text-gray-500 font-normal capitalize">{coupon.type}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                              {new Date(coupon.validFrom).toLocaleDateString()}<br />{new Date(coupon.validUntil).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-gray-300">₹{Number(coupon.minBookingAmount || 0).toLocaleString()}</td>
                            <td className="py-3 px-4 text-gray-300">{usage} / {limit}</td>
                            <td className="py-3 px-4">
                              <p className="text-blue-400 font-semibold">{analytics.redemptionRate || 0}% redeemed</p>
                              <p className="text-xs text-gray-500">Impact ₹{Number(analytics.revenueImpact || coupon.revenueImpact || 0).toLocaleString()}</p>
                            </td>
                            <td className="py-3 px-4">
                              <button onClick={() => toggleCouponStatus(coupon)}
                                className={`text-xs px-2 py-1 rounded-full border ${
                                  coupon.isActive
                                    ? 'border-green-500/30 text-green-400 bg-green-500/10'
                                    : 'border-red-500/30 text-red-400 bg-red-500/10'
                                }`}>
                                {coupon.isActive ? 'active' : 'inactive'}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-1.5">
                                <button onClick={() => openEditCoupon(coupon)}
                                  className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-amber-400 rounded-lg">
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => handleDeleteCoupon(coupon)}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg">
                                  <Power className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* MANAGERS */}
          {activeTab === 'managers' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Managers ({managers.length})</h2>
                </div>
                <button onClick={() => { setForm({}); setModal('manager'); }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
                  <Plus className="w-4 h-4" /> Add Manager
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {managers.map((mgr: any) => {
                  const hotel = hotels.find((h: any) => h._id === mgr.managedHotelId);
                  return (
                    <div key={mgr._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">{mgr.name[0]}</div>
                        <div><h3 className="font-bold text-white">{mgr.name}</h3><p className="text-sm text-gray-400">{mgr.email}</p></div>
                      </div>
                      {hotel && (
                        <div className="bg-gray-800 rounded-xl p-3 mb-4">
                          <p className="text-xs text-gray-500 mb-1">Managing</p>
                          <p className="text-sm font-medium text-white flex items-center gap-1"><Hotel className="w-3.5 h-3.5 text-amber-400" />{hotel.name}</p>
                        </div>
                      )}
                      <button onClick={() => handleDeleteUser(mgr._id)} className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-xs">
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* CUSTOMERS */}
          {activeTab === 'users' && (
            <CustomersManager customers={customers} bookings={bookings} onReload={loadAll} />
          )}

          {/* MESSAGES */}
          {activeTab === 'messages' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Contact Messages ({contacts.length})</h2>
              {contacts.length === 0 ? (
                <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800"><MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" /><p className="text-gray-400">No messages yet</p></div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((msg: any) => (
                    <div key={msg._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-2">
                        <div><h3 className="font-bold text-white">{msg.name}</h3><p className="text-xs text-gray-400">{msg.email}</p></div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${msg.status === 'unread' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-500/10 text-gray-400'}`}>{msg.status}</span>
                      </div>
                      <p className="text-white font-medium text-sm mt-2">{msg.subject}</p>
                      <p className="text-gray-400 text-sm mt-1">{msg.message}</p>
                      <p className="text-xs text-gray-600 mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ROOM MODAL */}
      {modal === 'room' && (
        <Modal
          title={editingId ? 'Edit Room' : 'Add Room'}
          onClose={() => { setModal(null); setEditingId(null); setForm({}); }}
          onSave={handleSaveRoom}
        >
          <Select
            label="Hotel *"
            value={form.hotelId || ''}
            onChange={(v: string) => setForm({ ...form, hotelId: v })}
            options={hotels.map((h: any) => ({ label: h.name, value: h._id }))}
          />
          <div className="grid grid-cols-2 gap-3">
            {([
              ['roomNumber', 'Room Number', 'text'],
              ['price', 'Price (₹)', 'number'],
              ['capacity', 'Capacity', 'number'],
              ['size', 'Size (m²)', 'number'],
              ['floor', 'Floor', 'number'],
            ] as const).map(([key, label, type]) => (
              <Input
                key={key}
                label={label}
                value={form[key] || ''}
                onChange={(v: string) => setForm({ ...form, [key]: type === 'number' ? Number(v) : v })}
                type={type}
              />
            ))}
            <Select
              label="Type"
              value={form.type || 'standard'}
              onChange={(v: string) => setForm({ ...form, type: v })}
              options={['standard', 'deluxe', 'suite', 'presidential']}
            />
          </div>
          <TextArea
            label="Description"
            value={form.description || ''}
            onChange={(v: string) => setForm({ ...form, description: v })}
          />
          <Input
            label="Amenities (comma-separated)"
            value={form.amenities || ''}
            onChange={(v: string) => setForm({ ...form, amenities: v })}
          />
          <Input
            label="Image URL"
            value={form.image || ''}
            onChange={(v: string) => setForm({ ...form, image: v })}
            type="url"
          />
          <Select
            label="Status"
            value={form.status || 'available'}
            onChange={(v: string) => setForm({ ...form, status: v })}
            options={['available', 'occupied', 'maintenance']}
          />
        </Modal>
      )}

      {/* BOOKING MODAL */}
      {modal === 'booking' && (
        <Modal
          title={editingId ? 'Update Booking' : 'Manual Booking'}
          onClose={() => { setModal(null); setEditingId(null); setForm({}); }}
          onSave={handleSaveBooking}
        >
          <Select
            label="Customer *"
            value={form.userId || ''}
            onChange={(v: string) => setForm({ ...form, userId: v })}
            options={[
              { label: '-- Select customer --', value: '' },
              ...customers.map((c: any) => ({ label: `${c.name} (${c.email})`, value: c._id })),
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Hotel *"
              value={form.hotelId || ''}
              onChange={(v: string) => setForm({ ...form, hotelId: v, roomId: '' })}
              options={[
                { label: '-- Select hotel --', value: '' },
                ...hotels.map((h: any) => ({ label: h.name, value: h._id })),
              ]}
            />
            <Select
              label="Room *"
              value={form.roomId || ''}
              onChange={(v: string) => setForm({ ...form, roomId: v })}
              options={[
                { label: '-- Select room --', value: '' },
                ...bookingRooms
                  .filter((r: any) => editingId || r.status === 'available' || r._id === form.roomId)
                  .map((r: any) => ({
                    label: `#${r.roomNumber} ${r.type} - ₹${Number(r.price || 0).toLocaleString()}/night`,
                    value: r._id,
                  })),
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Check-in *"
              value={form.checkIn || ''}
              onChange={(v: string) => setForm({ ...form, checkIn: v })}
              type="date"
            />
            <Input
              label="Check-out *"
              value={form.checkOut || ''}
              onChange={(v: string) => setForm({ ...form, checkOut: v })}
              type="date"
            />
            <Input
              label="Guests *"
              value={form.guests || 1}
              onChange={(v: string) => setForm({ ...form, guests: Number(v) })}
              type="number"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Booking Status"
              value={form.status || 'confirmed'}
              onChange={(v: string) => setForm({ ...form, status: v })}
              options={['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled']}
            />
            <Select
              label="Payment Status"
              value={form.paymentStatus || 'paid'}
              onChange={(v: string) => setForm({ ...form, paymentStatus: v })}
              options={['pending', 'paid', 'refunded']}
            />
          </div>
          <TextArea
            label="Special Requests"
            value={form.specialRequests || ''}
            onChange={(v: string) => setForm({ ...form, specialRequests: v })}
          />
          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Re-priced Total</p>
              <p className="text-xs text-gray-400">Calculated from room rate, nights, and 12% tax.</p>
            </div>
            <p className="text-xl font-bold text-amber-400">₹{bookingEstimate.toLocaleString()}</p>
          </div>
        </Modal>
      )}

      {/* COUPON MODAL */}
      {modal === 'coupon' && (
        <Modal
          title={editingId ? 'Edit Coupon' : 'Create Coupon'}
          onClose={() => { setModal(null); setEditingId(null); setForm({}); }}
          onSave={handleSaveCoupon}
        >
          <Input
            label="Coupon Code *"
            value={form.code || ''}
            onChange={(v: string) => setForm({ ...form, code: v.toUpperCase() })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Discount Type"
              value={form.type || 'percent'}
              onChange={(v: string) => setForm({ ...form, type: v })}
              options={[
                { label: 'Percentage (%)', value: 'percent' },
                { label: 'Flat Amount', value: 'flat' },
              ]}
            />
            <Input
              label={form.type === 'flat' ? 'Value (₹)' : 'Value (%)'}
              value={form.value || ''}
              onChange={(v: string) => setForm({ ...form, value: Number(v) })}
              type="number"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Valid From *"
              value={form.validFrom || ''}
              onChange={(v: string) => setForm({ ...form, validFrom: v })}
              type="date"
            />
            <Input
              label="Valid Until *"
              value={form.validUntil || ''}
              onChange={(v: string) => setForm({ ...form, validUntil: v })}
              type="date"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Min Booking Amount (₹)"
              value={form.minBookingAmount || 0}
              onChange={(v: string) => setForm({ ...form, minBookingAmount: Number(v) })}
              type="number"
            />
            <Input
              label="Usage Limit"
              value={form.usageLimit || 1}
              onChange={(v: string) => setForm({ ...form, usageLimit: Number(v) })}
              type="number"
            />
          </div>
          <Select
            label="Status"
            value={form.isActive ? 'active' : 'inactive'}
            onChange={(v: string) => setForm({ ...form, isActive: v === 'active' })}
            options={[
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />
          <div className="bg-gray-800/70 border border-gray-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-white mb-1">Delete behavior</p>
            <p className="text-xs text-gray-400">Deleting a coupon deactivates it immediately. Existing bookings that already used it remain unchanged.</p>
          </div>
        </Modal>
      )}

      {/* MANAGER MODAL */}
      {modal === 'manager' && (
        <Modal
          title="Add Manager"
          onClose={() => { setModal(null); setForm({}); }}
          onSave={handleSaveManager}
        >
          {([
            ['name', 'Full Name *', 'text'],
            ['email', 'Email *', 'email'],
            ['phone', 'Phone', 'tel'],
            ['password', 'Password *', 'text'],
          ] as const).map(([key, label, type]) => (
            <Input
              key={key}
              label={label}
              value={form[key] || ''}
              onChange={(v: string) => setForm({ ...form, [key]: v })}
              type={type}
            />
          ))}
          <Select
            label="Assign Hotel"
            value={form.managedHotelId || ''}
            onChange={(v: string) => setForm({ ...form, managedHotelId: v })}
            options={[{ label: '-- None --', value: '' }, ...hotels.map((h: any) => ({ label: h.name, value: h._id }))]}
          />
        </Modal>
      )}

      {/* ADMIN MODAL */}
      {modal === 'admin' && (
        <AdminModal
          onClose={() => { setModal(null); setForm({}); }}
          onSave={handleSaveAdmin}
          form={form}
          setForm={setForm}
        />
      )}
    </div>
  );
}

// ─── ADMIN MODAL ───
interface AdminModalProps {
  onClose: () => void;
  onSave: () => void;
  form: any;
  setForm: (f: any) => void;
}

function AdminModal({ onClose, onSave, form, setForm }: AdminModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-red-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl shadow-red-500/10">

        <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border-b border-red-500/20 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Admin</h2>
                <p className="text-xs text-red-300/80 mt-0.5">Full system access</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-amber-500/10 border-b border-amber-500/20 p-4 flex items-start gap-2">
          <Crown className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90">
            Admins can manage all hotels, rooms, bookings, users, and other admins. Only grant this role to trusted personnel.
          </p>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name *</label>
            <input
              type="text"
              value={form.name || ''}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 text-white px-4 py-3 rounded-xl text-sm outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={form.email || ''}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="admin@rsgalaxy.com"
                className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 text-white pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="tel"
                value={form.phone || ''}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 text-white pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Password *</label>
            <input
              type="text"
              value={form.password || ''}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Minimum 6 characters"
              className="w-full bg-gray-800 border border-gray-700 focus:border-red-500 text-white px-4 py-3 rounded-xl text-sm outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">💡 They can change this password after first login</p>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-800 bg-gray-900/50">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-3 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
          >
            <ShieldCheck className="w-4 h-4" /> Create Admin
          </button>
        </div>
      </div>
    </div>
  );
}
