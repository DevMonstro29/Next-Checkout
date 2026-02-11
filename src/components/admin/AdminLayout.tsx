import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  ShoppingCart,
  CreditCard,
  Globe,
  Plug,
  Settings,
  User,
  Users,
  LogOut,
  Sun,
  Moon,
  PanelLeft,
} from 'lucide-react';

const baseMenuItems = [
  { to: '/admin/inicio', icon: Home, label: 'Início' },
  { to: '/admin/vendas', icon: ShoppingCart, label: 'Vendas' },
  { to: '/admin/checkouts', icon: CreditCard, label: 'Checkout' },
  { to: '/admin/dominios', icon: Globe, label: 'Domínios' },
  { to: '/admin/integracoes', icon: Plug, label: 'Integrações' },
  { to: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
  { to: '/admin/usuarios', icon: Users, label: 'Usuários', adminOnly: true },
  { to: '/admin/perfil', icon: User, label: 'Perfil' },
];

const AdminLayoutInner = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useProfile();
  const menuItems = baseMenuItems.filter((item) => !item.adminOnly || isAdmin);
  const { theme, toggleTheme } = useTheme();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const avatarUrl = (user?.user_metadata as Record<string, string> | undefined)?.avatar_url;

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <>
      <Sidebar side="left" collapsible="icon" className="border-r border-neutral-200 dark:border-neutral-800">
        <SidebarHeader className="border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex h-12 items-center gap-2 px-2">
            <NavLink to="/admin/inicio" className="flex items-center gap-2 min-w-0">
              <img src="/logo-icon.png" alt="Logo" className="h-8 w-8 object-contain shrink-0" />
              <span className="font-semibold text-neutral-900 dark:text-white truncate group-data-[collapsible=icon]:hidden">
                NextCheckout
              </span>
            </NavLink>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map(({ to, icon: Icon, label }) => (
                  <SidebarMenuItem key={to}>
                    <SidebarMenuButton asChild isActive={location.pathname === to}>
                      <NavLink to={to} className="flex items-center gap-2">
                        {to === '/admin/perfil' && avatarUrl ? (
                          <span className="relative h-4 w-4 min-h-4 min-w-4 shrink-0 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-600 flex items-center justify-center">
                            <img
                              src={avatarUrl}
                              alt=""
                              className="block w-full h-full object-cover object-center aspect-square"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <span className="hidden absolute inset-0 flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-600" aria-hidden>
                              <Icon className="h-3.5 w-3.5 text-neutral-500 dark:text-neutral-400" />
                            </span>
                          </span>
                        ) : (
                          <Icon className="h-4 w-4 shrink-0" />
                        )}
                        <span>{label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-neutral-200 dark:border-neutral-800">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleSignOut} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={toggleSidebar}>
                <PanelLeft className="h-4 w-4 shrink-0" />
                <span className="group-data-[collapsible=icon]:hidden">Expandir / Recolher menu</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-12 items-center border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm px-4" aria-hidden="true" />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </SidebarInset>
    </>
  );
};

const AdminLayout = () => (
  <SidebarProvider>
    <AdminLayoutInner />
  </SidebarProvider>
);

export default AdminLayout;
