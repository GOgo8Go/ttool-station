import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { toolRegistry } from '../../tools/registry';
import { ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { t } = useTranslation();

  // State to track expanded categories. Default all expanded.
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(
    toolRegistry.reduce((acc, cat) => ({ ...acc, [cat.id]: true }), {})
  );

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 
    transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex flex-col h-full">
        {/* Brand Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <LayoutGrid className="w-5 h-5 text-primary-600 mr-2 flex-shrink-0" />
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
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4 mr-3" />
            {t('app.dashboard')}
          </NavLink>

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
                <div className="mt-1 space-y-1 ml-4 border-l border-gray-200 dark:border-gray-800 pl-2">
                  {category.tools.map((tool) => (
                    <NavLink
                      key={tool.id}
                      to={`/tools/${category.id}/${tool.id}`}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
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