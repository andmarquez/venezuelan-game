import { motion } from 'framer-motion';

interface PrimaryButtonProps {
  title: string;
  subtitle?: string;
  onClick: () => void;
  loading?: boolean;
  loadingText?: string;
  variant?: 'navy' | 'coral';
  align?: 'left' | 'center';
  fullWidth?: boolean;
}

const VARIANTS = {
  navy: {
    bg: 'bg-navy',
    subtitle: 'text-navy-muted',
    shadow: 'shadow-[0_4px_14px_rgba(30,35,65,0.22)]',
  },
  coral: {
    bg: 'bg-coral',
    subtitle: 'text-coral-muted',
    shadow: 'shadow-[0_4px_14px_rgba(253,107,107,0.28)]',
  },
};

export function PrimaryButton({
  title,
  subtitle,
  onClick,
  loading = false,
  loadingText = 'Working...',
  variant = 'navy',
  align = 'center',
  fullWidth = true,
}: PrimaryButtonProps) {
  const styles = VARIANTS[variant];
  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-busy={loading}
      whileTap={loading ? undefined : { scale: 0.98 }}
      className={`flex flex-col justify-center gap-0.5 rounded-[22px] px-[18px] py-3.5 ${styles.bg} ${styles.shadow} ${alignClass} ${
        fullWidth ? 'w-full' : ''
      } cursor-pointer transition-opacity disabled:cursor-not-allowed disabled:opacity-70 active:opacity-90`}
    >
      <span className="text-base font-medium text-white">
        {loading ? loadingText : title}
      </span>
      {subtitle && !loading && (
        <span className={`text-[13px] ${styles.subtitle}`}>{subtitle}</span>
      )}
    </motion.button>
  );
}
