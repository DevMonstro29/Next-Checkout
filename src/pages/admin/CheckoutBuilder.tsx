import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBuilder, BuilderProvider } from '@/contexts/BuilderContext';
import { CheckoutElementType, ELEMENT_LABELS } from '@/types/checkout';
import ElementPalette from '@/components/builder/ElementPalette';
import BuilderCanvas from '@/components/builder/BuilderCanvas';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import ThemeEditor from '@/components/builder/ThemeEditor';
import ProductEditor from '@/components/builder/ProductEditor';
import SettingsEditor from '@/components/builder/SettingsEditor';
import {
  ArrowLeft, Save, Loader2, Undo2, Redo2, Eye, Globe,
  Palette, Layers, ShoppingBag, Settings, Monitor, Smartphone,
  Sun, Moon, QrCode,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import ResizeHandle from '@/components/builder/ResizeHandle';
import PixPageTab from '@/components/builder/PixPageTab';
import PixPagePreview from '@/components/builder/PixPagePreview';

function BuilderContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme: appTheme, toggleTheme } = useTheme();
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [dragActiveType, setDragActiveType] = useState<string | null>(null);

  // Resizable sidebars
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = localStorage.getItem('builder-left-width');
    return saved ? parseInt(saved) : 260;
  });
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('builder-right-width');
    return saved ? parseInt(saved) : 320;
  });

  const handleLeftResize = useCallback((w: number) => {
    setLeftWidth(w);
    localStorage.setItem('builder-left-width', String(w));
  }, []);

  const handleRightResize = useCallback((w: number) => {
    setRightWidth(w);
    localStorage.setItem('builder-right-width', String(w));
  }, []);

  const {
    checkout,
    isLoading,
    isDirty,
    isSaving,
    activeTab,
    setActiveTab,
    loadCheckout,
    saveCheckout,
    addElement,
    reorderElements,
    elements,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useBuilder();

  useEffect(() => {
    if (id) loadCheckout(id);
  }, [id, loadCheckout]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    if (id.startsWith('palette-')) {
      setDragActiveType(id.replace('palette-', ''));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDragActiveType(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;

    // From palette -> canvas
    if (activeId.startsWith('palette-')) {
      const type = activeId.replace('palette-', '') as CheckoutElementType;
      const overIndex = elements.findIndex((e) => e.id === over.id);
      addElement(type, overIndex >= 0 ? overIndex + 1 : undefined);
      return;
    }

    // Reorder within canvas
    if (activeId !== over.id) {
      const oldIndex = elements.findIndex((e) => e.id === activeId);
      const newIndex = elements.findIndex((e) => e.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0) {
        reorderElements(oldIndex, newIndex);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCheckout();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveCheckout, undo, redo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex flex-col items-center justify-center gap-4 transition-colors">
        <img src="/logo-icon.png" alt="NextCheckout" className="w-10 h-10 object-contain animate-pulse" />
        <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!checkout) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <p className="text-neutral-500 dark:text-neutral-400 mb-4">Checkout não encontrado</p>
          <button
            onClick={() => navigate('/admin')}
            className="text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300 text-sm"
          >
            Voltar ao dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'settings' as const, icon: Settings, label: 'Config' },
    { id: 'product' as const, icon: ShoppingBag, label: 'Produtos' },
    { id: 'theme' as const, icon: Palette, label: 'Tema' },
    { id: 'elements' as const, icon: Layers, label: 'Elementos' },
    { id: 'pix_page' as const, icon: QrCode, label: 'Pág. PIX' },
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-neutral-50 dark:bg-neutral-900 transition-colors">
        {/* Top toolbar */}
        <header className="h-12 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-between px-3 flex-shrink-0 z-50 transition-colors">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700" />
            <img src="/logo-icon.png" alt="NextCheckout" className="w-7 h-7 object-contain" />
            <span className="text-neutral-900 dark:text-white text-sm font-medium truncate max-w-[200px]">
              {checkout.name}
            </span>
            {isDirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-400/10 px-2 py-0.5 rounded-full">
                Não salvo
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Refazer (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

            {/* Preview mode */}
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                previewMode === 'desktop'
                  ? 'text-brand-500 dark:text-brand-400 bg-neutral-100 dark:bg-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                previewMode === 'mobile'
                  ? 'text-brand-500 dark:text-brand-400 bg-neutral-100 dark:bg-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>

            <div className="h-5 w-px bg-neutral-200 dark:bg-neutral-700 mx-1" />

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
              title={appTheme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {appTheme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Preview in new tab */}
            {checkout.status === 'published' && (
              <button
                onClick={() => {
                  const url = checkout.custom_domain
                    ? `https://${checkout.custom_domain.replace(/^https?:\/\//, '')}/c/${checkout.slug}`
                    : `/c/${checkout.slug}`;
                  window.open(url, '_blank');
                }}
                className="p-1.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
                title="Ver checkout"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}

            {/* Save */}
            <button
              onClick={saveCheckout}
              disabled={isSaving || !isDirty}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ml-1"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              Salvar
            </button>
          </div>
        </header>

        {/* Main area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left sidebar - Palette & tabs */}
          <div
            className="border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col flex-shrink-0 overflow-hidden transition-colors"
            style={{ width: leftWidth }}
          >
            {/* Tab buttons */}
            <div className="flex border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 transition-all text-[10px] min-w-0 ${
                    activeTab === tab.id
                      ? 'text-brand-500 dark:text-brand-400 border-b-2 border-brand-500 dark:border-brand-400 bg-neutral-50 dark:bg-neutral-700/30'
                      : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                  }`}
                  title={tab.label}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate w-full text-center">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {activeTab === 'elements' && (
                <div className="p-2">
                  <ElementPalette />
                </div>
              )}
              {activeTab === 'theme' && <ThemeEditor />}
              {activeTab === 'product' && <ProductEditor />}
              {activeTab === 'settings' && <SettingsEditor />}
              {activeTab === 'pix_page' && <PixPageTab />}
            </div>
          </div>

          {/* Left resize handle */}
          <ResizeHandle
            side="left"
            currentWidth={leftWidth}
            minWidth={200}
            maxWidth={450}
            onResize={handleLeftResize}
          />

          {/* Center - Canvas or PIX Page Preview */}
          {activeTab === 'pix_page' ? (
            <PixPagePreview previewMode={previewMode} />
          ) : (
            <BuilderCanvas previewMode={previewMode} />
          )}

          {/* Right resize handle - hidden on PIX page tab */}
          {activeTab !== 'pix_page' && (
            <ResizeHandle
              side="right"
              currentWidth={rightWidth}
              minWidth={260}
              maxWidth={520}
              onResize={handleRightResize}
            />
          )}

          {/* Right sidebar - Properties (hidden on PIX page tab) */}
          {activeTab !== 'pix_page' && (
            <div
              className="border-l border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex-shrink-0 overflow-hidden transition-colors"
              style={{ width: rightWidth }}
            >
              <PropertiesPanel />
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {dragActiveType && (
          <div className="bg-brand-500/20 border border-brand-500/50 rounded-lg px-4 py-2 text-brand-500 dark:text-brand-400 text-sm font-medium backdrop-blur-sm">
            {ELEMENT_LABELS[dragActiveType as CheckoutElementType]}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

// Wrapper with BuilderProvider
const CheckoutBuilder = () => {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
};

export default CheckoutBuilder;
