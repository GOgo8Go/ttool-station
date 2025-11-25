import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowRightLeft, Copy, FileJson, FileSpreadsheet } from 'lucide-react';

const CsvJsonConverter: React.FC = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState<'csv2json' | 'json2csv'>('csv2json');
    const [error, setError] = useState<string | null>(null);

    const handleConvert = () => {
        setError(null);
        if (!input.trim()) {
            setOutput('');
            return;
        }

        try {
            if (mode === 'csv2json') {
                Papa.parse(input, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        if (results.errors.length > 0) {
                            setError(results.errors[0].message);
                        } else {
                            setOutput(JSON.stringify(results.data, null, 2));
                        }
                    },
                    error: (err) => setError(err.message)
                });
            } else {
                // JSON to CSV
                const jsonData = JSON.parse(input);
                const csv = Papa.unparse(jsonData);
                setOutput(csv);
            }
        } catch (err: any) {
            setError(err.message || t('tool.csv-json.error.conversion_failed'));
        }
    };

    const toggleMode = () => {
        setMode(prev => prev === 'csv2json' ? 'json2csv' : 'csv2json');
        setInput(output);
        setOutput(input);
        setError(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-center mb-6">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('csv2json')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'csv2json'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t('tool.csv-json.mode.csv_to_json')}
                    </button>
                    <button
                        onClick={() => setMode('json2csv')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'json2csv'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t('tool.csv-json.mode.json_to_csv')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
                {/* Input */}
                <Card className="flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 font-medium text-sm text-gray-500">
                            {mode === 'csv2json' ? <FileSpreadsheet className="w-4 h-4" /> : <FileJson className="w-4 h-4" />}
                            {mode === 'csv2json' ? t('tool.csv-json.input.label') + ' (CSV)' : t('tool.csv-json.input.label') + ' (JSON)'}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setInput('')}>
                            {t('common.clear')}
                        </Button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-4 font-mono text-sm bg-transparent border-none resize-none focus:ring-0"
                        placeholder={mode === 'csv2json' ? t('tool.csv-json.input.csv') : t('tool.csv-json.input.json')}
                    />
                </Card>

                {/* Output */}
                <Card className="flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 font-medium text-sm text-gray-500">
                            {mode === 'csv2json' ? <FileJson className="w-4 h-4" /> : <FileSpreadsheet className="w-4 h-4" />}
                            {mode === 'csv2json' ? t('tool.csv-json.output.label') + ' (JSON)' : t('tool.csv-json.output.label') + ' (CSV)'}
                        </div>
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
                        <div className="flex-1 p-4 text-red-500 font-mono text-sm bg-red-50 dark:bg-red-900/10">
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

            <div className="flex justify-center gap-4">
                <Button onClick={handleConvert} className="w-full md:w-auto px-8">
                    {t('common.convert')}
                </Button>
                <Button variant="secondary" onClick={toggleMode} className="w-full md:w-auto px-8">
                    <ArrowRightLeft className="w-4 h-4 mr-2" />
                    {t('common.swap')}
                </Button>
            </div>
        </div>
    );
};

export default CsvJsonConverter;
