import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  active?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  className = '', 
  children, 
  hover = false, 
  padding = 'md',
  active = false,
  ...props 
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6',
  };

  const baseStyles = "bg-white dark:bg-gray-800 rounded-xl border transition-all duration-200";
  const borderStyles = active 
    ? "border-primary-500 ring-1 ring-primary-500 dark:border-primary-500" 
    : "border-gray-200 dark:border-gray-700";
  
  const hoverStyles = hover 
    ? "hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700" 
    : "shadow-sm";

  return (
    <div 
      className={`${baseStyles} ${borderStyles} ${hoverStyles} ${paddings[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};