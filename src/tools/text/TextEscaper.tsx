import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Copy, ArrowRightLeft, Eraser } from 'lucide-react';

const TextEscaper: React.FC = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [mode, setMode] = useState<'escape' | 'unescape'>('escape');
    const [type, setType] = useState<'url' | 'html' | 'json' | 'java'>('url');

    const process = () => {
        try {
            if (mode === 'escape') {
                switch (type) {
                    case 'url':
                        setOutput(encodeURIComponent(input));
                        break;
                    case 'html':
                        setOutput(input.replace(/[&<>"']/g, (m) => ({
                            '&': '&amp;',
                            '<': '&lt;',
                            '>': '&gt;',
                            '"': '&quot;',
                            "'": '&#39;'
                        })[m] || m));
                        break;
                    case 'json':
                        setOutput(JSON.stringify(input).slice(1, -1));
                        break;
                    case 'java':
                        setOutput(JSON.stringify(input).slice(1, -1).replace(/"/g, '\\"'));
                        break;
                }
            } else {
                switch (type) {
                    case 'url':
                        setOutput(decodeURIComponent(input));
                        break;
                    case 'html':
                        const doc = new DOMParser().parseFromString(input, "text/html");
                        setOutput(doc.documentElement.textContent || "");
                        break;
                    case 'json':
                        setOutput(JSON.parse(`"${input}"`));
                        break;
                    case 'java':
                        setOutput(JSON.parse(`"${input.replace(/\\"/g, '"')}"`));
                        break;
                }
            }
        } catch (e) {
            setOutput(t('tool.text-escaper.error_invalid_input'));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-center gap-4 mb-6">
                <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        onClick={() => setMode('escape')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'escape'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t('tool.text-escaper.escape')}
                    </button>
                    <button
                        onClick={() => setMode('unescape')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${mode === 'unescape'
                                ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        {t('tool.text-escaper.unescape')}
                    </button>
                </div>

                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 text-sm"
                >
                    <option value="url">{t('tool.text-escaper.url')}</option>
                    <option value="html">{t('tool.text-escaper.html')}</option>
                    <option value="json">{t('tool.text-escaper.json')}</option>
                    <option value="java">{t('tool.text-escaper.java')}</option>
                </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                <Card className="flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                        <span className="font-medium text-sm text-gray-500">{t('common.input')}</span>
                        <Button variant="ghost" size="sm" onClick={() => setInput('')}>
                            <Eraser className="w-4 h-4" />
                        </Button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 p-4 font-mono text-sm bg-transparent border-none resize-none focus:ring-0"
                        placeholder={t('tool.text-escaper.enter_text')}
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
                    <textarea
                        readOnly
                        value={output}
                        className="flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900/50 text-blue-600 dark:text-blue-400 border-none resize-none focus:ring-0"
                    />
                </Card>
            </div>

            <div className="flex justify-center">
                <Button onClick={process} className="w-full md:w-auto px-8">
                    {mode === 'escape' ? t('tool.text-escaper.process_button.escape') : t('tool.text-escaper.process_button.unescape')}
                </Button>
            </div>
        </div>
    );
};

export default TextEscaper;
