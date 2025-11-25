import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Copy, ArrowRightLeft } from 'lucide-react';

const CaseConverter: React.FC = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');

    const convertCase = (text: string, type: string) => {
        if (!text) return '';

        // Split by common delimiters
        const words = text.split(/[\s\-_]+|(?=[A-Z])/).filter(Boolean).map(w => w.toLowerCase());

        switch (type) {
            case 'camel':
                return words.map((w, i) => i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)).join('');
            case 'pascal':
                return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
            case 'snake':
                return words.join('_');
            case 'kebab':
                return words.join('-');
            case 'constant':
                return words.join('_').toUpperCase();
            case 'sentence':
                return words.join(' ').replace(/^\w/, c => c.toUpperCase());
            case 'title':
                return words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            case 'lower':
                return text.toLowerCase();
            case 'upper':
                return text.toUpperCase();
            default:
                return text;
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const converters = [
        { id: 'camel', label: 'camelCase', example: 'helloWorld' },
        { id: 'pascal', label: 'PascalCase', example: 'HelloWorld' },
        { id: 'snake', label: 'snake_case', example: 'hello_world' },
        { id: 'kebab', label: 'kebab-case', example: 'hello-world' },
        { id: 'constant', label: 'CONSTANT_CASE', example: 'HELLO_WORLD' },
        { id: 'sentence', label: 'Sentence case', example: 'Hello world' },
        { id: 'title', label: 'Title Case', example: 'Hello World' },
        { id: 'lower', label: 'lowercase', example: 'hello world' },
        { id: 'upper', label: 'UPPERCASE', example: 'HELLO WORLD' },
    ];

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.input')}
                </label>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type or paste text here..."
                    className="w-full h-32 p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {converters.map((converter) => {
                    const converted = convertCase(input, converter.id);
                    return (
                        <Card key={converter.id} className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-medium text-gray-500 uppercase">{converter.label}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => copyToClipboard(converted)}
                                >
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                            <div className="font-mono text-sm truncate text-gray-800 dark:text-gray-200" title={converted || converter.example}>
                                {converted || <span className="text-gray-400 italic">{converter.example}</span>}
                            </div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default CaseConverter;
