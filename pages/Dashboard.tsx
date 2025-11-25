import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toolRegistry } from '../tools/registry';
import { Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';
import { SEO } from '../components/SEO';
import { getToolById } from '../tools/registry';

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [favoriteTools, setFavoriteTools] = useState<Set<string>>(new Set());

  // 从 localStorage 加载收藏工具
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteTools');
    if (savedFavorites) {
      try {
        setFavoriteTools(new Set(JSON.parse(savedFavorites)));
      } catch (e) {
        console.error('Failed to parse favorite tools', e);
      }
    }
  }, []);

  // 切换工具收藏状态
  const toggleFavorite = (categoryId: string, toolId: string) => {
    const toolKey = `${categoryId}/${toolId}`;
    const newFavorites = new Set(favoriteTools);
    
    if (newFavorites.has(toolKey)) {
      newFavorites.delete(toolKey);
    } else {
      newFavorites.add(toolKey);
    }
    
    setFavoriteTools(newFavorites);
    localStorage.setItem('favoriteTools', JSON.stringify(Array.from(newFavorites)));
    // 触发自定义事件，通知其他组件收藏状态已更新
    window.dispatchEvent(new CustomEvent('favoriteToolsUpdated', {
      detail: Array.from(newFavorites)
    }));
  };

  // 获取收藏的工具详情
  const favoriteToolsDetails = Array.from(favoriteTools)
    .map(toolKey => {
      const [categoryId, toolId] = (toolKey as string).split('/');
      const tool = getToolById(categoryId, toolId);
      const category = toolRegistry.find(cat => cat.id === categoryId);
      return tool && category ? { ...tool, categoryId, categoryIcon: category.icon } : null;
    })
    .filter(Boolean) as (ReturnType<typeof getToolById> & { 
      categoryId: string; 
      categoryIcon: React.ElementType 
    })[];

  return (
    <>
      <SEO />
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('app.welcome')}</h2>
          <p className="text-gray-500 dark:text-gray-400">{t('app.subtitle')}</p>
        </div>

        {/* 收藏工具区域 - 仅在有收藏工具时显示 */}
        {favoriteToolsDetails.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
              <div className="w-5 h-5 text-yellow-500">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('app.favorite_tools')}</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {favoriteToolsDetails.map((tool) => {
                const toolKey = `${tool.categoryId}/${tool.id}`;
                
                return (
                  <div key={toolKey} className="relative">
                    <Link to={`/tools/${tool.categoryId}/${tool.id}`}>
                      <Card hover padding="md" className="h-full flex flex-col items-center justify-center text-center group">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors mb-2">
                          <tool.icon className="w-6 h-6" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t(tool.name)}</h4>
                      </Card>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid gap-8">
          {toolRegistry.map((category) => (
            <div key={category.id} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
                <category.icon className="w-5 h-5 text-primary-600" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t(category.name)}</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.tools.map((tool) => {
                  const toolKey = `${category.id}/${tool.id}`;
                  const isFavorite = favoriteTools.has(toolKey);
                  
                  return (
                    <div key={tool.id} className="relative">
                      <Link to={`/tools/${category.id}/${tool.id}`}>
                        <Card hover padding="lg" className="h-full flex flex-col group">
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                              <tool.icon className="w-6 h-6" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleFavorite(category.id, tool.id);
                              }}
                              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              aria-label={isFavorite ? t('app.remove_favorite') : t('app.add_favorite')}
                            >
                              <Star
                                className={`w-5 h-5 ${
                                  isFavorite
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            </button>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t(tool.name)}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{t(tool.description)}</p>
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};