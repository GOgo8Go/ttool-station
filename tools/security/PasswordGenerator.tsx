import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Copy, RefreshCw, Check, Shield } from 'lucide-react';

const PasswordGenerator: React.FC = () => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });
    const [copied, setCopied] = useState(false);

    const generatePassword = () => {
        const charset = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
        };

        let chars = '';
        if (options.uppercase) chars += charset.uppercase;
        if (options.lowercase) chars += charset.lowercase;
        if (options.numbers) chars += charset.numbers;
        if (options.symbols) chars += charset.symbols;

        if (chars === '') {
            setPassword('');
            return;
        }

        let result = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            result += chars.charAt(array[i] % chars.length);
        }

        setPassword(result);
        setCopied(false);
    };

    useEffect(() => {
        generatePassword();
    }, [length, options]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const calculateStrength = () => {
        let score = 0;
        if (length > 8) score++;
        if (length > 12) score++;
        if (options.uppercase) score++;
        if (options.numbers) score++;
        if (options.symbols) score++;
        return score;
    };

    const strength = calculateStrength();
    const strengthColor = strength < 2 ? 'bg-red-500' : strength < 4 ? 'bg-yellow-500' : 'bg-green-500';
    const strengthText = strength < 2 ? t('tool.password-generator.strength.weak') : strength < 4 ? t('tool.password-generator.strength.medium') : t('tool.password-generator.strength.strong');

    return (
        <div className="space-y-6">
            <Card className="p-8 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="mb-6">
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="font-mono text-xl md:text-2xl break-all text-gray-800 dark:text-gray-200">
                            {password}
                        </div>
                        <div className="flex gap-2 ml-4">
                            <Button onClick={generatePassword} variant="ghost" size="sm">
                                <RefreshCw className="w-5 h-5" />
                            </Button>
                            <Button onClick={copyToClipboard} variant={copied ? "success" : "primary"} size="sm">
                                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 px-2 text-sm font-medium text-gray-500">
                        <div className={`w-2 h-2 rounded-full ${strengthColor}`} />
                        {strengthText}
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('tool.password-generator.length')}: {length}
                            </label>
                        </div>
                        <input
                            type="range"
                            min="4"
                            max="64"
                            value={length}
                            onChange={(e) => setLength(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(options).map(([key, value]) => (
                            <label key={key} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={value}
                                    onChange={() => setOptions(prev => ({ ...prev, [key]: !prev[key as keyof typeof options] }))}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t(`tool.password-generator.${key}`)}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PasswordGenerator;
