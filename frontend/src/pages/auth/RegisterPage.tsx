/**
 * Register Page — professional split-screen design with Google OAuth
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleOAuthButton } from '../../components/auth/GoogleOAuthButton';
import { apiClient } from '../../services/api';

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'Number', ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : 'bg-slate-200'}`} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score <= 2 ? 'text-yellow-500' : 'text-emerald-600'}`}>
          {labels[score]}
        </span>
        <div className="flex gap-3">
          {checks.map(c => (
            <span key={c.label} className={`text-[10px] ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
              {c.ok ? '✓' : '·'} {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
    role: 'EMPLOYEE' as const,  // always Employee — role assigned by admin
  });
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword]  = useState(false);
  const [showConfirm, setShowConfirm]    = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
    if (errors[name]) setErrors(p => { const n = { ...p }; delete n[name]; return n; });
    if (generalError) setGeneralError('');
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
    if (!formData.password) e.password = 'Password is required';
    else if (formData.password.length < 8) e.password = 'At least 8 characters required';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password))
      e.password = 'Must include uppercase, lowercase and a number';
    if (!formData.password_confirm) e.password_confirm = 'Please confirm your password';
    else if (formData.password !== formData.password_confirm) e.password_confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setGeneralError('');
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (error: any) {
      if (error.errors) setErrors(error.errors);
      else setGeneralError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setGeneralError('');
    try {
      const response = await apiClient.post<{
        access: string;
        refresh: string;
        user: { id: string; email: string; role: string };
      }>('/auth/google/', { credential });
      
      // Store tokens
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      // Navigate to dashboard
      navigate('/dashboard');
      window.location.reload(); // Refresh to update auth context
    } catch (error: any) {
      setGeneralError(error.message || 'Google sign-up failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGeneralError('Google sign-up was cancelled or failed.');
  };

  const EyeIcon = ({ show }: { show: boolean }) => show ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel — brand ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 rounded-full bg-indigo-500/10" />
        <div className="absolute bottom-[-40px] left-[-40px] w-48 h-48 rounded-full bg-purple-500/10" />

        <div className="relative text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">FaceAttend</h1>
          <p className="text-slate-400 text-sm mb-10 max-w-xs leading-relaxed">
            Set up your account and start marking attendance with your face in seconds
          </p>

          {/* Steps */}
          <div className="space-y-5 text-left max-w-xs mx-auto">
            {[
              { n: '1', title: 'Create account', desc: 'Register with your work email' },
              { n: '2', title: 'Register your face', desc: 'Capture your face via webcam' },
              { n: '3', title: 'Mark attendance', desc: 'Check in/out with a glance' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-4">
                <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {s.n}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{s.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-800">FaceAttend</span>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl font-bold text-slate-800">Create your account</h2>
            <p className="text-slate-500 text-sm mt-1">Fill in the details below to get started</p>
          </div>

          {/* General error */}
          {generalError && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{generalError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={formData.email} onChange={handleChange} disabled={isLoading}
                  placeholder="you@company.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors
                    ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={formData.password}
                  onChange={handleChange} disabled={isLoading}
                  placeholder="Create a strong password"
                  className={`w-full pl-10 pr-11 py-3 border rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors
                    ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-slate-300'}`}
                />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  <EyeIcon show={showPassword} />
                </button>
              </div>
              {errors.password
                ? <p className="mt-1.5 text-xs text-red-600">{errors.password}</p>
                : <PasswordStrength password={formData.password} />
              }
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="password_confirm" className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  id="password_confirm" name="password_confirm"
                  type={showConfirm ? 'text' : 'password'} autoComplete="new-password"
                  value={formData.password_confirm} onChange={handleChange} disabled={isLoading}
                  placeholder="Re-enter your password"
                  className={`w-full pl-10 pr-11 py-3 border rounded-xl bg-white text-slate-800 placeholder-slate-400 text-sm
                    focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors
                    ${errors.password_confirm ? 'border-red-400 bg-red-50'
                      : formData.password_confirm && formData.password === formData.password_confirm ? 'border-emerald-400'
                      : 'border-slate-200 hover:border-slate-300'}`}
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  <EyeIcon show={showConfirm} />
                </button>
              </div>
              {errors.password_confirm
                ? <p className="mt-1.5 text-xs text-red-600">{errors.password_confirm}</p>
                : formData.password_confirm && formData.password === formData.password_confirm
                  ? <p className="mt-1.5 text-xs text-emerald-600">✓ Passwords match</p>
                  : null
              }
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white text-sm transition-all
                bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-200 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          {/* Google OAuth Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google Sign Up */}
          <GoogleOAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signup"
          />

          {/* Login link */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-medium">Already have an account?</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <Link
            to="/login"
            className="w-full flex items-center justify-center py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-indigo-300 transition-all"
          >
            Sign in instead
          </Link>

          <p className="text-center text-xs text-slate-400 mt-6">
            Face Attendance System · Secured by ArcFace AI
          </p>
        </div>
      </div>
    </div>
  );
};
