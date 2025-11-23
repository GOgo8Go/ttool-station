import React from 'react';

export interface Option<T> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedControlProps<T> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  variant?: 'pill' | 'grid'; // 'pill' for tabs, 'grid' for simple grid buttons
}

export const SegmentedControl = <T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  className = '',
  variant = 'pill',
}: SegmentedControlProps<T>) => {
  if (variant === 'grid') {
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`}>
        {options.map((option) => (
          <button
            key={String(option.value)}
            onClick={() => !option.disabled && onChange(option.value)}
            disabled={option.disabled}
            className={`
              px-2 py-1.5 text-xs font-medium rounded border transition-all text-center
              ${value === option.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
              }
              ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  // Default 'pill' variant
  const sizeStyles = size === 'sm' ? 'p-0.5 text-xs' : 'p-1 text-sm';
  const itemStyles = size === 'sm' ? 'px-2 py-0.5' : 'px-4 py-1.5';

  return (
    <div className={`flex bg-gray-100 dark:bg-gray-800 rounded-lg ${sizeStyles} ${className}`}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          onClick={() => !option.disabled && onChange(option.value)}
          disabled={option.disabled}
          className={`
            flex-1 rounded-md font-medium transition-all flex items-center justify-center gap-2
            ${value === option.value
              ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
            ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${itemStyles}
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};