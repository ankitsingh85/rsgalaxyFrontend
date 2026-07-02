'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Hotel, Bed, Calendar, LogOut, Plus, Edit2, Trash2,
  X, Save, Search, Eye, TrendingUp, DollarSign, CheckCircle, Users, Star, MapPin
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { hotelAPI, roomAPI, bookingAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'hotel' | 'rooms' | 'bookings'>('overview');
  const [search, setSearch] = useState('');

  const [myHotel, setMyHotel] = useState<any>(null);
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);

  const [modal, setModal] = useState<'room' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (!isAuthenticated) { router.push('/managerlogin'); return; }
    if (user && user.role !== 'manager') { router.push('/'); return; }
    if (user) loadAll();
  }, [isAuthenticated, user, router]);

  const loadAll = async () => {
    try {
      if (user?.managedHotelId) {
        const h = await hotelAPI.getOne(user.managedHotelId);
        setMyHotel(h.hotel);
        setMyRooms(h.rooms || []);
      }
      const b = await bookingAPI.getAll();
      setMyBookings(b.bookings || []);
    } catch (err: any) { toast.error('Failed to load'); }
  };

  if (!user || user.role !== 'manager') return null;

  const revenue = myBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalPrice, 0);
  const availableRooms = myRooms.filter(r => r.status === 'available').length;
  const occupancyRate = myRooms.length > 0 ? Math.round(((myRooms.length - availableRooms) / myRooms.length) * 100) : 0;

  const handleSaveRoom = async () => {
    try {
      const data = {
        ...form,
        hotelId: myHotel._id,
        amenities: typeof form.amenities === 'string' ? form.amenities.split(',').map((a: string) => a.trim()) : form.amenities,
        images: form.image ? [form.image] : [],
      };
      if (editingId) await roomAPI.update(editingId, data);
      else await roomAPI.create(data);
      toast.success(editingId ? 'Room updated' : 'Room created');
      setModal(null); setEditingId(null); setForm({});
      loadAll();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    try { await roomAPI.delete(id); toast.success('Deleted'); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const updateRoomStatus = async (id: string, status: string) => {
    try { await roomAPI.update(id, { status }); loadAll(); } catch (err: any) { toast.error(err.message); }
  };

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
    { id: 'hotel',    icon: Hotel,           label: 'My Hotel' },
    { id: 'rooms',    icon: Bed,             label: 'Rooms' },
    { id: 'bookings', icon: Calendar,        label: 'Bookings' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex pt-20 -mt-20">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 border-r border-gray-800 fixed left-0 top-0 bottom-0">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="font-playfair text-xl font-bold text-amber-400">RS Galaxy</Link>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg font-bold border border-blue-500/20">Manager</span>
          </div>
          <div className="flex items-center gap-3 p-2.5 bg-gray-800 rounded-xl">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{user.name[0]}</div>
            <div><p className="text-sm font-bold text-white">{user.name}</p><p className="text-xs text-gray-400">Hotel Manager</p></div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id as any)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                activeTab === id ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-1">
          <Link href="/" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white">
            <Eye className="w-4 h-4" /> View Website
          </Link>
          <button onClick={() => { logout(); router.push('/'); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex flex-col items-center py-3 text-xs ${activeTab === id ? 'text-amber-400' : 'text-gray-500'}`}>
            <Icon className="w-5 h-5 mb-1" />{label}
          </button>
        ))}
      </div>

      {/* Main */}
      <div className="flex-1 lg:ml-64 overflow-auto pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur border-b border-gray-800 px-6 py-3 flex items-center gap-4">
          <h1 className="font-bold text-white text-lg capitalize flex-1">
            {activeTab === 'overview' ? 'Manager Dashboard' : activeTab}
          </h1>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="bg-gray-800 border border-gray-700 text-white pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-amber-500 w-48" />
          </div>
        </div>

        <div className="p-6">

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              <h2 className="font-playfair text-2xl font-bold text-white mb-1">Welcome, {user.name.split(' ')[0]}!</h2>
              {myHotel && <p className="text-gray-400 text-sm mb-6">Managing: <span className="text-amber-400 font-bold">{myHotel.name}</span></p>}
              {!myHotel && <p className="text-gray-500 text-sm mb-6">⚠️ No hotel assigned yet. Contact admin.</p>}

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Rooms',  value: myRooms.length, icon: Bed, color: 'from-blue-500 to-blue-600' },
                  { label: 'Available',    value: availableRooms, icon: CheckCircle, color: 'from-green-500 to-green-600' },
                  { label: 'Occupancy',    value: `${occupancyRate}%`, icon: TrendingUp, color: 'from-amber-500 to-amber-600' },
                  { label: 'Revenue',      value: `₹${revenue.toLocaleString()}`, icon: DollarSign, color: 'from-purple-500 to-purple-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-gray-400">{label}</p>
                  </div>
                ))}
              </div>

              {myHotel && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-6">
                  <div className="relative h-40">
                    <img src={myHotel.images?.[0] || myHotel.image} alt={myHotel.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <h3 className="font-playfair text-xl font-bold text-white">{myHotel.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />{myHotel.city}, {myHotel.country}
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 ml-2" />{myHotel.rating}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4">Recent Bookings</h3>
                {myBookings.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">No bookings yet</p>
                ) : (
                  <div className="space-y-3">
                    {myBookings.slice(0, 5).map(b => (
                      <div key={b._id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                        <div>
                          <p className="text-white text-sm font-medium">{b.userName}</p>
                          <p className="text-xs text-gray-400">Room #{b.roomNumber} · {new Date(b.checkIn).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-amber-400 font-bold text-sm">₹{b.totalPrice.toLocaleString()}</p>
                          <span className={`text-xs ${b.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>{b.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* MY HOTEL */}
          {activeTab === 'hotel' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">My Hotel</h2>
              {!myHotel ? (
                <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                  <Hotel className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No hotel assigned to you yet. Please contact the admin.</p>
                </div>
              ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="relative h-56">
                    <img src={myHotel.images?.[0] || myHotel.image} alt={myHotel.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-playfair text-2xl font-bold text-white">{myHotel.name}</h3>
                    <p className="flex items-center gap-1 text-gray-400 mb-3"><MapPin className="w-4 h-4 text-amber-400" />{myHotel.location}, {myHotel.city}</p>
                    <p className="text-gray-300 text-sm mb-4">{myHotel.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {myHotel.amenities.map((a: string) => (
                        <span key={a} className="text-xs bg-gray-800 text-gray-400 px-2.5 py-1 rounded-full">{a}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800 text-center">
                      <div><p className="text-xl font-bold text-white">{myRooms.length}</p><p className="text-xs text-gray-400">Total</p></div>
                      <div><p className="text-xl font-bold text-green-400">{availableRooms}</p><p className="text-xs text-gray-400">Available</p></div>
                      <div><p className="text-xl font-bold text-amber-400">{occupancyRate}%</p><p className="text-xs text-gray-400">Occupancy</p></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ROOMS */}
          {activeTab === 'rooms' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">Rooms ({myRooms.length})</h2>
                  <p className="text-gray-400 text-sm">{availableRooms} available</p>
                </div>
                <button onClick={() => { setEditingId(null); setForm({ type: 'standard', status: 'available', capacity: 2, floor: 1, size: 30 }); setModal('room'); }}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold">
                  <Plus className="w-4 h-4" /> Add Room
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {myRooms.map(room => (
                  <div key={room._id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="relative h-40">
                      <img src={room.images?.[0] || 'https://images.pexels.com/photos/3688261/pexels-photo-3688261.jpeg?w=400'} alt="" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full capitalize">{room.type}</div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between mb-2">
                        <h3 className="font-bold text-white">Room {room.roomNumber}</h3>
                        <span className="text-amber-400 font-bold">₹{room.price.toLocaleString()}<span className="text-xs text-gray-500">/night</span></span>
                      </div>
                      <div className="flex gap-3 text-xs text-gray-400 mb-3">
                        <span><Users className="w-3 h-3 inline" /> {room.capacity}</span>
                        <span>{room.size}m²</span>
                        <span>Floor {room.floor}</span>
                      </div>
                      <select value={room.status} onChange={e => updateRoomStatus(room._id, e.target.value)}
                        className={`w-full mb-3 text-xs px-3 py-2 rounded-lg border bg-gray-800 outline-none ${
                          room.status === 'available' ? 'border-green-500/30 text-green-400' :
                          room.status === 'occupied'  ? 'border-red-500/30 text-red-400' :
                          'border-yellow-500/30 text-yellow-400'
                        }`}>
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingId(room._id); setForm({ ...room, amenities: room.amenities.join(', '), image: room.images?.[0] || '' }); setModal('room'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-xs">
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button onClick={() => handleDeleteRoom(room._id)} className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* BOOKINGS */}
          {activeTab === 'bookings' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-6">Hotel Bookings ({myBookings.length})</h2>
              {myBookings.length === 0 ? (
                <div className="text-center py-20 bg-gray-900 rounded-2xl border border-gray-800">
                  <Calendar className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400">No bookings yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.map(b => (
                    <div key={b._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-white">{b.userName}</h3>
                        <p className="text-sm text-gray-400">{b.userEmail}</p>
                        <div className="flex gap-3 text-xs text-gray-400 mt-2">
                          <span>Room #{b.roomNumber}</span>
                          <span>·</span>
                          <span>{new Date(b.checkIn).toLocaleDateString()} → {new Date(b.checkOut).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-amber-400">₹{b.totalPrice.toLocaleString()}</p>
                        <span className={`text-xs ${b.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Room Modal */}
      {modal === 'room' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">{editingId ? 'Edit Room' : 'Add Room'}</h2>
              <button onClick={() => { setModal(null); setEditingId(null); setForm({}); }} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['roomNumber', 'Room Number', 'text'], ['price', 'Price (₹)', 'number'],
                  ['capacity', 'Capacity', 'number'], ['size', 'Size (m²)', 'number'],
                  ['floor', 'Floor', 'number'],
                ].map(([key, label, type]) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
                    <input type={type} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: type === 'number' ? Number(e.target.value) : e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                  <select value={form.type || 'standard'} onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500">
                    {['standard', 'deluxe', 'suite', 'presidential'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Amenities (comma-separated)</label>
                <input type="text" value={form.amenities || ''} onChange={e => setForm({ ...form, amenities: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Image URL</label>
                <input type="url" value={form.image || ''} onChange={e => setForm({ ...form, image: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Status</label>
                <select value={form.status || 'available'} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 text-white px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:border-amber-500">
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-800">
              <button onClick={() => { setModal(null); setEditingId(null); setForm({}); }} className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 py-3 rounded-xl font-semibold">Cancel</button>
              <button onClick={handleSaveRoom} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}