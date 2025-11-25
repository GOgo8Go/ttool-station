import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, Copy, Terminal, Code } from 'lucide-react';

const CurlConverter: React.FC = () => {
    const { t } = useTranslation();
    const [curlInput, setCurlInput] = useState('');
    const [outputFormat, setOutputFormat] = useState<'fetch' | 'node' | 'python'>('fetch');
    const [outputCode, setOutputCode] = useState('');

    const convertCurl = (curl: string, format: string) => {
        if (!curl.trim().startsWith('curl')) {
            return '// ' + t('tool.curl-converter.invalid_curl');
        }

        try {
            // Very basic parser for demonstration
            // In a real app, use a robust library like 'curl-to-json' or similar

            const urlMatch = curl.match(/['"](https?:\/\/[^'"]+)['"]/) || curl.match(/(https?:\/\/[^\s]+)/);
            const url = urlMatch ? urlMatch[1] : '';

            const methodMatch = curl.match(/-X\s+([A-Z]+)/) || curl.match(/--request\s+([A-Z]+)/);
            const method = methodMatch ? methodMatch[1] : 'GET';

            const headers: Record<string, string> = {};
            const headerMatches = curl.matchAll(/-H\s+['"]([^'"]+)['"]/g);
            for (const match of headerMatches) {
                const [key, value] = match[1].split(/:\s?/);
                if (key && value) headers[key] = value;
            }

            const dataMatch = curl.match(/-d\s+['"]([^'"]+)['"]/);
            const data = dataMatch ? dataMatch[1] : null;

            if (format === 'fetch') {
                return `fetch('${url}', {
    method: '${method}',
    headers: ${JSON.stringify(headers, null, 4)},
    ${data ? `body: ${JSON.stringify(data)}` : ''}
});`;
            } else if (format === 'node') {
                return `const fetch = require('node-fetch');

fetch('${url}', {
    method: '${method}',
    headers: ${JSON.stringify(headers, null, 4)},
    ${data ? `body: ${JSON.stringify(data)}` : ''}
})
.then(response => response.json())
.then(data => console.log(data));`;
            } else if (format === 'python') {
                return `import requests

url = '${url}'
headers = ${JSON.stringify(headers, null, 4).replace(/"/g, "'")}
${data ? `data = '${data}'` : ''}

response = requests.${method.toLowerCase()}(url, headers=headers${data ? ', data=data' : ''})
print(response.text)`;
            }

            return '';
        } catch (e) {
            return '// Error parsing curl command';
        }
    };

    const handleConvert = () => {
        const code = convertCurl(curlInput, outputFormat);
        setOutputCode(code);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Terminal className="w-5 h-5" />
                            {t('tool.curl-converter.curl_command')}
                        </h3>
                    </div>
                    <textarea
                        value={curlInput}
                        onChange={(e) => setCurlInput(e.target.value)}
                        placeholder="curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d 'data'"
                        className="flex-1 min-h-[200px] p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </Card>

                <div className="flex flex-col justify-center items-center gap-4 lg:hidden">
                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                </div>

                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            {t('tool.curl-converter.output_code')}
                        </h3>
                        <div className="flex gap-2">
                            <select
                                value={outputFormat}
                                onChange={(e) => {
                                    setOutputFormat(e.target.value as any);
                                    if (curlInput) {
                                        const code = convertCurl(curlInput, e.target.value);
                                        setOutputCode(code);
                                    }
                                }}
                                className="text-sm bg-gray-100 dark:bg-gray-700 border-none rounded-md px-2 py-1"
                            >
                                <option value="fetch">{t('tool.curl-converter.javascript_fetch')}</option>
                                <option value="node">{t('tool.curl-converter.node_js')}</option>
                                <option value="python">{t('tool.curl-converter.python_requests')}</option>
                            </select>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(outputCode)}
                                disabled={!outputCode}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[200px] relative">
                        <textarea
                            readOnly
                            value={outputCode}
                            className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 rounded-lg resize-none"
                            placeholder={t('tool.curl-converter.generated_code_placeholder')}
                        />
                    </div>
                </Card>
            </div>

            <div className="flex justify-center">
                <Button onClick={handleConvert} className="w-full md:w-auto px-8">
                    {t('common.convert')}
                </Button>
            </div>
        </div>
    );
};

export default CurlConverter;
