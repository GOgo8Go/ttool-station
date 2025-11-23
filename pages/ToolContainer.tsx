import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getToolById } from '../tools/registry';
import { useTranslation } from 'react-i18next';

export const ToolContainer: React.FC<{ setTitle: (t: string) => void }> = ({ setTitle }) => {
  const { categoryId, toolId } = useParams<{ categoryId: string; toolId: string }>();
  const { t } = useTranslation();
  
  const tool = useMemo(() => {
    if (!categoryId || !toolId) return null;
    return getToolById(categoryId, toolId);
  }, [categoryId, toolId]);

  // Update header title effect
  React.useEffect(() => {
    if (tool) {
      setTitle(t(tool.name));
    } else {
      setTitle(t('app.not_found'));
    }
    return () => setTitle(t('app.title'));
  }, [tool, setTitle, t]);

  if (!tool) {
    return <Navigate to="/" replace />;
  }

  const ToolComponent = tool.component;

  return (
    <div className="max-w-5xl mx-auto flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
             <tool.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          {t(tool.name)}
        </h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">{t(tool.description)}</p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <ToolComponent />
      </div>
    </div>
  );
};