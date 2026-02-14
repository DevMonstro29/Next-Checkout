import { Shield } from 'lucide-react';
import { CheckoutTheme } from '@/types/checkout';

interface Props {
  props: Record<string, any>;
  theme?: CheckoutTheme;
}

const HeaderElement = ({ props, theme }: Props) => {
  const {
    logoUrl = '',
    logoSize = '48px',
    showSecurityBadge = true,
    securityText = 'PAGAMENTO 100% SEGURO',
    backgroundColor = 'transparent',
    badgeColor = '',
    badgeTextColor = '',
  } = props;

  const primaryColor = theme?.colors.primary || '#22c55e';
  const effectiveBadgeColor = badgeColor || primaryColor;
  const effectiveBadgeTextColor = badgeTextColor || primaryColor;

  return (
    <div
      className="flex items-center justify-between py-2 px-2 pb-1"
      style={{ backgroundColor: backgroundColor !== 'transparent' ? backgroundColor : undefined }}
    >
      <div className="flex items-center gap-2">
        {logoUrl && (
          <img src={logoUrl} alt="Logo" className="object-contain" style={{ height: logoSize }} />
        )}
      </div>
      {showSecurityBadge && (
        <div className="flex items-center gap-2 text-xs">
          <Shield className="w-6 h-6" style={{ color: effectiveBadgeColor, fill: effectiveBadgeColor }} />
          <span className="font-bold tracking-tight leading-tight" style={{ color: effectiveBadgeTextColor }}>
            {securityText.includes('\n')
              ? securityText.split('\n').map((line: string, i: number) => (
                  <span key={i}>
                    {line}
                    {i < securityText.split('\n').length - 1 && <br />}
                  </span>
                ))
              : <>PAGAMENTO<br />100% SEGURO</>
            }
          </span>
        </div>
      )}
    </div>
  );
};

export default HeaderElement;
