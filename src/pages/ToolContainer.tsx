import React, { useMemo, Suspense } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getToolById } from '../tools/registry';
import { useTranslation } from 'react-i18next';
import { Card } from '../components/ui/Card';
import { SEO } from '../components/SEO';
import { getToolKeywords } from '../utils/seoKeywords';

export const ToolContainer: React.FC<{ setTitle: (t: string) => void; isWideMode?: boolean }> = ({ setTitle, isWideMode = false }) => {
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

  // 动态加载组件
  const ToolComponent = React.lazy(tool.component as any);

  return (
    <>
      <SEO
        title={t(tool.name)}
        description={t(tool.description)}
        keywords={getToolKeywords(toolId!)}
        toolId={toolId}
        categoryId={categoryId}
      />
      <div className={`mx-auto flex flex-col ${isWideMode ? 'w-full' : 'max-w-5xl'}`}>
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
          <Suspense fallback={
            <Card className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500 mb-2"></div>
                <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
              </div>
            </Card>
          }>
            <ToolComponent />
          </Suspense>
        </div>
      </div>
    </>
  );
};