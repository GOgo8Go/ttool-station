import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'sql-formatter';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Database, Copy, Eraser } from 'lucide-react';

const SqlFormatter: React.FC = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [dialect, setDialect] = useState('sql');
    const [error, setError] = useState<string | null>(null);

    const handleFormat = () => {
        try {
            const formatted = format(input, {
                language: dialect as any,
                tabWidth: 2,
                keywordCase: 'upper',
            });
            setOutput(formatted);
            setError(null);
        } catch (e: any) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex gap-4">
                    <select
                        value={dialect}
                        onChange={(e) => setDialect(e.target.value)}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
                    >
                        <option value="sql">Standard SQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="postgresql">PostgreSQL</option>
                        <option value="plsql">PL/SQL</option>
                        <option value="tsql">Transact-SQL</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setInput('')}>
                        <Eraser className="w-4 h-4 mr-2" />
                        {t('common.clear')}
                    </Button>
                    <Button onClick={handleFormat}>
                        <Database className="w-4 h-4 mr-2" />
                        {t('common.format')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                <Card className="flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 font-medium text-sm text-gray-500">
                        {t('common.input')}
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-4 font-mono text-sm bg-transparent border-none resize-none focus:ring-0"
                        placeholder="SELECT * FROM table WHERE id = 1..."
                    />
                </Card>

                <Card className="flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-sm text-gray-500">{t('common.output')}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(output)}
                            disabled={!output}
                        >
                            <Copy className="w-4 h-4" />
                        </Button>
                    </div>
                    {error ? (
                        <div className="flex-1 p-4 text-red-500 font-mono text-sm">
                            {error}
                        </div>
                    ) : (
                        <textarea
                            readOnly
                            value={output}
                            className="flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900/50 text-blue-600 dark:text-blue-400 border-none resize-none focus:ring-0"
                        />
                    )}
                </Card>
            </div>
        </div>
    );
};

export default SqlFormatter;
