import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { SegmentedControl, Option } from '../../../components/ui/SegmentedControl';
import { Calculator, Delete, ArrowRight, HelpCircle, AlertCircle, Cpu, Hash } from 'lucide-react';

type Operation = 'add' | 'sub' | 'mul' | 'div';
type CalcMode = 'integer' | 'float';

const BASES = [
  { value: 2, label: 'Binary (2)' },
  { value: 8, label: 'Octal (8)' },
  { value: 10, label: 'Decimal (10)' },
  { value: 16, label: 'Hex (16)' },
];

const OPS: Option<Operation>[] = [
  { value: 'add', label: '+' },
  { value: 'sub', label: '-' },
  { value: 'mul', label: '×' },
  { value: 'div', label: '÷' },
];

// --- Math Helpers ---

const parseBigInt = (str: string, base: number): bigint => {
  const validChars = "0123456789abcdefghijklmnopqrstuvwxyz";
  // Remove decimals for BigInt if accidentally entered
  const cleanStr = str.split('.')[0].toLowerCase().replace(/[^0-9a-z]/g, '');
  if (!cleanStr) return 0n;

  for (const char of cleanStr) {
    if (validChars.indexOf(char) >= base) throw new Error(`Invalid digit '${char}' for base ${base}`);
  }

  let res = 0n;
  const baseBig = BigInt(base);
  for (const char of cleanStr) {
    const val = validChars.indexOf(char);
    res = res * baseBig + BigInt(val);
  }
  return res;
};

const parseFloatBase = (str: string, base: number): number => {
  const validChars = "0123456789abcdefghijklmnopqrstuvwxyz";
  const parts = str.toLowerCase().split('.');
  if (parts.length > 2) throw new Error("Invalid format: multiple decimal points");

  const intStr = parts[0].replace(/[^0-9a-z-]/g, ''); // keep minus
  const fracStr = parts[1]?.replace(/[^0-9a-z]/g, '') || '';

  // Validate characters
  for (const char of (intStr.replace('-', '') + fracStr)) {
    if (validChars.indexOf(char) >= base && validChars.indexOf(char) !== -1) {
      throw new Error(`Invalid digit '${char}' for base ${base}`);
    }
  }

  let intVal = 0;
  try {
    intVal = parseInt(intStr, base);
  } catch (e) { intVal = 0; }
  if (isNaN(intVal)) intVal = 0;

  let fracVal = 0;
  for (let i = 0; i < fracStr.length; i++) {
    const val = validChars.indexOf(fracStr[i]);
    if (val >= 0) {
      fracVal += val / Math.pow(base, i + 1);
    }
  }

  const sign = intStr.startsWith('-') ? -1 : 1;
  // For JS number, if intVal is 0 and sign is -1 (e.g. "-0.5"), simple addition works differently 
  // because parseInt("-0") is -0.
  // We handle magnitude explicitly.
  const magnitude = Math.abs(intVal) + fracVal;
  return sign * magnitude;
};

const formatBigInt = (num: bigint, base: number): string => {
  return num.toString(base).toUpperCase();
};

const formatFloat = (num: number, base: number): string => {
  return num.toString(base).toUpperCase();
};

// IEEE 754 Helpers
const getIeee754 = (num: number) => {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);

  // 64-bit Double
  view.setFloat64(0, num, false); // Big Endian
  let bin64 = '';
  for (let i = 0; i < 8; i++) bin64 += view.getUint8(i).toString(2).padStart(8, '0');

  // 32-bit Single
  view.setFloat32(0, num, false);
  let bin32 = '';
  for (let i = 0; i < 4; i++) bin32 += view.getUint8(i).toString(2).padStart(8, '0');

  const hex64 = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  // Correct Hex32
  const buffer32 = new ArrayBuffer(4);
  const view32 = new DataView(buffer32);
  view32.setFloat32(0, num, false);
  const realHex32 = Array.from(new Uint8Array(buffer32)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  return {
    double: {
      sign: bin64[0],
      exp: bin64.slice(1, 12),
      mant: bin64.slice(12),
      hex: hex64
    },
    single: {
      sign: bin32[0],
      exp: bin32.slice(1, 9),
      mant: bin32.slice(9),
      hex: realHex32
    }
  };
};

