'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Hotel, Bed, Users, Calendar, MessageSquare,
  LogOut, Plus, Edit2, Trash2, X, Search, AlignJustify,
  TrendingUp, DollarSign, CheckCircle, Eye, ShieldCheck,
  Mail, Phone, Crown, UserX, UserCheck, KeyRound
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { hotelAPI, roomAPI, bookingAPI, userAPI, contactAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import HotelsManager from '@/components/admin/HotelsManager';
import CustomersManager from '@/components/admin/CustomersManager';
import { Modal, Input, TextArea, Select } from '@/components/admin/FormControls';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'hotels' | 'rooms' | 'bookings' | 'admins' | 'managers' | 'users' | 'messages'
  >('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [hotels, setHotels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const [modal, setModal] = useState<'hotel' | 'room' | 'manager' | 'admin' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!isAuthenticated) { router.push('/adminlogin'); return; }
    if (user && user.role !== 'admin') { router.push('/'); return; }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router]);

  const loadAll = async () => {
    try {
      const [h, r, b, u, c] = await Promise.all([
        hotelAPI.getAll(),
        roomAPI.getAll(),
        bookingAPI.getAll(),
        userAPI.getAll().catch(() => ({ users: [] })),
        contactAPI.getAll().catch(() => ({ contacts: [] })),
      ]);
      setHotels(h.hotels || []);
      setRooms(r.rooms || []);
      setBookings(b.bookings || []);
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

  // ── Filtered data ──
  const filteredRooms = rooms.filter((r: any) =>
    !search || r.roomNumber.includes(search) || r.hotelName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredBookings = bookings.filter((b: any) =>
    !search || b.userName.toLowerCase().includes(search.toLowerCase())
  );
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
              <h2 className="text-2xl font-bold text-white mb-6">Bookings ({bookings.length})</h2>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-800 bg-gray-800/50">
                    {['Ref', 'Guest', 'Hotel', 'Dates', 'Amount', 'Status', 'Payment'].map(h => (
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
                        <td className="py-3 px-4 text-amber-400 font-bold">₹{b.totalPrice.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <select value={b.status} onChange={e => updateBookingStatus(b._id, e.target.value)}
                            className="text-xs px-2 py-1 rounded-full bg-transparent border border-green-500/30 text-green-400 outline-none">
                            {['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'].map(s => <option key={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${b.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{b.paymentStatus}</span></td>
                      </tr>
                    ))}
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