import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';

const WordCounter: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const stats = useMemo(() => {
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lines = text.split(/\r\n|\r|\n/).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '').length;
    
    return { chars, words, lines, paragraphs };
  }, [text]);

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('tool.word-counter.words'), value: stats.words },
          { label: t('tool.word-counter.characters'), value: stats.chars },
          { label: t('tool.word-counter.lines'), value: stats.lines },
          { label: t('tool.word-counter.paragraphs'), value: stats.paragraphs },
        ].map((stat) => (
          <Card key={stat.label} padding="md">
            <div className="text-2xl font-bold text-primary-600 dark:text-primary-500">{stat.value}</div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="flex-1 min-h-[400px]">
        <textarea
          className="w-full h-full p-4 text-base bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none transition-all"
          placeholder={t('tool.word-counter.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
    </div>
  );
};

export default WordCounter;