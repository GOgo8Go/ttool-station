import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Key, Copy, Download, Loader2 } from 'lucide-react';

const RsaGenerator: React.FC = () => {
    const { t } = useTranslation();
    const [keySize, setKeySize] = useState(2048);
    const [publicKey, setPublicKey] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const exportKey = async (key: CryptoKey, type: 'pkcs8' | 'spki') => {
        const exported = await window.crypto.subtle.exportKey(type, key);
        const exportedAsBase64 = arrayBufferToBase64(exported);
        const pemExported = `-----BEGIN ${type === 'pkcs8' ? 'PRIVATE' : 'PUBLIC'} KEY-----\n${exportedAsBase64.match(/.{1,64}/g)?.join('\n')}\n-----END ${type === 'pkcs8' ? 'PRIVATE' : 'PUBLIC'} KEY-----`;
        return pemExported;
    };

    const generateKeys = async () => {
        setIsGenerating(true);
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: "RSA-OAEP",
                    modulusLength: keySize,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: "SHA-256",
                },
                true,
                ["encrypt", "decrypt"]
            );

            const pub = await exportKey(keyPair.publicKey, 'spki');
            const priv = await exportKey(keyPair.privateKey, 'pkcs8');

            setPublicKey(pub);
            setPrivateKey(priv);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadKey = (content: string, filename: string) => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('tool.rsa-generator.key_size')}:</label>
                        <select
                            value={keySize}
                            onChange={(e) => setKeySize(parseInt(e.target.value))}
                            className="bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm"
                        >
                            <option value={1024}>1024 bit (Weak)</option>
                            <option value={2048}>2048 bit (Standard)</option>
                            <option value={4096}>4096 bit (Strong)</option>
                        </select>
                    </div>
                    <Button onClick={generateKeys} disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                        {isGenerating ? t('tool.rsa-generator.generating') : t('common.generate')}
                    </Button>
                </div>
            </Card>

            {publicKey && privateKey && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Public Key */}
                    <Card className="flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-green-600 dark:text-green-400">{t('tool.rsa-generator.public_key')}</h3>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(publicKey)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => downloadKey(publicKey, 'public.pem')}>
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <pre className="p-4 text-xs font-mono bg-gray-50 dark:bg-gray-900 overflow-auto h-64 text-gray-600 dark:text-gray-300">
                            {publicKey}
                        </pre>
                    </Card>

                    {/* Private Key */}
                    <Card className="flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-red-600 dark:text-red-400">{t('tool.rsa-generator.private_key')}</h3>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(privateKey)}>
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => downloadKey(privateKey, 'private.pem')}>
                                    <Download className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <pre className="p-4 text-xs font-mono bg-gray-50 dark:bg-gray-900 overflow-auto h-64 text-gray-600 dark:text-gray-300">
                            {privateKey}
                        </pre>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default RsaGenerator;
