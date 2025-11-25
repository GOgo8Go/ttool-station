import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Copy, FileText, Upload, Fingerprint, Check, AlertCircle, Loader2, Search } from 'lucide-react';
// @ts-ignore
import CryptoJS from 'crypto-js';

type InputMode = 'text' | 'file';

const ALGOS = [
  { key: 'MD5', label: 'MD5', method: CryptoJS.MD5 },
  { key: 'SHA1', label: 'SHA-1', method: CryptoJS.SHA1 },
  { key: 'SHA256', label: 'SHA-256', method: CryptoJS.SHA256 },
  { key: 'SHA512', label: 'SHA-512', method: CryptoJS.SHA512 },
  { key: 'SHA224', label: 'SHA-224', method: CryptoJS.SHA224 },
  { key: 'SHA384', label: 'SHA-384', method: CryptoJS.SHA384 },
  { key: 'SHA3', label: 'SHA-3', method: CryptoJS.SHA3 },
  { key: 'RIPEMD160', label: 'RIPEMD-160', method: CryptoJS.RIPEMD160 },
];

const HashGenerator: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InputMode>('text');
  const [inputText, setInputText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [results, setResults] = useState<Record<string, string>>({});
  const [compareHash, setCompareHash] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uppercase, setUppercase] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Text Hashing (Reactive) ---
  useEffect(() => {
    if (mode === 'text') {
      const newResults: Record<string, string> = {};
      if (!inputText) {
        setResults({});
        return;
      }
      ALGOS.forEach(algo => {
        try {
          newResults[algo.key] = algo.method(inputText).toString();
        } catch (e) {
          newResults[algo.key] = "Error";
        }
      });
      setResults(newResults);
    }
  }, [inputText, mode]);

  // --- File Hashing (Chunked) ---
  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setResults({});
    setIsProcessing(true);
    setProgress(0);

    // We need to create incremental hashers for all algos
    const hashers = ALGOS.map(algo => ({
      key: algo.key,
      algo: CryptoJS.algo[algo.key].create(),
    }));

    const chunkSize = 2 * 1024 * 1024; // 2MB chunks
    let offset = 0;
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        const arrayBuffer = e.target.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);

        // Update all hashers
        hashers.forEach(h => h.algo.update(wordArray));

        offset += arrayBuffer.byteLength;
        const percentage = Math.min(100, Math.round((offset / selectedFile.size) * 100));
        setProgress(percentage);

        if (offset < selectedFile.size) {
          readNextChunk();
        } else {
          // Finalize
          const finalResults: Record<string, string> = {};
          hashers.forEach(h => {
            finalResults[h.key] = h.algo.finalize().toString();
          });
          setResults(finalResults);
          setIsProcessing(false);
        }
      }
    };

    reader.onerror = () => {
      setIsProcessing(false);
      alert(t('tool.hash-generator.error_reading_file'));
    };

    const readNextChunk = () => {
      const slice = selectedFile.slice(offset, offset + chunkSize);
      reader.readAsArrayBuffer(slice);
    };

    readNextChunk();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Formatting & Copy ---
  const formatHash = (hash: string) => {
    return uppercase ? hash.toUpperCase() : hash;
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // --- Match Logic ---
  const getMatchStatus = (hash: string) => {
    if (!compareHash) return 'none';
    return compareHash.toLowerCase().trim() === hash.toLowerCase() ? 'match' : 'no-match';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)]">

      {/* Left: Input Area */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <Card className="p-4 flex-1 flex flex-col">
          <div className="mb-4">
            <SegmentedControl<InputMode>
              value={mode}
              onChange={(v) => {
                setMode(v);
                setResults({});
                setProgress(0);
              }}
              options={[
                { value: 'text', label: <><FileText className="w-4 h-4 mr-2" /> {t('tool.hash-generator.text_input')}</> },
                { value: 'file', label: <><Upload className="w-4 h-4 mr-2" /> {t('tool.hash-generator.file_input')}</> },
              ]}
            />
          </div>

          {mode === 'text' ? (
            <div className="flex-1 flex flex-col gap-2">
              <textarea
                className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                placeholder={t('tool.hash-generator.paste_text')}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                autoFocus
              />
              <div className="text-xs text-gray-400 text-right">
                {inputText.length} {t('common.chars')}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer p-6 text-center"
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t('tool.hash-generator.processing')}</div>
                  <div className="text-sm text-gray-500">{progress}%</div>
                  <div className="w-48 h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-primary-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center">
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-4 rounded-full mb-4 text-primary-600 dark:text-primary-400">
                    <Fingerprint className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white break-all max-w-[200px]">{file.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button size="sm" variant="secondary" className="mt-4">{t('tool.hash-generator.change_file')}</Button>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">{t('tool.hash-generator.select_file')}</h3>
                  <p className="text-sm text-gray-500 mt-2">{t('tool.hash-generator.local_calculation')}</p>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Right: Results Area */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('tool.hash-generator.paste_compare')}
              className="bg-transparent text-sm outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-400"
              value={compareHash}
              onChange={(e) => setCompareHash(e.target.value)}
            />
            {compareHash && (
              <button onClick={() => setCompareHash('')} className="text-gray-400 hover:text-red-500"><AlertCircle className="w-4 h-4" /></button>
            )}
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={uppercase}
                onChange={(e) => setUppercase(e.target.checked)}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              {t('tool.hash-generator.uppercase')}
            </label>
            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(Object.entries(results).map(([k, v]) => `${k}: ${formatHash(v)}`).join('\n'), 'all')}>
              {copiedKey === 'all' ? <Check className="w-4 h-4 mr-1 text-green-500" /> : <Copy className="w-4 h-4 mr-1" />}
              {t('tool.hash-generator.copy_all')}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {ALGOS.map((algo) => {
            const hash = results[algo.key];
            if (!hash) return null;

            const formatted = formatHash(hash);
            const matchStatus = getMatchStatus(hash);
            const isMatch = matchStatus === 'match';

            return (
              <Card key={algo.key} padding="sm" className={`transition-all ${isMatch ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20' : ''}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">{algo.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-mono">{formatted.length} {t('common.chars')}</span>
                      <button
                        onClick={() => copyToClipboard(formatted, algo.key)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors"
                        title="Copy"
                      >
                        {copiedKey === algo.key ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-sm break-all text-gray-800 dark:text-gray-200 selection:bg-primary-200 dark:selection:bg-primary-900">
                    {formatted}
                  </div>
                </div>
              </Card>
            );
          })}

          {Object.keys(results).length === 0 && !isProcessing && (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
              <Fingerprint className="w-16 h-16 mb-4 opacity-20" />
              <p>{t('tool.hash-generator.enter_text_or_file')}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default HashGenerator;