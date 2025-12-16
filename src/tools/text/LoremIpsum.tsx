import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Copy, RefreshCw, AlignLeft } from 'lucide-react';

const LoremIpsum: React.FC = () => {
    const { t } = useTranslation();
    const [count, setCount] = useState(3);
    const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
    const [output, setOutput] = useState('');

    const words = [
        "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit",
        "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore",
        "magna", "aliqua", "ut", "enim", "ad", "minim", "veniam", "quis", "nostrud",
        "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea",
        "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit",
        "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla",
        "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident",
        "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id",
        "est", "laborum"
    ];

    const generateSentence = () => {
        const length = Math.floor(Math.random() * 10) + 5;
        const sentence = [];
        for (let i = 0; i < length; i++) {
            sentence.push(words[Math.floor(Math.random() * words.length)]);
        }
        return sentence.join(' ').replace(/^\w/, c => c.toUpperCase()) + '.';
    };

    const generateParagraph = () => {
        const length = Math.floor(Math.random() * 5) + 3;
        const paragraph = [];
        for (let i = 0; i < length; i++) {
            paragraph.push(generateSentence());
        }
        return paragraph.join(' ');
    };

    const generate = () => {
        let result = [];
        if (type === 'words') {
            for (let i = 0; i < count; i++) {
                result.push(words[Math.floor(Math.random() * words.length)]);
            }
            setOutput(result.join(' '));
        } else if (type === 'sentences') {
            for (let i = 0; i < count; i++) {
                result.push(generateSentence());
            }
            setOutput(result.join(' '));
        } else {
            for (let i = 0; i < count; i++) {
                result.push(generateParagraph());
            }
            setOutput(result.join('\n\n'));
        }
    };

    // Generate initial text
    React.useEffect(() => {
        generate();
    }, []);

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.lorem-ipsum.count')}
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            value={count}
                            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                            className="w-24 p-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.lorem-ipsum.type')}
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as any)}
                            className="w-40 p-2 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="paragraphs">{t('tool.lorem-ipsum.paragraphs')}</option>
                            <option value="sentences">{t('tool.lorem-ipsum.sentences')}</option>
                            <option value="words">{t('tool.lorem-ipsum.words')}</option>
                        </select>
                    </div>
                    <Button onClick={generate} className="mb-[2px]">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        {t('common.generate')}
                    </Button>
                </div>
            </Card>

            <Card className="relative p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 min-h-[300px]">
                <div className="absolute top-4 right-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(output)}
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                </div>
                <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                    {output}
                </div>
            </Card>
        </div>
    );
};

export default LoremIpsum;
