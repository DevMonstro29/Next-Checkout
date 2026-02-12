import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { apiUrl } from '@/lib/api';
import { Loader2, Clock, LogOut } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, session, loading: authLoading, signOut } = useAuth();
  const { setProfile } = useProfile();
  const [profileLoading, setProfileLoading] = useState(true);
  const [approved, setApproved] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session?.access_token || !user) {
      setProfileLoading(false);
      setApproved(null);
      return;
    }
    fetch(apiUrl('/api/me'), { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((res) => res.json())
      .then((data) => {
        setApproved(data?.profile?.approved ?? false);
        setProfile({ isAdmin: data?.profile?.isAdmin ?? false });
      })
      .catch(() => {
        setApproved(false);
        setProfile({ isAdmin: false });
      })
      .finally(() => setProfileLoading(false));
  }, [session?.access_token, user, setProfile]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center transition-colors">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (approved === false) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Aguardando aprovação</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
            Sua conta foi criada e está aguardando aprovação do administrador. Você receberá acesso assim que for aprovado.
          </p>
          <button
            onClick={() => { signOut(); navigate('/login'); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-sm font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
