import React from 'react';
import { useBuilder } from '@/contexts/BuilderContext';
import { ELEMENT_LABELS, CheckoutElementType } from '@/types/checkout';
import { Trash2, Eye, EyeOff, Plus, X } from 'lucide-react';
import ImageUpload from './ImageUpload';

// Generic input components
function PropInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
      />
    </div>
  );
}

function PropTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-all resize-none"
      />
    </div>
  );
}

function PropToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-9 h-5 rounded-full transition-all flex items-center ${
          value ? 'bg-brand-500 justify-end' : 'bg-neutral-300 dark:bg-neutral-600 justify-start'
        }`}
      >
        <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
      </button>
    </label>
  );
}

function PropSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function PropColor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-600 cursor-pointer bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="flex-1 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-all"
        />
      </div>
    </div>
  );
}

// Element-specific props editors
function HeaderPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <ImageUpload label="Logo" value={props.logoUrl || ''} onChange={(v) => onUpdate({ logoUrl: v })} placeholder="URL ou faça upload" />
      <PropInput label="Tamanho do logo" value={props.logoSize || '48px'} onChange={(v) => onUpdate({ logoSize: v })} placeholder="48px" />
      <PropToggle label="Mostrar badge de segurança" value={props.showSecurityBadge ?? true} onChange={(v) => onUpdate({ showSecurityBadge: v })} />
      <PropInput label="Texto de segurança" value={props.securityText || ''} onChange={(v) => onUpdate({ securityText: v })} />
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor de fundo" value={props.backgroundColor || 'transparent'} onChange={(v) => onUpdate({ backgroundColor: v })} />
      <PropColor label="Cor do ícone segurança (vazio = tema)" value={props.badgeColor || ''} onChange={(v) => onUpdate({ badgeColor: v })} />
      <PropColor label="Cor do texto segurança (vazio = tema)" value={props.badgeTextColor || ''} onChange={(v) => onUpdate({ badgeTextColor: v })} />
    </div>
  );
}

function RichTextEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (tag: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const text = ta.value;
    const selected = text.substring(start, end);
    if (!selected) return;

    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;

    // If already wrapped, unwrap
    const before = text.substring(0, start);
    const after = text.substring(end);
    if (before.endsWith(openTag) && after.startsWith(closeTag)) {
      const newText = before.slice(0, -openTag.length) + selected + after.slice(closeTag.length);
      onChange(newText);
      return;
    }

    const newText = text.substring(0, start) + openTag + selected + closeTag + text.substring(end);
    onChange(newText);

    // Restore selection
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = start + openTag.length;
      ta.selectionEnd = end + openTag.length;
    }, 0);
  };

  return (
    <div>
      <label className="text-neutral-400 text-xs font-medium mb-1 block">{label}</label>
      <div className="flex items-center gap-1 mb-1.5">
        <button
          type="button"
          onClick={() => wrapSelection('b')}
          className="px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-900 dark:text-white text-xs font-bold hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          title="Negrito - selecione o texto primeiro"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('i')}
          className="px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-900 dark:text-white text-xs italic hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          title="Itálico - selecione o texto primeiro"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => wrapSelection('u')}
          className="px-2 py-1 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded text-neutral-900 dark:text-white text-xs underline hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          title="Sublinhado - selecione o texto primeiro"
        >
          U
        </button>
        <span className="text-neutral-400 dark:text-neutral-600 text-[10px] ml-1">Selecione o texto e clique</span>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg py-2 px-3 text-neutral-900 dark:text-white text-sm focus:outline-none focus:border-brand-500 transition-all resize-none font-mono"
      />
    </div>
  );
}

function BannerPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <RichTextEditor label="Texto" value={props.text || ''} onChange={(v) => onUpdate({ text: v })} />
      <PropColor label="Cor de fundo" value={props.backgroundColor || '#DBEAFE'} onChange={(v) => onUpdate({ backgroundColor: v })} />
      <PropColor label="Cor do texto" value={props.textColor || '#000000'} onChange={(v) => onUpdate({ textColor: v })} />
      <PropSelect
        label="Ícone"
        value={props.icon ?? 'info'}
        onChange={(v) => onUpdate({ icon: v })}
        options={[
          { value: '', label: 'Nenhum' },
          { value: 'info', label: 'Info' },
          { value: 'warning', label: 'Alerta' },
          { value: 'success', label: 'Sucesso' },
          { value: 'lock', label: 'Cadeado' },
        ]}
      />
      {props.icon && (
        <PropColor label="Cor do ícone (vazio = cor do texto)" value={props.iconColor || ''} onChange={(v) => onUpdate({ iconColor: v })} />
      )}
      <PropToggle label="Largura total (lateral a lateral)" value={props.fullWidth ?? false} onChange={(v) => onUpdate({ fullWidth: v })} />
    </div>
  );
}

function TextPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <RichTextEditor label="Conteúdo" value={props.content || ''} onChange={(v) => onUpdate({ content: v })} />
      <PropSelect
        label="Alinhamento"
        value={props.alignment || 'left'}
        onChange={(v) => onUpdate({ alignment: v })}
        options={[
          { value: 'left', label: 'Esquerda' },
          { value: 'center', label: 'Centro' },
          { value: 'right', label: 'Direita' },
        ]}
      />
      <PropInput label="Tamanho da fonte" value={props.fontSize || '14px'} onChange={(v) => onUpdate({ fontSize: v })} placeholder="14px" />
      <PropSelect
        label="Peso da fonte"
        value={props.fontWeight || '400'}
        onChange={(v) => onUpdate({ fontWeight: v })}
        options={[
          { value: '400', label: 'Normal' },
          { value: '500', label: 'Medium' },
          { value: '600', label: 'Semibold' },
          { value: '700', label: 'Bold' },
        ]}
      />
      <PropColor label="Cor" value={props.color || ''} onChange={(v) => onUpdate({ color: v })} />
    </div>
  );
}

function ImagePropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <ImageUpload label="Imagem" value={props.src || ''} onChange={(v) => onUpdate({ src: v })} placeholder="URL ou faça upload" />
      <PropInput label="Texto alternativo" value={props.alt || ''} onChange={(v) => onUpdate({ alt: v })} />
      <PropToggle label="Largura total (lateral a lateral)" value={props.fullWidth ?? false} onChange={(v) => onUpdate({ fullWidth: v })} />
      {!props.fullWidth && (
        <PropInput label="Largura" value={props.width || '100%'} onChange={(v) => onUpdate({ width: v })} placeholder="100%" />
      )}
      <PropInput label="Altura" value={props.height || 'auto'} onChange={(v) => onUpdate({ height: v })} placeholder="auto" />
      {!props.fullWidth && (
        <PropInput label="Border radius" value={props.borderRadius || '12px'} onChange={(v) => onUpdate({ borderRadius: v })} />
      )}
      <PropSelect
        label="Ajuste"
        value={props.objectFit || 'contain'}
        onChange={(v) => onUpdate({ objectFit: v })}
        options={[
          { value: 'contain', label: 'Conter' },
          { value: 'cover', label: 'Cobrir' },
          { value: 'fill', label: 'Esticar' },
        ]}
      />
    </div>
  );
}

function FormPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  const fields = props.fields || [];

  const updateField = (index: number, data: Record<string, any>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...data };
    onUpdate({ fields: newFields });
  };

  const addField = () => {
    const id = `custom_${Date.now()}`;
    onUpdate({
      fields: [...fields, {
        id,
        name: id,
        label: 'Novo campo',
        type: 'text',
        placeholder: '',
        required: false,
        enabled: true,
        icon: 'user',
      }],
    });
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_: any, i: number) => i !== index);
    onUpdate({ fields: newFields });
  };

  return (
    <div className="space-y-3">
      <PropInput label="Título" value={props.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <PropToggle label="Mostrar ícone do título" value={props.showTitleIcon ?? true} onChange={(v) => onUpdate({ showTitleIcon: v })} />
      {(props.showTitleIcon ?? true) && (
        <PropColor label="Cor do ícone" value={props.titleIconColor || '#2957A4'} onChange={(v) => onUpdate({ titleIconColor: v })} />
      )}
      <PropToggle label="Mostrar ícones nos inputs" value={props.showInputIcons ?? true} onChange={(v) => onUpdate({ showInputIcons: v })} />
      <PropToggle label="Checkbox 'Não tenho email'" value={props.showNoEmailCheckbox ?? true} onChange={(v) => onUpdate({ showNoEmailCheckbox: v })} />
      {props.showNoEmailCheckbox && (
        <>
          <PropInput label="Label do checkbox" value={props.noEmailLabel || ''} onChange={(v) => onUpdate({ noEmailLabel: v })} />
          <PropColor label="Cor do checkbox (vazio = tema)" value={props.checkboxColor || ''} onChange={(v) => onUpdate({ checkboxColor: v })} />
        </>
      )}

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor do título (vazio = tema)" value={props.titleColor || ''} onChange={(v) => onUpdate({ titleColor: v })} />
      <PropColor label="Cor dos labels (vazio = tema)" value={props.labelColor || ''} onChange={(v) => onUpdate({ labelColor: v })} />
      <PropColor label="Cor do texto do input (vazio = tema)" value={props.inputTextColor || ''} onChange={(v) => onUpdate({ inputTextColor: v })} />
      <PropColor label="Fundo do input (vazio = tema)" value={props.inputBgColor || ''} onChange={(v) => onUpdate({ inputBgColor: v })} />
      <PropColor label="Borda do input (vazio = tema)" value={props.inputBorderColor || ''} onChange={(v) => onUpdate({ inputBorderColor: v })} />
      <PropColor label="Cor de foco (vazio = tema)" value={props.focusColor || ''} onChange={(v) => onUpdate({ focusColor: v })} />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Bordas dos inputs</h4>
      <div>
        {(() => {
          const val = parseInt(props.inputBorderRadius || '0') || 0;
          return (
            <>
              <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">
                Border radius: <span className="text-brand-500">{val === 0 ? 'Padrão (12px)' : `${val}px`}</span>
              </label>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={val}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  onUpdate({ inputBorderRadius: v === 0 ? '' : `${v}px` });
                }}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>Padrão</span>
                <span>24px</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-3">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mb-2">Campos</h4>
        {fields.map((field: any, i: number) => (
          <div key={field.id || i} className="bg-neutral-50 dark:bg-neutral-900 rounded-lg p-3 mb-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-700 dark:text-neutral-300 text-xs font-medium">{field.label}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateField(i, { enabled: !field.enabled })}
                  className={`p-1 rounded text-xs ${field.enabled ? 'text-brand-500 dark:text-brand-400' : 'text-neutral-400 dark:text-neutral-500'}`}
                >
                  {field.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button onClick={() => removeField(i)} className="p-1 rounded text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <PropInput label="Label" value={field.label} onChange={(v) => updateField(i, { label: v })} />
            <PropInput label="Placeholder" value={field.placeholder} onChange={(v) => updateField(i, { placeholder: v })} />
            <PropSelect
              label="Tipo"
              value={field.type}
              onChange={(v) => updateField(i, { type: v })}
              options={[
                { value: 'text', label: 'Texto' },
                { value: 'email', label: 'Email' },
                { value: 'tel', label: 'Telefone' },
                { value: 'cpf', label: 'CPF' },
                { value: 'custom', label: 'Customizado' },
              ]}
            />
            <PropToggle label="Obrigatório" value={field.required} onChange={(v) => updateField(i, { required: v })} />
          </div>
        ))}
        <button
          onClick={addField}
          className="w-full py-2 border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg text-neutral-500 dark:text-neutral-400 text-xs hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400 transition-all"
        >
          + Adicionar campo
        </button>
      </div>
    </div>
  );
}

function AddressPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Título" value={props.title || 'Endereço de Entrega'} onChange={(v) => onUpdate({ title: v })} />
      <PropInput label="Placeholder do CEP" value={props.cepPlaceholder || '00000-000'} onChange={(v) => onUpdate({ cepPlaceholder: v })} />
      <PropToggle label="Mostrar complemento" value={props.showComplemento ?? true} onChange={(v) => onUpdate({ showComplemento: v })} />
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Ícones</h4>
      <PropToggle label="Mostrar ícone do título (localizador)" value={props.showTitleIcon ?? true} onChange={(v) => onUpdate({ showTitleIcon: v })} />
      <PropToggle label="Mostrar ícone de busca no CEP" value={props.showCepSearchIcon ?? true} onChange={(v) => onUpdate({ showCepSearchIcon: v })} />
      <PropColor label="Cor do ícone de busca (CEP)" value={props.cepSearchIconColor || ''} onChange={(v) => onUpdate({ cepSearchIconColor: v })} />
      <p className="text-neutral-500 dark:text-neutral-400 text-[11px] mt-1">
        Para editar o bloco "Opções de Frete", clique nele no Passo 2.
      </p>
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor do título (vazio = tema)" value={props.titleColor || ''} onChange={(v) => onUpdate({ titleColor: v })} />
      <PropColor label="Cor do ícone" value={props.iconColor || ''} onChange={(v) => onUpdate({ iconColor: v })} />
      <PropColor label="Cor dos labels (vazio = tema)" value={props.labelColor || ''} onChange={(v) => onUpdate({ labelColor: v })} />
      <PropColor label="Cor do texto dos inputs" value={props.inputTextColor || ''} onChange={(v) => onUpdate({ inputTextColor: v })} />
      <PropColor label="Cor do fundo dos inputs" value={props.inputBgColor || ''} onChange={(v) => onUpdate({ inputBgColor: v })} />
      <PropColor label="Cor da borda dos inputs" value={props.inputBorderColor || ''} onChange={(v) => onUpdate({ inputBorderColor: v })} />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Bordas dos inputs</h4>
      <div>
        {(() => {
          const val = parseInt(props.inputBorderRadius || '0') || 0;
          return (
            <>
              <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">
                Border radius: <span className="text-brand-500">{val === 0 ? 'Padrão (12px)' : `${val}px`}</span>
              </label>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={val}
                onChange={(e) => {
                  const v = parseInt(e.target.value);
                  onUpdate({ inputBorderRadius: v === 0 ? '' : `${v}px` });
                }}
                className="w-full accent-brand-500"
              />
              <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                <span>Padrão</span>
                <span>24px</span>
              </div>
            </>
          );
        })()}
      </div>

      <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <p className="text-blue-400 text-[11px] leading-relaxed">
          Este elemento aparece automaticamente quando o produto principal é do tipo <strong>Físico</strong>. Configure o tipo do produto na aba "Produto".
        </p>
      </div>
    </div>
  );
}

function ShippingBlockPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Título" value={props.shippingBlockTitle || 'Opções de Frete'} onChange={(v) => onUpdate({ shippingBlockTitle: v })} />
      <PropToggle label="Mostrar ícone (caminhão)" value={props.shippingBlockShowIcon ?? true} onChange={(v) => onUpdate({ shippingBlockShowIcon: v })} />
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor do ícone (vazio = tema)" value={props.shippingBlockIconColor || ''} onChange={(v) => onUpdate({ shippingBlockIconColor: v })} />
      <PropColor label="Cor da borda selecionada" value={props.shippingBlockSelectedBorderColor || ''} onChange={(v) => onUpdate({ shippingBlockSelectedBorderColor: v })} />
      <PropColor label="Cor do fundo da opção selecionada" value={props.shippingBlockSelectedBgColor || ''} onChange={(v) => onUpdate({ shippingBlockSelectedBgColor: v })} />
      <PropColor label="Cor do texto das opções" value={props.shippingBlockOptionTextColor || ''} onChange={(v) => onUpdate({ shippingBlockOptionTextColor: v })} />
      <PropColor label="Cor do texto secundário (dias, descrição)" value={props.shippingBlockOptionMutedColor || ''} onChange={(v) => onUpdate({ shippingBlockOptionMutedColor: v })} />
      <PropColor label="Cor do preço (vazio = automático)" value={props.shippingBlockPriceColor || ''} onChange={(v) => onUpdate({ shippingBlockPriceColor: v })} />
    </div>
  );
}

function CartSummaryPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  // Resolve current mode (backwards compat)
  const currentMode: string = props.displayMode
    || (props.collapsible ? (props.defaultOpen === false ? 'collapsible_closed' : 'collapsible') : 'open');

  const modes = [
    { id: 'open', label: 'Sempre aberto' },
    { id: 'collapsible', label: 'Abrir/Fechar (aberto)' },
    { id: 'collapsible_closed', label: 'Abrir/Fechar (fechado)' },
    { id: 'closed', label: 'Sempre fechado' },
  ];

  const customLayout = props.customLayout ?? false;

  return (
    <div className="space-y-3">
      <PropToggle
        label="Personalizar layout e textos"
        value={customLayout}
        onChange={(v) => onUpdate({ customLayout: v })}
      />
      {customLayout ? (
        <>
          <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cabeçalho</h4>
          <ImageUpload label="Logo do cabeçalho" value={props.headerLogoUrl || ''} onChange={(v) => onUpdate({ headerLogoUrl: v })} placeholder="URL ou upload" />
          <PropInput label="Tamanho da logo" value={props.headerLogoSize || '48px'} onChange={(v) => onUpdate({ headerLogoSize: v })} placeholder="ex: 48px, 3rem" />
          <PropInput label="Linha 1 do título" value={props.headerLine1 || ''} onChange={(v) => onUpdate({ headerLine1: v })} placeholder="ex: Texto da linha 1" />
          <PropInput label="Linha 2 do título" value={props.headerLine2 || ''} onChange={(v) => onUpdate({ headerLine2: v })} placeholder="ex: Texto da linha 2" />
          <PropInput label="Linha 3 do título" value={props.headerLine3 || ''} onChange={(v) => onUpdate({ headerLine3: v })} placeholder="ex: Texto da linha 3" />
          <PropColor label="Cor do título do cabeçalho" value={props.headerTextColor || ''} onChange={(v) => onUpdate({ headerTextColor: v })} />
          <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Linhas de valores</h4>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Textos e valores abaixo são apenas visuais. O valor total exibido é sempre o valor real do pedido (usado no PIX).</p>
          <PropInput label="Label da 1ª linha" value={props.subtotalLabel || 'Valor da dívida (4)'} onChange={(v) => onUpdate({ subtotalLabel: v })} placeholder="ex: Valor da dívida (4)" />
          <PropInput label="Valor exibido na 1ª linha" value={props.customSubtotalValue || ''} onChange={(v) => onUpdate({ customSubtotalValue: v })} placeholder="ex: R$ 5.278,23 ou 5.278,23" />
          <PropColor label="Cor do valor da 1ª linha" value={props.subtotalValueColor || ''} onChange={(v) => onUpdate({ subtotalValueColor: v })} />
          <PropToggle label="Mostrar linha de desconto" value={props.showDiscountRow ?? false} onChange={(v) => onUpdate({ showDiscountRow: v })} />
          {(props.showDiscountRow ?? false) && (
            <>
              <PropInput label="Label do desconto" value={props.discountLabel || 'Desconto de 98,69%'} onChange={(v) => onUpdate({ discountLabel: v })} placeholder="ex: Desconto de 98,69%" />
              <PropInput label="Valor exibido do desconto" value={props.customDiscountValue || ''} onChange={(v) => onUpdate({ customDiscountValue: v })} placeholder="ex: - R$ 5.209,31" />
              <PropColor label="Cor do valor do desconto" value={props.discountValueColor || ''} onChange={(v) => onUpdate({ discountValueColor: v })} />
            </>
          )}
          <PropToggle label="Mostrar frete" value={props.showShipping ?? true} onChange={(v) => onUpdate({ showShipping: v })} />
          <PropInput label="Label frete" value={props.shippingLabel || 'Frete'} onChange={(v) => onUpdate({ shippingLabel: v })} />
          <PropColor label="Cor do valor do frete" value={props.shippingValueColor || ''} onChange={(v) => onUpdate({ shippingValueColor: v })} />
          <PropInput label="Label total" value={props.totalLabel || 'Valor total'} onChange={(v) => onUpdate({ totalLabel: v })} />
          <PropColor label="Cor do valor total" value={props.totalValueColor || ''} onChange={(v) => onUpdate({ totalValueColor: v })} />
          <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">Card</h4>
          <PropColor label="Cor do fundo" value={props.cardBgColor || ''} onChange={(v) => onUpdate({ cardBgColor: v })} />
          <PropColor label="Cor da borda" value={props.cardBorderColor || ''} onChange={(v) => onUpdate({ cardBorderColor: v })} />
          <PropColor label="Cor dos labels" value={props.labelColor || ''} onChange={(v) => onUpdate({ labelColor: v })} />
        </>
      ) : (
        <>
          <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Exibição do carrinho</h4>
          <div className="grid grid-cols-2 gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onUpdate({ displayMode: mode.id, collapsible: undefined, defaultOpen: undefined })}
                className={`py-2 px-2 rounded-lg border text-[11px] font-medium transition-all leading-tight ${
                  currentMode === mode.id
                    ? 'bg-brand-500/15 border-brand-500 text-brand-500 dark:text-brand-400'
                    : 'border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {(currentMode === 'collapsible' || currentMode === 'collapsible_closed') && (
            <>
              <PropInput label="Título do header" value={props.title || 'Resumo do pedido'} onChange={(v) => onUpdate({ title: v })} placeholder="Resumo do pedido" />
              <PropToggle label="Mostrar título quando aberto" value={props.showHeaderWhenOpen ?? true} onChange={(v) => onUpdate({ showHeaderWhenOpen: v })} />
            </>
          )}
          {currentMode === 'closed' && (
            <PropInput label="Texto exibido" value={props.closedText || ''} onChange={(v) => onUpdate({ closedText: v })} placeholder="Ex: Resumo do pedido" />
          )}

          <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Conteúdo</h4>
          {currentMode === 'open' && (
            <>
              <PropToggle label="Mostrar título" value={props.showTitle ?? false} onChange={(v) => onUpdate({ showTitle: v })} />
              {(props.showTitle ?? false) && (
                <PropInput label="Título" value={props.title || 'Seu carrinho'} onChange={(v) => onUpdate({ title: v })} />
              )}
            </>
          )}
          <PropToggle label="Mostrar nome do produto" value={props.showProductName ?? true} onChange={(v) => onUpdate({ showProductName: v })} />
          <PropToggle label="Mostrar imagem do produto" value={props.showProductImage ?? false} onChange={(v) => onUpdate({ showProductImage: v })} />
          {(props.showProductImage ?? false) && (
            <ImageUpload label="Imagem do produto" value={props.productImageUrl || ''} onChange={(v) => onUpdate({ productImageUrl: v })} placeholder="URL ou faça upload" />
          )}
          <PropToggle label="Mostrar descrição do produto" value={props.showProductDescription ?? false} onChange={(v) => onUpdate({ showProductDescription: v })} />
          <PropToggle label="Seletor de quantidade" value={props.showQuantitySelector ?? false} onChange={(v) => onUpdate({ showQuantitySelector: v })} />
          {!(props.showQuantitySelector ?? false) && (
            <>
              <PropToggle label="Mostrar quantidade" value={props.showQuantity ?? true} onChange={(v) => onUpdate({ showQuantity: v })} />
              <PropInput label="Label quantidade" value={props.quantityLabel || '1 un.'} onChange={(v) => onUpdate({ quantityLabel: v })} />
            </>
          )}
          <PropInput label="Label subtotal" value={props.subtotalLabel || 'Subtotal'} onChange={(v) => onUpdate({ subtotalLabel: v })} />
          <PropInput label="Label total" value={props.totalLabel || 'Total'} onChange={(v) => onUpdate({ totalLabel: v })} />
          <PropToggle label="Mostrar frete" value={props.showShipping ?? true} onChange={(v) => onUpdate({ showShipping: v })} />
          <PropInput label="Label frete" value={props.shippingLabel || 'Frete'} onChange={(v) => onUpdate({ shippingLabel: v })} />

          <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">Cores</h4>
          <PropColor label="Cor do fundo" value={props.cardBgColor || ''} onChange={(v) => onUpdate({ cardBgColor: v })} />
          <PropColor label="Cor da borda" value={props.cardBorderColor || ''} onChange={(v) => onUpdate({ cardBorderColor: v })} />
          <PropColor label="Cor do título" value={props.titleColor || ''} onChange={(v) => onUpdate({ titleColor: v })} />
          <PropColor label="Cor do texto do produto" value={props.productTextColor || ''} onChange={(v) => onUpdate({ productTextColor: v })} />
          <PropColor label="Cor dos labels (subtotal, frete)" value={props.labelColor || ''} onChange={(v) => onUpdate({ labelColor: v })} />
          <PropColor label="Cor dos valores" value={props.valueTextColor || ''} onChange={(v) => onUpdate({ valueTextColor: v })} />
          <PropColor label="Cor do valor total" value={props.totalColor || ''} onChange={(v) => onUpdate({ totalColor: v })} />
        </>
      )}
    </div>
  );
}

function PaymentPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Título" value={props.title || ''} onChange={(v) => onUpdate({ title: v })} />
      <PropTextarea label="Descrição" value={props.description || ''} onChange={(v) => onUpdate({ description: v })} />
      <PropToggle label="Mostrar logo PIX" value={props.showPixLogo ?? true} onChange={(v) => onUpdate({ showPixLogo: v })} />
      <ImageUpload label="Logo PIX" value={props.pixLogoUrl || ''} onChange={(v) => onUpdate({ pixLogoUrl: v })} placeholder="URL ou faça upload" />
      <PropInput label="Tamanho do logo PIX" value={props.pixLogoSize || '40px'} onChange={(v) => onUpdate({ pixLogoSize: v })} placeholder="40px" />
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor do título (vazio = tema)" value={props.titleColor || ''} onChange={(v) => onUpdate({ titleColor: v })} />
      <PropColor label="Cor da descrição (vazio = tema)" value={props.descriptionColor || ''} onChange={(v) => onUpdate({ descriptionColor: v })} />
      <PropColor label="Fundo da caixa interna" value={props.innerBgColor || ''} onChange={(v) => onUpdate({ innerBgColor: v })} />
      <PropColor label="Borda da caixa interna" value={props.innerBorderColor || ''} onChange={(v) => onUpdate({ innerBorderColor: v })} />
    </div>
  );
}

function TimerPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  const position = props.timerPosition || 'inline';
  return (
    <div className="space-y-3">
      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Posição</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { id: 'inline', label: 'Padrão (no fluxo da página)' },
            { id: 'sticky_top', label: 'Fixo no topo da tela' },
            { id: 'sticky_bottom', label: 'Fixo na base da tela' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onUpdate({ timerPosition: opt.id })}
              className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-left ${
                position === opt.id
                  ? 'bg-brand-500/15 border-brand-500 text-brand-500 dark:text-brand-400'
                  : 'border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
          {position === 'sticky_top' && 'O timer permanece visível no topo ao rolar a página.'}
          {position === 'sticky_bottom' && 'O timer permanece visível na base ao rolar a página.'}
          {position === 'inline' && 'O timer aparece no lugar em que foi posicionado no layout.'}
        </p>
      </div>
      <PropInput label="Minutos" type="number" value={String(props.minutes || 30)} onChange={(v) => onUpdate({ minutes: parseInt(v) || 30 })} />
      <PropColor label="Cor de fundo" value={props.backgroundColor || '#ef4444'} onChange={(v) => onUpdate({ backgroundColor: v })} />
      <PropColor label="Cor do texto" value={props.textColor || '#ffffff'} onChange={(v) => onUpdate({ textColor: v })} />
      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Transparência</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={typeof props.opacity === 'number' ? Math.round(props.opacity * 100) : 100}
            onChange={(e) => {
              const pct = parseInt(e.target.value, 10);
              onUpdate({ opacity: pct === 100 ? undefined : pct / 100 });
            }}
            className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400 w-10">
            {typeof props.opacity === 'number' ? Math.round(props.opacity * 100) : 100}%
          </span>
        </div>
        <p className="text-[10px] text-neutral-400 mt-0.5">0% = invisível, 100% = opaco (padrão)</p>
      </div>
      <PropInput label="Label" value={props.label || ''} onChange={(v) => onUpdate({ label: v })} />
      <PropToggle label="Mostrar ícone" value={props.showIcon ?? true} onChange={(v) => onUpdate({ showIcon: v })} />
    </div>
  );
}

function ButtonPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Texto" value={props.text || ''} onChange={(v) => onUpdate({ text: v })} />
      <PropInput label="Texto carregando" value={props.loadingText || ''} onChange={(v) => onUpdate({ loadingText: v })} />
      <PropColor label="Cor de fundo (vazio = tema)" value={props.backgroundColor || ''} onChange={(v) => onUpdate({ backgroundColor: v })} />
      <PropColor label="Cor do texto (vazio = tema)" value={props.textColor || ''} onChange={(v) => onUpdate({ textColor: v })} />
      <PropInput label="Tamanho fonte" value={props.fontSize || '16px'} onChange={(v) => onUpdate({ fontSize: v })} />
      <PropInput label="Padding vertical" value={props.paddingY || '16px'} onChange={(v) => onUpdate({ paddingY: v })} />
      <PropInput label="Border radius" value={props.borderRadius || '16px'} onChange={(v) => onUpdate({ borderRadius: v })} />
      <PropToggle label="Efeito glow" value={props.showGlow ?? true} onChange={(v) => onUpdate({ showGlow: v })} />
    </div>
  );
}

function DividerPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Espessura" value={props.thickness || '1px'} onChange={(v) => onUpdate({ thickness: v })} />
      <PropColor label="Cor (vazio = tema)" value={props.color || ''} onChange={(v) => onUpdate({ color: v })} />
      <PropInput label="Margem vertical" value={props.marginY || '8px'} onChange={(v) => onUpdate({ marginY: v })} />
    </div>
  );
}

function SpacerPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Altura" value={props.height || '20px'} onChange={(v) => onUpdate({ height: v })} />
    </div>
  );
}

function TestimonialPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Nome" value={props.name || ''} onChange={(v) => onUpdate({ name: v })} />
      <PropTextarea label="Texto" value={props.text || ''} onChange={(v) => onUpdate({ text: v })} />
      <PropSelect
        label="Avaliação"
        value={String(props.rating || 5)}
        onChange={(v) => onUpdate({ rating: parseInt(v) })}
        options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${'★'.repeat(n)}${'☆'.repeat(5 - n)}` }))}
      />
      <ImageUpload label="Avatar" value={props.avatarUrl || ''} onChange={(v) => onUpdate({ avatarUrl: v })} placeholder="URL ou upload (vazio = inicial do nome)" />
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor de fundo" value={props.backgroundColor || ''} onChange={(v) => onUpdate({ backgroundColor: v })} />
      <PropColor label="Cor da borda (vazio = tema)" value={props.borderColorProp || ''} onChange={(v) => onUpdate({ borderColorProp: v })} />
      <PropColor label="Cor do texto (vazio = tema)" value={props.textColorProp || ''} onChange={(v) => onUpdate({ textColorProp: v })} />
      <PropColor label="Cor do nome (vazio = tema)" value={props.nameColor || ''} onChange={(v) => onUpdate({ nameColor: v })} />
      <PropColor label="Cor das estrelas" value={props.starColor || '#f59e0b'} onChange={(v) => onUpdate({ starColor: v })} />
    </div>
  );
}

function SecurityBadgePropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Texto" value={props.text || ''} onChange={(v) => onUpdate({ text: v })} />
      <PropSelect
        label="Ícone"
        value={props.icon || 'shield'}
        onChange={(v) => onUpdate({ icon: v })}
        options={[
          { value: 'shield', label: 'Escudo' },
          { value: 'shield-check', label: 'Escudo check' },
          { value: 'lock', label: 'Cadeado' },
        ]}
      />
      <PropSelect
        label="Variante"
        value={props.variant || 'simple'}
        onChange={(v) => onUpdate({ variant: v })}
        options={[
          { value: 'simple', label: 'Simples' },
          { value: 'outlined', label: 'Borda' },
          { value: 'filled', label: 'Preenchido' },
        ]}
      />
      <PropToggle label="Mostrar imagem" value={props.showImage ?? true} onChange={(v) => onUpdate({ showImage: v })} />
      {props.showImage && (
        <ImageUpload label="Imagem" value={props.imageUrl || ''} onChange={(v) => onUpdate({ imageUrl: v })} placeholder="URL ou faça upload" />
      )}
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor do ícone (vazio = tema)" value={props.iconColor || ''} onChange={(v) => onUpdate({ iconColor: v })} />
      <PropColor label="Cor do texto (vazio = tema)" value={props.textColorProp || ''} onChange={(v) => onUpdate({ textColorProp: v })} />

      {/* Popup de Segurança */}
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">Pop-up de Segurança</h4>
      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 -mt-1">Aparece quando o cliente clica no badge</p>
      <PropInput
        label="Título do pop-up"
        value={props.popupTitle || 'Não se preocupe,\naqui é **seguro!**'}
        onChange={(v) => onUpdate({ popupTitle: v })}
        placeholder="Não se preocupe, aqui é **seguro!**"
      />
      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 -mt-1">Use **texto** para negrito e \n para quebra de linha</p>
      <PropInput
        label="Descrição"
        value={props.popupDescription || ''}
        onChange={(v) => onUpdate({ popupDescription: v })}
        placeholder="A loja que você está comprando..."
      />
      <PropInput
        label="Texto do botão"
        value={props.popupButtonText || 'Estou seguro, quero comprar!'}
        onChange={(v) => onUpdate({ popupButtonText: v })}
        placeholder="Estou seguro, quero comprar!"
      />
      <PropColor label="Cor do botão (vazio = tema)" value={props.popupButtonColor || ''} onChange={(v) => onUpdate({ popupButtonColor: v })} />
      <PropColor label="Cor do texto do botão" value={props.popupButtonTextColor || '#ffffff'} onChange={(v) => onUpdate({ popupButtonTextColor: v })} />
      <PropColor label="Cor dos ícones do pop-up (vazio = tema)" value={props.popupIconColor || ''} onChange={(v) => onUpdate({ popupIconColor: v })} />
    </div>
  );
}

function PaymentMethodsPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <PropInput label="Título" value={props.title || ''} onChange={(v) => onUpdate({ title: v })} placeholder="Formas de pagamento" />
      <PropToggle label="Mostrar ícone PIX" value={props.showPixIcon ?? true} onChange={(v) => onUpdate({ showPixIcon: v })} />
      {(props.showPixIcon ?? true) && (
        <>
          <ImageUpload label="Ícone PIX" value={props.pixIconUrl || ''} onChange={(v) => onUpdate({ pixIconUrl: v })} placeholder="URL ou faça upload" />
          <PropInput label="Tamanho do ícone PIX" value={props.pixIconSize || '40px'} onChange={(v) => onUpdate({ pixIconSize: v })} placeholder="40px" />
        </>
      )}
      <PropToggle label="Mostrar texto do rodapé" value={props.showFooterText ?? true} onChange={(v) => onUpdate({ showFooterText: v })} />
      {(props.showFooterText ?? true) && (
        <PropInput label="Texto do rodapé" value={props.footerText || ''} onChange={(v) => onUpdate({ footerText: v })} placeholder="© 2025 Formas de pagamento" />
      )}
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-2">Cores</h4>
      <PropColor label="Cor do título (vazio = tema)" value={props.titleColor || ''} onChange={(v) => onUpdate({ titleColor: v })} />
      <PropColor label="Cor do rodapé (vazio = tema)" value={props.footerColor || ''} onChange={(v) => onUpdate({ footerColor: v })} />
    </div>
  );
}

export function PixPagePropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  const instructions: string[] = props.instructions || [
    'Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.',
    'Escolha a opção PIX Copia e Cola e insira o código copiado.',
    'Confirme as informações e finalize sua compra.',
  ];

  const updateInstruction = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    onUpdate({ instructions: newInstructions });
  };

  const addInstruction = () => {
    onUpdate({ instructions: [...instructions, 'Nova instrução'] });
  };

  const removeInstruction = (index: number) => {
    onUpdate({ instructions: instructions.filter((_: string, i: number) => i !== index) });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Cabeçalho</h4>
      <ImageUpload label="Logo (substitui o ícone)" value={props.headerLogoUrl || ''} onChange={(v) => onUpdate({ headerLogoUrl: v })} placeholder="URL ou upload" />
      <PropInput label="Tamanho da logo" value={props.headerLogoSize || '56px'} onChange={(v) => onUpdate({ headerLogoSize: v })} placeholder="ex: 56px" />
      <PropInput label="Título" value={props.headerTitle || ''} onChange={(v) => onUpdate({ headerTitle: v })} placeholder="Falta pouco!" />
      <PropInput label="Subtítulo" value={props.headerSubtitle || ''} onChange={(v) => onUpdate({ headerSubtitle: v })} placeholder="Para finalizar..." />
      <PropToggle label="Mostrar QR Code" value={props.showQrCode ?? true} onChange={(v) => onUpdate({ showQrCode: v })} />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Botão copiar</h4>
      <PropInput label="Texto do botão" value={props.copyButtonText || ''} onChange={(v) => onUpdate({ copyButtonText: v })} placeholder="COPIAR CÓDIGO" />
      <PropInput label="Texto copiado" value={props.copiedButtonText || ''} onChange={(v) => onUpdate({ copiedButtonText: v })} placeholder="CÓDIGO COPIADO!" />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Valor e segurança</h4>
      <PropInput label="Label do valor" value={props.valueLabelText || ''} onChange={(v) => onUpdate({ valueLabelText: v })} placeholder="Valor a ser pago:" />
      <PropTextarea label="Mensagem de segurança" value={props.securityMessage || ''} onChange={(v) => onUpdate({ securityMessage: v })} />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Instruções</h4>
      <PropToggle label="Mostrar instruções" value={props.showInstructions ?? true} onChange={(v) => onUpdate({ showInstructions: v })} />
      {(props.showInstructions ?? true) && (
        <>
          <PropInput label="Título das instruções" value={props.instructionTitle || ''} onChange={(v) => onUpdate({ instructionTitle: v })} placeholder="Instruções para pagamento" />
          {instructions.map((inst: string, i: number) => (
            <div key={i} className="flex gap-1.5 items-start">
              <div className="flex-1">
                <PropInput label={`Passo ${i + 1}`} value={inst} onChange={(v) => updateInstruction(i, v)} />
              </div>
              {instructions.length > 1 && (
                <button onClick={() => removeInstruction(i)} className="text-red-400 hover:text-red-300 text-xs mt-6 px-1">✕</button>
              )}
            </div>
          ))}
          <button onClick={addInstruction} className="text-brand-500 hover:text-brand-400 text-xs">+ Adicionar passo</button>
        </>
      )}

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Detalhes da compra</h4>
      <PropToggle label="Mostrar detalhes" value={props.showPurchaseDetails ?? true} onChange={(v) => onUpdate({ showPurchaseDetails: v })} />
      {(props.showPurchaseDetails ?? true) && (
        <PropInput label="Título detalhes" value={props.purchaseDetailsTitle || ''} onChange={(v) => onUpdate({ purchaseDetailsTitle: v })} placeholder="Detalhes da compra:" />
      )}

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Rodapé</h4>
      <PropToggle label="Mostrar link de ajuda" value={props.showHelpLink ?? true} onChange={(v) => onUpdate({ showHelpLink: v })} />
      {(props.showHelpLink ?? true) && (
        <PropInput label="Texto do link" value={props.helpLinkText || ''} onChange={(v) => onUpdate({ helpLinkText: v })} />
      )}

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Tela de redirecionamento (após pagamento)</h4>
      <PropInput label="Título" value={props.confirmedTitle || ''} onChange={(v) => onUpdate({ confirmedTitle: v })} placeholder="Pagamento Confirmado!" />
      <PropInput label="Subtítulo" value={props.confirmedSubtitle || ''} onChange={(v) => onUpdate({ confirmedSubtitle: v })} placeholder="Seu pagamento foi recebido. Obrigado!" />
      <PropInput label="Mensagem de redirecionamento" value={props.redirectMessage || ''} onChange={(v) => onUpdate({ redirectMessage: v })} placeholder="Redirecionando automaticamente..." />
      <PropInput label="Logo (URL)" value={props.redirectScreenLogoUrl || ''} onChange={(v) => onUpdate({ redirectScreenLogoUrl: v })} placeholder="URL da logo (vazio = ícone padrão)" />
      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Tempo antes do redirect (segundos)</label>
        <input
          type="number"
          min="0.5"
          max="10"
          step="0.5"
          value={typeof props.redirectDelaySeconds === 'number' ? props.redirectDelaySeconds : 0.8}
          onChange={(e) => onUpdate({ redirectDelaySeconds: parseFloat(e.target.value) || 0.8 })}
          className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 text-sm text-neutral-900 dark:text-white"
        />
      </div>

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">Timer</h4>
      <PropInput label="Duração exibida (minutos)" type="number" value={String(props.timerDisplayMinutes || '')} onChange={(v) => onUpdate({ timerDisplayMinutes: v ? parseInt(v, 10) || 0 : 0 })} placeholder="ex: 30 (vazio = tempo real da API)" />
      <PropToggle label="Centralizar timer" value={props.timerCenter !== false} onChange={(v) => onUpdate({ timerCenter: v })} />
      <PropInput label="Texto do timer" value={props.timerLabel || 'Sua oferta termina em:'} onChange={(v) => onUpdate({ timerLabel: v })} placeholder="Sua oferta termina em:" />
      <PropToggle label="Mostrar ícone do timer" value={props.showTimerIcon ?? true} onChange={(v) => onUpdate({ showTimerIcon: v })} />
      <PropColor label="Cor do texto e ícone" value={props.timerColor || ''} onChange={(v) => onUpdate({ timerColor: v })} />
      <PropColor label="Cor de fundo" value={props.timerBgColor || ''} onChange={(v) => onUpdate({ timerBgColor: v })} />
      <PropColor label="Cor da borda" value={props.timerBorderColor || ''} onChange={(v) => onUpdate({ timerBorderColor: v })} />
      <PropInput label="Border radius do timer" value={props.timerBorderRadius || ''} onChange={(v) => onUpdate({ timerBorderRadius: v })} placeholder="ex: 12px (vazio = tema)" />
      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">Transparência do timer</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={typeof props.timerOpacity === 'number' ? Math.round(props.timerOpacity * 100) : 100}
            onChange={(e) => {
              const pct = parseInt(e.target.value, 10);
              onUpdate({ timerOpacity: pct === 100 ? undefined : pct / 100 });
            }}
            className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-brand-500"
          />
          <span className="text-xs text-neutral-500 dark:text-neutral-400 w-10">
            {typeof props.timerOpacity === 'number' ? Math.round(props.timerOpacity * 100) : 100}%
          </span>
        </div>
      </div>

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Cores gerais</h4>
      <PropColor label="Cor do ícone do cabeçalho" value={props.headerIconColor || ''} onChange={(v) => onUpdate({ headerIconColor: v })} />
      <PropColor label="Cor do título" value={props.titleColor || ''} onChange={(v) => onUpdate({ titleColor: v })} />
      <PropColor label="Cor do subtítulo" value={props.subtitleColor || ''} onChange={(v) => onUpdate({ subtitleColor: v })} />
      <PropColor label="Cor do botão copiar" value={props.copyButtonBgColor || ''} onChange={(v) => onUpdate({ copyButtonBgColor: v })} />
      <PropColor label="Cor do texto do botão" value={props.copyButtonTextColor || ''} onChange={(v) => onUpdate({ copyButtonTextColor: v })} />
      <PropColor label="Cor do valor" value={props.valueColor || ''} onChange={(v) => onUpdate({ valueColor: v })} />
      <PropColor label="Cor do fundo do valor" value={props.valueBgColor || ''} onChange={(v) => onUpdate({ valueBgColor: v })} />
      <PropColor label="Cor dos números das instruções" value={props.instructionNumberColor || ''} onChange={(v) => onUpdate({ instructionNumberColor: v })} />
      <PropColor label="Cor do texto das instruções" value={props.instructionTextColor || ''} onChange={(v) => onUpdate({ instructionTextColor: v })} />
      <PropColor label="Cor do card (fundo)" value={props.cardBgColor || ''} onChange={(v) => onUpdate({ cardBgColor: v })} />
      <PropColor label="Cor da borda" value={props.cardBorderColor || ''} onChange={(v) => onUpdate({ cardBorderColor: v })} />
    </div>
  );
}

// Styles editor (common for all elements)
const FONT_FAMILIES = [
  { value: '', label: 'Padrão (herda do tema)' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
  { value: 'Montserrat, sans-serif', label: 'Montserrat' },
  { value: 'Poppins, sans-serif', label: 'Poppins' },
  { value: 'Nunito, sans-serif', label: 'Nunito' },
  { value: 'Raleway, sans-serif', label: 'Raleway' },
  { value: 'Oswald, sans-serif', label: 'Oswald' },
  { value: 'Playfair Display, serif', label: 'Playfair Display' },
  { value: 'Merriweather, serif', label: 'Merriweather' },
  { value: 'Source Sans 3, sans-serif', label: 'Source Sans 3' },
  { value: 'DM Sans, sans-serif', label: 'DM Sans' },
  { value: 'Space Grotesk, sans-serif', label: 'Space Grotesk' },
  { value: 'Plus Jakarta Sans, sans-serif', label: 'Plus Jakarta Sans' },
  { value: 'Sora, sans-serif', label: 'Sora' },
];

function StylesEditor({
  styles,
  onUpdate,
}: {
  styles: Record<string, any>;
  onUpdate: (s: Record<string, any>) => void;
}) {
  // Parse values for range sliders
  const marginBottomPx = parseInt(styles.marginBottom || '0') || 0;
  const fontSizePx = parseInt(styles.fontSize || '0') || 0;
  const borderRadiusPx = parseInt(styles.borderRadius || '0') || 0;

  return (
    <div className="space-y-3">
      {/* Typography */}
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Tipografia</h4>

      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1.5 block">Fonte</label>
        <select
          value={styles.fontFamily || ''}
          onChange={(e) => onUpdate({ fontFamily: e.target.value || undefined })}
          className="w-full text-xs py-2 px-2.5 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
          style={{ fontFamily: styles.fontFamily || 'inherit' }}
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value || 'inherit' }}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">
          Tamanho da fonte: <span className="text-brand-500">{fontSizePx === 0 ? 'Padrão' : `${fontSizePx}px`}</span>
        </label>
        <input
          type="range"
          min="0"
          max="48"
          step="1"
          value={fontSizePx}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            onUpdate({ fontSize: v === 0 ? undefined : `${v}px` });
          }}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
          <span>Padrão</span>
          <span>48px</span>
        </div>
      </div>

      {/* Quick spacing control */}
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-1">Espaçamento</h4>
      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">
          Distância para o próximo elemento: <span className="text-brand-500">{marginBottomPx}px</span>
        </label>
        <input
          type="range"
          min="0"
          max="60"
          step="2"
          value={marginBottomPx}
          onChange={(e) => onUpdate({ marginBottom: `${e.target.value}px` })}
          className="w-full accent-brand-500"
        />
      </div>

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Margem externa</h4>
      <div className="grid grid-cols-2 gap-2">
        <PropInput label="Topo" value={styles.marginTop || ''} onChange={(v) => onUpdate({ marginTop: v })} placeholder="0px" />
        <PropInput label="Inferior" value={styles.marginBottom || ''} onChange={(v) => onUpdate({ marginBottom: v })} placeholder="0px" />
      </div>

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Espaçamento interno</h4>
      <div className="grid grid-cols-2 gap-2">
        <PropInput label="Topo" value={styles.paddingTop || ''} onChange={(v) => onUpdate({ paddingTop: v })} placeholder="0px" />
        <PropInput label="Inferior" value={styles.paddingBottom || ''} onChange={(v) => onUpdate({ paddingBottom: v })} placeholder="0px" />
        <PropInput label="Esquerda" value={styles.paddingLeft || ''} onChange={(v) => onUpdate({ paddingLeft: v })} placeholder="0px" />
        <PropInput label="Direita" value={styles.paddingRight || ''} onChange={(v) => onUpdate({ paddingRight: v })} placeholder="0px" />
      </div>

      <PropColor label="Cor de fundo" value={styles.backgroundColor || ''} onChange={(v) => onUpdate({ backgroundColor: v })} />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-1">Bordas</h4>
      <div>
        <label className="text-neutral-600 dark:text-neutral-400 text-xs font-medium mb-1 block">
          Border radius: <span className="text-brand-500">{borderRadiusPx === 0 ? 'Padrão (tema)' : `${borderRadiusPx}px`}</span>
        </label>
        <input
          type="range"
          min="0"
          max="40"
          step="1"
          value={borderRadiusPx}
          onChange={(e) => {
            const v = parseInt(e.target.value);
            onUpdate({ borderRadius: v === 0 ? undefined : `${v}px` });
          }}
          className="w-full accent-brand-500"
        />
        <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
          <span>Tema</span>
          <span>40px</span>
        </div>
      </div>
    </div>
  );
}

function StepIndicatorPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  return (
    <div className="space-y-3">
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Labels dos passos</h4>
      <PropInput label="Passo 1" value={props.step1Label || 'Identificação'} onChange={(v) => onUpdate({ step1Label: v })} placeholder="Identificação" />
      <PropInput label="Passo 2" value={props.step2Label || 'Endereço'} onChange={(v) => onUpdate({ step2Label: v })} placeholder="Endereço" />
      <PropInput label="Passo 3" value={props.step3Label || 'Pagamento'} onChange={(v) => onUpdate({ step3Label: v })} placeholder="Pagamento" />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Cores</h4>
      <PropColor label="Cor ativo (vazio = tema)" value={props.activeColor || ''} onChange={(v) => onUpdate({ activeColor: v })} />
      <PropColor label="Cor concluído (vazio = tema)" value={props.completedColor || ''} onChange={(v) => onUpdate({ completedColor: v })} />
      <PropColor label="Cor inativo (vazio = tema)" value={props.inactiveColor || ''} onChange={(v) => onUpdate({ inactiveColor: v })} />
      <PropColor label="Cor do label ativo (vazio = tema)" value={props.labelColor || ''} onChange={(v) => onUpdate({ labelColor: v })} />

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Tamanhos</h4>
      <PropInput label="Tamanho do círculo" value={props.circleSize || '32px'} onChange={(v) => onUpdate({ circleSize: v })} placeholder="32px" />
      <PropInput label="Tamanho do texto" value={props.fontSize || '11px'} onChange={(v) => onUpdate({ fontSize: v })} placeholder="11px" />
      <PropToggle label="Mostrar linhas conectoras" value={props.showConnectors ?? true} onChange={(v) => onUpdate({ showConnectors: v })} />
      {(props.showConnectors ?? true) && (
        <PropInput label="Largura da linha" value={props.connectorWidth || '48px'} onChange={(v) => onUpdate({ connectorWidth: v })} placeholder="48px" />
      )}
    </div>
  );
}

function OrderBumpPropsEditor({ props, onUpdate }: { props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }) {
  const items = props.items || [];

  const addItem = () => {
    const newItem = {
      id: `bump-${Date.now()}`,
      name: 'Novo produto',
      description: '',
      price_cents: 990,
      originalPrice_cents: 0,
      imageUrl: '',
    };
    onUpdate({ items: [...items, newItem] });
  };

  const updateItem = (id: string, field: string, value: any) => {
    const updated = items.map((item: any) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdate({ items: updated });
  };

  const removeItem = (id: string) => {
    onUpdate({ items: items.filter((item: any) => item.id !== id) });
  };

  const currentStyle = props.displayStyle || 'block';
  const styles = [
    { id: 'block', label: 'Bloco (empilhado)' },
    { id: 'carousel', label: 'Slides (carrossel)' },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Estilo de exibição</h4>
      <div className="grid grid-cols-2 gap-2">
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            onClick={() => onUpdate({ displayStyle: style.id })}
            className={`py-2 px-2 rounded-lg border text-[11px] font-medium transition-all leading-tight ${
              currentStyle === style.id
                ? 'bg-brand-500/15 border-brand-500 text-brand-500 dark:text-brand-400'
                : 'border-neutral-200 dark:border-neutral-600 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300'
            }`}
          >
            {style.label}
          </button>
        ))}
      </div>

      <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold mt-4">Aparência</h4>
      <PropToggle label="Mostrar faixa de destaque" value={props.showHighlight ?? true} onChange={(v) => onUpdate({ showHighlight: v })} />
      {(props.showHighlight ?? true) && (
        <>
          <PropInput label="Texto da faixa" value={props.highlightText || 'OFERTA ESPECIAL'} onChange={(v) => onUpdate({ highlightText: v })} />
          <PropColor label="Cor da faixa" value={props.highlightColor || '#ef4444'} onChange={(v) => onUpdate({ highlightColor: v })} />
        </>
      )}
      <PropColor label="Cor do checkbox (vazio = tema)" value={props.checkboxColor || ''} onChange={(v) => onUpdate({ checkboxColor: v })} />
      <PropColor label="Cor do fundo" value={props.cardBgColor || ''} onChange={(v) => onUpdate({ cardBgColor: v })} />
      <PropColor label="Cor da borda" value={props.cardBorderColor || ''} onChange={(v) => onUpdate({ cardBorderColor: v })} />
      <PropColor label="Cor do nome do produto" value={props.nameColor || ''} onChange={(v) => onUpdate({ nameColor: v })} />
      <PropColor label="Cor da descrição" value={props.descriptionColor || ''} onChange={(v) => onUpdate({ descriptionColor: v })} />
      <PropColor label="Cor do preço" value={props.priceColor || ''} onChange={(v) => onUpdate({ priceColor: v })} />

      <div className="flex items-center justify-between mt-4">
        <h4 className="text-neutral-700 dark:text-neutral-300 text-xs font-semibold">Itens do Order Bump</h4>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1 text-[11px] font-medium text-brand-500 hover:text-brand-600 transition-colors"
        >
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-neutral-400 dark:text-neutral-500 text-xs text-center py-3">
          Nenhum item. Clique em "Adicionar" acima.
        </p>
      )}

      {items.map((item: any, index: number) => (
        <div key={item.id} className="border border-neutral-200 dark:border-neutral-600 rounded-lg p-3 space-y-2.5 relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold">
              Item {index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="text-neutral-400 hover:text-red-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <PropInput label="Nome" value={item.name || ''} onChange={(v) => updateItem(item.id, 'name', v)} placeholder="Nome do produto" />
          <PropTextarea label="Descrição" value={item.description || ''} onChange={(v) => updateItem(item.id, 'description', v)} placeholder="Descrição curta" />
          <ImageUpload label="Imagem" value={item.imageUrl || ''} onChange={(v) => updateItem(item.id, 'imageUrl', v)} placeholder="URL ou faça upload" />
          <div className="grid grid-cols-2 gap-2">
            <PropInput label="Preço (centavos)" type="number" value={String(item.price_cents || 0)} onChange={(v) => updateItem(item.id, 'price_cents', parseInt(v) || 0)} />
            <PropInput label="De (centavos)" type="number" value={String(item.originalPrice_cents || 0)} onChange={(v) => updateItem(item.id, 'originalPrice_cents', parseInt(v) || 0)} placeholder="0 = sem desconto" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Map type to props editor
const PROPS_EDITORS: Record<CheckoutElementType, React.FC<{ props: Record<string, any>; onUpdate: (p: Record<string, any>) => void }>> = {
  header: HeaderPropsEditor,
  banner: BannerPropsEditor,
  text: TextPropsEditor,
  image: ImagePropsEditor,
  form: FormPropsEditor,
  address: AddressPropsEditor,
  cart_summary: CartSummaryPropsEditor,
  payment: PaymentPropsEditor,
  timer: TimerPropsEditor,
  button: ButtonPropsEditor,
  divider: DividerPropsEditor,
  spacer: SpacerPropsEditor,
  testimonial: TestimonialPropsEditor,
  security_badge: SecurityBadgePropsEditor,
  payment_methods: PaymentMethodsPropsEditor,
  step_indicator: StepIndicatorPropsEditor,
  order_bump: OrderBumpPropsEditor,
  pix_page: PixPagePropsEditor,
};

const SHIPPING_BLOCK_ID = 'shipping-block';

// Main component
const PropertiesPanel = () => {
  const {
    selectedElementId,
    elements,
    updateElementProps,
    updateElementStyles,
    removeElement,
    toggleElementVisibility,
  } = useBuilder();

  const element = elements.find((e) => e.id === selectedElementId);
  const addressElement = elements.find((e) => e.type === 'address');

  // Bloco de Opções de Frete (props armazenadas no elemento Address)
  if (selectedElementId === SHIPPING_BLOCK_ID && addressElement) {
    const onUpdate = (p: Record<string, any>) => updateElementProps(addressElement.id, { ...addressElement.props, ...p });
    return (
      <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden h-full">
        <h3 className="text-neutral-900 dark:text-white text-sm font-semibold">
          Opções de Frete
        </h3>
        <p className="text-neutral-500 dark:text-neutral-400 text-xs">
          Personalize o bloco de seleção de frete no Passo 2.
        </p>
        <div>
          <h4 className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-3">
            Propriedades
          </h4>
          <ShippingBlockPropsEditor props={addressElement.props} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (!element) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400 dark:text-neutral-500 text-sm p-4 text-center">
        Selecione um elemento no canvas para editar suas propriedades
      </div>
    );
  }

  const PropsEditor = PROPS_EDITORS[element.type as CheckoutElementType];

  return (
    <div className="p-4 space-y-4 overflow-y-auto overflow-x-hidden h-full">
      {/* Element header */}
      <div className="flex items-center justify-between">
        <h3 className="text-neutral-900 dark:text-white text-sm font-semibold">
          {ELEMENT_LABELS[element.type as CheckoutElementType] || element.type}
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleElementVisibility(element.id)}
            className="p-1.5 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
            title={element.visible ? 'Ocultar' : 'Mostrar'}
          >
            {element.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
          <button
            onClick={() => removeElement(element.id)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-700 transition-all"
            title="Remover"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Props section */}
      <div>
        <h4 className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-3">
          Propriedades
        </h4>
        {PropsEditor && (
          <PropsEditor
            props={element.props}
            onUpdate={(p) => updateElementProps(element.id, p)}
          />
        )}
      </div>

      {/* Styles section */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
        <h4 className="text-neutral-400 dark:text-neutral-500 text-xs font-semibold uppercase tracking-wider mb-3">
          Estilos
        </h4>
        <StylesEditor
          styles={element.styles}
          onUpdate={(s) => updateElementStyles(element.id, s)}
        />
      </div>
    </div>
  );
};

export default PropertiesPanel;
