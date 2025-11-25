import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Copy, Check, Hash, ArrowRightLeft, Calculator } from 'lucide-react';

const BaseConverter: React.FC = () => {
  const { t } = useTranslation();
  // --- Quick Converter State ---
  const [inputs, setInputs] = useState({
    dec: '',
    hex: '',
    oct: '',
    bin: ''
  });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // --- Custom Converter State ---
  const [customInput, setCustomInput] = useState('');
  const [fromBase, setFromBase] = useState(10);
  const [toBase, setToBase] = useState(36);
  const [customOutput, setCustomOutput] = useState('');

  // --- Helper: BigInt Parsing ---
  // Standard parseInt loses precision for large numbers. BigInt doesn't have a built-in parse(string, radix) method.
  const parseBigInt = (str: string, base: number): bigint => {
    const validChars = "0123456789abcdefghijklmnopqrstuvwxyz";
    const cleanStr = str.toLowerCase().replace(/[^0-9a-z]/g, '');
    if (!cleanStr) throw new Error("Empty");

    // Check for invalid digits for this base
    for (const char of cleanStr) {
      if (validChars.indexOf(char) >= base) throw new Error("Invalid digit");
    }

    // Manual parsing loop
    let res = 0n;
    const baseBig = BigInt(base);
    for (const char of cleanStr) {
      const val = validChars.indexOf(char);
      res = res * baseBig + BigInt(val);
    }
    return res;
  };

  // --- Quick Converter Logic ---
  const handleQuickChange = (value: string, type: 'dec' | 'hex' | 'oct' | 'bin') => {
    // 1. Validate Input character set immediately
    let validRegex;
    let base;

    switch (type) {
      case 'dec': validRegex = /^[0-9]*$/; base = 10; break;
      case 'hex': validRegex = /^[0-9a-fA-F]*$/; base = 16; break;
      case 'oct': validRegex = /^[0-7]*$/; base = 8; break;
      case 'bin': validRegex = /^[0-1]*$/; base = 2; break;
    }

    if (!validRegex.test(value)) return;

    // 2. Update the source input
    const newInputs = { ...inputs, [type]: value };

    // 3. Calculate others
    if (!value) {
      setInputs({ dec: '', hex: '', oct: '', bin: '' });
      return;
    }

    try {
      const bigVal = parseBigInt(value, base);

      if (type !== 'dec') newInputs.dec = bigVal.toString(10);
      if (type !== 'hex') newInputs.hex = bigVal.toString(16).toUpperCase();
      if (type !== 'oct') newInputs.oct = bigVal.toString(8);
      if (type !== 'bin') newInputs.bin = bigVal.toString(2);

      setInputs(newInputs);
    } catch (e) {
      // If parsing fails (e.g. intermediate empty state handled above), just update source
      setInputs(newInputs);
    }
  };

  // --- Custom Converter Logic ---
  useEffect(() => {
    if (!customInput) {
      setCustomOutput('');
      return;
    }
    try {
      const bigVal = parseBigInt(customInput, fromBase);
      setCustomOutput(bigVal.toString(toBase).toUpperCase());
    } catch (e) {
      // Don't clear output immediately on type error, maybe show indicator?
      // For now, strict validation on render prevents this mostly, but char validation is loose here
      setCustomOutput('...');
    }
  }, [customInput, fromBase, toBase]);

  const handleCustomInputChange = (val: string) => {
    // Basic validation: allow chars valid for the FROM base
    const validChars = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, fromBase);
    const regex = new RegExp(`^[${validChars}]*$`, 'i');
    if (regex.test(val)) {
      setCustomInput(val);
    }
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <div className="flex flex-col gap-8 h-full">
      {/* Quick Converter Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Hash className="w-5 h-5 text-primary-500" />
          <h3>{t('common.quick_converter')}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card padding="md" className="space-y-2 border-l-4 border-l-blue-500">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
              <span>{t('common.decimal')} (10)</span>
              <button onClick={() => copyToClipboard(inputs.dec, 'dec')} className="hover:text-primary-500">
                {copiedField === 'dec' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <input
              className="w-full bg-transparent font-mono text-xl outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
              placeholder="0"
              value={inputs.dec}
              onChange={(e) => handleQuickChange(e.target.value, 'dec')}
            />
          </Card>

          <Card padding="md" className="space-y-2 border-l-4 border-l-orange-500">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
              <span>{t('common.hexadecimal')} (16)</span>
              <button onClick={() => copyToClipboard(inputs.hex, 'hex')} className="hover:text-primary-500">
                {copiedField === 'hex' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <input
              className="w-full bg-transparent font-mono text-xl outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 uppercase"
              placeholder="0"
              value={inputs.hex}
              onChange={(e) => handleQuickChange(e.target.value, 'hex')}
            />
          </Card>

          <Card padding="md" className="space-y-2 border-l-4 border-l-green-500">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
              <span>{t('common.octal')} (8)</span>
              <button onClick={() => copyToClipboard(inputs.oct, 'oct')} className="hover:text-primary-500">
                {copiedField === 'oct' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <input
              className="w-full bg-transparent font-mono text-xl outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700"
              placeholder="0"
              value={inputs.oct}
              onChange={(e) => handleQuickChange(e.target.value, 'oct')}
            />
          </Card>

          <Card padding="md" className="space-y-2 border-l-4 border-l-purple-500">
            <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
              <span>{t('common.binary')} (2)</span>
              <button onClick={() => copyToClipboard(inputs.bin, 'bin')} className="hover:text-primary-500">
                {copiedField === 'bin' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
            <input
              className="w-full bg-transparent font-mono text-xl outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 break-all"
              placeholder="0"
              value={inputs.bin}
              onChange={(e) => handleQuickChange(e.target.value, 'bin')}
            />
          </Card>
        </div>
      </section>

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* Custom Converter Section */}
      <section className="space-y-4 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Calculator className="w-5 h-5 text-primary-500" />
          <h3>{t('common.custom_base')}</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex gap-4 items-center">
              <label className="text-sm font-medium text-gray-500">{t('common.from_base')}</label>
              <input
                type="number" min="2" max="36"
                value={fromBase} onChange={(e) => setFromBase(parseInt(e.target.value) || 10)}
                className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <textarea
              className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl resize-none font-mono text-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder={`${t('common.enter_number')} (base-${fromBase})`}
              value={customInput}
              onChange={(e) => handleCustomInputChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <label className="text-sm font-medium text-gray-500">{t('common.to_base')}</label>
                <input
                  type="number" min="2" max="36"
                  value={toBase} onChange={(e) => setToBase(parseInt(e.target.value) || 10)}
                  className="w-20 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              {customOutput && (
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(customOutput, 'custom')}>
                  {copiedField === 'custom' ? <Check size={14} /> : <Copy size={14} />}
                </Button>
              )}
            </div>
            <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl font-mono text-lg break-all overflow-auto text-gray-900 dark:text-white">
              {customOutput || <span className="text-gray-400 italic">{t('common.result')}</span>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BaseConverter;