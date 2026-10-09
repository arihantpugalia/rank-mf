import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
}

export function Input({ label, description, className = '', ...props }: InputProps) {
  return (
    <div className="mb-md">
      {props.type !== 'checkbox' && (
        <label className="block label-sm text-ink mb-xxs">{label}</label>
      )}
      {description && props.type !== 'checkbox' && (
        <p className="body-sm text-mute mb-sm">{description}</p>
      )}

      {props.type === 'checkbox' ? (
        <label className="flex items-start gap-sm cursor-pointer">
          <input
            {...props}
            className={`mt-1 w-4 h-4 rounded-sm border-hairline text-ink focus:ring-ink ${className}`}
          />
          <div>
            <span className="label-sm text-ink">{label}</span>
            {description && <p className="body-sm text-mute">{description}</p>}
          </div>
        </label>
      ) : (
        <input
          {...props}
          className={`
            w-full bg-elevated border border-hairline rounded-sm px-sm py-xs
            text-ink body-md placeholder:text-faint
            focus:outline-none focus:border-mute
            ${className}
          `}
        />
      )}
    </div>
  );
}
