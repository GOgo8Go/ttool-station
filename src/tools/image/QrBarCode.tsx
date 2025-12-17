import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Slider } from '../../components/ui/Slider';
import {
  QrCode, ScanLine, Download, Copy, RefreshCw,
  Settings, Camera, Image as ImageIcon, Check, X,
  AlertCircle, Upload, Trash2
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import QRCodeStyling from 'qr-code-styling';
// @ts-ignore
import JsBarcode from 'jsbarcode';

// @ts-ignore
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

type Mode = 'generate' | 'scan';
type CodeType = 'qr' | 'CODE128' | 'EAN13' | 'UPC' | 'CODE39' | 'ITF14' | 'MSI' | 'pharmacode';

const CODE_TYPES: { value: CodeType; label: string }[] = [
  { value: 'qr', label: 'QR Code' },
  { value: 'CODE128', label: 'Code 128 (Standard)' },
  { value: 'EAN13', label: 'EAN-13' },
  { value: 'UPC', label: 'UPC' },
  { value: 'CODE39', label: 'Code 39' },
  { value: 'ITF14', label: 'ITF-14' },
];

export const QR_DOT_STYLES = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'];
export const QR_LINE_STYLES = ['square', 'dot', 'extra-rounded'];
export const QR_CENTER_STYLES = ['square', 'dot'];
const QrBarCode: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('generate');

  // Generator State
  const [text, setText] = useState('https://example.com');
  const [codeType, setCodeType] = useState<CodeType>('qr');
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [scale, setScale] = useState(4); // For QR (actually serves as size multiplier)
  const [margin, setMargin] = useState(0); // For QR
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New Styling State
  const [dotsStyle, setDotsStyle] = useState<string>('square');
  const [cornersSquareStyle, setCornersSquareStyle] = useState<string>('square');
  const [cornersDotStyle, setCornersDotStyle] = useState<string>('square');
  const [centerImage, setCenterImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const qrCodeRef = useRef<any>(null);

  useEffect(() => {
    // Initialize QRCodeStyling instance once
    qrCodeRef.current = new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'canvas',
      data: 'https://example.com',
      image: '',
      dotsOptions: { color: '#000000', type: 'square' },
      backgroundOptions: { color: '#ffffff' },
      imageOptions: { crossOrigin: 'anonymous', margin: 5 }
    });
  }, []);

  // Scanner State
  const [scanResult, setScanResult] = useState<{ text: string; format: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // --- GENERATOR LOGIC ---

  const handleCodeTypeChange = (newType: CodeType) => {
    setCodeType(newType);
    setError(null);

    // Auto-fix text for strict formats if current text is invalid
    // This prevents immediate crashes when switching from QR (URL) to EAN (Numbers)
    if (newType === 'EAN13') {
      if (!/^\d{12,13}$/.test(text)) setText('9780201379624');
    } else if (newType === 'UPC') {
      if (!/^\d{11,12}$/.test(text)) setText('123456789999');
    } else if (newType === 'ITF14') {
      if (!/^\d{13,14}$/.test(text)) setText('10012345678902');
    } else if (newType === 'MSI' || newType === 'pharmacode') {
      if (!/^\d+$/.test(text)) setText('123456');
    }
  };

  const generate = async () => {
    setError(null);
    if (!text) return;

    try {
      if (codeType === 'qr') {
        const size = scale * 100;
        qrCodeRef.current.update({
          width: size,
          height: size,
          data: text,
          image: centerImage,
          dotsOptions: {
            color: color,
            type: dotsStyle as any
          },
          cornersSquareOptions: {
            color: color,
            type: cornersSquareStyle as any
          },
          cornersDotOptions: {
            color: color,
            type: cornersDotStyle as any
          },
          backgroundOptions: {
            color: bgColor
          },
          imageOptions: {
            crossOrigin: "anonymous",
            margin: margin * 2
          },
          qrOptions: {
            errorCorrectionLevel: errorCorrection
          }
        });

        // If background image is set, we can't easily set it via the library if it expects a color for background.
        // Actually the library doesn't strictly support "background image" in the same way as center image, 
        // but let's see if we can just rely on the canvas transparecy or if the library supports it.
        // Looking at common docs, it supports background color. 
        // However, if we want a background image, we might need to compose it ourselves or check if the library supports it.
        // The user asked for "background image". 
        // For now, let's generate the QR code blob.

        try {
          const blob = await qrCodeRef.current.getRawData('png');
          if (blob) {
            // If there's a background image, we might need to composite it.
            // But for now let's just use what the library gives. 
            // Wait, if backgroundImage is set, we might want to implement that too.
            // Let's tackle basic integration first.

            // If we really want background image, we might need to draw it on a canvas first.
            if (backgroundImage) {
              const canvas = document.createElement('canvas');
              canvas.width = size;
              canvas.height = size;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Load background
                const bgImg = new Image();
                bgImg.src = backgroundImage;
                await new Promise((resolve) => { bgImg.onload = resolve; bgImg.onerror = resolve; });
                ctx.drawImage(bgImg, 0, 0, size, size);

                // Load QR Code (transparent background if possible, or we rely on standard generation)
                // To make QR code transparent background we set backgroundOptions color to 'transparent'
                // But we already updated the instance with user's bgColor. 
                // If user wants background image, maybe we should ignore bgColor or treat it as overlay?
                // Let's do: if backgroundImage exists, use it, and maybe force QR background to be transparent?
                // But user might want a white box behind QR dots.
                // Let's just overlay QR on top of BG image.

                // Regenerate QR with transparent background for composition
                qrCodeRef.current.update({ backgroundOptions: { color: 'transparent' } });
                const qrBlob = await qrCodeRef.current.getRawData('png');
                if (qrBlob) {
                  const qrImg = new Image();
                  qrImg.src = URL.createObjectURL(qrBlob);
                  await new Promise((resolve) => { qrImg.onload = resolve; });
                  ctx.drawImage(qrImg, 0, 0, size, size);
                  setGeneratedUrl(canvas.toDataURL());

                  // Restore original bg color
                  qrCodeRef.current.update({ backgroundOptions: { color: bgColor } });
                  return;
                }
              }
            }

            setGeneratedUrl(URL.createObjectURL(blob));
          }
        } catch (e: any) {
          console.error("QR Generation error", e);
          setError(e.message);
        }

      } else {
        // Barcode generation
        const canvas = document.createElement('canvas');
        try {
          JsBarcode(canvas, text, {
            format: codeType,
            lineColor: color,
            background: bgColor,
            width: scale, // 1-4
            height: scale * 25,
            displayValue: true,
            margin: margin * 5
          });
          setGeneratedUrl(canvas.toDataURL());
        } catch (e: any) {
          // Provide clearer error messages based on type
          if (codeType === 'EAN13') throw new Error("EAN-13 requires exactly 12 or 13 digits.");
          if (codeType === 'UPC') throw new Error("UPC requires exactly 11 or 12 digits.");
          if (codeType === 'ITF14') throw new Error("ITF-14 requires exactly 13 or 14 digits.");
          throw new Error("Invalid data for this barcode type.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('common.error.general') + ': ' + t('tool.qr-barcode.scanner.no_code_found'));
      setGeneratedUrl(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(generate, 500);
    return () => clearTimeout(timer);
  }, [text, codeType, color, bgColor, scale, margin, errorCorrection, dotsStyle, cornersSquareStyle, cornersDotStyle, centerImage, backgroundImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setter(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleDownload = () => {
    if (!generatedUrl) return;
    const link = document.createElement('a');
    link.href = generatedUrl;
    link.download = `code-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    if (!generatedUrl) return;
    try {
      const res = await fetch(generatedUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alert("Image copied to clipboard!");
    } catch (e) {
      console.error(e);
      alert("Failed to copy image.");
    }
  };

  // --- SCANNER LOGIC ---

  // Cleanup scanner on unmount or mode switch
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
        scannerRef.current.clear();
      }
    };
  }, [mode]);

  const startCamera = async () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);

    try {
      const html5QrCode = new Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string, decodedResult: any) => {
          // 获取更详细的格式信息，使用可选链避免 TS 错误
          const format = decodedResult.result?.format?.formatName || 
                        decodedResult.resultFormat ||
                        'Unknown';
          
          setScanResult({
            text: decodedText,
            format: format
          });
          
          // 成功扫描后停止摄像头
          html5QrCode.stop().then(() => {
            setIsScanning(false);
          }).catch((err: any) => {
            console.error("Error stopping camera:", err);
            setIsScanning(false);
          });
        },
        (errorMessage: string) => {
          // parse error, ignore often
        }
      );
    } catch (err: any) {
      setError("Failed to start camera: " + err.message);
      setIsScanning(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.getState() !== Html5QrcodeScannerState.NOT_STARTED) {
      try {
        await scannerRef.current.stop();
        setIsScanning(false);
      } catch (err: any) {
        console.error("Error stopping camera:", err);
        setError("Failed to stop camera: " + (err.message || err));
        setIsScanning(false);
      } finally {
        scannerRef.current.clear();
      }
    }
  };

  const scanImageFile = async (file: File) => {
    setError(null);
    setScanResult(null);

    // If we're not in file mode, we need to switch or temporary create container
    // But Html5Qrcode needs the element to exist.
    // Assuming UI switches or is in file mode.

    try {
      // Ensure the container exists
      if (!document.getElementById("reader-hidden")) {
        // If called from paste while in camera mode, we might fail unless we switch modes.
        // For now, let's assume valid state or throw specific error
        throw new Error("Scanner not ready. Switch to 'Upload Image' mode first.");
      }

      const html5QrCode = new Html5Qrcode("reader-hidden");
      // 尝试扫描文件
      const result = await html5QrCode.scanFileV2(file, true);
      
      // 获取详细格式信息，移除对 result.format 的冗余访问以修复 TS 错误
      const format = result.result?.format?.formatName || 
                    'Detected from File';
      
      setScanResult({
        text: result.decodedText,
        format: format
      });
      
      // 清理扫描器
      html5QrCode.clear();
    } catch (err: any) {
      console.error("Scan error:", err);
      // 提供更友好的错误消息
      if (err.message && (err.message.includes("NotFoundException") || 
                          err.message.includes("QR code decode error"))) {
        setError(t('tool.qr-barcode.scanner.no_code_found'));
      } else {
        setError(t('tool.qr-barcode.scanner.scan_failed') + ": " + (err.message || err));
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScanFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await scanImageFile(file);
    }
  };

  // Paste Support for Scanner
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Only handle paste if we are in scanner mode
      if (mode !== 'scan') return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            e.preventDefault();
            scanImageFile(blob);
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mode]);

  return (
    <div className="flex flex-col">

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <SegmentedControl<Mode>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'generate', label: <><QrCode className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.generator.title')}</> },
            { value: 'scan', label: <><ScanLine className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.scanner.title')}</> },
          ]}
        />
      </div>

      <div className="flex-1">
        {mode === 'generate' ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Config */}
            <div className="w-full lg:w-96 space-y-4">
              <Card>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('tool.qr-barcode.generator.code_type')}</label>
                    <select
                      className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      value={codeType}
                      onChange={(e) => handleCodeTypeChange(e.target.value as CodeType)}
                    >
                      {CODE_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('tool.qr-barcode.generator.content')}</label>
                    <textarea
                      className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"
                      placeholder="Enter text, URL, or numbers..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                    />
                  </div>

                  <hr className="border-gray-100 dark:border-gray-800" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.qr-barcode.generator.foreground')}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-gray-200" />
                        <span className="text-xs font-mono">{color}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.qr-barcode.generator.background')}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-8 w-8 rounded cursor-pointer border border-gray-200" />
                        <span className="text-xs font-mono">{bgColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Slider
                      label={codeType === 'qr' ? t('tool.qr-barcode.generator.scale_size') : t('tool.qr-barcode.generator.bar_width')}
                      min={1} max={codeType === 'qr' ? 10 : 4} step={0.5}
                      value={scale} onChange={(e) => setScale(parseFloat(e.target.value))}
                    />
                    <Slider
                      label={t('tool.qr-barcode.generator.margin')}
                      min={0} max={10}
                      value={margin} onChange={(e) => setMargin(parseFloat(e.target.value))}
                    />
                  </div>

                  {codeType === 'qr' && (
                    <div className="space-y-4">
                      <hr className="border-gray-100 dark:border-gray-800" />

                      <h3 className="text-xs font-bold text-gray-500 uppercase">{t('tool.qr-barcode.generator.style_settings')}</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.qr-barcode.generator.dots_style')}</label>
                          <select
                            className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                            value={dotsStyle}
                            onChange={(e) => setDotsStyle(e.target.value)}
                          >
                            {QR_DOT_STYLES.map(s => (
                              <option key={s} value={s}>{t(`tool.qr-barcode.generator.styles.${s.replace('-', '_')}`)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.qr-barcode.generator.corners_square_style')}</label>
                          <select
                            className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                            value={cornersSquareStyle}
                            onChange={(e) => setCornersSquareStyle(e.target.value)}
                          >
                            {QR_LINE_STYLES.map(s => (
                              <option key={s} value={s}>{t(`tool.qr-barcode.generator.styles.${s.replace('-', '_')}`)}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-1">{t('tool.qr-barcode.generator.corners_dot_style')}</label>
                          <select
                            className="w-full p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none"
                            value={cornersDotStyle}
                            onChange={(e) => setCornersDotStyle(e.target.value)}
                          >
                            {QR_CENTER_STYLES.map(s => (
                              <option key={s} value={s}>{t(`tool.qr-barcode.generator.styles.${s.replace('-', '_')}`)}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('tool.qr-barcode.generator.center_image')}</label>
                          <div className="flex items-center gap-2">
                            {centerImage ? (
                              <div className="relative group">
                                <img src={centerImage} className="w-10 h-10 object-contain bg-white border rounded" />
                                <button onClick={() => setCenterImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <Upload className="w-4 h-4 text-gray-400" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setCenterImage)} />
                              </label>
                            )}
                            <span className="text-xs text-gray-400">{centerImage ? t('tool.qr-barcode.generator.remove_image') : t('tool.qr-barcode.generator.upload_image')}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('tool.qr-barcode.generator.background_image')}</label>
                          <div className="flex items-center gap-2">
                            {backgroundImage ? (
                              <div className="relative group">
                                <img src={backgroundImage} className="w-10 h-10 object-cover bg-white border rounded" />
                                <button onClick={() => setBackgroundImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <label className="cursor-pointer flex items-center justify-center w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700">
                                <Upload className="w-4 h-4 text-gray-400" />
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setBackgroundImage)} />
                              </label>
                            )}
                            <span className="text-xs text-gray-400">{backgroundImage ? t('tool.qr-barcode.generator.remove_image') : t('tool.qr-barcode.generator.upload_image')}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t('tool.qr-barcode.generator.error_correction')}</label>
                        <SegmentedControl
                          size="sm"
                          value={errorCorrection}
                          onChange={(v) => setErrorCorrection(v as any)}
                          options={[
                            { value: 'L', label: t('tool.qr-barcode.generator.low') },
                            { value: 'M', label: t('tool.qr-barcode.generator.medium') },
                            { value: 'Q', label: t('tool.qr-barcode.generator.quarter') },
                            { value: 'H', label: t('tool.qr-barcode.generator.high') },
                          ]}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Output */}
            <div className="flex-1 flex flex-col">
              <Card className="flex-1 flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-900/50 min-h-[400px]">
                {generatedUrl ? (
                  <div className="flex flex-col items-center gap-6">
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <img src={generatedUrl} alt="Generated Code" className="max-w-full max-h-[400px]" />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleCopyImage} variant="secondary">
                        <Copy className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.generator.copy_image')}
                      </Button>
                      <Button onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.generator.download_png')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <Settings className="w-12 h-12 mx-auto mb-2 opacity-20 animate-spin-slow" />
                    <p>{error || "Enter text to generate code..."}</p>
                  </div>
                )}
              </Card>
              {error && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" /> {error}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <div className="relative min-h-[400px] bg-black/5 dark:bg-black/40 rounded-xl overflow-hidden flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700">
                {/* Hidden reader element for file scanning */}
                <div id="reader-hidden" className="hidden"></div>

                {isScanning ? (
                  <>
                    <div id="reader" className="w-full h-full absolute inset-0"></div>
                    <button
                      onClick={stopCamera}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-10"
                    >
                      {t('tool.qr-barcode.scanner.stop_camera')}
                    </button>
                  </>
                ) : (
                  <div className="text-center space-y-6 w-full max-w-md">
                    <div className="flex justify-center gap-4 opacity-50 mb-4">
                      <Camera className="w-16 h-16" />
                      <ImageIcon className="w-16 h-16" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold">{t('tool.qr-barcode.scanner.ready_to_scan')}</h3>
                      <p className="text-gray-500">{t('common.drag_drop_paste_or_click')}</p>
                      <p className="text-gray-500 text-sm">{t('tool.qr-barcode.scanner.allow_camera')}</p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                      <Button size="lg" onClick={startCamera}>
                        <Camera className="w-5 h-5 mr-2" /> {t('tool.qr-barcode.scanner.start_scanning')}
                      </Button>
                      <Button size="lg" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-5 h-5 mr-2" /> {t('tool.qr-barcode.scanner.upload_image')}
                      </Button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleScanFile}
                    />
                  </div>
                )}
              </div>
            </Card>

            {/* Result Area */}
            <Card className={`transition-all duration-300 ${scanResult ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${scanResult ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {scanResult ? <Check className="w-6 h-6" /> : <ScanLine className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-1">
                    {scanResult ? `${t('tool.qr-barcode.scanner.detected')}: ${scanResult.format}` : t('tool.qr-barcode.scanner.ready_to_scan')}
                  </h3>
                  {scanResult ? (
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-lg break-all">
                      {scanResult.text}
                    </div>
                  ) : (
                    <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"></div>
                  )}
                </div>
              </div>
              {scanResult && (
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => {
                    navigator.clipboard.writeText(scanResult.text);
                    alert('Copied!');
                  }}>
                    <Copy className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.scanner.copy_text')}
                  </Button>
                  {scanResult.text.startsWith('http') && (
                    <Button onClick={() => window.open(scanResult.text, '_blank')}>
                      {t('tool.qr-barcode.scanner.open_url')}
                    </Button>
                  )}
                </div>
              )}
            </Card>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-center animate-in slide-in-from-bottom-2">
                <AlertCircle className="w-5 h-5 mr-2" /> {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QrBarCode;