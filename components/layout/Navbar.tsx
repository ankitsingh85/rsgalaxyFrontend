'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard, User, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, loadUser } = useAuthStore();
  const [mobile, setMobile] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    loadUser();
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [loadUser]);

  const dashboard = user?.role === 'admin' ? '/admin' : user?.role === 'manager' ? '/manager' : '/dashboard';

  // ── ALL 6 NAV LINKS ──
  const links = [
    { label: 'Home',      href: '/' },
    { label: 'Hotels',    href: '/hotels' },
    { label: 'Rooms',     href: '/room' },
    { label: 'Restaurant', href: '/restaurant' },
    { label: 'Amenities', href: '/amenities' },
    { label: 'Blogs',     href: '/blogs' },
    { label: 'Offers',    href: '/offers' },
    { label: 'Contact',   href: '/contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all ${
      scrolled ? 'bg-white/98 backdrop-blur shadow-md' : 'bg-white border-b border-amber-100/60'
    }`}>
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center">
            <img
              src="/logo.png"
              alt="RS Galaxy Hotel"
              className="h-16 w-auto object-contain"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  (l.href === '/' ? pathname === '/' : pathname.startsWith(l.href))
                    ? 'text-amber-700 bg-amber-50'
                    : 'text-gray-600 hover:text-amber-700 hover:bg-amber-50/60'
                }`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && user ? (
              <div className="relative">
                <button onClick={() => setMenu(!menu)} className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl">
                  <div className="w-7 h-7 bg-amber-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">{user.name[0]}</div>
                  <span className="hidden sm:block text-sm font-semibold text-gray-700">{user.name.split(' ')[0]}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${menu ? 'rotate-180' : ''}`} />
                </button>
                {menu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-amber-100 rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                      <p className="font-bold text-sm text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button onClick={() => { router.push(dashboard); setMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50">
                      <LayoutDashboard className="w-4 h-4 text-amber-500" /> Dashboard
                    </button>
                    {user.role === 'user' && (
                      <button onClick={() => { router.push('/dashboard'); setMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-amber-50">
                        <User className="w-4 h-4 text-blue-500" /> My Profile
                      </button>
                    )}
                    <button onClick={() => { logout(); router.push('/'); setMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 border-t border-amber-50">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-amber-700 px-4 py-2">Sign In</Link>
                <Link href="/register" className="text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl shadow-md">Book Now</Link>
              </>
            )}
            <button onClick={() => setMobile(!mobile)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              {mobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobile && (
        <div className="lg:hidden bg-white border-t border-amber-100 px-4 py-4 space-y-1">
          {links.map(l => (
            <Link key={l.href} href={l.href} className="block px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-amber-50">{l.label}</Link>
          ))}
        </div>
      )}
    </nav>
  );
}
