import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'pill' | 'square';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'pill',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'button-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    pill: 'bg-ink text-white rounded-pill px-4 h-10 hover:bg-body',
    square: 'bg-elevated text-ink border border-hairline rounded-sm px-2 h-10 hover:bg-hairline-soft',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className} inline-flex items-center justify-center`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Processing...</span>
        </div>
      ) : children}
    </button>
  );
}
