import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Slider } from '../../../components/ui/Slider';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';
import { Copy, RefreshCw, Trash2, Download, Check, Fingerprint, Hash } from 'lucide-react';
// @ts-ignore
import { v1, v4, v3, v5, NIL } from 'uuid';

type UuidVersion = 'v1' | 'v3' | 'v4' | 'v5' | 'nil';

const NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

const UuidGenerator: React.FC = () => {
  const { t } = useTranslation();
  // Config State
  const [version, setVersion] = useState<UuidVersion>('v4');
  const [quantity, setQuantity] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const [braces, setBraces] = useState(false);

  // v3/v5 Specific State
  const [namespaceType, setNamespaceType] = useState<keyof typeof NAMESPACES | 'custom'>('DNS');
  const [customNamespace, setCustomNamespace] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Output State
  const [generatedList, setGeneratedList] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    const list: string[] = [];

    // Hash based versions (Single generation based on input)
    if (version === 'v3' || version === 'v5') {
      const ns = namespaceType === 'custom' ? customNamespace : NAMESPACES[namespaceType];

      if (!ns || !nameInput) {
        setGeneratedList([]); // Or handle error
        return;
      }

      try {
        const func = version === 'v3' ? v3 : v5;
        // Validate custom namespace if needed, but uuid lib might throw
        const result = func(nameInput, ns);
        list.push(result);
      } catch (e) {
        // Fallback for invalid namespace format
        list.push(t('tool.uuid-generator.invalid_namespace'));
      }
    }
    // Random / Time based versions (Batch generation)
    else if (version === 'nil') {
      list.push(NIL);
    }
    else {
      const func = version === 'v1' ? v1 : v4;
      for (let i = 0; i < quantity; i++) {
        list.push(func());
      }
    }

    setGeneratedList(list);
  };

  // Auto generate on settings change (debounce for quantity/inputs)
  useEffect(() => {
    const timer = setTimeout(generate, 200);
    return () => clearTimeout(timer);
  }, [version, quantity, namespaceType, customNamespace, nameInput]);

  const formattedList = generatedList.map(uuid => {
    if (uuid.includes('Invalid')) return uuid;
    let formatted = uuid;
    if (!hyphens) formatted = formatted.replace(/-/g, '');
    if (uppercase) formatted = formatted.toUpperCase();
    if (braces) formatted = `{${formatted}}`;
    return formatted;
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedList.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([formattedList.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uuids-${version}-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-16rem)]">

      {/* Left: Configuration */}
      <div className="w-full lg:w-80 flex flex-col gap-6 overflow-y-auto">
        <Card className="flex flex-col gap-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase">{t('tool.uuid-generator.version')}</label>
            <div className="grid grid-cols-1 gap-2">
              <SegmentedControl<UuidVersion>
                value={version}
                onChange={(v) => {
                  setVersion(v);
                  // Reset quantity if switching to/from hash versions
                  if (v === 'v3' || v === 'v5' || v === 'nil') setQuantity(1);
                }}
                options={[
                  { value: 'v1', label: t('tool.uuid-generator.v1_label') },
                  { value: 'v4', label: t('tool.uuid-generator.v4_label') },
                ]}
              />
              <SegmentedControl<UuidVersion>
                value={version}
                onChange={setVersion}
                options={[
                  { value: 'v3', label: t('tool.uuid-generator.v3_label') },
                  { value: 'v5', label: t('tool.uuid-generator.v5_label') },
                ]}
              />
              <SegmentedControl<UuidVersion>
                value={version}
                onChange={setVersion}
                options={[
                  { value: 'nil', label: t('tool.uuid-generator.nil_label') },
                ]}
              />
            </div>
            <p className="text-xs text-gray-400">
              {version === 'v4' && t('tool.uuid-generator.v4_desc')}
              {version === 'v1' && t('tool.uuid-generator.v1_desc')}
              {version === 'v3' && t('tool.uuid-generator.v3_desc')}
              {version === 'v5' && t('tool.uuid-generator.v5_desc')}
              {version === 'nil' && t('tool.uuid-generator.nil_desc')}
            </p>
          </div>

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Conditional Inputs based on Version */}
          {(version === 'v1' || version === 'v4') && (
            <div className="space-y-4">
              <Slider
                label={`${t('tool.uuid-generator.quantity')}: ${quantity}`}
                min="1" max="100"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
              />
            </div>
          )}

          {(version === 'v3' || version === 'v5') && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('tool.uuid-generator.namespace')}</label>
                <select
                  className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  value={namespaceType}
                  onChange={(e) => setNamespaceType(e.target.value as any)}
                >
                  <option value="DNS">DNS</option>
                  <option value="URL">URL</option>
                  <option value="OID">OID</option>
                  <option value="X500">X.500</option>
                  <option value="custom">{t('tool.uuid-generator.custom_uuid')}</option>
                </select>
              </div>

              {namespaceType === 'custom' && (
                <input
                  type="text"
                  className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-transparent"
                  placeholder={t('tool.uuid-generator.enter_valid_uuid')}
                  value={customNamespace}
                  onChange={(e) => setCustomNamespace(e.target.value)}
                />
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('tool.uuid-generator.name_label')}</label>
                <input
                  type="text"
                  className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder={t('tool.uuid-generator.example_name')}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>
            </div>
          )}

          <hr className="border-gray-100 dark:border-gray-800" />

          {/* Formatting Options */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-500 uppercase">{t('tool.uuid-generator.format')}</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={hyphens} onChange={e => setHyphens(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
                {t('tool.uuid-generator.hyphens')}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={uppercase} onChange={e => setUppercase(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
                {t('tool.uuid-generator.uppercase')}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input type="checkbox" checked={braces} onChange={e => setBraces(e.target.checked)} className="rounded text-primary-600 focus:ring-primary-500" />
                {t('tool.uuid-generator.braces')}
              </label>
            </div>
          </div>

          <Button onClick={generate} size="lg" className="mt-auto">
            <RefreshCw className="w-4 h-4 mr-2" /> {t('tool.uuid-generator.regenerate')}
          </Button>
        </Card>
      </div>

      {/* Right: Output Area */}
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 pl-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
            <Fingerprint size={18} />
            {formattedList.length} {t('tool.uuid-generator.generated')}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={handleDownload} disabled={formattedList.length === 0}>
              <Download className="w-4 h-4 mr-2" /> .txt
            </Button>
            <Button size="sm" variant="primary" onClick={handleCopy} disabled={formattedList.length === 0}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? t('common.copied') : t('tool.hash-generator.copy_all')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm custom-scrollbar">
          {formattedList.length > 0 ? (
            <div className="font-mono text-sm space-y-2 text-gray-700 dark:text-gray-300">
              {formattedList.map((uuid, i) => (
                <div key={i} className="flex items-center gap-3 group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1 -mx-1 rounded">
                  <span className="text-gray-400 select-none w-6 text-right text-xs opacity-50">{i + 1}.</span>
                  <span className="break-all">{uuid}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Hash className="w-12 h-12 mb-2 opacity-20" />
              <p>{(version === 'v3' || version === 'v5') ? t('tool.uuid-generator.enter_name_namespace') : t('tool.uuid-generator.ready_to_generate')}</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default UuidGenerator;