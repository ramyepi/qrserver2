
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLogin from './AdminLogin';
import type { User } from '@supabase/supabase-js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkAdminRole = async (userId: string) => {
      try {
        console.log('Checking admin role for user:', userId);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        console.log('Profile query result:', { profile, error });

        if (!mounted) return false;

        if (error) {
          setError(error.message || 'خطأ في التحقق من صلاحيات الإدارة');
          return false;
        }
        
        return profile?.role === 'admin';
      } catch (error: any) {
        setError(error.message || 'خطأ في التحقق من صلاحيات الإدارة');
        return false;
      }
    };

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { session: !!session, error });
        
        if (!mounted) return;
        
        if (error) {
          setError(error.message || 'خطأ في التحقق من الجلسة');
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          setAuthInitialized(true);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          const adminStatus = await checkAdminRole(session.user.id);
          if (mounted) {
            setIsAdmin(adminStatus);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      } catch (error: any) {
        setError(error.message || 'خطأ في التحقق من الجلسة');
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        if (session?.user && authInitialized) {
          setUser(session.user);
          const adminStatus = await checkAdminRole(session.user.id);
          if (mounted) {
            setIsAdmin(adminStatus);
            setIsLoading(false);
          }
        }
      }
    );

    // Initialize auth
    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authInitialized]);

  const handleLogout = async () => {
    try {
      console.log('Logging out user');
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
      }
      // Reset state immediately
      setUser(null);
      setIsAdmin(false);
      setIsLoading(false);
      setAuthInitialized(false);
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    // Reset states and let the auth listener handle the update
    setIsLoading(true);
    setAuthInitialized(false);
  };

  console.log('ProtectedRoute state:', { 
    user: user?.email, 
    isAdmin, 
    isLoading,
    authInitialized
  });

  // Loading state
  if (isLoading || !authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من صلاحيات الوصول...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>حدث خطأ في التحقق من الصلاحيات:</p>
          <p className="mt-2">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 underline text-blue-600">إعادة المحاولة</button>
        </div>
      </div>
    );
  }

  // If not authenticated or not admin, show login
  if (!user || !isAdmin) {
    return (
      <div>
        {user && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 mb-4 text-center">
            <p className="text-yellow-800 mb-2">مرحباً {user.email} - ليس لديك صلاحيات إدارية</p>
            <button
              onClick={handleLogout}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              تسجيل الخروج
            </button>
          </div>
        )}
        <AdminLogin onLogin={handleLoginSuccess} />
      </div>
    );
  }

  // If authenticated and admin, show content
  return <>{children}</>;
};

export default ProtectedRoute;
