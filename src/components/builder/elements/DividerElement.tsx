import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const DividerElement = ({ props, theme }: Props) => {
  const {
    thickness = '1px',
    color = '',
    marginY = '8px',
  } = props;

  return (
    <div style={{ paddingTop: marginY, paddingBottom: marginY }}>
      <hr
        style={{
          border: 'none',
          borderTop: `${thickness} solid ${color || theme?.colors.border || '#e5e7eb'}`,
        }}
      />
    </div>
  );
};

export default DividerElement;
