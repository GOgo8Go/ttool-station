import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UAParser } from 'ua-parser-js';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Monitor, Smartphone, Globe, Cpu, Copy } from 'lucide-react';

const UserAgentParser: React.FC = () => {
    const { t } = useTranslation();
    const [uaString, setUaString] = useState('');
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        // Default to current browser UA
        const currentUA = navigator.userAgent;
        setUaString(currentUA);
        parseUA(currentUA);
    }, []);

    const parseUA = (ua: string) => {
        if (!ua) {
            setResult(null);
            return;
        }
        const parser = new UAParser(ua);
        setResult(parser.getResult());
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setUaString(val);
        parseUA(val);
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('tool.user-agent.user_agent_string')}
                    </label>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setUaString(navigator.userAgent);
                            parseUA(navigator.userAgent);
                        }}
                    >
                        {t('tool.user-agent.use_my_ua')}
                    </Button>
                </div>
                <textarea
                    value={uaString}
                    onChange={handleInputChange}
                    placeholder="Mozilla/5.0..."
                    className="w-full h-24 p-3 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
            </Card>

            {result && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Browser */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Globe className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold">{t('tool.user-agent.browser')}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.version')}</span>
                                <span className="font-medium">{result.browser.name || t('tool.user-agent.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.version')}</span>
                                <span className="font-medium">{result.browser.version || t('tool.user-agent.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.engine')}</span>
                                <span className="font-medium">{result.engine.name || t('tool.user-agent.unknown')}</span>
                            </div>
                        </div>
                    </Card>

                    {/* OS */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <Monitor className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold">{t('tool.user-agent.os')}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.version')}</span>
                                <span className="font-medium">{result.os.name || t('tool.user-agent.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.version')}</span>
                                <span className="font-medium">{result.os.version || t('tool.user-agent.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.platform')}</span>
                                <span className="font-medium">{result.cpu.architecture || t('tool.user-agent.unknown')}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Device */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold">{t('tool.user-agent.device')}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.vendor')}</span>
                                <span className="font-medium">{result.device.vendor || t('tool.user-agent.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.model')}</span>
                                <span className="font-medium">{result.device.model || t('tool.user-agent.unknown')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.type')}</span>
                                <span className="font-medium">{result.device.type || t('tool.user-agent.desktop')}</span>
                            </div>
                        </div>
                    </Card>

                    {/* CPU */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <h3 className="font-semibold">{t('tool.user-agent.cpu')}</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">{t('tool.user-agent.architecture')}</span>
                                <span className="font-medium">{result.cpu.architecture || t('tool.user-agent.unknown')}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default UserAgentParser;
