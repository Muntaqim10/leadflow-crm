'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

interface AuthScreenProps {
  authMode: 'signin' | 'signup' | 'forgot_password' | 'reset_password';
  setAuthMode: (mode: 'signin' | 'signup' | 'forgot_password' | 'reset_password') => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authName: string;
  setAuthName: (name: string) => void;
  authError: string;
  setAuthError: (error: string) => void;
  successMsg: string;
  setSuccessMsg: (msg: string) => void;
  authSubmitting: boolean;
  handleSignIn: (e: React.FormEvent) => void;
  handleSignUp: (e: React.FormEvent) => void;
  handleForgotPassword: (e: React.FormEvent) => void;
  handleResetPassword: (e: React.FormEvent) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authName,
  setAuthName,
  authError,
  setAuthError,
  successMsg,
  setSuccessMsg,
  authSubmitting,
  handleSignIn,
  handleSignUp,
  handleForgotPassword,
  handleResetPassword
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | null>(null);
  const [showTrendsModal, setShowTrendsModal] = useState(false);

  return (
    <div className="flex min-h-screen w-screen bg-white font-sans antialiased overflow-hidden">
      {/* Left Side: Login Form */}
      <div className="w-full md:w-1/2 flex flex-col p-8 lg:p-12 xl:p-16 relative z-10">
        <div className="mb-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">LeadFlow</span>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto my-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {authMode === 'signin' && 'Welcome Back'}
            {authMode === 'signup' && 'Create Account'}
            {authMode === 'forgot_password' && 'Reset Password'}
            {authMode === 'reset_password' && 'Set New Password'}
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            {authMode === 'signin' && 'Sign in to your sales workspace to continue.'}
            {authMode === 'signup' && 'Register a new account to join the workspace.'}
            {authMode === 'forgot_password' && "Enter your email address and we'll send you a password reset link."}
            {authMode === 'reset_password' && 'Enter your new password below to secure your account.'}
          </p>

          <form
            onSubmit={
              authMode === 'signin'
                ? handleSignIn
                : authMode === 'signup'
                ? handleSignUp
                : authMode === 'forgot_password'
                ? handleForgotPassword
                : handleResetPassword
            }
            className="space-y-5"
          >
            {authError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>
            )}

