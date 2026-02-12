import { Bell, Palette } from 'lucide-react';

const ConfiguracoesPage = () => {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Configurações</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configurações padrão da sua conta</p>
      </div>

      <div className="space-y-4">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <Bell className="w-5 h-5 text-neutral-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-neutral-900 dark:text-white">Notificações</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Preferências de alertas e avisos</p>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
            <Palette className="w-5 h-5 text-neutral-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-neutral-900 dark:text-white">Aparência</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Tema e preferências visuais</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
