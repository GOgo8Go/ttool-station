import React from 'react';

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  valueDisplay?: React.ReactNode;
}

export const Slider: React.FC<SliderProps> = ({ 
  label, 
  valueDisplay, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {(label || valueDisplay) && (
        <div className="flex justify-between items-center">
          {label && (
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {label}
            </label>
          )}
          {valueDisplay && (
            <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
              {valueDisplay}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
        {...props}
      />
    </div>
  );
};