import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Slider } from '../../components/ui/Slider';
import { 
  QrCode, ScanLine, Download, Copy, RefreshCw, 
  Settings, Camera, Image as ImageIcon, Check, X,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import QRCode from 'qrcode';
// @ts-ignore
import JsBarcode from 'jsbarcode';
// @ts-ignore
import { Html5Qrcode, Html5QrcodeScanner } from 'html5-qrcode';

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

const QrBarCode: React.FC = () => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('generate');
  
  // Generator State
  const [text, setText] = useState('https://example.com');
  const [codeType, setCodeType] = useState<CodeType>('qr');
  const [color, setColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [scale, setScale] = useState(4); // For QR
  const [margin, setMargin] = useState(2); // For QR
  const [errorCorrection, setErrorCorrection] = useState<'L'|'M'|'Q'|'H'>('M');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Scanner State
  const [scanResult, setScanResult] = useState<{ text: string; format: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'file'>('camera');
  
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
        const url = await QRCode.toDataURL(text, {
          color: { dark: color, light: bgColor },
          width: scale * 100, // Approximate sizing logic
          margin: margin,
          errorCorrectionLevel: errorCorrection
        });
        setGeneratedUrl(url);
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
        } catch (e) {
           // Provide clearer error messages based on type
           if (codeType === 'EAN13') throw new Error("EAN-13 requires exactly 12 or 13 digits.");
           if (codeType === 'UPC') throw new Error("UPC requires exactly 11 or 12 digits.");
           if (codeType === 'ITF14') throw new Error("ITF-14 requires exactly 13 or 14 digits.");
           throw new Error("Invalid data for this barcode type.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t('common.error') + ': ' + t('tool.qr-barcode.scanner.no_code_found'));
      setGeneratedUrl(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(generate, 500);
    return () => clearTimeout(timer);
  }, [text, codeType, color, bgColor, scale, margin, errorCorrection]);


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
  }, [mode, scanMode]);

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
           setScanResult({ 
             text: decodedText, 
             format: decodedResult.result.format?.formatName || 'Unknown' 
           });
           html5QrCode.stop();
           setIsScanning(false);
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
    if (scannerRef.current && isScanning) {
      await scannerRef.current.stop();
      scannerRef.current.clear();
      setIsScanning(false);
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
      const result = await html5QrCode.scanFile(file, true);
      setScanResult({
         text: result,
         format: 'Detected from File'
      });
      html5QrCode.clear();
    } catch (err: any) {
      console.error(err);
      setError(t('tool.qr-barcode.scanner.no_code_found'));
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
            
            // If user is in Camera mode, automatically switch to File mode to enable scanning
            if (scanMode !== 'file') {
               setScanMode('file');
               // Give React a moment to render the 'reader-hidden' div
               setTimeout(() => scanImageFile(blob), 100);
            } else {
               scanImageFile(blob);
            }
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [mode, scanMode]);

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      
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

      <div className="flex-1 overflow-y-auto">
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
          <div className="max-w-3xl mx-auto space-y-6">
             <Card>
                <div className="mb-6 flex justify-center">
                   <SegmentedControl<'camera' | 'file'>
                      value={scanMode}
                      onChange={setScanMode}
                      options={[
                        { value: 'camera', label: <><Camera className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.scanner.camera')}</> },
                        { value: 'file', label: <><ImageIcon className="w-4 h-4 mr-2" /> {t('tool.qr-barcode.scanner.upload_image')}</> },
                      ]}
                   />
                </div>

                <div className="relative min-h-[300px] bg-black rounded-xl overflow-hidden flex items-center justify-center">
                   {scanMode === 'camera' ? (
                      isScanning ? (
                        <>
                           <div id="reader" className="w-full h-full"></div>
                           <button 
                             onClick={stopCamera}
                             className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full shadow-lg z-10"
                           >
                              {t('tool.qr-barcode.scanner.stop_camera')}
                           </button>
                        </>
                      ) : (
                        <div className="text-center text-white">
                           <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                           <p className="mb-4">{t('tool.qr-barcode.scanner.allow_camera')}</p>
                           <Button onClick={startCamera}>{t('tool.qr-barcode.scanner.start_scanning')}</Button>
                        </div>
                      )
                   ) : (
                      <div className="text-center text-white p-8">
                         <div id="reader-hidden" className="hidden"></div>
                         <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                         <p className="mb-4">{t('common.drag_drop_paste_or_click')}</p>
                         <Button onClick={() => fileInputRef.current?.click()}>{t('common.select_file')}</Button>
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