const BaseCalculator: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CalcMode>('integer');
  const [num1, setNum1] = useState('');
  const [num2, setNum2] = useState('');
  const [base, setBase] = useState(2);
  const [operation, setOperation] = useState<Operation>('add');
  const [error, setError] = useState<string | null>(null);

  const [resultStr, setResultStr] = useState<string | null>(null);
  const [resultNum, setResultNum] = useState<number | null>(null);
  const [remainder, setRemainder] = useState<string | null>(null);

  // --- Calculation Logic ---

  const calculate = () => {
    setError(null);
    setResultStr(null);
    setResultNum(null);
    setRemainder(null);

    if (!num1 || !num2) return;

    try {
      if (mode === 'integer') {
        const n1 = parseBigInt(num1, base);
        const n2 = parseBigInt(num2, base);
        let res = 0n;
        switch (operation) {
          case 'add': res = n1 + n2; break;
          case 'sub': res = n1 - n2; break;
          case 'mul': res = n1 * n2; break;
          case 'div':
            if (n2 === 0n) throw new Error("Division by zero");
            res = n1 / n2;
            setRemainder(formatBigInt(n1 % n2, base));
            break;
        }
        setResultStr(formatBigInt(res, base));
      } else {
        const n1 = parseFloatBase(num1, base);
        const n2 = parseFloatBase(num2, base);
        let res = 0;
        switch (operation) {
          case 'add': res = n1 + n2; break;
          case 'sub': res = n1 - n2; break;
          case 'mul': res = n1 * n2; break;
          case 'div': res = n1 / n2; break;
        }
        if (!isFinite(res) && !isNaN(res)) setResultStr(res > 0 ? 'Infinity' : '-Infinity');
        else if (isNaN(res)) setResultStr('NaN');
        else setResultStr(formatFloat(res, base));
        setResultNum(res);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    calculate();
  }, [num1, num2, base, operation, mode]);

  const validateInput = (val: string) => {
    const validChars = "0123456789abcdefghijklmnopqrstuvwxyz".slice(0, base);
    const regexStr = mode === 'float' ? `^[${validChars}.]*$` : `^[${validChars}]*$`;
    const regex = new RegExp(regexStr, 'i');
    return regex.test(val);
  };

  const decimalDisplayValue = useMemo(() => {
    if (!resultStr || error) return null;
    try {
      if (mode === 'integer') {
        return parseBigInt(resultStr, base).toString(10);
      } else {
        return resultNum?.toPrecision(6);
      }
    } catch (e) {
      return null;
    }
  }, [resultStr, base, mode, resultNum, error]);

  // --- Visualization Logic ---

  const renderBinaryAddition = (aStr: string, bStr: string) => {
    const maxLen = Math.max(aStr.length, bStr.length);
    const carries: string[] = [];
    const sumRow: string[] = [];
    let carry = 0;

    const aRev = aStr.split('').reverse();
    const bRev = bStr.split('').reverse();

    for (let i = 0; i < maxLen; i++) {
      const a = parseInt(aRev[i] || '0', 2);
      const b = parseInt(bRev[i] || '0', 2);
      const sum = a + b + carry;
      sumRow.push((sum % 2).toString());
      carry = Math.floor(sum / 2);
      carries.push(carry > 0 ? '1' : '0');
    }
    if (carry > 0) sumRow.push('1');

    const width = sumRow.length;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase">{t('tool.base-calculator.binary_addition')}</h4>
        <div className="font-mono text-lg leading-relaxed tracking-widest text-right inline-block bg-white dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 text-xs mb-1 text-left">{t('tool.base-calculator.carries')}</div>
          <div className="text-orange-500 h-6">{carries.reverse().join('').padStart(width, ' ').substring(0, width)}</div>
          <div className="text-gray-900 dark:text-gray-100">{aStr.padStart(width, ' ')}</div>
          <div className="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 flex justify-end gap-2">
            <span className="text-gray-400 select-none">+</span> {bStr.padStart(width, ' ')}
          </div>
          <div className="text-green-600 dark:text-green-400 font-bold mt-1">{sumRow.reverse().join('')}</div>
        </div>
      </div>
    );
  };

  const renderBinarySubtraction = (num1: string, num2: string) => {
    const val1 = parseBigInt(num1, 2);
    const val2 = parseBigInt(num2, 2);

    // Visualization assumes A >= B. If A < B, we show -(B - A)
    const isNegative = val1 < val2;
    const aStr = (isNegative ? num2 : num1).replace(/^0+/, '') || '0';
    const bStr = (isNegative ? num1 : num2).replace(/^0+/, '') || '0';

    const maxLen = Math.max(aStr.length, bStr.length);
    const borrows: string[] = [];
    const diffRow: string[] = [];
    let borrow = 0;

    const aRev = aStr.split('').reverse();
    const bRev = bStr.split('').reverse();

    for (let i = 0; i < maxLen; i++) {
      const a = parseInt(aRev[i] || '0', 2);
      const b = parseInt(bRev[i] || '0', 2);
      let diff = a - b - borrow;

      if (diff < 0) {
        diff += 2;
        borrow = 1;
      } else {
        borrow = 0;
      }
      diffRow.push(diff.toString());
      borrows.push(borrow > 0 ? '1' : '0');
    }

    // Trim leading zeros from visual borrows for cleaner look (optional)
    // Keep full width for alignment
    const width = maxLen;

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase">{t('tool.base-calculator.binary_subtraction')}</h4>
        {isNegative && <p className="text-xs text-red-500 mb-2">{t('tool.base-calculator.result_negative')}</p>}
        <div className="font-mono text-lg leading-relaxed tracking-widest text-right inline-block bg-white dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 text-xs mb-1 text-left">{t('tool.base-calculator.borrows')}</div>
          <div className="text-orange-500 h-6">{borrows.reverse().join('').substring(0, width)}</div>
          <div className="text-gray-900 dark:text-gray-100">{aStr.padStart(width, ' ')}</div>
          <div className="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 flex justify-end gap-2">
            <span className="text-gray-400 select-none">-</span> {bStr.padStart(width, ' ')}
          </div>
          <div className="text-green-600 dark:text-green-400 font-bold mt-1">
            {isNegative ? '-' : ' '}{diffRow.reverse().join('')}
          </div>
        </div>
      </div>
    );
  };

  const renderBinaryMultiplication = (num1: string, num2: string) => {
    const aStr = num1.replace(/^0+/, '') || '0';
    const bStr = num2.replace(/^0+/, '') || '0';

    const partials: string[] = [];
    const bRev = bStr.split('').reverse();

    for (let i = 0; i < bRev.length; i++) {
      if (bRev[i] === '1') {
        partials.push(aStr + '0'.repeat(i));
      } else {
        partials.push('0'); // or skip
      }
    }

    const totalLen = (parseBigInt(num1, 2) * parseBigInt(num2, 2)).toString(2).length;
    const width = Math.max(totalLen, aStr.length, bStr.length);

    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase">{t('tool.base-calculator.binary_multiplication')}</h4>
        <div className="font-mono text-lg leading-relaxed tracking-widest text-right inline-block bg-white dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-900 dark:text-gray-100">{aStr.padStart(width, ' ')}</div>
          <div className="text-gray-900 dark:text-gray-100 border-b border-gray-300 dark:border-gray-600 flex justify-end gap-2 mb-1">
            <span className="text-gray-400 select-none">×</span> {bStr.padStart(width, ' ')}
          </div>

          {partials.map((p, i) => (
            <div key={i} className={`text-gray-600 dark:text-gray-400 ${p === '0' ? 'opacity-30' : ''}`}>
              {p.padStart(width, ' ')}
            </div>
          ))}

          <div className="border-t border-gray-300 dark:border-gray-600 mt-1 pt-1 text-green-600 dark:text-green-400 font-bold">
            {(parseBigInt(num1, 2) * parseBigInt(num2, 2)).toString(2).padStart(width, ' ')}
          </div>
        </div>
      </div>
    );
  };

  const renderBinaryDivision = (dividendStr: string, divisorStr: string) => {
    // Binary Long Division Visualization
    // Format:
    //       101 (Quotient)
    //     -----
    // 11 ) 1111 (Dividend)
    //      - 11
    //      ----
    //        01...

    const dividend = parseBigInt(dividendStr, 2);
    const divisor = parseBigInt(divisorStr, 2);
    if (divisor === 0n) return <div>Division by Zero</div>;

    const divStr = dividendStr.replace(/^0+/, '') || '0';
    const dvsrStr = divisorStr.replace(/^0+/, '') || '0';
    const quotientStr = (dividend / divisor).toString(2);

    const steps: React.ReactNode[] = [];

    let currentRem = 0n;
    const dvsrBig = divisor;
    let processStr = "";

    // Simulation needed to capture alignment
    // We iterate through dividend bits

    for (let i = 0; i < divStr.length; i++) {
      // Bring down bit
      const bit = divStr[i] === '1' ? 1n : 0n;
      currentRem = (currentRem << 1n) | bit;
      processStr += divStr[i]; // Track visual width

      // Check if we can subtract
      // Visual logic usually only shows the subtraction step if it happens (quotient bit 1)
      // Or brings down next if 0.
      // Simple simulation:
    }

    // Re-implementation for visual layout:
    // We will construct a grid of rows.

    const rows: { text: string; type: 'sub' | 'rem' | 'bring'; indent: number }[] = [];

    let rem = "";
    let indent = 0;

    // Working with strings for visual simplicity in binary
    const divArr = divStr.split('');
    let curr = "";

    for (let i = 0; i < divArr.length; i++) {
      curr += divArr[i];
      const currVal = parseBigInt(curr, 2);

      // Optimization: remove leading zeros for comparison but keep for length tracking if needed?
      // Binary division simple rule: if curr >= divisor, subtract.

      if (currVal >= divisor) {
        // Record Subtraction Step
        // Calculate indent based on where 'curr' ends in the full string context?
        // It's easier to just list the steps aligned to the right of the accumulated buffer.

        // Standard Long Division layout is tricky in HTML.
        // Simplified Step View:
        // Step 1: 111 >= 11? Yes. Sub 11. Rem 01.
        // Step 2: Bring down 1. 011 >= 11? Yes...
      }
    }

    // Fallback to simple text explanation if full graphical layout is too complex for this component size
    return (
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-gray-500 uppercase">{t('tool.base-calculator.binary_division')}</h4>
        <div className="font-mono text-base bg-white dark:bg-black/20 p-4 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="text-right border-r-2 border-gray-300 dark:border-gray-600 pr-2 mr-2">
              {dvsrStr}
            </div>
            <div>
              <div className="border-b-2 border-gray-300 dark:border-gray-600 mb-1 px-1">
                {quotientStr}
              </div>
              <div className="px-1 tracking-widest">
                {divStr}
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            <p>{t('tool.base-calculator.quotient')}: {quotientStr} ({parseInt(quotientStr, 2)})</p>
            <p>{t('tool.base-calculator.remainder')}: {(dividend % divisor).toString(2)} ({parseInt((dividend % divisor).toString(2), 2)})</p>
          </div>
        </div>
      </div>
    );
  };

  const renderVisuals = useMemo(() => {
    if (error) return null;

    // INTEGER MODE: Binary Arithmetic Steps
    if (mode === 'integer') {
      if (!num1 || !num2 || base !== 2) return (
        <div className="text-gray-400 italic text-sm p-4 text-center">
          <Trans i18nKey="tool.base-calculator.step_by_step_binary_only" components={{ strong: <strong /> }} />
        </div>
      );

      switch (operation) {
        case 'add': return renderBinaryAddition(num1, num2);
        case 'sub': return renderBinarySubtraction(num1, num2);
        case 'mul': return renderBinaryMultiplication(num1, num2);
        case 'div': return renderBinaryDivision(num1, num2);
        default: return null;
      }
    }

    // FLOAT MODE: IEEE 754 Representation
    if (mode === 'float') {
      if (resultNum === null || isNaN(resultNum)) return null;
      const ieee = getIeee754(resultNum);

      const BitBox = ({ label, bits, color }: any) => (
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-gray-400 mb-1">{label}</span>
          <div className={`font-mono text-sm px-1 border rounded ${color} bg-white dark:bg-gray-800 border-current break-all text-center`}>{bits}</div>
        </div>
      );

      return (
        <div className="space-y-8">
          {/* 32-bit Single */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Cpu size={16} /> {t('tool.base-calculator.ieee754_single')}
              </h4>
              <span className="font-mono text-xs text-gray-500">{t('tool.base-calculator.hex')}: 0x{ieee.single.hex}</span>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <BitBox label="Sign (1)" bits={ieee.single.sign} color="text-red-500 border-red-200 dark:border-red-900" />
                <BitBox label="Exponent (8)" bits={ieee.single.exp} color="text-green-600 border-green-200 dark:border-green-900" />
                <BitBox label="Mantissa (23)" bits={ieee.single.mant} color="text-blue-600 border-blue-200 dark:border-blue-900" />
              </div>
              <div className="mt-3 text-xs text-gray-500 font-mono">
                {t('tool.base-calculator.value')} ≈ {ieee.single.sign === '1' ? '-' : '+'}(1.{parseInt(ieee.single.mant, 2).toString(16)}... ) × 2^({parseInt(ieee.single.exp, 2) - 127})
              </div>
            </div>
          </div>

          {/* 64-bit Double */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Cpu size={16} /> {t('tool.base-calculator.ieee754_double')}
              </h4>
              <span className="font-mono text-xs text-gray-500">{t('tool.base-calculator.hex')}: 0x{ieee.double.hex}</span>
            </div>
            <div className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                <BitBox label="Sign (1)" bits={ieee.double.sign} color="text-red-500 border-red-200 dark:border-red-900" />
                <BitBox label="Exponent (11)" bits={ieee.double.exp} color="text-green-600 border-green-200 dark:border-green-900" />
                <BitBox label="Mantissa (52)" bits={ieee.double.mant} color="text-blue-600 border-blue-200 dark:border-blue-900" />
              </div>
              <div className="mt-3 text-xs text-gray-500 font-mono">
                {t('tool.base-calculator.value')} = {ieee.double.sign === '1' ? '-' : '+'}(1.{parseInt(ieee.double.mant.slice(0, 10), 2).toString(16)}...) × 2^({parseInt(ieee.double.exp, 2) - 1023})
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }, [num1, num2, base, operation, resultStr, resultNum, mode, error]);

  return (
    <div className="flex flex-col gap-6 h-full">

      {/* Control Panel */}
      <Card className="p-6 bg-white dark:bg-gray-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Settings */}
          <div className="lg:col-span-3 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-700 pb-4 lg:pb-0 lg:pr-6">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('common.mode')}</label>
              <SegmentedControl<CalcMode>
                options={[
                  { value: 'integer', label: <><Hash size={14} className="mr-1" /> Int</> },
                  { value: 'float', label: <><Cpu size={14} className="mr-1" /> Float</> },
                ]}
                value={mode}
                onChange={(v) => {
                  setMode(v);
                  setResultStr(null);
                  setResultNum(null);
                }}
                size="sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Base</label>
              <select
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                value={base}
                onChange={(e) => setBase(Number(e.target.value))}
              >
                {BASES.map(b => <option key={b.value} value={b.value}>{b.label.replace('Binary', t('common.binary')).replace('Octal', t('common.octal')).replace('Decimal', t('common.decimal')).replace('Hex', t('common.hexadecimal'))}</option>)}
                {!BASES.find(b => b.value === base) && <option value={base}>Base {base}</option>}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('common.options')}</label>
              <SegmentedControl<Operation>
                options={OPS}
                value={operation}
                onChange={setOperation}
                variant="grid"
              />
            </div>
          </div>

          {/* Inputs */}
          <div className="lg:col-span-9 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.base-calculator.number_1')}</label>
                <input
                  className="w-full text-xl font-mono p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  value={num1}
                  onChange={(e) => validateInput(e.target.value) && setNum1(e.target.value)}
                  placeholder={mode === 'float' ? "0.0" : "0"}
                />
              </div>
              <div className="text-2xl font-bold text-gray-300 dark:text-gray-600 pt-4">
                {OPS.find(o => o.value === operation)?.label}
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.base-calculator.number_2')}</label>
                <input
                  className="w-full text-xl font-mono p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                  value={num2}
                  onChange={(e) => validateInput(e.target.value) && setNum2(e.target.value)}
                  placeholder={mode === 'float' ? "0.0" : "0"}
                />
              </div>
            </div>

            {/* Result Bar */}
            <div className="bg-gray-100 dark:bg-gray-900/50 rounded-xl p-4 flex items-center justify-between min-h-[80px]">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400 flex-shrink-0">
                  <Calculator className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-gray-500 uppercase font-bold">{t('common.result')} (Base {base})</div>
                  {error ? (
                    <div className="text-red-500 font-medium flex items-center gap-1"><AlertCircle size={14} /> {error}</div>
                  ) : (
                    <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white truncate">
                      {resultStr || '0'}
                      {remainder && <span className="text-sm text-gray-500 ml-2 opacity-75 font-normal">rem {remainder}</span>}
                    </div>
                  )}
                </div>
              </div>
              {resultStr && !error && decimalDisplayValue && (
                <div className="text-right hidden sm:block flex-shrink-0 pl-4 border-l border-gray-200 dark:border-gray-700 ml-4">
                  <div className="text-xs text-gray-400 uppercase">{t('tool.base-calculator.decimal_value')}</div>
                  <div className="font-mono text-gray-600 dark:text-gray-400 text-sm">
                    {decimalDisplayValue}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Visualization Area */}
      <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-primary-500" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
            {mode === 'integer' ? t('tool.base-calculator.calculation_steps') : t('tool.base-calculator.format_visualization')}
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-8 flex items-start justify-center bg-white dark:bg-gray-900">
          {resultStr && !error ? (
            <div className="w-full max-w-3xl">
              {renderVisuals}
            </div>
          ) : (
            <div className="text-center text-gray-400 self-center">
              <Calculator className="w-12 h-12 mx-auto mb-2 opacity-20" />
              <p>{t('tool.base-calculator.enter_valid_numbers')}</p>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
};

export default BaseCalculator;