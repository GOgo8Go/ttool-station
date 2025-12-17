import React, { useEffect, useState, useRef } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { ThemeMode } from '../../types';

export const ThemeToggle: React.FC = () => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 获取当前实际应用的主题
  const getCurrentTheme = (): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode as 'light' | 'dark';
  };

  // 应用主题到 DOM
  const applyTheme = (mode: ThemeMode) => {
    const actualTheme = mode === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // 初始化主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeMode(savedTheme);
    }
  }, []);

  // 应用主题和监听系统主题变化
  useEffect(() => {
    applyTheme(themeMode);

    // 如果是跟随系统模式，监听系统主题变化
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // 处理主题切换
  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
    localStorage.setItem('themeMode', mode);
    setIsDropdownOpen(false);
  };

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 获取当前显示的图标
  const getCurrentIcon = () => {
    const actualTheme = getCurrentTheme();
    if (themeMode === 'system') {
      return <Monitor className="w-5 h-5" />;
    }
    return actualTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
  };

  // 获取当前主题的标签
  const getCurrentLabel = () => {
    switch (themeMode) {
      case 'light': return '浅色模式';
      case 'dark': return '深色模式';
      case 'system': return '跟随系统';
      default: return '跟随系统';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
        aria-label="切换主题"
        title={`当前主题: ${getCurrentLabel()}`}
      >
        {getCurrentIcon()}
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                themeMode === 'light'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Moon className="w-4 h-4 mr-3" />
              浅色模式
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                themeMode === 'dark'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Sun className="w-4 h-4 mr-3" />
              深色模式
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`flex items-center w-full px-4 py-2 text-sm ${
                themeMode === 'system'
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Monitor className="w-4 h-4 mr-3" />
              跟随系统
              <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                ({getCurrentTheme() === 'dark' ? '深色' : '浅色'})
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
