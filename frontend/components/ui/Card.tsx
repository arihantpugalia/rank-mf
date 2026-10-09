import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
}

export function Card({ children, className = '', elevated = false }: CardProps) {
  const shadowStyle = elevated
    ? 'shadow-sm hover:shadow-md'
    : '';

  return (
    <div
      className={`bg-elevated border border-hairline rounded-md p-lg ${shadowStyle} ${className}`}
    >
      {children}
    </div>
  );
}
