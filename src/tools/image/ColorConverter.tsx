import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Slider } from '../../components/ui/Slider';
import { Copy, Check, Palette, Hash } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// --- Types ---

interface RGB { r: number; g: number; b: number; }
interface HSL { h: number; s: number; l: number; }
interface HSV { h: number; s: number; v: number; }
interface CMYK { c: number; m: number; y: number; k: number; }

// --- Conversion Helpers ---

const clamp = (val: number, min: number, max: number) => Math.min(Math.max(val, min), max);

const rgbToHex = ({ r, g, b }: RGB): string => {
  const toHex = (c: number) => {
    const hex = Math.round(c).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

const hexToRgb = (hex: string): RGB | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const rgbToHsl = ({ r, g, b }: RGB): HSL => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
};

const hslToRgb = ({ h, s, l }: HSL): RGB => {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255)
  };
};

const rgbToHsv = ({ r, g, b }: RGB): HSV => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round(v * 100) };
};

const hsvToRgb = ({ h, s, v }: HSV): RGB => {
  s /= 100;
  v /= 100;
  let r = 0, g = 0, b = 0;
  const i = Math.floor(h / 60);
  const f = h / 60 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

const rgbToCmyk = ({ r, g, b }: RGB): CMYK => {
  let c = 1 - (r / 255);
  let m = 1 - (g / 255);
  let y = 1 - (b / 255);
  let k = Math.min(c, Math.min(m, y));

  c = (c - k) / (1 - k) || 0;
  m = (m - k) / (1 - k) || 0;
  y = (y - k) / (1 - k) || 0;

  return {
    c: Math.round(c * 100),
    m: Math.round(m * 100),
    y: Math.round(y * 100),
    k: Math.round(k * 100)
  };
};

const cmykToRgb = ({ c, m, y, k }: CMYK): RGB => {
  c /= 100; m /= 100; y /= 100; k /= 100;
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return {
    r: Math.round(r),
    g: Math.round(g),
    b: Math.round(b)
  };
};

const COMMON_COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Amber', hex: '#F59E0B' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'Lime', hex: '#84CC16' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Teal', hex: '#14B8A6' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Sky', hex: '#0EA5E9' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Indigo', hex: '#6366F1' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Purple', hex: '#A855F7' },
  { name: 'Fuchsia', hex: '#D946EF' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Slate', hex: '#64748B' },
  { name: 'Gray', hex: '#6B7280' },
  { name: 'Zinc', hex: '#71717A' },
  { name: 'Neutral', hex: '#737373' },
  { name: 'Stone', hex: '#78716C' },
  { name: 'Black', hex: '#000000' },
  { name: 'White', hex: '#FFFFFF' },
];

const ColorConverter: React.FC = () => {
  const { t } = useTranslation();
  const [rgb, setRgb] = useState<RGB>({ r: 59, g: 130, b: 246 }); // Default Blue-500
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Derived Values
  const hex = useMemo(() => rgbToHex(rgb), [rgb]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const hsv = useMemo(() => rgbToHsv(rgb), [rgb]);
  const cmyk = useMemo(() => rgbToCmyk(rgb), [rgb]);

  const updateRgb = (key: keyof RGB, value: number) => {
    setRgb(prev => ({ ...prev, [key]: clamp(value || 0, 0, 255) }));
  };

  const updateHsl = (key: keyof HSL, value: number) => {
    const newHsl = { ...hsl, [key]: value || 0 };
    // Wrap Hue
    if (key === 'h') {
        if (value < 0) newHsl.h = 360 + (value % 360);
        else if (value > 360) newHsl.h = value % 360;
    } else {
        newHsl[key] = clamp(value || 0, 0, 100);
    }
    setRgb(hslToRgb(newHsl));
  };

  const updateHsv = (key: keyof HSV, value: number) => {
    const newHsv = { ...hsv, [key]: value || 0 };
    if (key === 'h') {
        if (value < 0) newHsv.h = 360 + (value % 360);
        else if (value > 360) newHsv.h = value % 360;
    } else {
        newHsv[key] = clamp(value || 0, 0, 100);
    }
    setRgb(hsvToRgb(newHsv));
  };

  const updateCmyk = (key: keyof CMYK, value: number) => {
    const newCmyk = { ...cmyk, [key]: clamp(value || 0, 0, 100) };
    setRgb(cmykToRgb(newCmyk));
  };

  const handleHexChange = (val: string) => {
    // Basic validation to allow typing
    if (val.startsWith('#')) val = val.substring(1);
    // Allow typing shorthand or full
    if (val.length === 3) {
      val = val.split('').map(c => c + c).join('');
    }
    if (val.length === 6) {
      const newRgb = hexToRgb('#' + val);
      if (newRgb) setRgb(newRgb);
    }
  };

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  // Contrast Calculation for text color
  const getContrastColor = ({ r, g, b }: RGB) => {
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128 ? '#000000' : '#FFFFFF';
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6 overflow-hidden">
      
      {/* Left: Interactive Controls */}
      <div className="flex-1 overflow-y-auto space-y-6 lg:pr-2 custom-scrollbar">
        
        {/* Preview & Hex Input */}
        <Card className="flex flex-col md:flex-row gap-6 items-center">
           <div 
             className="w-32 h-32 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0"
             style={{ backgroundColor: hex }}
           >
              <div 
                className="text-center font-bold font-mono text-sm opacity-80"
                style={{ color: getContrastColor(rgb) }}
              >
                 {hex}<br/>
                 rgb({rgb.r}, {rgb.g}, {rgb.b})
              </div>
           </div>

           <div className="flex-1 w-full space-y-4">
              <div className="flex flex-col gap-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">{t('tool.color-converter.hex_color')}</label>
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                       <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                       <input 
                         type="text" 
                         className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary-500 outline-none uppercase font-mono"
                         maxLength={7}
                         defaultValue={hex} 
                         // Use key to force update on external change but allow typing
                         key={hex}
                         onBlur={(e) => handleHexChange(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleHexChange(e.currentTarget.value)}
                       />
                    </div>
                    <input 
                      type="color" 
                      value={hex}
                      onChange={(e) => {
                         const c = hexToRgb(e.target.value);
                         if(c) setRgb(c);
                      }}
                      className="h-10 w-12 rounded cursor-pointer p-0 border border-gray-200 dark:border-gray-700 bg-transparent"
                    />
                 </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => handleCopy(hex, 'HEX')}
              >
                {copiedFormat === 'HEX' ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copiedFormat === 'HEX' ? t('common.copied') : t('tool.color-converter.copy_hex')}
              </Button>
           </div>
        </Card>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           
           {/* RGB Sliders */}
           <Card className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                 <h3 className="font-semibold text-gray-700 dark:text-gray-300">{t('tool.color-converter.rgb')}</h3>
              </div>
              <div className="space-y-4">
                 {(['r', 'g', 'b'] as const).map((channel, i) => {
                   const colors = ['red', 'green', 'blue'];
                   const labels = [t('common.red'), t('common.green'), t('common.blue')];
                   return (
                     <div key={channel} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12">{labels[i]}</label>
                          <input 
                             type="number" 
                             min="0" max="255" 
                             value={rgb[channel]}
                             onChange={(e) => updateRgb(channel, parseInt(e.target.value))}
                             className="w-14 px-1 py-0.5 text-right text-sm border border-gray-200 dark:border-gray-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                        </div>
                        <input
                           type="range"
                           min="0" max="255"
                           value={rgb[channel]}
                           onChange={(e) => updateRgb(channel, parseInt(e.target.value))}
                           className={`w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none accent-${colors[i]}-500`}
                        />
                     </div>
                   );
                 })}
              </div>
              <Button 
                size="sm" variant="secondary" className="w-full mt-2"
                onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')}
              >
                 {copiedFormat === 'RGB' ? t('common.copied') : t('tool.color-converter.copy_rgb')}
              </Button>
           </Card>

           {/* HSL Sliders */}
           <Card className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                 <h3 className="font-semibold text-gray-700 dark:text-gray-300">{t('tool.color-converter.hsl')}</h3>
              </div>
              <div className="space-y-4">
                 {(['h', 's', 'l'] as const).map((channel, i) => {
                   const labels = [t('tool.color-converter.hue'), t('tool.color-converter.saturation'), t('tool.color-converter.lightness')];
                   const max = i === 0 ? 360 : 100;
                   const unit = i === 0 ? '°' : '%';
                   return (
                     <div key={channel} className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 w-16">{labels[i]}</label>
                          <div className="flex items-center relative">
                             <input 
                               type="number" 
                               min="0" max={max}
                               value={hsl[channel]}
                               onChange={(e) => updateHsl(channel, parseInt(e.target.value))}
                               className="w-14 px-1 py-0.5 text-right text-sm border border-gray-200 dark:border-gray-700 rounded bg-transparent focus:ring-1 focus:ring-primary-500 outline-none pr-4"
                            />
                            <span className="absolute right-1 text-xs text-gray-400 pointer-events-none">{unit}</span>
                          </div>
                        </div>
                        <input
                           type="range"
                           min="0" max={max}
                           value={hsl[channel]}
                           onChange={(e) => updateHsl(channel, parseInt(e.target.value))}
                           className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer focus:outline-none accent-purple-500"
                        />
                     </div>
                   );
                 })}
              </div>
              <Button 
                size="sm" variant="secondary" className="w-full mt-2"
                onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')}
              >
                 {copiedFormat === 'HSL' ? t('common.copied') : t('tool.color-converter.copy_hsl')}
              </Button>
           </Card>
        </div>

        {/* Other Formats Readout (Editable) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase">{t('tool.color-converter.hsv_hsb')}</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                 <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-400 mb-1">{t('tool.color-converter.hue')}</div>
                    <div className="relative">
                       <input 
                         type="number"
                         value={hsv.h}
                         onChange={(e) => updateHsv('h', parseInt(e.target.value))}
                         className="w-full bg-transparent text-center font-mono font-medium outline-none focus:text-primary-600 dark:focus:text-primary-400"
                       />
                       <span className="absolute right-0 top-0 text-[10px] text-gray-400 pointer-events-none">°</span>
                    </div>
                 </div>
                 <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-400 mb-1">{t('tool.color-converter.saturation')}</div>
                    <div className="relative">
                       <input 
                         type="number"
                         value={hsv.s}
                         onChange={(e) => updateHsv('s', parseInt(e.target.value))}
                         className="w-full bg-transparent text-center font-mono font-medium outline-none focus:text-primary-600 dark:focus:text-primary-400"
                       />
                       <span className="absolute right-0 top-0 text-[10px] text-gray-400 pointer-events-none">%</span>
                    </div>
                 </div>
                 <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    <div className="text-xs text-gray-400 mb-1">{t('tool.color-converter.value')}</div>
                    <div className="relative">
                       <input 
                         type="number"
                         value={hsv.v}
                         onChange={(e) => updateHsv('v', parseInt(e.target.value))}
                         className="w-full bg-transparent text-center font-mono font-medium outline-none focus:text-primary-600 dark:focus:text-primary-400"
                       />
                       <span className="absolute right-0 top-0 text-[10px] text-gray-400 pointer-events-none">%</span>
                    </div>
                 </div>
              </div>
              <Button 
                size="sm" variant="ghost" className="w-full text-xs"
                onClick={() => handleCopy(`hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`, 'HSV')}
              >
                 {t('tool.color-converter.copy_hsv')}
              </Button>
           </Card>

           <Card className="space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase">{t('tool.color-converter.cmyk')}</h3>
              <div className="grid grid-cols-4 gap-2 text-center">
                 {(['c', 'm', 'y', 'k'] as const).map((key) => {
                   const colors = { c: 'text-cyan-500', m: 'text-pink-500', y: 'text-yellow-500', k: 'text-gray-900 dark:text-gray-400' };
                   return (
                     <div key={key} className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                        <div className={`text-xs font-bold mb-1 ${colors[key]}`}>{key.toUpperCase()}</div>
                        <input 
                           type="number"
                           value={cmyk[key]}
                           onChange={(e) => updateCmyk(key, parseInt(e.target.value))}
                           className="w-full bg-transparent text-center font-mono font-medium outline-none focus:text-primary-600 dark:focus:text-primary-400"
                         />
                     </div>
                   );
                 })}
              </div>
              <Button 
                size="sm" variant="ghost" className="w-full text-xs"
                onClick={() => handleCopy(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, 'CMYK')}
              >
                 {t('tool.color-converter.copy_cmyk')}
              </Button>
           </Card>
        </div>
      </div>

      {/* Right: Common Palette */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 flex flex-col h-[40vh] lg:h-full">
         <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-semibold text-sm flex items-center gap-2">
               <Palette className="w-4 h-4" /> {t('tool.color-converter.common_colors')}
            </h3>
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
               {COMMON_COLORS.map((color) => (
                  <button
                    key={color.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                    onClick={() => {
                       const c = hexToRgb(color.hex);
                       if(c) setRgb(c);
                    }}
                  >
                     <div 
                       className="w-8 h-8 rounded-full shadow-sm border border-gray-100 dark:border-gray-700 shrink-0"
                       style={{ backgroundColor: color.hex }}
                     />
                     <div className="min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">{color.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{color.hex}</div>
                     </div>
                  </button>
               ))}
            </div>
         </div>
      </div>

    </div>
  );
};

export default ColorConverter;