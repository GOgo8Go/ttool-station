import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import cronstrue from 'cronstrue/i18n';
import { Card } from '../../../components/ui/Card';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

const CronGenerator: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [cronExpression, setCronExpression] = useState('* * * * *');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [nextDates, setNextDates] = useState<string[]>([]);

    useEffect(() => {
        try {
            if (!cronExpression.trim()) {
                setDescription('');
                setError(null);
                return;
            }

            const desc = cronstrue.toString(cronExpression, {
                locale: i18n.language === 'zh' ? 'zh_CN' : 'en'
            });
            setDescription(desc);
            setError(null);

            // Simple next run calculation (approximation for display)
            // For robust next run calculation, we might need 'cron-parser' package, 
            // but for now we'll just show the description which is the main value add.

        } catch (err) {
            setError(t('tool.cron-generator.invalid_cron'));
            setDescription('');
        }
    }, [cronExpression, i18n.language, t]);

    const commonSchedules = [
        { label: t('tool.cron-generator.every_minute'), value: '* * * * *' },
        { label: t('tool.cron-generator.every_hour'), value: '0 * * * *' },
        { label: t('tool.cron-generator.every_day_midnight'), value: '0 0 * * *' },
        { label: t('tool.cron-generator.every_week'), value: '0 0 * * 0' },
        { label: t('tool.cron-generator.every_month'), value: '0 0 1 * *' },
    ];

    return (
        <div className="space-y-6">
            <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center justify-center space-y-6">
                    <div className="w-full max-w-2xl">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.cron-generator.expression')}
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={cronExpression}
                                onChange={(e) => setCronExpression(e.target.value)}
                                className="w-full p-4 text-2xl font-mono text-center bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="* * * * *"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                {error ? (
                                    <AlertCircle className="w-6 h-6 text-red-500" />
                                ) : (
                                    <CheckCircle className="w-6 h-6 text-green-500" />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center min-h-[3rem]">
                        {error ? (
                            <p className="text-red-500 font-medium">{error}</p>
                        ) : (
                            <p className="text-xl text-blue-600 dark:text-blue-400 font-medium">
                                {description}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full max-w-3xl">
                        {['Minute', 'Hour', 'Day (Month)', 'Month', 'Day (Week)'].map((label, i) => (
                            <div key={i} className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                                <div className="text-xs text-gray-500 uppercase mb-1">{label}</div>
                                <div className="font-mono font-bold text-lg">
                                    {cronExpression.split(' ')[i] || '?'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    {t('tool.cron-generator.common_examples')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commonSchedules.map((schedule) => (
                        <button
                            key={schedule.value}
                            onClick={() => setCronExpression(schedule.value)}
                            className="text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                        >
                            <div className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                {schedule.label}
                            </div>
                            <div className="text-xs font-mono text-gray-500 mt-1">
                                {schedule.value}
                            </div>
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default CronGenerator;
