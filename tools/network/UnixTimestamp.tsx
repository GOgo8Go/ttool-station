import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Clock, Play, Pause, Copy } from 'lucide-react';

const UnixTimestamp: React.FC = () => {
    const { t } = useTranslation();
    const [now, setNow] = useState(Math.floor(Date.now() / 1000));
    const [isPaused, setIsPaused] = useState(false);
    const [inputTimestamp, setInputTimestamp] = useState('');
    const [inputDate, setInputDate] = useState('');
    const [convertedDate, setConvertedDate] = useState('');
    const [convertedTimestamp, setConvertedTimestamp] = useState('');

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isPaused) {
                setNow(Math.floor(Date.now() / 1000));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isPaused]);

    const handleTimestampConvert = (ts: string) => {
        setInputTimestamp(ts);
        if (!ts) {
            setConvertedDate('');
            return;
        }
        const timestamp = parseInt(ts);
        if (!isNaN(timestamp)) {
            // Handle both seconds and milliseconds
            const date = new Date(ts.length > 11 ? timestamp : timestamp * 1000);
            setConvertedDate(date.toLocaleString());
        } else {
            setConvertedDate(t('common.error.invalid_timestamp', 'Invalid Timestamp'));
        }
    };

    const handleDateConvert = (dateStr: string) => {
        setInputDate(dateStr);
        if (!dateStr) {
            setConvertedTimestamp('');
            return;
        }
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            setConvertedTimestamp(Math.floor(date.getTime() / 1000).toString());
        } else {
            setConvertedTimestamp(t('common.error.invalid_date', 'Invalid Date'));
        }
    };

    return (
        <div className="space-y-6">
            {/* Current Time */}
            <Card className="p-8 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-center">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-2 font-medium uppercase tracking-wider">
                    {t('tool.unix-timestamp.current_timestamp', 'Current Unix Timestamp')}
                </div>
                <div className="text-5xl font-mono font-bold text-blue-700 dark:text-blue-300 mb-6">
                    {now}
                </div>
                <div className="flex justify-center gap-4">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setIsPaused(!isPaused)}
                    >
                        {isPaused ? <Play className="w-4 h-4 mr-2" /> : <Pause className="w-4 h-4 mr-2" />}
                        {isPaused ? t('tool.unix-timestamp.resume', 'Resume') : t('tool.unix-timestamp.pause', 'Pause')}
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(now.toString())}
                    >
                        <Copy className="w-4 h-4 mr-2" />
                        {t('common.copy', 'Copy')}
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timestamp to Date */}
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">{t('tool.unix-timestamp.timestamp_to_date', 'Timestamp to Date')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('tool.unix-timestamp.enter_timestamp', 'Unix Timestamp')}
                            </label>
                            <input
                                type="number"
                                value={inputTimestamp}
                                onChange={(e) => handleTimestampConvert(e.target.value)}
                                placeholder={now.toString()}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[3rem] flex items-center justify-center font-medium">
                            {convertedDate || <span className="text-gray-400">{t('common.result', 'Result will appear here')}</span>}
                        </div>
                    </div>
                </Card>

                {/* Date to Timestamp */}
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">{t('tool.unix-timestamp.date_to_timestamp', 'Date to Timestamp')}</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('tool.unix-timestamp.enter_date', 'Date & Time')}
                            </label>
                            <input
                                type="datetime-local"
                                value={inputDate}
                                onChange={(e) => handleDateConvert(e.target.value)}
                                className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[3rem] flex items-center justify-center font-mono font-medium text-lg">
                            {convertedTimestamp || <span className="text-gray-400 text-sm font-sans">{t('common.result', 'Result will appear here')}</span>}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default UnixTimestamp;
