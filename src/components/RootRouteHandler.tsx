import { Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const CheckoutRenderer = lazy(() => import('@/pages/CheckoutRenderer'));

/**
 * Domínios principais da aplicação (painel admin).
 * Quando o usuário acessa "/" nesses domínios, redireciona para /login.
 * Em domínios personalizados, renderiza o CheckoutRenderer.
 */
const MAIN_APP_HOSTS = [
  'localhost',
  '127.0.0.1',
  ...(import.meta.env.VITE_APP_HOST
    ? String(import.meta.env.VITE_APP_HOST).split(',').map((h: string) => h.trim().toLowerCase())
    : ['app.nextcheckoutbr.com']),
].filter(Boolean);

const RootRouteHandler = () => {
  const hostname = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';

  if (MAIN_APP_HOSTS.some((h) => hostname === h)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-3 border-neutral-300 dark:border-neutral-700 border-t-brand-500 rounded-full animate-spin" />
      </div>
    }>
      <CheckoutRenderer />
    </Suspense>
  );
};

export default RootRouteHandler;
