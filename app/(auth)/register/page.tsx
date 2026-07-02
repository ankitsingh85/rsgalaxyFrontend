'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, AlertCircle, CheckCircle, Gift } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [agree, setAgree] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agree) { setError('Please agree to the Terms of Service'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/19041828/pexels-photo-19041828.jpeg?w=1200" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-amber-900/40" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full text-white">
          <Link href="/" className="font-playfair text-2xl font-bold text-amber-400">RS GALAXY</Link>
          <div>
            <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-2 rounded-full text-sm mb-6">
              <Gift className="w-4 h-4" /> Free — No credit card required
            </div>
            <h2 className="font-playfair text-6xl font-bold mb-5">Begin Your<br /><span className="text-amber-400">Luxury</span> Journey</h2>
            <p className="text-gray-300 mb-8">Join 10,000+ travelers enjoying exclusive rates and seamless booking.</p>
            {['Exclusive member discounts up to 35%', 'Instant booking confirmation', 'Early access to flash sales', '24/7 priority support'].map(t => (
              <div key={t} className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
          <div />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 mb-8">Join RS Galaxy and unlock exclusive benefits.</p>

          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            {[
              { name: 'name', label: 'Full Name', icon: User, type: 'text', required: true },
              { name: 'email', label: 'Email', icon: Mail, type: 'email', required: true },
              { name: 'phone', label: 'Phone Number', icon: Phone, type: 'tel', required: false },
            ].map(({ name, label, icon: Icon, type, required }) => (
              <div key={name}>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{label}{required && ' *'}</label>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type={type} required={required} value={(form as any)[name]}
                    onChange={e => setForm({ ...form, [name]: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </div>
              </div>
            ))}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input type={showPass ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 pl-11 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                <input type={showPass ? 'text' : 'password'} required value={form.confirmPassword}
                  onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 accent-amber-500" />
              <span className="text-sm text-gray-500">I agree to the <span className="text-amber-600 font-semibold">Terms of Service</span> and <span className="text-amber-600 font-semibold">Privacy Policy</span></span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200">
              {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account? <Link href="/login" className="text-amber-600 hover:text-amber-700 font-bold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}