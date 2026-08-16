'use client';

import React, { useState } from 'react';
import { TrendingUp, Lock, Mail, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { getBrowserSupabaseClient } from '@/lib/supabaseClient';

interface AuthScreenProps {
  authMode: 'signin' | 'signup' | 'forgot_password' | 'reset_password';
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot_password' | 'reset_password') => void;
  onSuccess: (session: any) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode,
  setAuthMode,
  onSuccess
}) => {
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Sales Agent');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim(), password: authPassword })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Invalid credentials');
      }

      if (data.session) {
        localStorage.setItem('leadflow_auth_session', JSON.stringify(data.session));
        onSuccess(data.session);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          name: authName.trim(),
          role: authRole
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create account');
      }

      setAuthSuccessMsg('Account created successfully! You can now sign in.');
      setAuthMode('signin');
    } catch (err: any) {
      setAuthError(err.message || 'Sign up failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), {
        redirectTo: window.location.origin
      });

      if (error) throw error;
      setAuthSuccessMsg('Password reset link sent to your email.');
    } catch (err: any) {
      setAuthError(err.message || 'Could not send reset email.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSubmitting(true);

    try {
      const supabase = getBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: authPassword });
      if (error) throw error;
      setAuthSuccessMsg('Password updated successfully! Please sign in.');
      setAuthMode('signin');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to update password.');
    } finally {
      setAuthSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1120] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0F1E36] border border-[#1F3A60] rounded-2xl shadow-2xl overflow-hidden p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white">Leadflow</h1>
            <p className="text-xs text-blue-200/70">Sales & Hospitality CRM</p>
          </div>
        </div>

        {authSuccessMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg">
            {authSuccessMsg}
          </div>
        )}

        {authError && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg">
            {authError}
          </div>
        )}

        {authMode === 'signin' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@leadflow.com"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot_password')}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md mt-2 disabled:opacity-50"
            >
              {authSubmitting ? 'Signing in...' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-sky-400 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </form>
        )}

        {authMode === 'signup' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@leadflow.com"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assign Role</label>
              <select
                value={authRole}
                onChange={(e) => setAuthRole(e.target.value)}
                className="w-full bg-[#162945] border border-[#274472] rounded-lg px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
              >
                <option value="Sales Agent">Sales Agent</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Director of Sales">Director of Sales</option>
                <option value="Front Desk Supervisor">Front Desk Supervisor</option>
                <option value="General Manager">General Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md mt-2 disabled:opacity-50"
            >
              {authSubmitting ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-sky-400 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {authMode === 'forgot_password' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-xs text-slate-300">
              Enter your email address and we&apos;ll send you a password reset link.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@leadflow.com"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {authSubmitting ? 'Sending link...' : 'Send Reset Link'}
            </button>

            <p className="text-center text-xs text-slate-400 pt-2">
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-sky-400 font-semibold hover:underline"
              >
                Back to Sign In
              </button>
            </p>
          </form>
        )}

        {authMode === 'reset_password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-xs text-slate-300">Enter your new password below.</p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#162945] border border-[#274472] rounded-lg pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-400 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors shadow-md disabled:opacity-50"
            >
              {authSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
