'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabaseClient';
import { User } from '@/types/crm';

export function useAuth(users: User[]) {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot_password' | 'reset_password'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState('Sales Agent');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSubmitting, setAuthSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    if (typeof window !== 'undefined') {
      if (window.location.hash.includes('type=recovery') || window.location.href.includes('reset=true')) {
        setAuthMode('reset_password');
      }
      const savedLocalSession = localStorage.getItem('leadflow_auth_session');
      if (savedLocalSession) {
        try {
          setSession(JSON.parse(savedLocalSession));
        } catch (e) { }
      }
    }

    const timer = setTimeout(() => {
      if (active) setAuthLoading(false);
    }, 1200);

    const supabase = getBrowserSupabaseClient();
    supabase.auth.getSession()
      .then((res: any) => {
        const supaSession = res?.data?.session;
        if (active) {
          if (supaSession) setSession(supaSession);
          setAuthLoading(false);
        }
      })
      .catch((err: any) => {
        console.warn('Supabase auth getSession skipped/failed:', err);
        if (active) setAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event: string, supaSession: any) => {
      if (active) {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode('reset_password');
        }
        if (supaSession) setSession(supaSession);
        setAuthLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(timer);
      data?.subscription?.unsubscribe();
    };
  }, []);

  const currentUserEmail = session?.user?.email || '';
  const emailLower = currentUserEmail.toLowerCase().trim();
  const isMuntaqim = emailLower === 'muntaqim@leadflow.com' || emailLower === 'muntaquime@gmail.com';
  const isArzaan = emailLower === 'arzaan@leadflow.com';
  const isRokeya = emailLower === 'rokeya@leadflow.com';
  const isRiham = emailLower === 'riham@leadflow.com';

  const defaultUserRole = isMuntaqim ? 'Front Desk Supervisor' : isArzaan ? 'General Manager' : session?.user?.user_metadata?.role || 'Sales Agent';
  const defaultUserName = session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || (isMuntaqim ? 'Muntaqim Elahi' : isArzaan ? 'Arzaan Shaikh' : emailLower.split('@')[0] || 'User');

  const currentUserObj = users.find(u => (u.email && u.email.toLowerCase().trim() === emailLower) || u.id === session?.user?.id);
  const currentUserRole = currentUserObj?.role || defaultUserRole;
  const currentUserName = currentUserObj?.name || defaultUserName;
  const currentUserTier = (currentUserObj as any)?.permission_tier || session?.user?.user_metadata?.permission_tier;

  const roleLower = currentUserRole.toLowerCase();
  const isGeneralManager = currentUserTier === 'admin' || roleLower.includes('general manager') || roleLower.includes('admin') || isArzaan;
  const isFrontDeskSupervisor = roleLower.includes('front desk supervisor') || roleLower.includes('supervisor') || isMuntaqim;
  const isSalesAgent = roleLower.includes('agent') && !isGeneralManager && !isFrontDeskSupervisor;

  const canManageUsers = currentUserTier === 'admin' || isGeneralManager || isFrontDeskSupervisor || isMuntaqim;
  const canDeleteLeads = canManageUsers && !isRokeya && !isRiham && !isSalesAgent;
  const canManageHotelDetails = canManageUsers;

  const handleSignOut = async () => {
    try {
      const supabase = getBrowserSupabaseClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Sign out error:', e);
    }
    localStorage.removeItem('leadflow_auth_session');
    setSession(null);
    setAuthMode('signin');
  };

  return {
    session,
    setSession,
    authLoading,
    authMode,
    setAuthMode,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authName,
    setAuthName,
    authRole,
    setAuthRole,
    showPassword,
    setShowPassword,
    authError,
    setAuthError,
    authSubmitting,
    setAuthSubmitting,
    currentUserEmail,
    currentUserName,
    currentUserRole,
    canDeleteLeads,
    canManageUsers,
    canManageHotelDetails,
    isGeneralManager,
    isFrontDeskSupervisor,
    handleSignOut
  };
}
