'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, Shield, Star, Zap } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      if (user.role !== 'user') {
        useAuthStore.getState().logout();
        setError('This login is for customers only. Please use the admin or manager login page.');
        return;
      }
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/261101/pexels-photo-261101.jpeg?w=1200" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-amber-900/40" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full text-white">
          <Link href="/" className="font-playfair text-2xl font-bold text-amber-400">RS GALAXY</Link>
          <div>
            <h2 className="font-playfair text-6xl font-bold mb-5">Welcome<br />Back to<br /><span className="text-amber-400">Luxury</span></h2>
            <p className="text-gray-300 mb-8">Sign in to access your reservations, profile, and exclusive offers.</p>
            <div className="space-y-3">
              {[
                { icon: Shield, text: 'JWT-secured authentication' },
                { icon: Zap,    text: 'Instant booking confirmation' },
                { icon: Star,   text: '4.9★ rated by 10,000+ guests' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                  <Icon className="w-5 h-5 text-amber-400" />
                  <span className="text-sm">{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">Sign In</h1>
            <p className="text-gray-500">Welcome back! Enter your credentials.</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-11 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
{/* Add this BEFORE the Sign In button */}
<div className="flex items-center justify-end mb-4">
  <Link href="/forgot-password" className="text-sm font-semibold text-amber-600 hover:text-amber-700">
    Forgot password?
  </Link>
</div>
            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200">
              {loading ? 'Signing in...' : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-8">
            Don't have an account? <Link href="/register" className="text-amber-600 hover:text-amber-700 font-bold">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}