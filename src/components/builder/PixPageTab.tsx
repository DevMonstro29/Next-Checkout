import { useBuilder } from '@/contexts/BuilderContext';
import { PixPagePropsEditor } from './PropertiesPanel';

const PixPageTab = () => {
  const { elements, updateElementProps } = useBuilder();
  const pixPageElement = elements.find((el) => el.type === 'pix_page');

  if (!pixPageElement) {
    return (
      <div className="p-4 text-neutral-400 dark:text-neutral-500 text-sm text-center">
        Elemento Página PIX não encontrado.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4">
      <div>
        <h3 className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-3">
          Página PIX
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-[11px] leading-relaxed mb-4">
          Personalize a página exibida após o cliente gerar o pagamento PIX.
        </p>
      </div>

      <PixPagePropsEditor
        props={pixPageElement.props}
        onUpdate={(p) => updateElementProps(pixPageElement.id, p)}
      />
    </div>
  );
};

export default PixPageTab;
