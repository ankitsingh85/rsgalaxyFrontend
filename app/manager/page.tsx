'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Hotel, Bed, Calendar, LogOut,
  Search, Eye, TrendingUp, DollarSign, CheckCircle, Users, Star, MapPin,
  UtensilsCrossed, Sparkles, UserCog, TicketPercent, Newspaper, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { hotelAPI, bookingAPI, menuItemAPI, orderAPI, userAPI, couponAPI, notificationAPI, blogAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import RoomsManager from '@/components/admin/RoomsManager';
import RestaurantManager from '@/components/admin/RestaurantManager';
import AmenitiesManager from '@/components/admin/AmenitiesManager';
import StaffManager from '@/components/admin/StaffManager';
import CustomersManager from '@/components/admin/CustomersManager';
import CouponsManager from '@/components/admin/CouponsManager';
import NotificationsManager from '@/components/admin/NotificationsManager';
import BlogsManager from '@/components/admin/BlogsManager';
import type { ManagerPermissions } from '@/types';

type ManagerTab = 'overview' | 'hotel' | 'rooms' | 'bookings' | 'restaurant' | 'amenities' | 'staff' | 'customers' | 'coupons' | 'notifications' | 'blogs';

// Always-visible tabs (no permission key) plus one entry per permission module —
// gated purely on 'view' so a manager only ever sees what they've been granted.
const MODULE_NAV: { id: ManagerTab; icon: any; label: string; permKey?: keyof ManagerPermissions }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
  { id: 'hotel', icon: Hotel, label: 'My Hotel' },
  { id: 'rooms', icon: Bed, label: 'Rooms', permKey: 'rooms' },
  { id: 'bookings', icon: Calendar, label: 'Bookings', permKey: 'bookings' },
  { id: 'restaurant', icon: UtensilsCrossed, label: 'Restaurant', permKey: 'restaurant' },
  { id: 'amenities', icon: Sparkles, label: 'Amenities', permKey: 'amenities' },
  { id: 'staff', icon: UserCog, label: 'Staff', permKey: 'staff' },
  { id: 'customers', icon: Users, label: 'Customers', permKey: 'customers' },
  { id: 'coupons', icon: TicketPercent, label: 'Coupons', permKey: 'coupons' },
  { id: 'notifications', icon: Bell, label: 'Notifications', permKey: 'notifications' },
  { id: 'blogs', icon: Newspaper, label: 'Blogs', permKey: 'blogs' },
];

export default function ManagerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ManagerTab>('overview');
  const [search, setSearch] = useState('');

  const [myHotel, setMyHotel] = useState<any>(null);
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    // The login response only returns a trimmed user object (no `permissions`) —
    // refresh from /auth/me once on mount so the full profile (with permissions) loads.
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/managerlogin'); return; }
    if (user && user.role !== 'manager') { router.push('/'); return; }
    if (user) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, router]);

  const loadAll = async () => {
    try {
      const tasks: Promise<any>[] = [];

      if (user?.managedHotelId) {
        tasks.push(hotelAPI.getOne(user.managedHotelId).then(h => { setMyHotel(h.hotel); setMyRooms(h.rooms || []); }));
      }
      tasks.push(bookingAPI.getAll().then(b => setMyBookings(b.bookings || [])).catch(() => {}));

      const perms = user?.permissions;
      if (perms?.restaurant?.view) {
        tasks.push(menuItemAPI.getAll().then(d => setMenuItems(d.menuItems || [])).catch(() => {}));
        tasks.push(orderAPI.getAll().then(d => setOrders(d.orders || [])).catch(() => {}));
      }
      if (perms?.customers?.view) {
        tasks.push(userAPI.getAll().then(d => setCustomers((d.users || []).filter((u: any) => u.role === 'user'))).catch(() => {}));
      }
      if (perms?.coupons?.view) {
        tasks.push(couponAPI.getAll().then(d => setCoupons(d.coupons || [])).catch(() => {}));
      }
      if (perms?.notifications?.view) {
        tasks.push(notificationAPI.getAll().then(d => setNotifications(d.notifications || [])).catch(() => {}));
      }
      if (perms?.blogs?.view) {
        tasks.push(blogAPI.getAdminAll().then(d => setBlogs(d.blogs || [])).catch(() => {}));
      }

      await Promise.all(tasks);
    } catch (err: any) { toast.error('Failed to load'); }
  };

  if (!user || user.role !== 'manager') return null;

  const revenue = myBookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalPrice, 0);
  const availableRooms = myRooms.filter(r => r.status === 'available').length;
  const occupancyRate = myRooms.length > 0 ? Math.round(((myRooms.length - availableRooms) / myRooms.length) * 100) : 0;
  const myHotelList = myHotel ? [myHotel] : [];

  const navItems = MODULE_NAV.filter(m => !m.permKey || user.permissions?.[m.permKey]?.view);

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
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
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
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex overflow-x-auto">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs shrink-0 px-2 ${activeTab === id ? 'text-amber-400' : 'text-gray-500'}`}>
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
            <RoomsManager hotels={myHotelList} rooms={myRooms} onReload={loadAll} />
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

          {/* RESTAURANT */}
          {activeTab === 'restaurant' && (
            <RestaurantManager hotels={myHotelList} menuItems={menuItems} orders={orders} onReload={loadAll} />
          )}

          {/* AMENITIES & BILLING */}
          {activeTab === 'amenities' && (
            <AmenitiesManager hotels={myHotelList} bookings={myBookings} />
          )}

          {/* STAFF */}
          {activeTab === 'staff' && (
            <StaffManager hotels={myHotelList} />
          )}

          {/* CUSTOMERS */}
          {activeTab === 'customers' && (
            <CustomersManager customers={customers} bookings={myBookings} hotels={myHotelList} onReload={loadAll} />
          )}

          {/* COUPONS */}
          {activeTab === 'coupons' && (
            <CouponsManager coupons={coupons} onReload={loadAll} />
          )}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationsManager notifications={notifications} users={customers} hotels={myHotelList} onReload={loadAll} />
          )}

          {/* BLOGS */}
          {activeTab === 'blogs' && (
            <BlogsManager blogs={blogs} onReload={loadAll} />
          )}
        </div>
      </div>

    </div>
  );
}
