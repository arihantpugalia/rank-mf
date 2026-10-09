import React from 'react';

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  description?: string;
}

export function CheckboxGroup({ label, options, selected, onChange, description }: CheckboxGroupProps) {
  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="mb-md">
      <label className="block label-sm text-ink mb-xxs">{label}</label>
      {description && <p className="body-sm text-mute mb-sm">{description}</p>}

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleOption(option)}
              className={`
                px-sm py-xxs rounded-sm text-sm border transition-colors
                ${isSelected
                  ? 'bg-ink text-white border-ink'
                  : 'bg-elevated text-body border-hairline hover:border-mute'}
              `}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
