import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { toolRegistry } from '../../tools/registry';
import { ChevronDown, ChevronRight, LayoutGrid, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getToolById } from '../../tools/registry';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { t } = useTranslation();
  const [favoriteTools, setFavoriteTools] = useState<Set<string>>(new Set());

  // 从 localStorage 加载收藏工具
  useEffect(() => {
    const updateFavorites = () => {
      const savedFavorites = localStorage.getItem('favoriteTools');
      if (savedFavorites) {
        try {
          setFavoriteTools(new Set(JSON.parse(savedFavorites)));
        } catch (e) {
          console.error('Failed to parse favorite tools', e);
        }
      }
    };

    updateFavorites();

    // 监听 storage 事件以同步不同标签页之间的收藏状态
    window.addEventListener('storage', updateFavorites);

    // 监听自定义事件以同步同一页内的收藏状态变化
    const handleFavoriteUpdate = (event: CustomEvent) => {
      setFavoriteTools(new Set(event.detail));
    };

    window.addEventListener('favoriteToolsUpdated', handleFavoriteUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', updateFavorites);
      window.removeEventListener('favoriteToolsUpdated', handleFavoriteUpdate as EventListener);
    };
  }, []);

  // State to track expanded categories. Default all expanded.
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(
    toolRegistry.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );

  // 添加收藏工具区域的展开状态，默认展开
  const [expandedFavorite, setExpandedFavorite] = useState<boolean>(true);

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  // 切换收藏工具区域的展开状态
  const toggleFavoriteCategory = () => {
    setExpandedFavorite(prev => !prev);
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 bg-theme-dark-900 border-r border-gray-200 dark:border-gray-800 border-theme-dark-700
    transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  // 获取收藏的工具详情
  const favoriteToolsDetails = Array.from(favoriteTools)
    .map(toolKey => {
      const [categoryId, toolId] = (toolKey as string).split('/');
      const tool = getToolById(categoryId, toolId);
      const category = toolRegistry.find(cat => cat.id === categoryId);
      return tool && category ? { ...tool, categoryId, categoryName: category.name } : null;
    })
    .filter(Boolean) as (ReturnType<typeof getToolById> & {
      categoryId: string;
      categoryName: string;
    })[];

  return (
    <aside className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Brand Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800 border-theme-dark-700">
          <img
            src="/favicon.ico"
            alt="Logo"
            className="w-5 h-5 mr-2 flex-shrink-0"
          />
          <span className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 whitespace-nowrap overflow-hidden text-ellipsis">
            {t('app.title')}
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
          <NavLink
            to="/"
            end
            onClick={onCloseMobile}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:bg-theme-dark-800'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4 mr-3" />
            {t('app.dashboard')}
          </NavLink>

          {/* 收藏工具区域 - 仅在有收藏工具时显示 */}
          {favoriteToolsDetails.length > 0 && (
            <div>
              <button
                onClick={toggleFavoriteCategory}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-3 text-yellow-500 fill-current" />
                  {t('app.favorite_tools')}
                </div>
                {expandedFavorite ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {expandedFavorite && (
                <div className="mt-1 space-y-1 ml-4 border-l border-gray-200 dark:border-gray-800 border-theme-dark-700 pl-2">
                  {favoriteToolsDetails.map((tool) => (
                    <NavLink
                      key={`${tool.categoryId}-${tool.id}`}
                      to={`/tools/${tool.categoryId}/${tool.id}`}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:bg-theme-dark-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }`
                      }
                    >
                      <span className="truncate">{t(tool.name)}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {toolRegistry.map((category) => (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <div className="flex items-center">
                  <category.icon className="w-4 h-4 mr-3 opacity-75" />
                  {t(category.name)}
                </div>
                {expandedCats[category.id] ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>

              {expandedCats[category.id] && (
                <div className="mt-1 space-y-1 ml-4 border-l border-gray-200 dark:border-gray-800 border-theme-dark-700 pl-2">
                  {category.tools.map((tool) => (
                    <NavLink
                      key={tool.id}
                      to={`/tools/${category.id}/${tool.id}`}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:bg-theme-dark-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }`
                      }
                    >
                      <span className="truncate">{t(tool.name)}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};