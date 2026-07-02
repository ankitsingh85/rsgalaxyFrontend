'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail, Lock, ArrowRight, ArrowLeft, AlertCircle, CheckCircle,
  Shield, Clock, KeyRound, Eye, EyeOff
} from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1=email, 2=OTP, 3=new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Step 1 — Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep(2);
      startCountdown();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — Verify OTP
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.verifyOTP(email, otpString);
      toast.success('OTP verified!');
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — Reset password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const otpString = otp.join('');
      const data = await authAPI.resetPassword(email, otpString, newPassword);

      // Auto-login after reset
      Cookies.set('rs_token', data.token, { expires: 7 });

      toast.success('Password reset successfully! Logging you in...');
      setTimeout(() => {
        const role = data.user.role;
        if (role === 'admin') router.push('/admin');
        else if (role === 'manager') router.push('/manager');
        else router.push('/dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP countdown
  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toast.success('New OTP sent!');
      setOtp(['', '', '', '', '', '']);
      startCountdown();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // last char only
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="https://images.pexels.com/photos/19041828/pexels-photo-19041828.jpeg?w=1200" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 to-amber-900/40" />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full text-white">
          <Link href="/" className="font-playfair text-2xl font-bold text-amber-400">RS GALAXY</Link>
          <div>
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-400/30 rounded-2xl flex items-center justify-center mb-6">
              <KeyRound className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="font-playfair text-5xl font-bold mb-5">Forgot Your<br /><span className="text-amber-400">Password?</span></h2>
            <p className="text-gray-300 mb-8">No worries! We'll send you a secure OTP to reset it in 3 easy steps.</p>
            <div className="space-y-3">
              {[
                { num: '1', text: 'Enter your registered email', active: step >= 1 },
                { num: '2', text: 'Verify 6-digit OTP from email', active: step >= 2 },
                { num: '3', text: 'Create your new password', active: step >= 3 },
              ].map(({ num, text, active }) => (
                <div key={num} className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                  active ? 'bg-amber-500/20 border border-amber-400/40' : 'bg-white/5 border border-white/10'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    active ? 'bg-amber-500 text-white' : 'bg-white/10 text-gray-400'
                  }`}>
                    {step > Number(num) ? <CheckCircle className="w-4 h-4" /> : num}
                  </div>
                  <span className={`text-sm ${active ? 'text-white font-medium' : 'text-gray-400'}`}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div />
        </div>
      </div>

      {/* Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Back link */}
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-amber-600 mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Step {step} of 3</span>
              <span className="text-xs font-bold text-amber-600">{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {/* ════ STEP 1: EMAIL ════ */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-500 mb-8">Enter your email and we'll send you a 6-digit verification code.</p>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200">
                {loading ? 'Sending OTP...' : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
              </button>

              <p className="text-center text-gray-500 text-sm mt-8">
                Remember your password? <Link href="/login" className="text-amber-600 hover:text-amber-700 font-bold">Sign in</Link>
              </p>
            </form>
          )}

          {/* ════ STEP 2: VERIFY OTP ════ */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">Verify OTP</h1>
              <p className="text-gray-500 mb-2">We sent a 6-digit code to</p>
              <p className="text-amber-600 font-bold mb-8">{email}</p>

              {/* OTP boxes */}
              <div className="flex gap-2 sm:gap-3 mb-6 justify-center">
                {otp.map((digit, idx) => (
                  <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric"
                    maxLength={1} value={digit}
                    onChange={e => handleOTPChange(idx, e.target.value)}
                    onKeyDown={e => handleOTPKeyDown(idx, e)}
                    onPaste={handleOTPPaste}
                    className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-gray-900" />
                ))}
              </div>

              {/* Timer / Resend */}
              <div className="flex items-center justify-center gap-2 text-sm mb-6">
                <Clock className="w-4 h-4 text-gray-400" />
                {countdown > 0 ? (
                  <span className="text-gray-500">Resend OTP in <strong className="text-amber-600">{countdown}s</strong></span>
                ) : (
                  <button type="button" onClick={handleResendOTP} className="text-amber-600 hover:text-amber-700 font-bold">
                    🔄 Resend OTP
                  </button>
                )}
              </div>

              <button type="submit" disabled={loading || otp.join('').length !== 6}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
                {loading ? 'Verifying...' : <>Verify OTP <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button type="button" onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); }}
                className="w-full mt-3 text-sm text-gray-500 hover:text-amber-600">
                ← Use different email
              </button>
            </form>
          )}

          {/* ════ STEP 3: NEW PASSWORD ════ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <h1 className="font-playfair text-4xl font-bold text-gray-900 mb-2">New Password</h1>
              <p className="text-gray-500 mb-8">Create a strong password for your account</p>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type={showPass ? 'text' : 'password'} required value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters" minLength={6}
                    className="w-full bg-gray-50 border border-gray-200 pl-11 pr-12 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
                  <input type={showPass ? 'text' : 'password'} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className="w-full bg-gray-50 border border-gray-200 pl-11 pr-4 py-3.5 rounded-xl text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100" />
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords don't match
                  </p>
                )}
              </div>

              {/* Password strength */}
              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Password Requirements
                </p>
                <ul className="text-xs space-y-1 text-amber-800">
                  <li className={newPassword.length >= 6 ? 'opacity-100' : 'opacity-50'}>
                    {newPassword.length >= 6 ? '✅' : '⭕'} At least 6 characters
                  </li>
                  <li className={newPassword === confirmPassword && newPassword ? 'opacity-100' : 'opacity-50'}>
                    {newPassword === confirmPassword && newPassword ? '✅' : '⭕'} Passwords match
                  </li>
                </ul>
              </div>

              <button type="submit" disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200">
                {loading ? 'Resetting...' : <>Reset Password & Login <CheckCircle className="w-4 h-4" /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}