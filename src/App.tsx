import { lazy, Suspense, Component, ReactNode } from "react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";

// Existing pages
import Index from "./pages/Index";
import Upsell1 from "./pages/Upsell1";
import Upsell2 from "./pages/Upsell2";
import NotFound from "./pages/NotFound";

// Lazy-loaded admin pages
const Login = lazy(() => import("./pages/admin/Login"));
const InicioPage = lazy(() => import("./pages/admin/InicioPage"));
const VendasPage = lazy(() => import("./pages/admin/VendasPage"));
const CheckoutsPage = lazy(() => import("./pages/admin/CheckoutsPage"));
const DominiosPage = lazy(() => import("./pages/admin/DominiosPage"));
const IntegracoesPage = lazy(() => import("./pages/admin/IntegracoesPage"));
const ConfiguracoesPage = lazy(() => import("./pages/admin/ConfiguracoesPage"));
const PerfilPage = lazy(() => import("./pages/admin/PerfilPage"));
const UsuariosPage = lazy(() => import("./pages/admin/UsuariosPage"));
const CheckoutBuilder = lazy(() => import("./pages/admin/CheckoutBuilder"));
const CheckoutRenderer = lazy(() => import("./pages/CheckoutRenderer"));
const RootRouteHandler = lazy(() => import("./components/RootRouteHandler"));

const queryClient = new QueryClient();

// Error boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#ef4444', minHeight: '100vh' }} className="bg-background">
          <h1 className="text-foreground" style={{ marginBottom: 16 }}>Erro na aplicação</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{this.state.error.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, marginTop: 8 }} className="text-muted-foreground">{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: '8px 16px', background: '#E63946', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Loading = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="w-8 h-8 border-3 border-neutral-300 dark:border-neutral-700 border-t-brand-500 rounded-full animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <Analytics />
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Login - única rota de acesso ao painel */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<RootRouteHandler />} />
                <Route path="/taxa-administrativa" element={<Upsell1 />} />
                <Route path="/ressarcimento-extra" element={<Upsell2 />} />

                {/* Admin - apenas após login */}
                <Route
                  path="/admin"
                  element={
                    <ProfileProvider>
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    </ProfileProvider>
                  }
                >
                  <Route index element={<Navigate to="/admin/inicio" replace />} />
                  <Route path="inicio" element={<InicioPage />} />
                  <Route path="vendas" element={<VendasPage />} />
                  <Route path="checkouts" element={<CheckoutsPage />} />
                  <Route path="dominios" element={<DominiosPage />} />
                  <Route path="integracoes" element={<IntegracoesPage />} />
                  <Route path="configuracoes" element={<ConfiguracoesPage />} />
                  <Route path="usuarios" element={<UsuariosPage />} />
                  <Route path="perfil" element={<PerfilPage />} />
                </Route>
                <Route
                  path="/admin/builder/:id"
                  element={
                    <ProfileProvider>
                      <ProtectedRoute>
                        <CheckoutBuilder />
                      </ProtectedRoute>
                    </ProfileProvider>
                  }
                />

                {/* Public checkout: por slug */}
                <Route path="/c/:slug" element={<CheckoutRenderer />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
