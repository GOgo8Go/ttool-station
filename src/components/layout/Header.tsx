import React, { useState, useEffect, useRef } from 'react';
import { Menu, Languages, Search, Maximize2, Minimize2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { ColorPalette } from './ColorPalette';
import { useTranslation } from 'react-i18next';
import { toolRegistry } from '../../tools/registry';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  isWideMode: boolean;
  onToggleWideMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, title, isWideMode, onToggleWideMode }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTools, setFilteredTools] = useState<{ categoryId: string, toolId: string, name: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const languageButtonRef = useRef<HTMLButtonElement>(null);

  // 支持的语言列表
  const languages = [
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
    { code: 'kr', name: '한국어', flag: '🇰🇷' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' }
  ];

  // 切换语言
  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLanguageDropdown(false);
  };

  // 点击其他地方关闭语言下拉菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageButtonRef.current && !languageButtonRef.current.contains(event.target as Node) && 
          !(event.target as Element)?.closest('.language-dropdown')) {
        setShowLanguageDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 获取所有工具的扁平化列表
  const getAllTools = () => {
    const tools = [];
    for (const category of toolRegistry) {
      for (const tool of category.tools) {
        tools.push({
          categoryId: category.id,
          toolId: tool.id,
          name: t(tool.name)
        });
      }
    }
    return tools;
  };

  // 搜索工具
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTools([]);
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    const allTools = getAllTools();
    const filtered = allTools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredTools(filtered);
    setShowDropdown(true);
    setSelectedIndex(filtered.length > 0 ? 0 : -1); // 默认选中第一个
  }, [searchQuery, t]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredTools.length > 0 && selectedIndex >= 0) {
      const selectedTool = filteredTools[selectedIndex];
      navigate(`/tools/${selectedTool.categoryId}/${selectedTool.toolId}`);
      setSearchQuery('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    } else if (filteredTools.length > 0) {
      // 如果没有明确选中项，但有搜索结果，默认选择第一个
      const firstTool = filteredTools[0];
      navigate(`/tools/${firstTool.categoryId}/${firstTool.toolId}`);
      setSearchQuery('');
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleToolSelect = (categoryId: string, toolId: string) => {
    navigate(`/tools/${categoryId}/${toolId}`);
    setSearchQuery('');
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredTools.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredTools.length > 0) {
          const selectedTool = filteredTools[selectedIndex];
          handleToolSelect(selectedTool.categoryId, selectedTool.toolId);
        }
        break;

      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        searchInputRef.current?.focus();
        break;
    }
  };

  // 当选中索引改变时，确保选中的元素在可视区域内
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownItemRefs.current[selectedIndex]) {
      dropdownItemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest'
      });
    }
  }, [selectedIndex]);

  return (
    <header className="h-16 bg-white dark:bg-gray-900 bg-theme-dark-900 border-b border-gray-200 dark:border-gray-800 border-theme-dark-700 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6 transition-colors duration-200">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* 搜索框 */}
        <div className="relative flex-1 max-w-md">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('common.search')}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </form>

          {/* 搜索结果下拉框 */}
          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5">
              <div className="py-1 max-h-60 overflow-auto">
                {filteredTools.length > 0 ? (
                  filteredTools.map((tool, index) => (
                    <button
                      key={`${tool.categoryId}-${tool.toolId}`}
                      ref={el => dropdownItemRefs.current[index] = el}
                      onClick={() => handleToolSelect(tool.categoryId, tool.toolId)}
                      className={`block w-full text-left px-4 py-2 text-sm ${index === selectedIndex
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                    >
                      {tool.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                    {t('app.not_found')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleWideMode}
          className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors hidden sm:flex items-center gap-1"
          aria-label={isWideMode ? t('app.exit_wide_mode') : t('app.enter_wide_mode')}
          title={isWideMode ? t('app.exit_wide_mode') : t('app.enter_wide_mode')}
        >
          {isWideMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
        
        {/* 语言选择下拉菜单 */}
        <div className="relative">
          <button
            ref={languageButtonRef}
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
            aria-label="Switch Language"
            title={t('common.switch_language')}
          >
            <Languages className="w-5 h-5" />
            <span className="text-xs font-medium uppercase">
              {languages.find(lang => lang.code === i18n.language)?.code || i18n.language}
            </span>
          </button>
          
          {showLanguageDropdown && (
            <div className="language-dropdown absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
              <div className="py-1">
                {languages.map((language) => (
                  <button
                    key={language.code}
                    onClick={() => changeLanguage(language.code)}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      i18n.language === language.code
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-900 dark:text-primary-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2">{language.flag}</span>
                    {language.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <ColorPalette />
        <ThemeToggle />
      </div>
    </header>
  );
};