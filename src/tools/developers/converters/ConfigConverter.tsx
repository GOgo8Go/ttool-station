import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ArrowRight, ArrowLeftRight, Copy, AlertCircle, FileJson, FileCode, Check } from 'lucide-react';
// @ts-ignore
import yaml from 'js-yaml';
// @ts-ignore
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
// @ts-ignore
import ini from 'ini';
// @ts-ignore
import * as toml from 'smol-toml';

type Format = 'json' | 'yaml' | 'toml' | 'xml' | 'ini';

const FORMATS: { value: Format; label: string; color: string }[] = [
  { value: 'json', label: 'JSON', color: 'text-yellow-600 dark:text-yellow-400' },
  { value: 'yaml', label: 'YAML', color: 'text-red-600 dark:text-red-400' },
  { value: 'toml', label: 'TOML', color: 'text-blue-600 dark:text-blue-400' },
  { value: 'xml', label: 'XML', color: 'text-green-600 dark:text-green-400' },
  { value: 'ini', label: 'INI', color: 'text-purple-600 dark:text-purple-400' },
];

const EXAMPLE_DATA = {
  json: '{\n  "app": "Tool",\n  "version": 1.0,\n  "features": ["convert", "edit"]\n}',
  yaml: 'app: Tool\nversion: 1.0\nfeatures:\n  - convert\n  - edit',
  toml: 'app = "Tool"\nversion = 1.0\nfeatures = [ "convert", "edit" ]',
  xml: '<root>\n  <app>Tool</app>\n  <version>1</version>\n  <features>convert</features>\n  <features>edit</features>\n</root>',
  ini: 'app=Tool\nversion=1.0\n\n[features]\n0=convert\n1=edit'
};

const ConfigConverter: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState(EXAMPLE_DATA.json);
  const [output, setOutput] = useState('');
  const [sourceFormat, setSourceFormat] = useState<Format>('json');
  const [targetFormat, setTargetFormat] = useState<Format>('yaml');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Conversion Logic
  const convert = () => {
    setError(null);
    setWarning(null);

    if (!input.trim()) {
      setOutput('');
      return;
    }

    let dataObj: any;

    // 1. Parse Input
    try {
      switch (sourceFormat) {
        case 'json':
          dataObj = JSON.parse(input);
          break;
        case 'yaml':
          dataObj = yaml.load(input);
          break;
        case 'toml':
          dataObj = toml.parse(input);
          break;
        case 'xml':
          const parser = new XMLParser();
          dataObj = parser.parse(input);
          break;
        case 'ini':
          dataObj = ini.parse(input);
          break;
      }
    } catch (e: any) {
      setError(`${t('tool.config-converter.parse_error')} (${sourceFormat.toUpperCase()}): ${e.message}`);
      return;
    }

    if (!dataObj && typeof dataObj !== 'object') {
      setError(t('tool.config-converter.parsed_content_empty'));
      return;
    }

    // 2. Stringify Output
    try {
      let result = '';
      switch (targetFormat) {
        case 'json':
          result = JSON.stringify(dataObj, null, 2);
          break;
        case 'yaml':
          result = yaml.dump(dataObj);
          break;
        case 'toml':
          try {
            result = toml.stringify(dataObj);
          } catch (tomlErr: any) {
            // TOML is strict about types (e.g. no nulls, strict arrays)
            throw new Error(t('tool.config-converter.toml_error', { error: tomlErr.message }));
          }
          break;
        case 'xml':
          const builder = new XMLBuilder({ format: true, ignoreAttributes: false });
          // XML requires a single root. If dataObj is array or multi-key obj, wrap it.
          const keys = Object.keys(dataObj);
          if (Array.isArray(dataObj) || keys.length > 1) {
            setWarning(t('tool.config-converter.xml_warning'));
            result = builder.build({ root: dataObj });
          } else {
            result = builder.build(dataObj);
          }
          break;
        case 'ini':
          // INI does not support complex nesting well
          const hasDeepNesting = (obj: any, depth = 0): boolean => {
            if (depth > 1) return true;
            if (typeof obj !== 'object' || obj === null) return false;
            return Object.values(obj).some(val => hasDeepNesting(val, depth + 1));
          };

          if (hasDeepNesting(dataObj)) {
            setWarning(t('tool.config-converter.ini_warning'));
          }
          result = ini.stringify(dataObj);
          break;
      }
      setOutput(result);
    } catch (e: any) {
      setError(`${t('tool.config-converter.conversion_error')} (${targetFormat.toUpperCase()}): ${e.message}`);
    }
  };

  // Auto-convert when input or formats change
  useEffect(() => {
    const timer = setTimeout(convert, 500);
    return () => clearTimeout(timer);
  }, [input, sourceFormat, targetFormat]);

  const handleSwap = () => {
    setSourceFormat(targetFormat);
    setTargetFormat(sourceFormat);
    setInput(output);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t('tool.config-converter.from')}</label>
            <select
              value={sourceFormat}
              onChange={(e) => setSourceFormat(e.target.value as Format)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={handleSwap}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors self-center mt-4"
          title={t('tool.config-converter.swap_formats')}
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-xs font-semibold text-gray-500 uppercase">{t('tool.config-converter.to')}</label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as Format)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {FORMATS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Input */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className={`text-sm font-bold ${FORMATS.find(f => f.value === sourceFormat)?.color}`}>
              {FORMATS.find(f => f.value === sourceFormat)?.label} {t('tool.config-converter.input')}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setInput('')}>{t('tool.config-converter.clear')}</Button>
          </div>
          <textarea
            className="flex-1 w-full p-4 font-mono text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('tool.config-converter.paste_placeholder', { format: sourceFormat.toUpperCase() })}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <span className={`text-sm font-bold ${FORMATS.find(f => f.value === targetFormat)?.color}`}>
              {FORMATS.find(f => f.value === targetFormat)?.label} {t('tool.config-converter.output')}
            </span>
            <Button size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? t('tool.config-converter.copied') : t('tool.config-converter.copy')}
            </Button>
          </div>
          <div className="flex-1 relative group">
            <textarea
              readOnly
              className={`flex-1 w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border rounded-xl resize-none focus:ring-2 focus:ring-primary-500 outline-none leading-relaxed ${error ? 'border-red-300 dark:border-red-900' : 'border-gray-200 dark:border-gray-700'}`}
              value={output}
              placeholder={t('tool.config-converter.result_placeholder')}
            />

            {/* Feedback Overlays */}
            {(error || warning) && (
              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2 animate-in slide-in-from-bottom-2">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 shadow-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-medium break-words">{error}</div>
                  </div>
                )}
                {warning && !error && (
                  <div className="bg-orange-50 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 px-4 py-3 rounded-lg border border-orange-200 dark:border-orange-800 shadow-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="text-sm font-medium break-words">{warning}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigConverter;