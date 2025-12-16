import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Copy, Trash2, Calculator, AlertCircle, Check } from 'lucide-react';

type Operation = '+' | '-' | '*' | '/' | '%' | '**' | 'gcd' | 'lcm';

const BigIntCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const gcd = (a: bigint, b: bigint): bigint => {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b > 0n) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };

  const lcm = (a: bigint, b: bigint): bigint => {
    if (a === 0n || b === 0n) return 0n;
    const absA = a < 0n ? -a : a;
    const absB = b < 0n ? -b : b;
    return (absA * absB) / gcd(a, b);
  };

  const calculate = (op: Operation) => {
    setError(null);
    if (!valA.trim()) {
      setError(t('tool.bigint-calculator.enter_value_a'));
      return;
    }

    // Some operations don't strictly need B (like Factorial, but we stick to binary ops here for now)
    if (!valB.trim()) {
      setError(t('tool.bigint-calculator.enter_value_b'));
      return;
    }

    try {
      // Clean inputs (remove commas, spaces)
      const cleanA = valA.replace(/[,_\s]/g, '');
      const cleanB = valB.replace(/[,_\s]/g, '');

      // Validate regex for integer
      if (!/^-?\d+$/.test(cleanA) || !/^-?\d+$/.test(cleanB)) {
        throw new Error(t('tool.bigint-calculator.invalid_inputs'));
      }

      const a = BigInt(cleanA);
      const b = BigInt(cleanB);
      let res = 0n;

      switch (op) {
        case '+': res = a + b; break;
        case '-': res = a - b; break;
        case '*': res = a * b; break;
        case '/':
          if (b === 0n) throw new Error(t('tool.base-calculator.division_by_zero'));
          res = a / b;
          break;
        case '%':
          if (b === 0n) throw new Error(t('tool.bigint-calculator.modulo_by_zero'));
          res = a % b;
          break;
        case '**':
          if (b < 0n) throw new Error(t('tool.bigint-calculator.exponent_negative'));
          // Safety check for huge exponents to prevent browser freeze
          if (b > 10000n) throw new Error(t('tool.bigint-calculator.exponent_too_large'));
          res = a ** b;
          break;
        case 'gcd':
          res = gcd(a, b);
          break;
        case 'lcm':
          res = lcm(a, b);
          break;
      }

      const resStr = res.toString();
      setResult(resStr);

    } catch (err: any) {
      setError(err.message);
      setResult('');
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] gap-3">

      {/* Top Section: Inputs & Operations */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">

        {/* Input Area */}
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="flex-1 flex flex-col gap-2 overflow-y-auto p-1.5 custom-scrollbar">

            {/* Input A */}
            <div className="flex-1 flex flex-col min-h-[100px]">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('tool.bigint-calculator.number_a')}</label>
                <span className="text-xs text-gray-400">{valA.length} {t('common.chars')}</span>
              </div>
              <textarea
                className="flex-1 w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm text-gray-900 dark:text-white leading-relaxed"
                placeholder={t('tool.bigint-calculator.enter_large_integer')}
                value={valA}
                onChange={(e) => setValA(e.target.value)}
              />
            </div>

            {/* Input B */}
            <div className="flex-1 flex flex-col min-h-[100px]">
              <div className="flex justify-between mb-1">
                <label className="text-xs font-bold text-gray-500 uppercase">{t('tool.bigint-calculator.number_b')}</label>
                <span className="text-xs text-gray-400">{valB.length} {t('common.chars')}</span>
              </div>
              <textarea
                className="flex-1 w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm text-gray-900 dark:text-white leading-relaxed"
                placeholder={t('tool.bigint-calculator.enter_large_integer')}
                value={valB}
                onChange={(e) => setValB(e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="ghost" size="sm" onClick={() => { setValA(''); setValB(''); setResult(''); setError(null); }} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8">
                <Trash2 className="w-4 h-4 mr-2" /> {t('tool.bigint-calculator.clear_inputs')}
              </Button>
            </div>
          </div>
        </div>

        {/* Operations Panel */}
        <div className="lg:w-60 flex flex-col gap-3 flex-shrink-0">
          <Card className="p-3">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('common.arithmetic')}</label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => calculate('+')} className="text-lg font-mono h-10">+</Button>
              <Button variant="secondary" onClick={() => calculate('-')} className="text-lg font-mono h-10">-</Button>
              <Button variant="secondary" onClick={() => calculate('*')} className="text-lg font-mono h-10">×</Button>
              <Button variant="secondary" onClick={() => calculate('/')} className="text-lg font-mono h-10">÷</Button>
              <Button variant="secondary" onClick={() => calculate('%')} className="font-mono h-10">Mod</Button>
              <Button variant="secondary" onClick={() => calculate('**')} className="font-mono h-10">Pow</Button>
            </div>
          </Card>

          <Card className="p-3">
            <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">{t('common.number_theory')}</label>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" onClick={() => calculate('gcd')} className="h-9">{t('tool.bigint-calculator.gcd')}</Button>
              <Button variant="outline" size="sm" onClick={() => calculate('lcm')} className="h-9">{t('tool.bigint-calculator.lcm')}</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Result Area (Fixed Height) */}
      <div className="h-48 flex-shrink-0 bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        <div className="flex justify-between items-start mb-2 flex-shrink-0">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('common.result')}</span>
          <div className="flex gap-2 items-center">
            {result && (
              <>
                <span className="text-xs text-gray-500 font-mono">{result.length} {t('common.digits')}</span>
                <button onClick={handleCopy} className="text-gray-400 hover:text-primary-600 dark:hover:text-white transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
                  {copied ? <Check size={14} className="text-green-500 dark:text-green-400" /> : <Copy size={14} />}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-lg break-all leading-relaxed text-primary-600 dark:text-green-400 selection:bg-primary-100 dark:selection:bg-primary-900/30 pr-1">
          {error ? (
            <div className="text-red-500 dark:text-red-400 flex items-center gap-2 text-sm">
              <AlertCircle size={16} /> {error}
            </div>
          ) : (
            result || <span className="text-gray-300 dark:text-gray-700 select-none">0</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default BigIntCalculator;