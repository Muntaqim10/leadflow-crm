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
  const isMuntaqim = currentUserEmail.toLowerCase().includes('muntaqim') || currentUserEmail.toLowerCase() === 'muntaquime@gmail.com';
  const isArzaan = currentUserEmail.toLowerCase() === 'arzaan@leadflow.com';

  const defaultUserRole = isMuntaqim ? 'Front Desk Supervisor' : isArzaan ? 'General Manager' : session?.user?.user_metadata?.role || 'Sales Agent';
  const defaultUserName = session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || (isMuntaqim ? 'Muntaqim Elahi' : 'User');

  const currentUserObj = users.find(u => u.email?.toLowerCase() === currentUserEmail.toLowerCase() || u.id === session?.user?.id);
  const currentUserRole = currentUserObj?.role || defaultUserRole;
  const currentUserName = currentUserObj?.name || defaultUserName;

  const isGeneralManager = currentUserRole.toLowerCase().includes('general manager') || isArzaan;
  const isFrontDeskSupervisor = currentUserRole.toLowerCase().includes('front desk supervisor') || currentUserRole.toLowerCase().includes('supervisor') || isMuntaqim;

  // Strict restriction: Rokeya (Director of Sales) and Riham (Sales Manager) cannot delete leads
  const isRokeya = currentUserEmail.toLowerCase().includes('rokeya') || currentUserName.toLowerCase().includes('rokeya') || currentUserRole.toLowerCase().includes('director');
  const isRiham = currentUserEmail.toLowerCase().includes('riham') || currentUserName.toLowerCase().includes('riham') || (currentUserRole.toLowerCase().includes('manager') && !isGeneralManager);
  const isSalesAgent = currentUserRole.toLowerCase().includes('agent');

  const canDeleteLeads = (isGeneralManager || isFrontDeskSupervisor || isMuntaqim) && !isRokeya && !isRiham && !isSalesAgent;
  const canManageUsers = isGeneralManager || isFrontDeskSupervisor || isMuntaqim;
  const canManageHotelDetails = isGeneralManager || isFrontDeskSupervisor || isMuntaqim;

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
