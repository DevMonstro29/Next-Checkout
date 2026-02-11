import { useBuilder } from '@/contexts/BuilderContext';
import PixPageElement from './elements/PixPageElement';
import ElementRenderer from './elements/ElementRenderer';

const PixPagePreview = ({ previewMode = 'mobile' }: { previewMode?: 'desktop' | 'mobile' }) => {
  const { elements, checkout } = useBuilder();
  const theme = checkout?.theme;
  const pixPageElement = elements.find((el) => el.type === 'pix_page');
  const headerElement = elements.find((el) => el.type === 'header' && el.visible);

  const themeMaxWidth = theme?.maxWidth || '448px';
  const isMobile = previewMode === 'mobile';
  const canvasMaxWidth = isMobile ? themeMaxWidth : '960px';

  return (
    <div className="flex-1 overflow-auto bg-neutral-100 dark:bg-neutral-950/50 flex justify-center transition-colors">
      <div
        className="transition-all duration-300 ease-in-out w-full h-full"
        style={{ maxWidth: canvasMaxWidth }}
      >
        <div
          className={`min-h-full transition-all ${
            isMobile ? 'px-4 pb-6' : 'px-8 pb-6'
          } pt-6`}
          style={{
            backgroundColor: theme?.colors.background || '#f5f7fa',
            fontFamily: theme?.font.family || 'Inter',
          }}
        >
          {theme?.customCSS && (
            <style dangerouslySetInnerHTML={{ __html: theme.customCSS }} />
          )}

          <div className={!isMobile ? 'mx-auto' : ''} style={!isMobile ? { maxWidth: themeMaxWidth } : {}}>
            {/* Header element if exists */}
            {headerElement && (
              <div className="mb-4">
                <ElementRenderer element={headerElement} isBuilder={true} />
              </div>
            )}

            {/* PIX Page preview label */}
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-neutral-300/50 dark:bg-neutral-600/50" />
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider whitespace-nowrap">
                Preview da Página PIX
              </span>
              <div className="h-px flex-1 bg-neutral-300/50 dark:bg-neutral-600/50" />
            </div>

            {/* PIX Page content */}
            {pixPageElement ? (
              <PixPageElement props={pixPageElement.props} theme={theme} />
            ) : (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-neutral-300 dark:border-neutral-600/50 rounded-xl">
                <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                  Elemento Página PIX não encontrado
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPagePreview;
