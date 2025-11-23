import React from 'react';
import { Menu, Languages } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const nextLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 transition-colors duration-200">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
          {title || t('app.title')}
        </h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={toggleLanguage}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
          aria-label="Switch Language"
          title={i18n.language.startsWith('zh') ? 'Switch to English' : '切换到中文'}
        >
          <Languages className="w-5 h-5" />
          <span className="text-xs font-medium uppercase">{i18n.language.startsWith('zh') ? 'ZH' : 'EN'}</span>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
};