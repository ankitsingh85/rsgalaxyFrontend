'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Lock, Eye, EyeOff, Save, AlertCircle, CheckCircle,
  Shield, User, Mail, Phone, KeyRound
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isAuthenticated || !user) {
    if (typeof window !== 'undefined') router.push('/adminlogin');
    return null;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setSuccess(true);
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-20 -mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* Back Link */}
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-amber-400 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-3xl flex items-center justify-center text-white font-bold text-4xl mx-auto mb-4 shadow-2xl shadow-red-500/30">
                {user.name.charAt(0)}
              </div>
              <h3 className="font-bold text-white text-xl mb-1">{user.name}</h3>
              <p className="text-sm text-gray-400 mb-3">{user.email}</p>
              <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold">
                <Shield className="w-3 h-3" /> Administrator
              </span>

              <div className="mt-6 pt-6 border-t border-gray-800 space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <User className="w-4 h-4 text-amber-400" /> {user.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Mail className="w-4 h-4 text-amber-400" /> {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Phone className="w-4 h-4 text-amber-400" /> {user.phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                <div className="w-12 h-12 bg-amber-500/15 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-playfair text-2xl font-bold text-white">Change Password</h2>
                  <p className="text-sm text-gray-400">Update your account password</p>
                </div>
              </div>

              {success && (
                <div className="mb-5 flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-xl">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Password changed successfully! Confirmation email sent.</span>
                </div>
              )}

              {error && (
                <div className="mb-5 flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Current Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input type={showCurrent ? 'text' : 'password'} required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full bg-gray-800 border border-gray-700 text-white pl-11 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">New Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input type={showNew ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters" minLength={6}
                      className="w-full bg-gray-800 border border-gray-700 text-white pl-11 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-500" />
                    <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Confirm New Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                    <input type={showNew ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className={`w-full bg-gray-800 border text-white pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-gray-700 focus:border-amber-500'
                      }`} />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-400 text-xs mt-1.5">⚠️ Passwords don't match</p>
                  )}
                </div>

                {/* Security tips */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Security Tips
                  </p>
                  <ul className="text-xs text-amber-300/90 space-y-1">
                    <li>✓ Use at least 8 characters with mixed case</li>
                    <li>✓ Include numbers and symbols</li>
                    <li>✓ Don't reuse passwords from other accounts</li>
                    <li>✓ You'll receive a confirmation email</li>
                  </ul>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:from-gray-700 disabled:to-gray-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20">
                  {loading ? 'Updating...' : <><Save className="w-4 h-4" /> Update Password</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}