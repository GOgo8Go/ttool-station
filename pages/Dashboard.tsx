import React from 'react';
import { Link } from 'react-router-dom';
import { toolRegistry } from '../tools/registry';
import { ArrowRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTranslation } from 'react-i18next';

// 定义常用工具
const COMMON_TOOLS = [
  { categoryId: 'developers', toolId: 'json-formatter' },
  { categoryId: 'developers', toolId: 'base-converter' },
  { categoryId: 'developers', toolId: 'hash-generator' },
  { categoryId: 'lookup', toolId: 'dns-lookup' },
  { categoryId: 'lookup', toolId: 'http-status' },
  { categoryId: 'productivity', toolId: 'word-counter' },
];

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  // 获取常用工具详情
  const commonTools = COMMON_TOOLS.map(({ categoryId, toolId }) => {
    const category = toolRegistry.find(cat => cat.id === categoryId);
    const tool = category?.tools.find(t => t.id === toolId);
    return tool ? { ...tool, categoryId, categoryIcon: category?.icon } : null;
  }).filter(Boolean) as (typeof toolRegistry[0]['tools'][0] & { categoryId: string, categoryIcon: React.ElementType })[];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('app.welcome')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('app.subtitle')}</p>
      </div>

      {/* 常用工具区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
          <div className="w-5 h-5 text-primary-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/>
              <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
              <path d="M12 2v2"/>
              <path d="M12 22v-2"/>
              <path d="m17 20.66-1-1.73"/>
              <path d="M11 10.27 7 3.34"/>
              <path d="m20.66 17-1.73-1"/>
              <path d="m3.34 7 1.73 1"/>
              <path d="M14 12h8"/>
              <path d="M2 12h2"/>
              <path d="m20.66 7-1.73 1"/>
              <path d="m3.34 17 1.73-1"/>
              <path d="m17 3.34-1 1.73"/>
              <path d="m11 13.73-4 6.93"/>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t('app.common_tools')}</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {commonTools.map((tool) => (
            <Link key={`${tool.categoryId}-${tool.id}`} to={`/tools/${tool.categoryId}/${tool.id}`}>
              <Card hover padding="md" className="h-full flex flex-col items-center justify-center text-center group">
                <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors mb-2">
                  <tool.icon className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">{t(tool.name)}</h4>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-8">
        {toolRegistry.map((category) => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
              <category.icon className="w-5 h-5 text-primary-600" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{t(category.name)}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.tools.map((tool) => (
                <Link key={tool.id} to={`/tools/${category.id}/${tool.id}`}>
                  <Card hover padding="lg" className="h-full flex flex-col group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t(tool.name)}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{t(tool.description)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};