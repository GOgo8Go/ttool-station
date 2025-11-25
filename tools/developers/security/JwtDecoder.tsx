import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Key, AlertCircle, CheckCircle, Copy, Clock } from 'lucide-react';

const JwtDecoder: React.FC = () => {
    const { t } = useTranslation();
    const [token, setToken] = useState('');
    const [decodedHeader, setDecodedHeader] = useState<any>(null);
    const [decodedPayload, setDecodedPayload] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDecode = (input: string) => {
        setToken(input);
        setError(null);
        setDecodedHeader(null);
        setDecodedPayload(null);

        if (!input.trim()) return;

        try {
            const header = jwtDecode(input, { header: true });
            const payload = jwtDecode(input);
            setDecodedHeader(header);
            setDecodedPayload(payload);
        } catch (err) {
            setError(t('tool.jwt-decoder.invalid_token'));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const formatJson = (data: any) => JSON.stringify(data, null, 2);

    const isExpired = (payload: any) => {
        if (!payload || !payload.exp) return false;
        return payload.exp * 1000 < Date.now();
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('tool.jwt-decoder.token_label')}
                        </label>
                        <textarea
                            value={token}
                            onChange={(e) => handleDecode(e.target.value)}
                            placeholder={t('tool.jwt-decoder.placeholder')}
                            className="w-full h-32 p-3 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>
            </Card>

            {decodedHeader && decodedPayload && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Header */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-red-500">Header</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(formatJson(decodedHeader))}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-red-600 dark:text-red-400">
                            {formatJson(decodedHeader)}
                        </pre>
                    </Card>

                    {/* Payload */}
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 lg:col-span-2">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-purple-500">Payload</h3>
                                {decodedPayload.exp && (
                                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${isExpired(decodedPayload)
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        }`}>
                                        <Clock className="w-3 h-3" />
                                        {isExpired(decodedPayload) ? t('tool.jwt-decoder.expired') : t('tool.jwt-decoder.valid')}
                                    </div>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(formatJson(decodedPayload))}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <pre className="text-xs font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-auto max-h-96 text-purple-600 dark:text-purple-400">
                            {formatJson(decodedPayload)}
                        </pre>

                        {/* Common Claims Info */}
                        <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-4">
                            {decodedPayload.iss && <div><span className="font-semibold">Issuer (iss):</span> {decodedPayload.iss}</div>}
                            {decodedPayload.sub && <div><span className="font-semibold">Subject (sub):</span> {decodedPayload.sub}</div>}
                            {decodedPayload.aud && <div><span className="font-semibold">Audience (aud):</span> {decodedPayload.aud}</div>}
                            {decodedPayload.exp && <div><span className="font-semibold">Expires (exp):</span> {new Date(decodedPayload.exp * 1000).toLocaleString()}</div>}
                            {decodedPayload.iat && <div><span className="font-semibold">Issued At (iat):</span> {new Date(decodedPayload.iat * 1000).toLocaleString()}</div>}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default JwtDecoder;