            {authMode !== 'reset_password' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                  placeholder="name@company.com"
                />
              </div>
            )}

            {authMode !== 'forgot_password' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  {authMode === 'reset_password' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-400"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === 'signin' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('forgot_password');
                    setAuthError('');
                    setSuccessMsg('');
                  }}
                  className="text-blue-600 font-medium hover:text-blue-800 transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={authSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 mt-4"
            >
              {authSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>
                  {authMode === 'signin' && 'Log in'}
                  {authMode === 'signup' && 'Create Account'}
                  {authMode === 'forgot_password' && 'Send Reset Link'}
                  {authMode === 'reset_password' && 'Update Password'}
                </span>
              )}
            </button>

            <div className="text-center mt-6">

              {authMode === 'signup' && (
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                  >
                    Log in
                  </button>
                </p>
              )}
              {(authMode === 'forgot_password' || authMode === 'reset_password') && (
                <p className="text-sm text-slate-500">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                      setSuccessMsg('');
                    }}
                    className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
                  >
                    Back to Log in
                  </button>
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="mt-auto pt-8 text-xs text-slate-400 flex items-center justify-between">
          <span>© 2026 Leadflow</span>
          <div className="space-x-4">
            <button
              type="button"
              onClick={() => setShowLegalModal('privacy')}
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => setShowLegalModal('terms')}
              className="hover:text-slate-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>

      {/* Right Side: Marketing / Value Prop */}
      <div className="hidden md:flex w-1/2 bg-[#F0F7FF] flex-col justify-center items-center p-12 relative overflow-hidden">
        {/* Decorative Dot Pattern Background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        ></div>

        <div className="relative z-10 max-w-lg text-center">
          <h2 className="text-[2.5rem] font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight font-serif">
            Close More Deals with Intelligent Lead Tracking
          </h2>
          <p className="text-lg text-slate-600 mb-10 leading-relaxed font-medium">
            Manage your pipeline, automate follow-ups, and convert prospects into loyal customers with our AI-driven
            leads platform.
          </p>

          {/* Visual element representing a report or UI */}
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 transform rotate-[2deg] hover:rotate-0 transition-transform duration-500 max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-50 pb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 text-sm">Lead Conversion Projected</div>
                <div className="text-[10px] text-emerald-600 font-bold">+24% Increase this month</div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-2 bg-blue-50 rounded-full w-full"></div>
              <div className="h-2 bg-blue-100 rounded-full w-5/6"></div>
              <div className="h-2 bg-blue-200 rounded-full w-4/6"></div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowTrendsModal(true)}
            className="mt-12 px-6 py-3 bg-white hover:bg-blue-50 text-blue-600 font-semibold rounded-full shadow hover:shadow-md transition-all text-sm cursor-pointer inline-flex items-center gap-2"
          >
            <span>Explore the 2026 Sales Trends Report</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legal Modal (Privacy Policy & Terms of Service) */}
      {showLegalModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setShowLegalModal('privacy')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    showLegalModal === 'privacy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setShowLegalModal('terms')}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    showLegalModal === 'terms' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Terms of Service
                </button>
              </div>
              <button
                onClick={() => setShowLegalModal(null)}
                className="text-slate-400 hover:text-slate-700 h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-slate-200/50 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto text-xs text-slate-600 space-y-5 leading-relaxed">
              {showLegalModal === 'privacy' ? (
                <>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Privacy Policy</h3>
                    <p className="text-[11px] text-slate-400">Last updated: August 2026</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">1. Information We Collect</h4>
                    <p>
                      When you register for and use Leadflow, we collect account details (such as your full name, work email
                      address, and encrypted credentials), as well as sales inquiries, booking details, and interaction
                      logs you enter into your sales workspace.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">2. Use of Information</h4>
                    <p>
                      Your information is used strictly to power your sales pipeline, track lead progression, automate
                      personalized follow-up correspondence, generate deal insights, and manage team permissions. We do
                      not sell or lease your business data to any third parties.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">3. Data Security & Isolation</h4>
                    <p>
                      All database records are protected with industry-standard encryption in transit (HTTPS/TLS) and at
                      rest. Strict Row Level Security (RLS) policies and role-based permissions ensure that access to your
                      workspace data is restricted exclusively to authenticated users within your organization.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">4. Data Ownership & Retention</h4>
                    <p>
                      You retain 100% intellectual property and operational ownership over all customer lists, revenue
                      targets, and contract terms stored in Leadflow. You can export or request permanent deletion of your
                      organization&apos;s records at any time.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">5. Contact Information</h4>
                    <p>
                      If you have any questions regarding data protection or compliance, please reach out to our privacy team
                      at <span className="font-semibold text-blue-600">privacy@leadflow.app</span>.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 mb-1">Terms of Service</h3>
                    <p className="text-[11px] text-slate-400">Last updated: August 2026</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">1. Agreement to Terms</h4>
                    <p>
                      By accessing or using the Leadflow sales platform, you agree to be bound by these Terms of Service. If
                      you are using Leadflow on behalf of a hotel, property, or business entity, you represent that you
                      have the authority to bind that organization.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">2. User Accounts & Responsibilities</h4>
                    <p>
                      You are responsible for maintaining the confidentiality of your account credentials and for all
                      activities that occur under your account. Roles and permissions (such as General Manager, Front Desk
                      Supervisor, and Sales Agent) must be assigned in compliance with your organization&apos;s internal
                      controls.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">3. Acceptable Use</h4>
                    <p>
                      You agree to use Leadflow solely for legitimate sales pipeline tracking, group booking management,
                      client communications, and hospitality operations. You may not attempt to disrupt service
                      availability or access data belonging to other organizations.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">4. AI-Assisted Tools & Automation</h4>
                    <p>
                      Leadflow provides AI-assisted draft generation and demand analysis as productivity tools. Users remain
                      responsible for reviewing all generated proposals, contracts, and email correspondences prior to
                      sending them to prospective clients.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-sm">5. Limitation of Liability</h4>
                    <p>
                      Leadflow is provided on an &quot;as-is&quot; and &quot;as-available&quot; basis. In no event shall
                      Leadflow be liable for indirect, incidental, or consequential damages arising from the use of the
                      platform.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowLegalModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2026 Sales Trends Report Modal */}
      {showTrendsModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/20 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">2026 Sales & Pipeline Velocity Report</h3>
                  <p className="text-[11px] text-blue-100">
                    Key industry benchmarks & revenue drivers for high-performance teams
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTrendsModal(false)}
                className="text-white/80 hover:text-white h-8 w-8 rounded-full flex items-center justify-center text-lg font-bold hover:bg-white/10 transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto text-xs text-slate-600 space-y-6 leading-relaxed">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
                  <div className="text-2xl font-extrabold text-blue-600 mb-1">+42%</div>
                  <div className="font-bold text-slate-800 text-xs mb-0.5">Response Velocity</div>
                  <div className="text-[11px] text-slate-500">Inquiries answered in &lt;15 mins yield 2.4x conversion.</div>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
                  <div className="text-2xl font-extrabold text-emerald-600 mb-1">+24%</div>
                  <div className="font-bold text-slate-800 text-xs mb-0.5">Close Rate Lift</div>
                  <div className="text-[11px] text-slate-500">Achieved via automated cadence and personalized proposals.</div>
                </div>
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-100 text-center">
                  <div className="text-2xl font-extrabold text-purple-600 mb-1">3.8x</div>
                  <div className="font-bold text-slate-800 text-xs mb-0.5">Touchpoint ROI</div>
                  <div className="text-[11px] text-slate-500">Multichannel follow-ups (Email + Calls) close 80% of volume.</div>
                </div>
              </div>

              {/* Insight 1 */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                  1. Automated AI Proposal Turnaround
                </h4>
                <p>
                  Traditional group booking contracts take an average of 18 hours to draft and send. With Leadflow&apos;s
                  instant AI proposal compiler, sales managers generate accurate, customized room block agreements in under
                  2 minutes, capturing booking commitments while prospect intent is highest.
                </p>
              </div>

              {/* Insight 2 */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                  2. Stage Velocity Tracking
                </h4>
                <p>
                  Tracking &quot;Days in Stage&quot; allows revenue directors to identify bottlenecks before leads turn cold. The
                  2026 data shows that inquiries remaining in &quot;Proposal Sent&quot; for longer than 7 days have an 85% drop in
                  win probability unless a scheduled follow-up task is triggered.
                </p>
              </div>

              {/* Insight 3 */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  3. Multi-Segment Revenue Balancing
                </h4>
                <p>
                  Balancing corporate group bookings with weddings and social blocks generates 19% higher RevPAR during
                  shoulder seasons. Leadflow&apos;s demand heatmap provides instant visual indicators of upcoming
                  high-density booking dates.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="text-[11px] text-slate-400">Source: Leadflow 2026 Sales & Hospitality Index</span>
              <button
                onClick={() => setShowTrendsModal(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
