import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiUrl } from '@/lib/api';
import { Ban, Check, Loader2, ShoppingCart, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PendingUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
  is_banned: boolean;
  checkout_count: number;
  sales_count: number;
  revenue_cents: number;
  domains_count: number;
}

type Tab = 'usuarios' | 'solicitacoes';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);

const UsuariosPage = () => {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('usuarios');

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);

  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [banningId, setBanningId] = useState<string | null>(null);

  const [forbidden, setForbidden] = useState(false);

  const fetchAdminUsers = () => {
    if (!session?.access_token) return;
    setAdminUsersLoading(true);
    fetch(apiUrl('/api/admin/users'), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (res.status === 403) setForbidden(true);
        return res.json();
      })
      .then((data) => setAdminUsers(data?.users ?? []))
      .catch(() => setAdminUsers([]))
      .finally(() => setAdminUsersLoading(false));
  };

  const fetchPendingUsers = () => {
    if (!session?.access_token) return;
    setPendingLoading(true);
    fetch(apiUrl('/api/pending-users'), {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => {
        if (res.status === 403) setForbidden(true);
        return res.json();
      })
      .then((data) => setPendingUsers(data?.users ?? []))
      .catch(() => setPendingUsers([]))
      .finally(() => setPendingLoading(false));
  };

  useEffect(() => {
    if (!session?.access_token) {
      setPendingLoading(false);
      return;
    }
    fetchPendingUsers();
  }, [session?.access_token]);

  useEffect(() => {
    if (activeTab === 'usuarios' && session?.access_token) {
      fetchAdminUsers();
    }
  }, [activeTab, session?.access_token]);

  const approveUser = async (userId: string) => {
    if (!session?.access_token) return;
    setApprovingId(userId);
    try {
      const res = await fetch(apiUrl(`/api/approve-user/${userId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao aprovar');
      toast.success('Usuário aprovado com sucesso!');
      setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
      fetchAdminUsers();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao aprovar usuário');
    } finally {
      setApprovingId(null);
    }
  };

  const banUser = async (userId: string) => {
    if (!session?.access_token) return;
    if (!confirm('Tem certeza que deseja banir este usuário? Ele perderá o acesso ao painel.')) return;
    setBanningId(userId);
    try {
      const res = await fetch(apiUrl(`/api/admin/ban-user/${userId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao banir');
      toast.success('Usuário banido com sucesso');
      setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: true } : u)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao banir usuário');
    } finally {
      setBanningId(null);
    }
  };

  const unbanUser = async (userId: string) => {
    if (!session?.access_token) return;
    setBanningId(userId);
    try {
      const res = await fetch(apiUrl(`/api/admin/unban-user/${userId}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro ao desbanir');
      toast.success('Usuário desbanido com sucesso');
      setAdminUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: false } : u)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desbanir usuário');
    } finally {
      setBanningId(null);
    }
  };

  if (forbidden) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <p className="text-amber-600 dark:text-amber-400 font-medium">Acesso restrito</p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Apenas o administrador pode acessar esta área.
          </p>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'solicitacoes', label: 'Solicitações', icon: UserCheck },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Usuários</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Gerencie os usuários e solicitações de cadastro do painel
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 mb-6 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {id === 'solicitacoes' && pendingUsers.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Aba Usuários */}
      {activeTab === 'usuarios' && (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 overflow-hidden min-h-[200px]">
          {adminUsersLoading && (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          )}

          {!adminUsersLoading && adminUsers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Nome</th>
                    <th className="text-left px-4 py-3">E-mail</th>
                    <th className="text-left px-4 py-3">Checkouts</th>
                    <th className="text-left px-4 py-3">Vendas</th>
                    <th className="text-left px-4 py-3">Faturamento</th>
                    <th className="text-left px-4 py-3">Domínios</th>
                    <th className="text-right px-4 py-3">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                  {adminUsers.map((u) => (
                    <tr
                      key={u.id}
                      className={`text-sm hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors ${
                        u.is_banned ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 dark:text-white truncate max-w-[180px]">
                          {u.full_name || '—'}
                        </div>
                        {u.is_banned && (
                          <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium">
                            <Ban className="w-3 h-3" />
                            Banido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 truncate max-w-[200px]">
                        {u.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                          <ShoppingCart className="w-4 h-4 text-neutral-400" />
                          {u.checkout_count}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{u.sales_count}</td>
                      <td className="px-4 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(u.revenue_cents)}
                      </td>
                      <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{u.domains_count}</td>
                      <td className="px-4 py-3 text-right">
                        {u.is_banned ? (
                          <button
                            onClick={() => unbanUser(u.id)}
                            disabled={!!banningId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 font-medium text-sm disabled:opacity-50"
                          >
                            {banningId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                            Desbanir
                          </button>
                        ) : (
                          <button
                            onClick={() => banUser(u.id)}
                            disabled={!!banningId}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 hover:bg-red-500/25 font-medium text-sm disabled:opacity-50"
                          >
                            {banningId === u.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Ban className="w-3.5 h-3.5" />
                            )}
                            Banir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!adminUsersLoading && adminUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Nenhum usuário</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                Não há usuários aprovados no momento.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Aba Solicitações */}
      {activeTab === 'solicitacoes' && (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-neutral-50/80 to-white dark:from-neutral-800/50 dark:to-neutral-900/50 overflow-hidden min-h-[200px]">
          {pendingLoading && (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
          )}

          {!pendingLoading && pendingUsers.length > 0 && (
            <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
              <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60 px-4 py-3 grid grid-cols-12 gap-4 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <span className="col-span-4">Nome</span>
                <span className="col-span-4">E-mail</span>
                <span className="col-span-3">Data de cadastro</span>
                <span className="col-span-1 text-right">Ação</span>
              </div>
              {pendingUsers.map((u) => (
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

          {!pendingLoading && pendingUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12">
              <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                <UserCheck className="w-10 h-10 text-neutral-400 dark:text-neutral-500" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-1">Nenhum usuário pendente</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
                Não há cadastros aguardando aprovação no momento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
