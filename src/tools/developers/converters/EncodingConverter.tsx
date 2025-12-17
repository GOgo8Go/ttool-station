import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Copy, ArrowRightLeft, Check, AlertCircle, FileText, Upload } from 'lucide-react';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';

type EncodingType = 'base64' | 'base64url' | 'base32' | 'url' | 'hex' | 'binary' | 'ascii' | 'unicode' | 'octal' | 'html';
type Direction = 'encode' | 'decode';

const EncodingConverter: React.FC = () => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [encoding, setEncoding] = useState<EncodingType>('base64');
    const [direction, setDirection] = useState<Direction>('encode');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [binaryData, setBinaryData] = useState<string>(''); // Store binary data separately
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const ENCODINGS: { value: EncodingType; label: string; description: string }[] = [
        { value: 'base64', label: t('tool.encoding-converter.encodings.base64'), description: t('tool.encoding-converter.encodings.base64_desc') },
        { value: 'base64url', label: t('tool.encoding-converter.encodings.base64url'), description: t('tool.encoding-converter.encodings.base64url_desc') },
        { value: 'base32', label: t('tool.encoding-converter.encodings.base32'), description: t('tool.encoding-converter.encodings.base32_desc') },
        { value: 'url', label: t('tool.encoding-converter.encodings.url'), description: t('tool.encoding-converter.encodings.url_desc') },
        { value: 'hex', label: t('tool.encoding-converter.encodings.hex'), description: t('tool.encoding-converter.encodings.hex_desc') },
        { value: 'binary', label: t('tool.encoding-converter.encodings.binary'), description: t('tool.encoding-converter.encodings.binary_desc') },
        { value: 'ascii', label: t('tool.encoding-converter.encodings.ascii'), description: t('tool.encoding-converter.encodings.ascii_desc') },
        { value: 'unicode', label: t('tool.encoding-converter.encodings.unicode'), description: t('tool.encoding-converter.encodings.unicode_desc') },
        { value: 'octal', label: t('tool.encoding-converter.encodings.octal'), description: t('tool.encoding-converter.encodings.octal_desc') },
        { value: 'html', label: t('tool.encoding-converter.encodings.html'), description: t('tool.encoding-converter.encodings.html_desc') },
    ];

    // UTF-8 safe Base64 encoding
    const utf8ToBase64 = (str: string): string => {
        // Encode UTF-8 string to bytes
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);

        // Convert bytes to binary string
        let binaryString = '';
        for (let i = 0; i < bytes.length; i++) {
            binaryString += String.fromCharCode(bytes[i]);
        }

        return btoa(binaryString);
    };

    const base64ToUtf8 = (base64: string): string => {
        // Decode base64 to binary string
        const binaryString = atob(base64);

        // Convert binary string to bytes
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Decode bytes to UTF-8 string
        const decoder = new TextDecoder('utf-8');
        return decoder.decode(bytes);
    };

    // Base64 URL-safe encoding/decoding (UTF-8 safe)
    const base64UrlEncode = (str: string): string => {
        return utf8ToBase64(str)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    };

    const base64UrlDecode = (str: string): string => {
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return base64ToUtf8(str);
    };

    // Base32 encoding/decoding
    const base32Encode = (str: string): string => {
        const encoder = new TextEncoder();
        const bytes = encoder.encode(str);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';

        for (let i = 0; i < bytes.length; i++) {
            value = (value << 8) | bytes[i];
            bits += 8;

            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }

        return output;
    };

    const base32Decode = (str: string): string => {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        const output: number[] = [];

        for (let i = 0; i < str.length; i++) {
            const idx = alphabet.indexOf(str[i].toUpperCase());
            if (idx === -1) continue;

            value = (value << 5) | idx;
            bits += 5;

            if (bits >= 8) {
                output.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }

        const decoder = new TextDecoder('utf-8');
        return decoder.decode(new Uint8Array(output));
    };

    // String to binary
    const stringToBinary = (str: string): string => {
        return str.split('').map(char =>
            char.charCodeAt(0).toString(2).padStart(8, '0')
        ).join(' ');
    };

    const binaryToString = (binary: string): string => {
        return binary.split(' ')
            .map(bin => String.fromCharCode(parseInt(bin, 2)))
            .join('');
    };

    // String to hex
    const stringToHex = (str: string): string => {
        return str.split('').map(char =>
            char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join('');
    };

    const hexToString = (hex: string): string => {
        const hexStr = hex.replace(/\s/g, '');
        let result = '';
        for (let i = 0; i < hexStr.length; i += 2) {
            result += String.fromCharCode(parseInt(hexStr.substr(i, 2), 16));
        }
        return result;
    };

    // ASCII codes
    const stringToAscii = (str: string): string => {
        return str.split('').map(char => char.charCodeAt(0)).join(' ');
    };

    const asciiToString = (ascii: string): string => {
        return ascii.split(/\s+/).map(code => String.fromCharCode(parseInt(code))).join('');
    };

    // Unicode escape
    const stringToUnicode = (str: string): string => {
        return str.split('').map(char => {
            const code = char.charCodeAt(0);
            return '\\u' + code.toString(16).padStart(4, '0');
        }).join('');
    };

    const unicodeToString = (unicode: string): string => {
        return unicode.replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => {
            return String.fromCharCode(parseInt(code, 16));
        });
    };

    // Octal
    const stringToOctal = (str: string): string => {
        return str.split('').map(char =>
            '\\' + char.charCodeAt(0).toString(8).padStart(3, '0')
        ).join('');
    };

    const octalToString = (octal: string): string => {
        return octal.replace(/\\([0-7]{1,3})/g, (match, code) => {
            return String.fromCharCode(parseInt(code, 8));
        });
    };

    // HTML entities
    const stringToHtml = (str: string): string => {
        return str.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code > 127 || '<>&"\''.includes(char)) {
                return `&#${code};`;
            }
            return char;
        }).join('');
    };

    const htmlToString = (html: string): string => {
        return html.replace(/&#(\d+);/g, (match, code) => {
            return String.fromCharCode(parseInt(code));
        }).replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    };

    const convert = () => {
        setError(null);

        // Use binaryData if available (from file upload), otherwise use input
        const dataToEncode = binaryData || input;

        if (!dataToEncode.trim() && !uploadedFile) {
            setOutput('');
            return;
        }

        try {
            let result = '';

            if (direction === 'encode') {
                switch (encoding) {
                    case 'base64':
                        result = utf8ToBase64(dataToEncode);
                        break;
                    case 'base64url':
                        result = base64UrlEncode(dataToEncode);
                        break;
                    case 'base32':
                        result = base32Encode(dataToEncode);
                        break;
                    case 'url':
                        result = encodeURIComponent(dataToEncode);
                        break;
                    case 'hex':
                        result = stringToHex(dataToEncode);
                        break;
                    case 'binary':
                        result = stringToBinary(dataToEncode);
                        break;
                    case 'ascii':
                        result = stringToAscii(dataToEncode);
                        break;
                    case 'unicode':
                        result = stringToUnicode(dataToEncode);
                        break;
                    case 'octal':
                        result = stringToOctal(dataToEncode);
                        break;
                    case 'html':
                        result = stringToHtml(dataToEncode);
                        break;
                }
            } else {
                // Decode
                switch (encoding) {
                    case 'base64':
                        result = base64ToUtf8(input);
                        break;
                    case 'base64url':
                        result = base64UrlDecode(input);
                        break;
                    case 'base32':
                        result = base32Decode(input);
                        break;
                    case 'url':
                        result = decodeURIComponent(input);
                        break;
                    case 'hex':
                        result = hexToString(input);
                        break;
                    case 'binary':
                        result = binaryToString(input);
                        break;
                    case 'ascii':
                        result = asciiToString(input);
                        break;
                    case 'unicode':
                        result = unicodeToString(input);
                        break;
                    case 'octal':
                        result = octalToString(input);
                        break;
                    case 'html':
                        result = htmlToString(input);
                        break;
                }
            }

            setOutput(result);
        } catch (e: any) {
            const errorKey = direction === 'encode' ? 'encoding_error' : 'decoding_error';
            setError(t(`tool.encoding-converter.${errorKey}`, { error: e.message }));
            setOutput('');
        }
    };

    useEffect(() => {
        convert();
    }, [input, binaryData, encoding, direction]);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSwap = () => {
        setInput(output);
        setOutput(input);
        setDirection(direction === 'encode' ? 'decode' : 'encode');
    };

    // File handling - read as binary
    const handleFileRead = (file: File) => {
        setUploadedFile(file);

        // Create preview URL for images
        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
        } else {
            setFilePreviewUrl(null);
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);

            // Convert binary to string for encoding
            let binaryString = '';
            for (let i = 0; i < bytes.length; i++) {
                binaryString += String.fromCharCode(bytes[i]);
            }

            // Store binary data for encoding
            setBinaryData(binaryString);

            // For encode mode with binary files, don't show in textarea
            if (direction === 'encode') {
                // Check if it's a text file by trying to decode
                const isTextFile = file.type.startsWith('text/') ||
                    file.type === 'application/json' ||
                    file.type === 'application/xml';

                if (isTextFile) {
                    const textDecoder = new TextDecoder('utf-8', { fatal: false });
                    const text = textDecoder.decode(bytes);
                    setInput(text);
                } else {
                    // For binary files, just set the binary data without showing in textarea
                    setInput(''); // Clear input textarea for binary files
                }
            } else {
                // For decode mode, try to interpret as text
                const textDecoder = new TextDecoder('utf-8', { fatal: false });
                const text = textDecoder.decode(bytes);
                setInput(text);
            }
        };
        reader.onerror = () => {
            setError(t('tool.encoding-converter.file_read_error'));
        };
        reader.readAsArrayBuffer(file);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileRead(file);
        }
    };

    // Clear file when input changes manually
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        setUploadedFile(null);
        setFilePreviewUrl(null);
        setBinaryData('');
    };

    // Cleanup preview URL on unmount
    useEffect(() => {
        return () => {
            if (filePreviewUrl) {
                URL.revokeObjectURL(filePreviewUrl);
            }
        };
    }, [filePreviewUrl]);

    // Drag and drop
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileRead(file);
        }
    };

    // Paste handling
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    handleFileRead(file);
                }
                break;
            }
        }
    };

    const inputMode = direction === 'encode' ? t('tool.encoding-converter.plain_text') : t('tool.encoding-converter.encoded');
    const outputMode = direction === 'encode' ? t('tool.encoding-converter.encoded') : t('tool.encoding-converter.plain_text');

    return (
        <div className="flex flex-col h-[calc(100vh-12rem)] space-y-4">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Toolbar */}
            <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                {/* Encoding Type Selection */}
                <SegmentedControl
                    value={encoding}
                    onChange={(value) => setEncoding(value as EncodingType)}
                    options={ENCODINGS.map(enc => ({
                        value: enc.value,
                        label: enc.label,
                        title: enc.description
                    }))}
                />

                {/* Direction Toggle */}
                <div className="flex items-center gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setDirection('encode')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'encode'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {t('tool.encoding-converter.encode')}
                        </button>
                        <button
                            onClick={() => setDirection('decode')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${direction === 'decode'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {t('tool.encoding-converter.decode')}
                        </button>
                    </div>

                    <button
                        onClick={handleSwap}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={t('tool.encoding-converter.swap_tooltip')}
                    >
                        <ArrowRightLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Input/Output Area */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                {/* Input */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {t('tool.encoding-converter.input')} ({inputMode})
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4 mr-1" />
                                {t('tool.encoding-converter.upload')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                                setInput('');
                                setUploadedFile(null);
                                setFilePreviewUrl(null);
                                setBinaryData('');
                            }}>
                                {t('tool.encoding-converter.clear')}
                            </Button>
                        </div>
                    </div>
                    <div
                        className={`flex-1 relative ${isDragging ? 'ring-2 ring-primary-500 rounded-xl' : ''}`}
                        onDragEnter={handleDragEnter}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {/* File Preview or Textarea */}
                        {uploadedFile && !uploadedFile.type.startsWith('text/') && uploadedFile.type !== 'application/json' ? (
                            <div className="w-full h-full p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-auto">
                                {filePreviewUrl ? (
                                    /* Image Preview */
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <img
                                            src={filePreviewUrl}
                                            alt={uploadedFile.name}
                                            className="max-w-full max-h-[60%] object-contain rounded-lg shadow-md"
                                        />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadedFile.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.type || 'Unknown type'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Binary File Info */
                                    <div className="flex flex-col items-center justify-center h-full gap-4">
                                        <FileText className="w-16 h-16 text-gray-400" />
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{uploadedFile.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {(uploadedFile.size / 1024).toFixed(2)} KB • {uploadedFile.type || 'Binary file'}
                                            </p>
                                            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                                ✓ File loaded, ready to encode
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* Text Input */
                            <textarea
                                ref={textareaRef}
                                className="w-full h-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
                                value={input}
                                onChange={handleInputChange}
                                onPaste={handlePaste}
                                placeholder={t('tool.encoding-converter.input_placeholder', { mode: inputMode.toLowerCase() })}
                                spellCheck={false}
                            />
                        )}

                        {isDragging && (
                            <div className="absolute inset-0 bg-primary-500/10 border-2 border-dashed border-primary-500 rounded-xl flex items-center justify-center pointer-events-none">
                                <div className="bg-white dark:bg-gray-800 px-6 py-4 rounded-lg shadow-lg">
                                    <Upload className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('tool.encoding-converter.drop_file_here')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Output */}
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                            {t('tool.encoding-converter.output')} ({outputMode})
                        </span>
                        <Button size="sm" variant="ghost" onClick={handleCopy} disabled={!output}>
                            {copied ? <Check className="w-4 h-4 text-green-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                            {copied ? t('tool.encoding-converter.copied') : t('tool.encoding-converter.copy')}
                        </Button>
                    </div>
                    <div className="flex-1 relative">
                        <textarea
                            readOnly
                            className={`flex-1 w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed ${error ? 'border-red-300 dark:border-red-900' : 'border-gray-200 dark:border-gray-700'
                                }`}
                            value={output}
                            placeholder={t('tool.encoding-converter.output_placeholder')}
                        />

                        {/* Error Display */}
                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 shadow-lg flex items-start gap-3 animate-in slide-in-from-bottom-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <div className="text-sm font-medium break-words">{error}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                        {t('tool.encoding-converter.info_text')}
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default EncodingConverter;
