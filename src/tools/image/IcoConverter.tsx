import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Upload, Download, Check, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AVAILABLE_SIZES = [16, 24, 32, 48, 64, 96, 128, 256];
const DEFAULT_SIZES = [16, 32, 48];

const IcoConverter: React.FC = () => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<number[]>(DEFAULT_SIZES);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedIcoUrl, setGeneratedIcoUrl] = useState<string | null>(null);
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (generatedIcoUrl) URL.revokeObjectURL(generatedIcoUrl);
    };
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) {
      setError(t('common.error') + ': ' + t('tool.converter.desc'));
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (generatedIcoUrl) URL.revokeObjectURL(generatedIcoUrl);
    
    setGeneratedIcoUrl(null);
    setError(null);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files?.length) {
        const pastedFile = e.clipboardData.files[0];
        if (pastedFile.type.startsWith('image/')) {
          e.preventDefault();
          handleFileSelect(pastedFile);
        }
      }
    };
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  const toggleSize = (size: number) => {
    setSelectedSizes(prev => 
      prev.includes(size) 
        ? prev.filter(s => s !== size)
        : [...prev, size].sort((a, b) => a - b)
    );
  };

  const generateIco = async () => {
    if (!file || !previewUrl || selectedSizes.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(t('tool.editor.adjust.effects')));
        img.src = previewUrl;
      });

      // 1. Generate PNG buffers for each size
      const pngBuffers: Uint8Array[] = [];
      for (const size of selectedSizes) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error(t('common.error') + ': ' + t('tool.paint.canvas.save_image'));
        
        // High quality resizing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, size, size);
        
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error(t('tool.ico-converter.upload_image') + ` ${size}x${size} ` + t('tool.editor.transform.geometry'));
        
        const buffer = await blob.arrayBuffer();
        pngBuffers.push(new Uint8Array(buffer));
      }

      // 2. Construct ICO file
      // Header (6 bytes) + Directory (16 bytes * count) + Data
      const headerSize = 6;
      const dirEntrySize = 16;
      const directorySize = dirEntrySize * selectedSizes.length;
      let currentOffset = headerSize + directorySize;

      const parts: (ArrayBuffer | Uint8Array)[] = [];

      // Write Header
      const header = new DataView(new ArrayBuffer(headerSize));
      header.setUint16(0, 0, true); // Reserved
      header.setUint16(2, 1, true); // Type (1 = ICO)
      header.setUint16(4, selectedSizes.length, true); // Count
      parts.push(header.buffer);

      // Write Directory Entries
      for (let i = 0; i < selectedSizes.length; i++) {
        const size = selectedSizes[i];
        const pngData = pngBuffers[i];
        const entry = new DataView(new ArrayBuffer(dirEntrySize));

        const w = size >= 256 ? 0 : size;
        const h = size >= 256 ? 0 : size;

        entry.setUint8(0, w); // Width
        entry.setUint8(1, h); // Height
        entry.setUint8(2, 0); // Palette count
        entry.setUint8(3, 0); // Reserved
        entry.setUint16(4, 1, true); // Color planes
        entry.setUint16(6, 32, true); // Bits per pixel
        entry.setUint32(8, pngData.byteLength, true); // Size
        entry.setUint32(12, currentOffset, true); // Offset

        parts.push(entry.buffer);
        currentOffset += pngData.byteLength;
      }

      // Write Image Data
      for (const pngData of pngBuffers) {
        parts.push(pngData);
      }

      const icoBlob = new Blob(parts, { type: 'image/x-icon' });
      const icoUrl = URL.createObjectURL(icoBlob);
      setGeneratedIcoUrl(icoUrl);
      
    } catch (err) {
      console.error(err);
      setError(t('tool.ico-converter.convert_to_ico') + '. ' + t('tool.metadata.no_gps_data'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!generatedIcoUrl) return;
    const link = document.createElement('a');
    link.href = generatedIcoUrl;
    link.download = `${file?.name.split('.')[0] || 'icon'}.ico`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setGeneratedIcoUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!file || !previewUrl) {
    return (
       <div className="h-[calc(100vh-16rem)] flex flex-col items-center justify-center">
        <div 
          className="w-full max-w-xl flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
             e.preventDefault();
             if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
          }}
        >
          <div className="p-4 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-6">
            <Upload className="w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('tool.ico-converter.upload_image')}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
            {t('tool.qr-barcode.scanner.select_image')} (Ctrl+V) {t('tool.code-diff.swap_tooltip')}
          </p>
          <Button>{t('common.upload')}</Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
      {/* Left Column: Input & Preview */}
      <div className="space-y-6">
        <Card className="h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('common.input')}</h3>
            <Button variant="ghost" size="sm" onClick={reset} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <X className="w-4 h-4 mr-2" /> {t('tool.ico-viewer.save')}
            </Button>
          </div>
          
          <div className="flex-1 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+PHJlY3QgeD0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2U1ZjdkYiIvPjxyZWN0IHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlNWU3ZGIiLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg==')] dark:bg-none dark:bg-gray-900/50 rounded-lg flex items-center justify-center p-8 border border-gray-100 dark:border-gray-800">
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[300px] object-contain shadow-lg rounded-md" />
          </div>
          <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 font-mono">
            {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        </Card>
      </div>

      {/* Right Column: Settings & Output */}
      <div className="space-y-6 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('tool.ico-converter.icon_sizes')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('tool.ico-converter.desc')}</p>
            
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
              {AVAILABLE_SIZES.map(size => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`
                      relative p-3 rounded-lg border text-center transition-all
                      ${isSelected 
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className={`text-lg font-bold ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>
                      {size}
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase">px</div>
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="w-3 h-3 text-primary-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {selectedSizes.length === 0 && (
              <p className="text-xs text-red-500 mt-2">{t('tool.converter.resize.width')} {t('common.error')}.</p>
            )}
          </div>

          <div className="mt-auto space-y-4">
             {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}

            {!generatedIcoUrl ? (
              <Button 
                onClick={generateIco} 
                disabled={isProcessing || selectedSizes.length === 0} 
                className="w-full h-12 text-base"
              >
                {isProcessing ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> {t('common.processing')}</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" /> {t('tool.ico-converter.convert_to_ico')}</>
                )}
              </Button>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center text-green-700 dark:text-green-300">
                    <Check className="w-5 h-5 mr-2" />
                    <span className="font-medium">{t('tool.ico-converter.conversion_successful')}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setGeneratedIcoUrl(null)} className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40">
                    {t('common.clear')}
                  </Button>
                </div>
                <Button onClick={handleDownload} className="w-full h-12 text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <Download className="w-5 h-5 mr-2" /> {t('tool.ico-converter.download_ico')}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default IcoConverter;