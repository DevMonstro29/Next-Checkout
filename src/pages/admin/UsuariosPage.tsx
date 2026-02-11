import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const UsuariosPage = () => {
  const { session } = useAuth();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!session?.access_token) {
      setLoading(false);
      return;
    }
    fetch('/api/pending-users', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (res.status === 403) {
          setForbidden(true);
          return { users: [] };
        }
        return res.json();
      })
      .then((data) => setUsers(data?.users ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [session?.access_token]);

  const approveUser = async (userId: string) => {
    if (!session?.access_token) return;
    setApprovingId(userId);
    try {
      const res = await fetch(`/api/approve-user/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao aprovar');
      toast.success('Usuário aprovado com sucesso!');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar usuário');
    } finally {
      setApprovingId(null);
    }
  };

  if (forbidden) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-amber-600 dark:text-amber-400 font-medium">Acesso restrito</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Apenas o administrador pode aprovar novos usuários.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Aprovar usuários</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Novos cadastros aguardando sua aprovação para acessar o painel
        </p>
      </div>

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 overflow-hidden min-h-[200px]">
        {loading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
            <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <span className="col-span-4">Nome</span>
              <span className="col-span-4">E-mail</span>
              <span className="col-span-3">Data de cadastro</span>
              <span className="col-span-1 text-right">Ação</span>
            </div>
            {users.map((u) => (
              <div
                key={u.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 items-center text-sm hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors"
              >
                <div className="col-span-4 font-medium text-neutral-900 dark:text-white truncate">
                  {u.full_name || '—'}
                </div>
                <div className="col-span-4 text-neutral-600 dark:text-neutral-400 truncate">{u.email || '—'}</div>
                <div className="col-span-3 text-neutral-500 dark:text-neutral-400">{formatDate(u.created_at)}</div>
                <div className="col-span-1 text-right">
                  <button
                    onClick={() => approveUser(u.id)}
                    disabled={!!approvingId}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 font-medium text-sm disabled:opacity-50"
                  >
                    {approvingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Aprovar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12">
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <UserPlus className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Nenhum usuário pendente</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
              Não há cadastros aguardando aprovação no momento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsuariosPage;
