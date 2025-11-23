import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Binary, ArrowDown, Delete } from 'lucide-react';

type Format = 'bin' | 'dec' | 'hex';
type Operation = '&' | '|' | '^' | '~' | '<<' | '>>' | '>>>';

const OPS: { value: Operation; label: string; key: string }[] = [
  { value: '&', label: 'AND', key: 'and' },
  { value: '|', label: 'OR', key: 'or' },
  { value: '^', label: 'XOR', key: 'xor' },
  { value: '~', label: 'NOT', key: 'not' },
  { value: '<<', label: 'LSH', key: 'lsh' },
  { value: '>>', label: 'RSH', key: 'rsh' },
  { value: '>>>', label: 'ZRSH', key: 'zrsh' },
];

const BitwiseCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [format, setFormat] = useState<Format>('dec');
  const [op, setOp] = useState<Operation>('&');
  const [inputA, setInputA] = useState('0');
  const [inputB, setInputB] = useState('0');

  // Internal 32-bit integers
  const [valA, setValA] = useState(0);
  const [valB, setValB] = useState(0);
  const [result, setResult] = useState(0);

  // --- Parsing & Formatting ---

  const parseInput = (str: string, fmt: Format): number => {
    // Clean string
    let clean = str.trim();
    if (!clean) return 0;

    try {
      let num = 0;
      if (fmt === 'bin') {
        // Remove non-binary chars
        clean = clean.replace(/[^01]/g, '');
        num = parseInt(clean, 2);
      } else if (fmt === 'hex') {
        clean = clean.replace(/[^0-9a-fA-F]/g, '');
        num = parseInt(clean, 16);
      } else {
        clean = clean.replace(/[^0-9-]/g, '');
        num = parseInt(clean, 10);
      }
      return isNaN(num) ? 0 : num | 0; // Force 32-bit int
    } catch {
      return 0;
    }
  };

  const formatOutput = (num: number, fmt: Format): string => {
    if (fmt === 'bin') {
      // Show raw bits for negative numbers (two's complement)
      return (num >>> 0).toString(2);
    }
    if (fmt === 'hex') {
      return (num >>> 0).toString(16).toUpperCase();
    }
    return num.toString(10);
  };

  // --- Effects ---

  // Update internal numbers when inputs change
  useEffect(() => {
    const a = parseInput(inputA, format);
    const b = parseInput(inputB, format);
    setValA(a);
    setValB(b);
  }, [inputA, inputB, format]);

  // Calculate Result
  useEffect(() => {
    let res = 0;
    switch (op) {
      case '&': res = valA & valB; break;
      case '|': res = valA | valB; break;
      case '^': res = valA ^ valB; break;
      case '~': res = ~valA; break;
      case '<<': res = valA << valB; break;
      case '>>': res = valA >> valB; break;
      case '>>>': res = valA >>> valB; break;
    }
    setResult(res);
  }, [valA, valB, op]);

  const handleInputChange = (val: string, setter: (v: string) => void) => {
    setter(val);
  };

  // --- Bit Visualization Helper ---
  const renderBitRow = (num: number, label: string, highlight = false) => {
    const bits = [];
    for (let i = 31; i >= 0; i--) {
      const bit = (num >>> i) & 1;
      const isOne = bit === 1;

      bits.push(
        <div key={i} className="flex flex-col items-center gap-1 group relative">
          {/* Bit Index Tooltip */}
          <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 text-[9px] text-gray-400 font-mono transition-opacity bg-white dark:bg-gray-800 px-1 rounded shadow-sm pointer-events-none">
            {i}
          </div>

          <div
            className={`
              w-6 h-8 sm:w-5 sm:h-8 md:w-7 md:h-10 flex items-center justify-center text-xs sm:text-sm font-mono font-bold rounded transition-all
              ${isOne
                ? highlight
                  ? 'bg-green-500 text-white shadow-md shadow-green-500/20'
                  : 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
              }
              ${i % 8 === 0 && i !== 0 ? 'mr-2' : 'mr-px'}
            `}
          >
            {bit}
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 overflow-x-auto pb-2">
        <div className="w-8 text-xs font-bold text-gray-500 text-right flex-shrink-0">{label}</div>
        <div className="flex flex-1 min-w-max">{bits}</div>
        <div className="w-24 text-xs font-mono text-right text-gray-600 dark:text-gray-400 flex-shrink-0 hidden md:block">
          {formatOutput(num, format)}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Controls */}
      <Card className="p-6 bg-white dark:bg-gray-800 space-y-6">

        {/* Top Bar */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <SegmentedControl<Format>
            value={format}
            onChange={(fmt) => {
              // Convert current values to new format string to keep UX consistent
              const nA = parseInput(inputA, format);
              const nB = parseInput(inputB, format);
              setFormat(fmt);
              setInputA(formatOutput(nA, fmt));
              setInputB(formatOutput(nB, fmt));
            }}
            options={[
              { value: 'dec', label: t('common.decimal') },
              { value: 'hex', label: t('common.hexadecimal') },
              { value: 'bin', label: t('common.binary') },
            ]}
          />

          <div className="flex-1 overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex gap-2 min-w-max">
              {OPS.map(o => (
                <button
                  key={o.value}
                  onClick={() => setOp(o.value)}
                  className={`
                      px-3 py-2 rounded-lg text-sm font-bold font-mono transition-all border
                      ${op === o.value
                      ? 'bg-primary-500 text-white border-primary-500 shadow-md'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                    `}
                  title={t(`tool.bitwise-calculator.desc_${o.key}`)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">

          {/* Operand A */}
          <div className="md:col-span-5">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">{t('tool.bitwise-calculator.operand_a')}</label>
            <input
              type="text"
              className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-lg outline-none focus:ring-2 focus:ring-primary-500"
              value={inputA}
              onChange={(e) => handleInputChange(e.target.value, setInputA)}
            />
          </div>

          {/* Operator Display (Visual) */}
          <div className="md:col-span-2 flex justify-center py-2 md:py-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl font-bold text-gray-600 dark:text-gray-300 font-mono">
              {OPS.find(o => o.value === op)?.value}
            </div>
          </div>

          {/* Operand B */}
          <div className="md:col-span-5">
            <label className={`text-xs font-bold text-gray-500 uppercase mb-1 block ${op === '~' ? 'opacity-50' : ''}`}>
              {op === '<<' || op === '>>' || op === '>>>' ? t('tool.bitwise-calculator.shift_amount') : t('tool.bitwise-calculator.operand_b')}
            </label>
            <input
              type="text"
              disabled={op === '~'}
              className={`w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg font-mono text-lg outline-none focus:ring-2 focus:ring-primary-500 ${op === '~' ? 'opacity-50 cursor-not-allowed' : ''}`}
              value={inputB}
              onChange={(e) => handleInputChange(e.target.value, setInputB)}
            />
          </div>
        </div>
      </Card>

      {/* Visualization */}
      <Card className="flex-1 flex flex-col p-6 bg-white dark:bg-gray-800 min-h-0 overflow-hidden" padding="none">
        <div className="flex items-center gap-2 mb-6 text-gray-500">
          <Binary className="w-5 h-5" />
          <h3 className="text-sm font-bold uppercase">{t('tool.bitwise-calculator.visualization')}</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pb-4">
          {/* Row A */}
          {renderBitRow(valA, 'A')}

          {/* Row B (Hidden for unary NOT) */}
          {op !== '~' && (
            <div className="relative">
              {renderBitRow(valB, 'B')}
              {/* Operator Overlay */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 -ml-8 text-gray-300 font-mono text-xl font-bold hidden md:block">
                {op}
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gray-200 dark:bg-gray-700 w-full my-2 relative">
            <div className="absolute right-0 -top-3 text-gray-400">
              <ArrowDown size={16} />
            </div>
          </div>

          {/* Result */}
          {renderBitRow(result, '=', true)}
        </div>

        {/* Result Summary Footer */}
        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase font-bold">{t('common.decimal')}</div>
              <div className="font-mono text-sm sm:text-base text-gray-900 dark:text-white">{result}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase font-bold">{t('common.hexadecimal')}</div>
              <div className="font-mono text-sm sm:text-base text-primary-600 dark:text-primary-400">0x{(result >>> 0).toString(16).toUpperCase()}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
              <div className="text-[10px] text-gray-400 uppercase font-bold">{t('common.binary')}</div>
              <div className="font-mono text-sm sm:text-base text-gray-600 dark:text-gray-300 truncate">{(result >>> 0).toString(2)}</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BitwiseCalculator;